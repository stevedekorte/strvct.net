#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvVisionQuery — one image, one question, answered in text.
 * Each provider gets the image in its own shape (Gemini parts, Anthropic
 * blocks), the data URL's type is carried through, the describe and question
 * kinds pick their models, and a failing model hands the question to the
 * failover model once. No network: the models' requests are stand-ins.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestVisionQuery.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let passed = 0;
let failed = 0;

function check (condition, message) {
    if (condition) {
        passed++;
        console.log("  \x1b[32m✓\x1b[0m " + message);
    } else {
        failed++;
        console.log("  \x1b[31m✗\x1b[0m " + message);
    }
}

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");
    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot";
    await SvBootLoader.asyncRun();
}

// a stand-in model whose request answers (or fails) without the network
function fakeModel (name, service, outcome) {
    const sent = [];
    const model = {
        modelName: () => name,
        service: () => service,
        sent: sent,
        newChatRequest: () => {
            let body = null;
            return {
                setBodyJson: (b) => { body = b; sent.push(b); },
                setTimeoutPeriodInMs: () => {},
                setRejectsOnFinalError: (v) => { model.rejects = v; },
                asyncSendAndStreamResponse: async () => {},
                error: () => outcome.error ? new Error(outcome.error) : null,
                fullContent: () => outcome.text || "",
                body: () => body
            };
        }
    };
    return model;
}

async function main () {
    await boot();
    const g = (n) => SvGlobals.get(n);
    const SvVisionQuery = g("SvVisionQuery");
    const gemini = g("SvGeminiService").shared();
    const anthropic = g("SvAnthropicService").shared();
    const dataUrl = "data:image/png;base64,iVBORw0KGgo=";

    console.log("Each provider gets the image in its own shape");
    const gParts = gemini.visionUserContent("How many?", "image/png", "AAAA");
    check(gParts[0].text === "How many?" && gParts[1].inline_data.mime_type === "image/png" && gParts[1].inline_data.data === "AAAA", "Gemini: a text part and an inline_data part");
    const aParts = anthropic.visionUserContent("How many?", "image/png", "AAAA");
    check(aParts[0].type === "image" && aParts[0].source.type === "base64" && aParts[0].source.media_type === "image/png" && aParts[1].text === "How many?", "Anthropic: an image block and a text block");
    let threw = false;
    try {
        g("SvAiService").prototype.visionUserContent.call({ svType: () => "SvSomeTextOnlyService" }, "x", "image/png", "AAAA");
    } catch (e) {
        threw = /cannot send images/.test(e.message);
    }
    check(threw, "a service without vision says so");

    const merged = anthropic.mergedContent("Please begin.", aParts);
    check(Array.isArray(merged) && merged[0].text === "Please begin." && merged[1].type === "image", "Anthropic merges a text message with an image message as blocks, not \"[object Object]\"");
    check(anthropic.mergedContent("a", "b") === "a\nb", "...and two strings as before");

    console.log("\nThe data URL's type and bytes");
    const parts = SvVisionQuery.clone().setDataUrl(dataUrl).imageParts();
    check(parts.mimeType === "image/png" && parts.base64 === "iVBORw0KGgo=", "image/png and its bytes, not a guessed jpeg");
    threw = false;
    try {
        SvVisionQuery.clone().setDataUrl("https://example.com/a.png").imageParts();
    } catch (e) {
        threw = true;
    }
    check(threw, "a non-data URL is refused");

    console.log("\nThe two kinds of query pick their models");
    SvVisionQuery.setDescribeChatModelName("describer");
    SvVisionQuery.setQuestionChatModelName("asker");
    SvVisionQuery.setFailoverChatModelName("backup");
    const describing = SvVisionQuery.describing(dataUrl);
    const asking = SvVisionQuery.asking(dataUrl, "Is he holding a towel?");
    check(describing.chatModelName() === "describer" && /People or creatures: N/.test(describing.instruction()), "describing: the describe model, a count-first instruction");
    check(asking.chatModelName() === "asker" && asking.prompt() === "Is he holding a towel?", "asking: the question model, the question as the prompt");

    console.log("\nAnswers, and failover");
    const models = {
        describer: fakeModel("describer", gemini, { text: "  People or creatures: 1.\n" }),
        asker: fakeModel("asker", gemini, { error: "503 overloaded" }),
        backup: fakeModel("backup", anthropic, { text: "Yes — a towel over his shoulder." })
    };
    g("SvServices").shared().chatModelWithName = (name) => models[name] || null;
    const description = await SvVisionQuery.describing(dataUrl).asyncAnswer();
    check(description === "People or creatures: 1.", "the answer, trimmed: " + JSON.stringify(description));
    const body = models.describer.sent[0];
    check(body.model === "describer" && models.describer.rejects === true, "the body names the model, and a failed request will reject (so failover follows)");
    check(body.messages[0].role === "system" && body.messages[1].content[1].inline_data.data === "iVBORw0KGgo=", "the request: the instruction, then the question with the image in the model's shape");
    const answer = await SvVisionQuery.asking(dataUrl, "Is he holding a towel?").asyncAnswer();
    check(answer.startsWith("Yes") && models.asker.sent.length === 1 && models.backup.sent.length === 1, "the question model failed; the failover answered once");
    check(models.backup.sent[0].messages[1].content[0].type === "image", "the failover got the image in its own (Anthropic) shape");
    models.backup = fakeModel("backup", anthropic, { error: "down too" });
    threw = false;
    try {
        await SvVisionQuery.asking(dataUrl, "?").asyncAnswer();
    } catch (e) {
        threw = /down too/.test(e.message);
    }
    check(threw, "when both fail, the failover's error comes back");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
