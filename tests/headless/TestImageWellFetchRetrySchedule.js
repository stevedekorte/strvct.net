#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvImageWellFieldTile's blob-fetch retry schedule.
 *
 * A guest's image well resolves the final image by content hash. Any single
 * 404 (the blob not yet pushed, or a probe that raced the push) is cached for
 * 60s in two independent negative caches, so the retry schedule has to outlast
 * them. The old schedule was 8 attempts at 200·n ms — every attempt spent
 * inside 7.2s, i.e. entirely against the cache — after which the well gave up
 * forever. The replacement is capped exponential backoff with a 5-minute
 * horizon, plus a "force past the caches" flag and a stall hook that lets the
 * node go get the bytes made available.
 *
 * Covered here (all DOM-free: the schedule and its bookkeeping are pure
 * methods invoked on a stub receiver, the same technique TestImageEnvelopeReplay
 * uses for the client session's seq guard):
 *   1. imageFetchRetryDelayMs — exact values, monotonicity, the 15s cap
 *   2. the horizon and its interaction with scheduleImageFetchRetry
 *   3. force-past-the-caches from the second attempt on
 *   4. retry bookkeeping resets when the target hash changes
 *   5. the optional onProgressiveImageFetchStalled hook: first at attempt 3,
 *      then throttled to once per report interval
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestImageWellFetchRetrySchedule.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

// Boot expects cwd to be the strvct root (build/_index.json lives there).
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

/**
 * A DOM-free stand-in for a live tile: inherits every tile method (so the code
 * under test is the shipped code) but replaces the two things that would need a
 * browser — the well view and addTimeout — with recorders.
 */
function makeStubTile (proto, node) {
    const stub = Object.create(proto);
    stub.scheduled = [];
    stub.wellWorkingCalls = [];
    stub.traces = [];
    stub.errors = [];
    stub.node = () => node;
    stub.imageWellView = () => ({ setIsWorking: (b) => stub.wellWorkingCalls.push(b) });
    stub.addTimeout = (fn, ms, name) => { stub.scheduled.push({ ms, name }); return stub; };
    stub.logProgressive = (m) => { stub.traces.push(m); return stub; };
    return stub;
}

function testDelaySchedule (proto) {
    console.log("\nimageFetchRetryDelayMs — capped exponential backoff");
    const delays = [1, 2, 3, 4, 5, 6, 7, 8, 20].map((n) => proto.imageFetchRetryDelayMs(n));
    check(JSON.stringify(delays.slice(0, 6)) === JSON.stringify([250, 500, 1000, 2000, 4000, 8000]),
        "attempts 1-6 are 250, 500, 1000, 2000, 4000, 8000 ms (got " + delays.slice(0, 6).join(", ") + ")");
    check(delays[6] === 15000 && delays[7] === 15000 && delays[8] === 15000,
        "attempt 7 onward repeats at the 15s cap");
    check(delays.every((d, i) => i === 0 || d >= delays[i - 1]), "the schedule is monotone non-decreasing");
    check(delays.every((d) => d <= proto.imageFetchRetryMaxDelayMs()), "no delay exceeds imageFetchRetryMaxDelayMs()");
    check(proto.imageFetchRetryDelayMs(0) === 250 && proto.imageFetchRetryDelayMs(-5) === 250,
        "a non-positive attempt clamps to the first delay rather than returning a sub-ms value");

    // The whole point of the rewrite: the schedule must outlast a 60s negative
    // cache. The old one (8 attempts at 200*n, 7.2s total) never could.
    const cumulativeMs = (attempts) => {
        let total = 0;
        for (let n = 1; n <= attempts; n++) { total += proto.imageFetchRetryDelayMs(n); }
        return total;
    };
    check(cumulativeMs(9) > 60000, "the schedule passes the 60s negative-cache TTL by attempt 9 ("
        + cumulativeMs(9) + "ms; the old schedule's whole run was 7200ms)");
    check(cumulativeMs(9) < proto.imageFetchRetryHorizonMs(),
        "...with the horizon still leaving room for many more attempts");
    check(proto.imageFetchRetryHorizonMs() === 300000, "the retry horizon is 5 minutes");
    check(proto.imageFetchStallReportIntervalMs() === 30000, "the stall hook reports at most every 30s");
}

function testHorizon (proto) {
    console.log("\nscheduleImageFetchRetry — bookkeeping and the horizon");
    const stub = makeStubTile(proto, { value: () => null });

    stub.scheduleImageFetchRetry();
    check(stub.imageFetchFirstMissMs() !== 0, "the first miss stamps the horizon clock");
    check(stub.imageFetchRetryCount() === 1, "the first call is attempt 1");
    check(stub.scheduled.length === 1 && stub.scheduled[0].ms === 250, "attempt 1 is scheduled 250ms out");

    stub.scheduleImageFetchRetry();
    check(stub.imageFetchRetryCount() === 2 && stub.scheduled[1].ms === 500, "attempt 2 is scheduled 500ms out");
    check(stub.wellWorkingCalls.length === 0, "a miss does NOT turn the working indicator off (the well keeps preview + shimmer)");

    // Backdate past the horizon: the next call must report failure instead of
    // scheduling attempt 3 forever.
    stub.setImageFetchFirstMissMs(Date.now() - proto.imageFetchRetryHorizonMs() - 1);
    const scheduledBefore = stub.scheduled.length;
    const errs = [];
    const realError = console.error;
    console.error = (...a) => errs.push(a.join(" "));
    stub.scheduleImageFetchRetry();
    console.error = realError;
    check(stub.scheduled.length === scheduledBefore, "past the horizon no further retry is scheduled");
    check(errs.length === 1 && errs[0].includes("never became fetchable"),
        "horizon exhaustion logs a console.error naming the failure");
    check(stub.wellWorkingCalls.length === 1 && stub.wellWorkingCalls[0] === false,
        "horizon exhaustion stops the shimmer (exactly once)");
}

function testForceAndTargetReset (proto) {
    console.log("\nforce past the negative caches, and reset on a new target");
    const imageNode = { valueHash: () => "a".repeat(64) };
    const node = { value: () => imageNode };
    const stub = makeStubTile(proto, node);

    check(stub.nodeFinalHash() === "a".repeat(64), "nodeFinalHash reads the hash off the node's value");

    // Mirror the real sequence: every sync pass opens with the target check,
    // then a miss schedules a retry, whose own pass re-checks the target.
    stub.resetImageFetchRetriesIfTargetChanged();
    check(stub.shouldForceFinalImageFetch() === false, "the FIRST attempt does not force (a fresh miss may be a real 404)");
    stub.scheduleImageFetchRetry();
    check(stub.shouldForceFinalImageFetch() === true, "from the second attempt on the resolve forces past both caches");

    // Same hash: bookkeeping survives, so the backoff actually progresses
    // instead of restarting at 250ms on every re-sync.
    stub.resetImageFetchRetriesIfTargetChanged();
    check(stub.imageFetchRetryCount() === 1, "an unchanged hash keeps the attempt count");

    // New hash: a different blob, so attempts and horizon must not carry over.
    node.value = () => ({ valueHash: () => "b".repeat(64) });
    stub.resetImageFetchRetriesIfTargetChanged();
    check(stub.imageFetchRetryCount() === 0 && stub.imageFetchFirstMissMs() === 0,
        "a CHANGED hash resets the attempt count and the horizon clock");
    check(stub.lastFetchedFinalHash() === "b".repeat(64), "the new target hash is recorded");

    // The stub -> completion transition (null hash becomes a real one) is the
    // common case, and it must also clear a previously exhausted schedule.
    const cold = makeStubTile(proto, { value: () => null });
    cold.resetImageFetchRetriesIfTargetChanged();
    cold.setImageFetchRetryCount(7);
    cold.setImageFetchFirstMissMs(1);
    cold.node = () => ({ value: () => ({ valueHash: () => "d".repeat(64) }) });
    cold.resetImageFetchRetriesIfTargetChanged();
    check(cold.imageFetchRetryCount() === 0 && cold.imageFetchFirstMissMs() === 0,
        "a stub well whose completion envelope brings a hash starts its schedule fresh");

    stub.setImageFetchRetryCount(4);
    stub.resetImageFetchRetries();
    check(stub.imageFetchRetryCount() === 0 && stub.lastFetchStallReportMs() === 0,
        "resetImageFetchRetries clears the count and the stall-report clock (the success path)");
}

function testStallHook (proto) {
    console.log("\nonProgressiveImageFetchStalled — optional node hook");
    const calls = [];
    const hash = "c".repeat(64);
    const node = {
        value: () => ({ valueHash: () => hash }),
        onProgressiveImageFetchStalled: (attempt, h) => calls.push({ attempt, h })
    };
    const stub = makeStubTile(proto, node);

    stub.notifyNodeOfImageFetchStall(1);
    stub.notifyNodeOfImageFetchStall(2);
    check(calls.length === 0, "attempts 1-2 do not bother the node (a startup race resolves itself)");

    stub.notifyNodeOfImageFetchStall(3);
    check(calls.length === 1 && calls[0].attempt === 3 && calls[0].h === hash,
        "attempt 3 reports the stall with the attempt number and the hash");

    stub.notifyNodeOfImageFetchStall(4);
    stub.notifyNodeOfImageFetchStall(5);
    check(calls.length === 1, "further attempts inside the report interval are throttled");

    stub.setLastFetchStallReportMs(Date.now() - proto.imageFetchStallReportIntervalMs() - 1);
    stub.notifyNodeOfImageFetchStall(6);
    check(calls.length === 2 && calls[1].attempt === 6, "once the interval elapses the stall is reported again");

    // A node with no hook must be completely unaffected (the hook is optional,
    // deliberately NOT a declared protocol method — addProtocol would then
    // throw for any conformer that has no recovery to offer).
    const plain = makeStubTile(proto, { value: () => null });
    let threw = false;
    try { plain.notifyNodeOfImageFetchStall(5); } catch { threw = true; }
    check(threw === false, "a node that doesn't implement the hook is skipped silently");
}

async function main () {
    await boot();
    const tileClass = SvGlobals.get("SvImageWellFieldTile");
    const protocol = SvGlobals.get("SvProgressiveImageSourceProtocol");
    console.log("\nLoad");
    check(!!tileClass, "SvImageWellFieldTile loaded at boot");
    check(!!protocol, "SvProgressiveImageSourceProtocol loaded at boot");
    check(protocol.protocolMethodNames().indexOf("onProgressiveImageFetchStalled") === -1,
        "the stall hook is NOT a declared protocol method (it must stay optional)");

    const proto = tileClass.prototype;
    testDelaySchedule(proto);
    testHorizon(proto);
    testForceAndTargetReset(proto);
    testStallHook(proto);

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
