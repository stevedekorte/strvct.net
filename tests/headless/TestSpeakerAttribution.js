#!/usr/bin/env node

"use strict";

/**
 * Headless test: speaker attribution in narration markup (Plans/Multi-Voice
 * Narration, M0).
 *
 * Invariants:
 *   - a <sentence> inside <quote speaker="x"> resolves speaker x;
 *   - a <sentence speaker="y"> resolves y, and its own attribute beats an
 *     enclosing quote's;
 *   - a bare sentence (and one in a quote with no speaker) resolves null —
 *     the narrator;
 *   - the quote is found through intervening elements, and a missing
 *     attributes dictionary is not an error;
 *   - blank or whitespace-only values count as absent;
 *   - the OpenAI TTS session offers the eleven current voices and speaks one
 *     request in an override voice without touching its stored voice.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestSpeakerAttribution.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let pass = 0, fail = 0;
const check = (c, m) => {
    if (c) {
        pass++;
        console.log("  \x1b[32m✓\x1b[0m " + m);
    } else {
        fail++;
        console.log("  \x1b[31m✗\x1b[0m " + m);
    }
};

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

// The reader itself needs a DOM (SvStreamElementNode.onOpen builds one), so
// headless we build the node tree the reader would have produced. The
// resolver only reads name(), attributes(), isTextNode() and detectAncestor().
function el (name, attributes, parent) {
    const SvStreamElementNode = SvGlobals.get("SvStreamElementNode");
    const node = SvStreamElementNode.clone();
    node.setName(name);
    node.setAttributes(attributes || {});
    if (parent) {
        node.setParent(parent);
    }
    return node;
}

async function main () {
    await boot();
    const resolver = SvGlobals.get("SvAiParsedResponseMessage").prototype.speakerIdForStreamNode;
    const speakerOf = (node) => resolver(node);

    console.log("Speaker resolution on the node tree the parser produces");
    const top = el("top");
    const narration = el("narration", {}, top);
    const p = el("p", {}, narration);
    const q1 = el("quote", { speaker: "npc-thrain" }, p);
    const s1 = el("sentence", {}, q1);
    const s2 = el("sentence", {}, q1);
    const s3 = el("sentence", { speaker: "pc-azrakos" }, p);
    const s4 = el("sentence", {}, p);
    const q2 = el("quote", {}, p);
    const s5 = el("sentence", {}, q2);
    const q3 = el("quote", { speaker: "npc-a" }, p);
    const s6 = el("sentence", { speaker: "npc-b" }, q3);
    const q4 = el("quote", { speaker: "  " }, p);
    const s7 = el("sentence", {}, q4);
    const s8 = el("sentence", {}, el("strong", {}, el("quote", { speaker: "deep" }, p)));
    check(speakerOf(s1) === "npc-thrain" && speakerOf(s2) === "npc-thrain", "sentences inside an attributed quote resolve the quote's speaker");
    check(speakerOf(s3) === "pc-azrakos", "a sentence's own speaker attribute resolves");
    check(speakerOf(s4) === null, "a bare sentence is the narrator (null)");
    check(speakerOf(s5) === null, "a quote without a speaker is the narrator too");
    check(speakerOf(s6) === "npc-b", "a sentence's own attribute beats the enclosing quote's");
    check(speakerOf(s7) === null, "a blank speaker value counts as absent");
    check(speakerOf(s8) === "deep", "the quote is found through intervening elements");
    check(speakerOf(el("sentence", null)) === null, "a node with no attributes dictionary is the narrator, not an error");

    console.log("\nOpenAI speech: current voices, per-request override");
    const SvOpenAiTtsSession = SvGlobals.get("SvOpenAiTtsSession");
    const voices = SvOpenAiTtsSession.validVoiceNames();
    check(voices.length === 11 && voices.includes("onyx") && voices.includes("sage"), "eleven voices, including the newer ones");
    let session = null;
    try {
        session = SvOpenAiTtsSession.clone();
    } catch (e) {
        console.log("  (SvOpenAiTtsSession.clone() not available headless: " + e.message + ")");
    }
    if (session) {
        session.setPrompt("Hello there.");
        const plain = session.newRequest();
        const overridden = session.newRequest("onyx");
        check(plain.bodyJson().voice === session.voice(), "no override → the session's stored voice (" + session.voice() + ")");
        check(overridden.bodyJson().voice === "onyx", "override → that voice on the request only");
        check(session.voice() === "fable", "…and the stored voice slot is untouched (still " + session.voice() + ")");
    }

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
