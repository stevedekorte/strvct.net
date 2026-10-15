#!/usr/bin/env node

"use strict";

/**
 * Headless test: thinking models that stream their thinking get a short
 * silence limit (2026-10-15).
 *
 * Adaptive-thinking models stream nothing while they think unless asked to
 * show it, so a streamed reply's silence limit had to be minutes. A model
 * entry's "thinkingDisplay" asks for summaries (Anthropic thinking.display);
 * measured on dev, the longest silence then fell from 12–30 s to about 4 s.
 *
 *   - the entry's key reaches the model, and the Anthropic request sends
 *     thinking {type: "adaptive", display} (the only form Fable accepts);
 *   - an entry without it sends no thinking config, as before;
 *   - the silence limit is the model's: a minute when it streams its
 *     thinking, four otherwise; a request's own limit still wins.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestThinkingDisplay.js
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
    await SvPlatform.promiseReady();
    await StrvctFile.asyncLoadAndSequentiallyEvalPaths(SvBootLoader.fullPaths());
    const originalSerialForEach = Array.prototype.promiseSerialForEach;
    Array.prototype.promiseSerialForEach = async function (callback) {
        for (let i = 0; i < this.length; i++) {
            try {
                await callback(this[i], i, this);
            } catch {
                // intentionally swallow (native modules unavailable here)
            }
        }
    };
    await SvResourceManager.shared().setupAndRun();
    await SvResourceManager.shared().promiseCompleted();
    Array.prototype.promiseSerialForEach = originalSerialForEach;
}

function streamedBodyFor (model) {
    const request = model.newChatRequest();
    request.setBodyJson({ model: model.modelName(), messages: [] });
    request.setupForStreaming();
    return { request: request, body: request.bodyJson() };
}

async function main () {
    console.log("TestThinkingDisplay: booting strvct…");
    await boot();
    const service = SvAnthropicService.clone();
    const named = (name) => service.models().subnodes().find(m => m.modelName() === name);

    console.log("\nModels that stream their thinking");
    for (const name of ["claude-fable-5-1", "claude-sonnet-5", "claude-opus-5-5", "claude-opus-5"]) {
        const model = named(name);
        const { request, body } = streamedBodyFor(model);
        check(model.thinkingDisplay() === "summarized", name + ": the entry asks for summarized thinking");
        check(JSON.stringify(body.thinking) === JSON.stringify({ type: "adaptive", display: "summarized" }), name + ": the request sends thinking " + JSON.stringify(body.thinking));
        check(request.activeStallTimeoutPeriodInMs() === 60 * 1000, name + ": a one-minute silence limit");
    }

    console.log("\nA model without it");
    const quiet = named("claude-fable-5");
    const { request, body } = streamedBodyFor(quiet);
    check(quiet.thinkingDisplay() === null && !("thinking" in body), "claude-fable-5: no thinking config is sent");
    check(request.activeStallTimeoutPeriodInMs() === 4 * 60 * 1000, "...and the four-minute limit stays");
    request.setStallTimeoutPeriodInMs(5000);
    check(request.activeStallTimeoutPeriodInMs() === 5000, "a request's own limit wins");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
