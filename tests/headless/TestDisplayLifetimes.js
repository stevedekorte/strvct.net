#!/usr/bin/env node

"use strict";

/**
 * Headless test: message display lifetimes (Plans/Disappearing Messages).
 *
 * Invariants under test:
 * - "keep" (default) never expires.
 * - "after-messages-deep:N" derives expiry purely from distance to the
 *   conversation tail — flips as messages are appended, no clocks involved.
 * - "after-resolved-seconds:N" derives expiry from the shared resolvedAt
 *   stamp vs the local clock; unresolved messages never expire.
 * - markResolvedNow is idempotent (first stamp wins).
 * - isVisible() composes: an expired message reports not-visible (the tile
 *   machinery hides on this), while isVisibleToUser is left untouched.
 * - The conversation sweep fires exactly ONE view refresh (didUpdateNode)
 *   per expiry transition, and arms a single timer for the earliest
 *   pending time-based expiry.
 * - Malformed policies warn and never expire (fail-visible).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestDisplayLifetimes.js
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
    conv.setService({ serviceRoleNameForRole: (r) => r });
    return conv;
}

function addMessage (conv, content) {
    const SvAiMessage = SvGlobals.get("SvAiMessage");
    const m = SvAiMessage.clone();
    m.setRole("user");
    m.setContent(content);
    m.setIsComplete(true); // before setConversation, so onComplete never schedules
    m.setConversation(conv);
    conv.addSubnode(m);
    return m;
}

function countUpdates (message, fn) {
    let count = 0;
    const real = message.didUpdateNode.bind(message);
    message.didUpdateNode = function () {
        count++;
        return real();
    };
    fn();
    message.didUpdateNode = real;
    return count;
}

// --- tests ---------------------------------------------------------------

function testDepthPolicy () {
    console.log("\nafter-messages-deep: expiry derives from distance to the conversation tail");

    const conv = newConversation();
    const m = addMessage(conv, "I attack the goblin");
    m.setDisplayLifetime("after-messages-deep:2");

    check(m.isDisplayExpired() === false, "fresh message (depth 0) not expired");
    check(m.isVisible() === true, "…and reports visible");

    addMessage(conv, "reply 1");
    check(m.isDisplayExpired() === false, "depth 1 (< N) not expired");

    addMessage(conv, "reply 2");
    check(m.isDisplayExpired() === true, "depth 2 (≥ N) expired");
    check(m.isVisible() === false, "…and reports not-visible (tile hides on this)");
    check(m.isVisibleToUser() === true, "isVisibleToUser untouched — expiry is a separate, derived state");
}

function testTimePolicy () {
    console.log("\nafter-resolved-seconds: expiry derives from the shared resolvedAt stamp vs the local clock");

    const conv = newConversation();
    const m = addMessage(conv, "roll request");
    m.setDisplayLifetime("after-resolved-seconds:10");

    check(m.isDisplayExpired() === false, "unresolved message never expires (dice still in the air)");
    check(m.displayExpiryTime() === null, "…and reports no pending expiry time");

    m.setResolvedAt(Date.now() - 11000); // resolved 11s ago (> N)
    check(m.isDisplayExpired() === true, "resolved 11s ago with N=10 → expired");

    m.setResolvedAt(Date.now() - 2000); // resolved 2s ago (< N)
    check(m.isDisplayExpired() === false, "resolved 2s ago with N=10 → not yet");
    check(m.displayExpiryTime() === m.resolvedAt() + 10000, "pending expiry time = resolvedAt + N seconds");

    // legacy rule: resolved-by-stored-fact (subclass isDisplayResolved
    // override, e.g. a roll with a result) but never stamped → derives as
    // long-expired (hidden on load, no linger replay)
    const legacy = addMessage(conv, "pre-feature roll");
    legacy.setDisplayLifetime("after-resolved-seconds:10");
    check(legacy.isDisplayExpired() === false, "default isDisplayResolved: no stamp → unresolved → never expires");
    legacy.isDisplayResolved = () => true; // subclass-style override (resolution is its own stored fact)
    check(legacy.resolvedAt() === null && legacy.isDisplayExpired() === true, "resolved-without-stamp (legacy) derives as long-expired");

    // markResolvedNow: first stamp wins
    const m2 = addMessage(conv, "another");
    m2.setDisplayLifetime("after-resolved-seconds:10");
    m2.markResolvedNow();
    const firstStamp = m2.resolvedAt();
    check(typeof firstStamp === "number", "markResolvedNow stamped the clock");
    m2.markResolvedNow();
    check(m2.resolvedAt() === firstStamp, "second markResolvedNow is a no-op (first stamp wins)");
}

function testSweepTransitionsAndTimer () {
    console.log("\nSweep: one view refresh per expiry transition; one timer for the earliest pending expiry");

    const conv = newConversation();
    const m = addMessage(conv, "user message");
    m.setDisplayLifetime("after-messages-deep:1");
    conv.sweepDisplayLifetimes(); // settle wasDisplayExpired baseline

    addMessage(conv, "reply"); // pushes m to depth 1 → expired
    const updates = countUpdates(m, () => {
        conv.sweepDisplayLifetimes();
        conv.sweepDisplayLifetimes(); // second sweep: no transition, no refresh
    });
    check(updates === 1, "exactly one didUpdateNode across two sweeps (transition fired once)");

    // timer arms only when a resolved-but-unexpired time policy is pending
    const pending = addMessage(conv, "resolved recently");
    pending.setDisplayLifetime("after-resolved-seconds:10");
    check(!conv._displayLifetimeTimeoutId, "no timer while nothing is pending");
    pending.markResolvedNow();
    conv.sweepDisplayLifetimes();
    check(Boolean(conv._displayLifetimeTimeoutId), "timer armed for the pending expiry");
    conv.armDisplayLifetimeTimer(null);
    check(!conv._displayLifetimeTimeoutId, "timer cleared when nothing pending (test cleanup)");
}

function testNextMessagePolicy () {
    console.log("\nafter-resolved-next-message: expires once resolved AND a later user-visible message completes");

    const conv = newConversation();
    const m = addMessage(conv, "roll request");
    m.setDisplayLifetime("after-resolved-next-message");

    check(m.isDisplayExpired() === false, "unresolved → not expired");

    m.setResolvedAt(1); // resolved (any stamp)
    check(m.isDisplayExpired() === false, "resolved but no later message → not expired (still the story's tail)");

    const invisible = addMessage(conv, "tool results");
    invisible.setIsVisibleToUser(false);
    check(m.isDisplayExpired() === false, "a later INVISIBLE message doesn't count (user never saw it)");

    const SvAiMessage = SvGlobals.get("SvAiMessage");
    const streaming = SvAiMessage.clone();
    streaming.setRole("assistant");
    streaming.setContent("The blade arcs…");
    streaming.setConversation(conv);
    conv.addSubnode(streaming); // incomplete — still streaming
    check(m.isDisplayExpired() === false, "a later visible but INCOMPLETE message doesn't count (narration still streaming)");

    streaming.setIsComplete(true);
    check(m.isDisplayExpired() === true, "later visible message completed → expired (the story moved past it)");
    check(m.isVisible() === false, "…and reports not-visible");

    // resolution still gates: an unresolved sibling with the same policy
    // stays visible even though later messages completed
    const unresolvedRoll = addMessage(conv, "second roll, dice in the air");
    unresolvedRoll.setDisplayLifetime("after-resolved-next-message");
    addMessage(conv, "party chat flowing past");
    check(unresolvedRoll.isDisplayExpired() === false, "unresolved message never expires however much arrives after it");
}

function testMalformedPolicies () {
    console.log("\nMalformed policies fail visible (never expire)");

    const conv = newConversation();
    const m = addMessage(conv, "message");

    const realWarn = console.warn;
    console.warn = () => {};
    try {
        m.setDisplayLifetime("after-messages-deep:oops");
        check(m.isDisplayExpired() === false, "non-numeric N → not expired");
        m.setDisplayLifetime("bogus-policy:5");
        check(m.isDisplayExpired() === false, "unknown policy → not expired");
    } finally {
        console.warn = realWarn;
    }
}

async function main () {
    console.log("TestDisplayLifetimes: booting strvct…");
    await boot();

    SvGlobals.get("SvSyncScheduler").shared().pause();

    testDepthPolicy();
    testTimePolicy();
    testNextMessagePolicy();
    testSweepTransitionsAndTimer();
    testMalformedPolicies();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
