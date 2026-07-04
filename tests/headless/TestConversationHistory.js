#!/usr/bin/env node

"use strict";

/**
 * Headless test: pushHistory episodic filing + composeJsonHistory projection.
 *
 * Invariants under test (Message History Management v1):
 * - pushHistory files ONLY the settled unfiled buffer: system messages and
 *   AI-invisible messages (e.g. party chat) are never copied; filing stops
 *   at the first unsettled message so blocks stay contiguous.
 * - Filing copies, never moves: original message nodes stay in the
 *   conversation, gaining only a filedToHistoryBlockId marker.
 * - composeJsonHistory keeps the NEWEST filed block's messages inline
 *   (one-episode lookback); older blocks collapse to ONE handle-dict
 *   marker each, regenerated from live block state on every pass.
 * - Block handles carry subtitle and message count.
 * - pushHistory with nothing to file errors instead of creating an empty block.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestConversationHistory.js
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

// --- fixtures ----------------------------------------------------------------

function newConversation () {
    const SvAiConversation = SvGlobals.get("SvAiConversation");
    const conv = SvAiConversation.clone();
    // messagesJson resolves roles through the service; stub it headlessly.
    conv.setService({ serviceRoleNameForRole: (r) => r });
    return conv;
}

function addMessage (conv, role, speakerName, content, opts = {}) {
    const SvAiMessage = SvGlobals.get("SvAiMessage");
    const m = SvAiMessage.clone();
    m.setRole(role);
    m.setSpeakerName(speakerName);
    m.setContent(content);
    if (opts.invisible) {
        m.setIsVisibleToAi(false);
    }
    if (opts.incomplete !== true) {
        m.setIsComplete(true); // before setConversation, so onComplete never schedules
    }
    m.setConversation(conv);
    conv.addSubnode(m);
    return m;
}

function newToolCall (params) {
    const call = { result: undefined, error: null, resultWasSet: false };
    call.parametersDict = () => params;
    call.setCallResult = (r) => { call.result = r; call.resultWasSet = true; };
    call.setCallError = (e) => { call.error = e; };
    return call;
}

function markerContents (jsonHistory) {
    return jsonHistory
        .map(m => m.content)
        .filter(c => typeof c === "string" && c.includes("<history-record>"));
}

// --- tests -------------------------------------------------------------------

function testHistory () {
    const conv = newConversation();
    check(!!conv.history(), "conversation has a history node (finalInitProto)");
    check(conv.history().blocks().length === 0, "history starts empty");

    // tool metadata landed on the shared method object
    const method = conv.pushHistory;
    check(typeof method.isToolable === "function" && method.isToolable() === true,
        "pushHistory is registered as a toolable method");

    // transcript: system prompt, four settled crypt messages, one party
    // whisper (AI-invisible), one still-streaming response
    addMessage(conv, "system", "system", "You are the GM.");
    const m1 = addMessage(conv, "user", "Aria", "We enter the crypt.");
    const m2 = addMessage(conv, "assistant", "GM", "Dust swirls in the torchlight.");
    addMessage(conv, "user", "Aria", "I search the sarcophagus.");
    const m4 = addMessage(conv, "assistant", "GM", "You find the tide key.");
    const party = addMessage(conv, "user", "Aria → party", "psst, don't trust the warden", { invisible: true });
    const m5 = addMessage(conv, "assistant", "GM", "The warden appears at the door—", { incomplete: true });

    console.log("\npushHistory files the settled buffer");
    const call1 = newToolCall({ title: "The Sunken Crypt", subtitle: "Found the tide key" });
    conv.pushHistory(call1);
    check(call1.error === null, "push 1 succeeds" + (call1.error ? " (error: " + call1.error.message + ")" : ""));
    check(call1.resultWasSet && call1.result === null, "push 1 sets a null (silent) result");

    const history = conv.history();
    check(history.blocks().length === 1, "one block filed");
    const block1 = history.blocks()[0];
    check(block1.title() === "The Sunken Crypt", "block title set");
    check(block1.subtitle() === "Found the tide key", "block subtitle set");
    check(block1.messages().subnodes().length === 4, "block copied exactly the 4 settled visible messages");
    const copiedContents = block1.messages().subnodes().map(c => c.content());
    check(!copiedContents.includes(party.content()), "AI-invisible (party) message was NOT copied");
    check(!copiedContents.includes(m5.content()), "unsettled message was NOT copied");
    check(copiedContents[0] === m1.content() && copiedContents[3] === m4.content(), "copies preserve order");
    check(block1.messages().subnodes()[0].sourceMessageId() === m1.messageId(), "copy carries provenance (sourceMessageId)");

    console.log("\nCopies, not moves");
    check(conv.messages().length === 7, "conversation still has all 7 original messages");
    check(m1.filedToHistoryBlockId() === block1.jsonId(), "original gained the filed marker");
    check(m5.filedToHistoryBlockId() === null, "unsettled original stays unfiled");
    check(party.filedToHistoryBlockId() === null, "party original stays unfiled");

    console.log("\nNewest block stays inline (one-episode lookback)");
    const visible = conv.messages().filter(m => m.isVisibleToAi());
    const composed1 = conv.composeJsonHistory(visible);
    check(markerContents(composed1).length === 0, "no marker while the only block is the newest");
    check(composed1.some(m => m.content === m2.content()), "newest block's messages emit inline");

    console.log("\nOlder blocks collapse to one marker each");
    m5.setIsComplete(true); // the warden scene settles...
    const m6 = addMessage(conv, "user", "Aria", "We flee into the forest.");
    addMessage(conv, "assistant", "GM", "Branches whip past as you run.");
    const call2 = newToolCall({ title: "Flight to the Forest", subtitle: "Escaped the warden" });
    conv.pushHistory(call2);
    check(call2.error === null, "push 2 succeeds");
    check(history.blocks().length === 2, "second block filed");
    const block2 = history.blocks()[1];
    check(block2.messages().subnodes().length === 3, "block 2 copied m5-m7 (the new settled buffer)");

    const composed2 = conv.composeJsonHistory(conv.messages().filter(m => m.isVisibleToAi()));
    const markers = markerContents(composed2);
    check(markers.length === 1, "exactly one marker (block 1) in composed history");
    check(markers[0].includes(block1.jsonId()), "marker carries block 1's jsonId");
    check(markers[0].includes("The Sunken Crypt"), "marker carries block 1's title");
    check(markers[0].includes("Found the tide key"), "marker carries block 1's subtitle");
    check(markers[0].includes("\"count\": 4"), "marker carries block 1's message count");
    check(!composed2.some(m => m.content === m1.content()), "block 1 contents no longer inline");
    check(composed2.some(m => m.content === m6.content()), "block 2 (newest) contents still inline");
    const systemDict = composed2[0];
    check(systemDict.content === "You are the GM.", "system message unaffected, still first");
    check(markers[0] === composed2[1].content, "marker sits where the filed messages were (right after system)");

    console.log("\nMarkers regenerate from live block state");
    block1.setTitle("The Crypt, Renamed");
    const composed3 = conv.composeJsonHistory(conv.messages().filter(m => m.isVisibleToAi()));
    check(markerContents(composed3)[0].includes("The Crypt, Renamed"), "marker reflects a later block rename");

    console.log("\ncollapseNewestBlock suspends the lookback (context-pressure valve)");
    const composedC = conv.composeJsonHistory(conv.messages().filter(m => m.isVisibleToAi()), { collapseNewestBlock: true });
    const markersC = markerContents(composedC);
    check(markersC.length === 2, "both blocks collapse to markers");
    check(!composedC.some(m => m.content === m6.content()), "newest block's contents no longer inline");
    check(composedC.some(m => m.content === "You are the GM."), "system message still present");

    console.log("\nDrill-in: blocks are lens-expandable by jsonId");
    check(conv.history().blockWithJsonId(block1.jsonId()) === block1, "blockWithJsonId resolves");
    const handle = block1.lensHandleJson();
    check(handle._lod === "handle" && handle.count === 4 && handle.subtitle === "Found the tide key",
        "lensHandleJson carries _lod, count, subtitle");

    console.log("\nEmpty push errors, no empty block");
    const call3 = newToolCall({ title: "Nothing Happened" });
    conv.pushHistory(call3);
    check(call3.error !== null && call3.error.message.includes("nothing to file"), "empty push reports an error");
    check(history.blocks().length === 2, "no empty block created");

    console.log("\nMissing title errors");
    addMessage(conv, "user", "Aria", "We rest.");
    const call4 = newToolCall({ subtitle: "no title given" });
    conv.pushHistory(call4);
    check(call4.error !== null && call4.error.message.includes("title"), "missing title reports an error");
}

// --- main --------------------------------------------------------------------

async function main () {
    console.log("Booting strvct headless...");
    await boot();
    console.log("Booted.\n");

    testHistory();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
