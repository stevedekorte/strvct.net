#!/usr/bin/env node

"use strict";

/**
 * Headless test: a tool result too large to send fails its call instead
 * (SvToolCall.oversizedResultError, SvAssistantToolKit.maxToolResultChars).
 * A result is re-sent with every request until its turn is filed away, so
 * one unbounded read (a whole archive at full detail, 633 KB) doubled every
 * later request. A result that fits is sent as before; one over the limit —
 * when set, or when refreshed before sending — becomes an error telling the
 * AI to ask for less; a conversation may set its own limit.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestToolResultSizeLimit.js
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
    for (const rel of ["SvGlobals.js", "SvPlatform.js", "StrvctFile.js", "SvBootLoader.js"]) {
        await bootFile(path.join("source/boot", rel));
    }
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

/** A tool call whose toolkit answers for a conversation with the given limit (or none). */
function newCall (conversationLimit) {
    const kit = SvGlobals.get("SvAssistantToolKit").clone();
    kit.conversation = () => (conversationLimit ? { maxToolResultChars: () => conversationLimit } : null);
    const call = SvGlobals.get("SvToolCall").clone();
    const calls = { assistantToolKit: () => kit, onToolCallComplete () {} };
    call.toolCalls = () => calls; // the slot is typed
    call.reportError = () => {}; // no error reports from a test
    return call;
}

const text = (n) => ({ text: "x".repeat(n) });

(async () => {
    await boot();

    console.log("a result that fits is sent");
    const small = newCall();
    small.setCallResult(text(30000));
    check(small.toolResult().status() === "success" && small.toolResult().result().text.length === 30000, "a 30k result succeeds unchanged");

    console.log("a result over the limit fails its call");
    const big = newCall();
    big.setCallResult(text(633000));
    const r = big.toolResult();
    check(r.status() === "failure" && r.result() === null, "a 633k result is not sent (status " + r.status() + ")");
    check(/633k characters, over the 64k/.test(r.error()) && /Ask for less/.test(r.error()), "the error says how large, the limit, and to ask for less (" + r.error() + ")");

    console.log("a refreshed result is held to it too");
    const refreshed = newCall();
    refreshed.setCallResult(text(1000));
    refreshed.setResultRefresher(() => text(100000));
    refreshed.refreshResultForSending();
    check(refreshed.toolResult().status() === "failure" && refreshed.toolResult().result() === null, "a result that grows past the limit when refreshed fails");

    console.log("a conversation sets its own limit");
    const strict = newCall(5000);
    strict.setCallResult(text(6000));
    check(strict.toolResult().status() === "failure" && /over the 5k/.test(strict.toolResult().error()), "6k fails under a 5k limit");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
