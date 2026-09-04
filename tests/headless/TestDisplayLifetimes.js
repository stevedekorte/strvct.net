#!/usr/bin/env node

"use strict";

/**
 * Headless test: message display lifetimes (Plans/Disappearing Messages).
 *
 * Invariants under test:
 * - v1 isDisplayExpired: only complete narration-progress-only messages,
 *   and once a later follow-on has begun (narration/table-talk text, even
 *   while streaming) or a later completed user/choice message exists.
 * - isVisible() does NOT fold expiry (the tile stays in the column).
 * - Stored policies live on isExpiredByStoredPolicy (later slices).
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

    check(m.isExpiredByStoredPolicy() === false, "fresh message (depth 0) not expired");
    check(m.isDisplayExpired() === false, "v1 isDisplayExpired ignores stored depth policy");
    check(m.isVisible() === true, "…and reports visible");

    addMessage(conv, "reply 1");
    check(m.isExpiredByStoredPolicy() === false, "depth 1 (< N) not expired");

    addMessage(conv, "reply 2");
    check(m.isExpiredByStoredPolicy() === true, "depth 2 (≥ N) expired by stored policy");
    check(m.isDisplayExpired() === false, "v1 still ignores stored depth policy");
    check(m.isVisible() === true, "isVisible does not fold expiry — tile stays in the column");
    check(m.isVisibleToUser() === true, "isVisibleToUser untouched — expiry is a separate, derived state");
}

function testTimePolicy () {
    console.log("\nafter-resolved-seconds: expiry derives from the shared resolvedAt stamp vs the local clock");

    const conv = newConversation();
    const m = addMessage(conv, "roll request");
    m.setDisplayLifetime("after-resolved-seconds:10");

    check(m.isExpiredByStoredPolicy() === false, "unresolved message never expires (dice still in the air)");
    check(m.displayExpiryTime() === null, "…and reports no pending expiry time");

    m.setResolvedAt(Date.now() - 11000); // resolved 11s ago (> N)
    check(m.isExpiredByStoredPolicy() === true, "resolved 11s ago with N=10 → expired");

    m.setResolvedAt(Date.now() - 2000); // resolved 2s ago (< N)
    check(m.isExpiredByStoredPolicy() === false, "resolved 2s ago with N=10 → not yet");
    check(m.displayExpiryTime() === m.resolvedAt() + 10000, "pending expiry time = resolvedAt + N seconds");

    // legacy rule: resolved-by-stored-fact (subclass isDisplayResolved
    // override, e.g. a roll with a result) but never stamped → derives as
    // long-expired (hidden on load, no linger replay)
    const legacy = addMessage(conv, "pre-feature roll");
    legacy.setDisplayLifetime("after-resolved-seconds:10");
    check(legacy.isExpiredByStoredPolicy() === false, "default isDisplayResolved: no stamp → unresolved → never expires");
    legacy.isDisplayResolved = () => true; // subclass-style override (resolution is its own stored fact)
    check(legacy.resolvedAt() === null && legacy.isExpiredByStoredPolicy() === true, "resolved-without-stamp (legacy) derives as long-expired");

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
    const progress = addProgressMessage(conv, "Checking on the tavern…");
    conv.sweepDisplayLifetimes(); // settle wasDisplayExpired baseline

    const story = addMessage(conv, "<narration><p>The door opens.</p></narration>");
    story.setRole("assistant");
    const updates = countUpdates(progress, () => {
        conv.sweepDisplayLifetimes();
        conv.sweepDisplayLifetimes(); // second sweep: no transition, no refresh
    });
    // The sweep deliberately does NOT didUpdateNode on an expiry transition
    // (SvConversation.sweepDisplayLifetimes, 2026-08-28): a message notify
    // bubbles to the conversation, rebuilds the column, bumps
    // SvImageWellFieldTile's progressive epoch and cancels in-flight blob
    // loads — reopening a session showed a blank scene-image well. The hide is
    // tag-only; chat tiles animate it themselves. This assertion used to
    // expect 1 and was left behind by that fix; it now guards against
    // reintroducing the column storm.
    check(updates === 0, "no didUpdateNode from the sweep — the hide is tag-only (got " + updates + ")");

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

    check(m.isExpiredByStoredPolicy() === false, "unresolved → not expired");

    m.setResolvedAt(1); // resolved (any stamp)
    check(m.isExpiredByStoredPolicy() === false, "resolved but no later message → not expired (still the story's tail)");

    const invisible = addMessage(conv, "tool results");
    invisible.setIsVisibleToUser(false);
    check(m.isExpiredByStoredPolicy() === false, "a later INVISIBLE message doesn't count (user never saw it)");

    const SvAiMessage = SvGlobals.get("SvAiMessage");
    const streaming = SvAiMessage.clone();
    streaming.setRole("assistant");
    streaming.setContent("The blade arcs…");
    streaming.setConversation(conv);
    conv.addSubnode(streaming); // incomplete — still streaming
    check(m.isExpiredByStoredPolicy() === false, "a later visible but INCOMPLETE message doesn't count (narration still streaming)");

    streaming.setIsComplete(true);
    check(m.isExpiredByStoredPolicy() === true, "later visible message completed → expired (the story moved past it)");
    check(m.isVisible() === true, "isVisible stays true — expiry is the tile's job");

    // resolution still gates: an unresolved sibling with the same policy
    // stays visible even though later messages completed
    const unresolvedRoll = addMessage(conv, "second roll, dice in the air");
    unresolvedRoll.setDisplayLifetime("after-resolved-next-message");
    addMessage(conv, "party chat flowing past");
    check(unresolvedRoll.isExpiredByStoredPolicy() === false, "unresolved message never expires however much arrives after it");
}

function addProgressMessage (conv, inner) {
    const SvAiMessage = SvGlobals.get("SvAiMessage");
    const m = SvAiMessage.clone();
    m.setRole("assistant");
    m.setContent("<narration-progress>" + inner + "</narration-progress>");
    m.setIsComplete(true);
    m.setConversation(conv);
    conv.addSubnode(m);
    return m;
}

function testNarrationProgressSlice () {
    console.log("\nv1 slice: only narration-progress-only messages expire, and only after a later completed follow-on");

    const conv = newConversation();
    const progress = addProgressMessage(conv, "Checking on the tavern…");
    check(progress.isNarrationProgressOnly() === true, "progress-only content is detected");
    check(progress.isDisplayExpired() === false, "complete progress with no later message stays visible");

    const invisible = addMessage(conv, "Continue.");
    invisible.setIsVisibleToUser(false);
    check(progress.isDisplayExpired() === false, "later invisible message does not expire it");

    check(progress.hasNarrationContent() === false, "progress-only is not a <narration> tag");
    check(progress.hasFollowOnContent() === false, "progress-only has no follow-on of its own");

    const moreProgress = addProgressMessage(conv, "Still checking…");
    check(progress.isDisplayExpired() === false, "a later progress-only line does not expire it");

    const streamingProgress = addMessage(conv, "<narration-progress>Filing the arrival…");
    streamingProgress.setRole("assistant");
    streamingProgress.setIsComplete(false);
    check(progress.isDisplayExpired() === false, "a later unclosed progress tag does not expire it");
    check(moreProgress.isDisplayExpired() === false, "…nor the progress line just before it");

    const streaming = addMessage(conv, "<narration><p>The door</p></narration>");
    streaming.setRole("assistant");
    streaming.setIsComplete(false);
    check(progress.isDisplayExpired() === true, "begun later narration expires earlier progress");
    check(moreProgress.isDisplayExpired() === true, "…and the progress line just before it");
    check(progress.isVisible() === true, "expired progress is still isVisible (tile stays in the column)");

    const convTalk = newConversation();
    const prep = addProgressMessage(convTalk, "Preparing to begin…");
    const talk = addMessage(convTalk, "<table-talk>Welcome to the table.</table-talk>");
    talk.setRole("assistant");
    check(prep.isDisplayExpired() === true, "later completed table-talk expires progress-only");

    const convUser = newConversation();
    const look = addProgressMessage(convUser, "Waiting…");
    addMessage(convUser, "I open the door.");
    check(look.isDisplayExpired() === true, "a later completed user line expires progress-only");

    const mixed = addMessage(conv, "<narration-progress>Checking…</narration-progress>\nThe door creaks.");
    mixed.setRole("assistant");
    addMessage(conv, "after mixed");
    check(mixed.isNarrationProgressOnly() === false, "progress plus prose is not progress-only");
    check(mixed.isDisplayExpired() === false, "mixed message does not expire");

    const toolsOnly = addMessage(conv, "<tool-call>lookup</tool-call>");
    toolsOnly.setRole("assistant");
    addMessage(conv, "after tools");
    check(toolsOnly.isNarrationProgressOnly() === false, "tool-only (no progress tag) is not progress-only");
    check(toolsOnly.isDisplayExpired() === false, "tool-only does not expire in v1");

    const conv2 = newConversation();
    const stale = addProgressMessage(conv2, "Checking…");
    const leftover = addMessage(conv2, "<narration><p>The door was already open.</p></narration>");
    leftover.setRole("assistant");
    leftover.setIsComplete(false);
    check(stale.isDisplayExpired() === true, "begun later narration expires it without waiting for complete");

    const conv3 = newConversation();
    const waiting = addProgressMessage(conv3, "Preparing to begin…");
    const choice = addMessage(conv3, "");
    choice.setRole("assistant");
    choice.setIsComplete(false);
    check(waiting.isDisplayExpired() === false, "a later incomplete choice does not expire progress-only");
}

function testMalformedPolicies () {
    console.log("\nMalformed policies fail visible (never expire)");

    const conv = newConversation();
    const m = addMessage(conv, "message");

    const realWarn = console.warn;
    console.warn = () => {};
    try {
        m.setDisplayLifetime("after-messages-deep:oops");
        check(m.isExpiredByStoredPolicy() === false, "non-numeric N → not expired");
        m.setDisplayLifetime("bogus-policy:5");
        check(m.isExpiredByStoredPolicy() === false, "unknown policy → not expired");
    } finally {
        console.warn = realWarn;
    }
}

async function main () {
    console.log("TestDisplayLifetimes: booting strvct…");
    await boot();

    SvGlobals.get("SvSyncScheduler").shared().pause();

    testNarrationProgressSlice();
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
