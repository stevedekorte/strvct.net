#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvXhrRequest automatic-retry DECISION.
 *
 * A transient 502 — from an image host, or from our own /proxy when its upstream
 * socket dies — used to kill a whole image generation: SvFileToDownload.fetch()
 * throws on any non-2xx and the enclosing Promise.all over the download urls
 * rejects. SvXhrRequest already knew which status codes are worth repeating
 * (statusCodeMap) and already had the backoff math, but nothing called it.
 *
 * asyncSend() is now a send → await → classify loop. The behavior it must have:
 *
 *   - Automatic retry is OPT-IN. maxRetries defaults to 0, so an unmodified
 *     request behaves exactly as it did before: one attempt, whatever the error.
 *     This is what makes the change safe for the streaming path (SvAiRequest
 *     consumes an SvXhrRequest incrementally) and for non-idempotent, billable
 *     POSTs (an image job submit).
 *   - With setMaxRetries(n), a retryable failure is repeated up to n times.
 *   - Only retryable failures: a 404 / 400 is final, and an abort is never retried.
 *   - onRequestFailure / onRequestSuccess / onRequestComplete and the
 *     completionPromise resolution fire EXACTLY ONCE, after the final attempt.
 *     A caller that saw onRequestFailure for attempt 1 would give up while a
 *     retry was still in flight.
 *
 * The XHR itself is faked: a scripted global XMLHttpRequest is installed BEFORE
 * boot, which also keeps XMLHttpRequestShim.js from requiring the xhr2 package.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestXhrAutoRetry.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

// Boot expects cwd to be the site root (build/_index.json lives there).
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

// --- the scripted fake XHR -------------------------------------------------

// Each entry is one attempt's outcome, consumed in order by send().
let scriptedOutcomes = [];
let attemptCount = 0;

class FakeXMLHttpRequest {

    constructor () {
        this.readyState = 0;
        this.status = 0;
        this.statusText = "";
        this.response = null;
        this.responseText = "";
        this.responseType = "";
        this.timeout = 0;
        this.listenersByName = new Map();
    }

    addEventListener (name, handler) {
        if (!this.listenersByName.has(name)) {
            this.listenersByName.set(name, []);
        }
        this.listenersByName.get(name).push(handler);
    }

    fire (name) {
        const handlers = this.listenersByName.get(name) || [];
        handlers.forEach((handler) => handler({ type: name, target: this }));
    }

    open (method, url) {
        this.method = method;
        this.url = url;
        this.readyState = 1;
    }

    setRequestHeader () {
    }

    getResponseHeader (name) {
        return name.toLowerCase() === "content-type" ? "text/plain" : null;
    }

    abort () {
        this.deliver({ kind: "abort" });
    }

    send () {
        attemptCount++;
        const outcome = scriptedOutcomes.shift() || { kind: "status", status: 200 };
        setTimeout(() => this.deliver(outcome), 0);
    }

    deliver (outcome) {
        this.fire("loadstart");
        this.readyState = 4;
        if (outcome.kind === "status") {
            this.status = outcome.status;
            this.responseText = outcome.body || "";
            if (this.status >= 200 && this.status < 300) {
                this.fire("load");
            }
            this.fire("loadend");
        } else if (outcome.kind === "networkError") {
            this.fire("error");
            this.fire("loadend");
        } else if (outcome.kind === "timeout") {
            this.fire("timeout");
            this.fire("loadend");
        } else if (outcome.kind === "abort") {
            this.fire("abort");
            this.fire("loadend");
        }
    }

}

global.XMLHttpRequest = FakeXMLHttpRequest;

// --- boot ------------------------------------------------------------------

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

    // Resources that need native modules unavailable in this environment (the
    // canvas bindings) must not abort the boot — the model classes under test
    // do not depend on them.
    const originalSerialForEach = Array.prototype.promiseSerialForEach;
    Array.prototype.promiseSerialForEach = async function (callback) {
        for (let i = 0; i < this.length; i++) {
            try {
                await callback(this[i], i, this);
            } catch {
                // intentionally swallow
            }
        }
    };
    await SvResourceManager.shared().setupAndRun();
    await SvResourceManager.shared().promiseCompleted();
    Array.prototype.promiseSerialForEach = originalSerialForEach;
}

// --- helpers ---------------------------------------------------------------

function newRecordingDelegate () {
    const counts = {};
    const record = (name) => { counts[name] = (counts[name] || 0) + 1; };
    return {
        counts: counts,
        onRequestBegin: () => record("onRequestBegin"),
        onRequestProgress: () => record("onRequestProgress"),
        onRequestSuccess: () => record("onRequestSuccess"),
        onRequestFailure: () => record("onRequestFailure"),
        onRequestAbort: () => record("onRequestAbort"),
        onRequestError: () => record("onRequestError"),
        onRequestTimeout: () => record("onRequestTimeout"),
        onRequestComplete: () => record("onRequestComplete")
    };
}

function newRequest (maxRetries) {
    const request = SvGlobals.get("SvXhrRequest").clone();
    request.setUrl("https://example.com/image.png");
    request.setMethod("GET");
    request.setHeaders({});
    request.setRetryDelaySeconds(0); // keep the test fast; backoff math is unchanged
    if (maxRetries !== undefined) {
        request.setMaxRetries(maxRetries);
    }
    return request;
}

// Counts every completionPromise the request creates and resolves. Call BEFORE
// asyncSend(): the point is to catch a completion promise created (and settled)
// per attempt rather than once per asyncSend().
function watchCompletionPromises (request, counter) {
    const originalSetter = request.setCompletionPromise.bind(request);
    request.setCompletionPromise = function (aPromise) {
        originalSetter(aPromise);
        if (aPromise) {
            counter.created++;
            aPromise.then(() => { counter.resolutions++; });
        }
        return this;
    };
}

async function runScript (request, outcomes) {
    scriptedOutcomes = outcomes;
    attemptCount = 0;
    await request.asyncSend();
    return attemptCount;
}

// --- tests -----------------------------------------------------------------

function testRetriesAreOffByDefault () {
    console.log("\nretries are opt-in");
    const request = newRequest();
    check(request.maxRetries() === 0, "maxRetries defaults to 0 (no automatic retries)");
}

async function testNoRetryWhenDisabled () {
    console.log("\ndefault request: a 502 is NOT retried");
    const request = newRequest();
    const delegate = newRecordingDelegate();
    request.setDelegate(delegate);

    const attempts = await runScript(request, [{ kind: "status", status: 502 }]);

    check(attempts === 1, "sent exactly one attempt");
    check(request.hasError() === true, "request reports an error");
    check(request.retryCount() === 0, "retryCount stayed 0");
    check(delegate.counts.onRequestFailure === 1, "onRequestFailure sent once");
    check(delegate.counts.onRequestComplete === 1, "onRequestComplete sent once");
}

async function testRetryThenSuccess () {
    console.log("\nopted in: 502 then 200 succeeds");
    const request = newRequest(3);
    const delegate = newRecordingDelegate();
    request.setDelegate(delegate);
    const counter = { created: 0, resolutions: 0 };
    watchCompletionPromises(request, counter);

    const attempts = await runScript(request, [
        { kind: "status", status: 502 },
        { kind: "status", status: 200, body: "ok" }
    ]);
    await request.completionPromise();

    check(attempts === 2, "sent two attempts");
    check(request.hasError() === false, "final state is success");
    check(request.retryCount() === 1, "retryCount is 1");
    check(delegate.counts.onRequestSuccess === 1, "onRequestSuccess sent once");
    check(delegate.counts.onRequestFailure === undefined, "onRequestFailure never sent");
    check(delegate.counts.onRequestComplete === 1, "onRequestComplete sent once, after the last attempt");
    check(counter.created === 1, "one completionPromise for the whole asyncSend, not one per attempt");
    check(counter.resolutions === 1, "completionPromise resolved exactly once");
}

async function testGivesUpAfterMaxRetries () {
    console.log("\nopted in: gives up after maxRetries");
    const request = newRequest(2);
    const delegate = newRecordingDelegate();
    request.setDelegate(delegate);

    const attempts = await runScript(request, [
        { kind: "status", status: 502 },
        { kind: "status", status: 503 },
        { kind: "status", status: 502 },
        { kind: "status", status: 200 } // must never be reached
    ]);

    check(attempts === 3, "sent the initial attempt plus 2 retries");
    check(request.hasError() === true, "still an error");
    check(request.retryCount() === 2, "retryCount is 2");
    check(delegate.counts.onRequestFailure === 1, "onRequestFailure sent once, not once per attempt");
    check(delegate.counts.onRequestComplete === 1, "onRequestComplete sent once");
}

async function testNoRetryForFinalStatusCodes () {
    console.log("\nopted in: 404 and 400 are final");
    for (const status of [404, 400]) {
        const request = newRequest(3);
        const attempts = await runScript(request, [
            { kind: "status", status: status },
            { kind: "status", status: 200 } // must never be reached
        ]);
        check(attempts === 1, status + " is not retried");
        check(request.hasError() === true, status + " leaves the request in error");
    }
}

async function testRetriesTimeout () {
    console.log("\nopted in: a timeout is retried");
    const request = newRequest(3);
    const attempts = await runScript(request, [
        { kind: "timeout" },
        { kind: "status", status: 200 }
    ]);
    check(attempts === 2, "timed-out attempt was repeated");
    check(request.hasError() === false, "the retry succeeded");
    check(request.didTimeout() === false, "didTimeout was cleared for the new attempt");
}

async function testRetriesNetworkError () {
    console.log("\nopted in: a transport error is retried");
    const request = newRequest(3);
    const attempts = await runScript(request, [
        { kind: "networkError" },
        { kind: "status", status: 200 }
    ]);
    check(attempts === 2, "failed attempt was repeated");
    check(request.hasError() === false, "the retry succeeded");
}

async function testAbortIsNeverRetried () {
    console.log("\nopted in: an abort is never retried");
    const request = newRequest(3);
    const delegate = newRecordingDelegate();
    request.setDelegate(delegate);

    let threw = false;
    try {
        await runScript(request, [
            { kind: "abort" },
            { kind: "status", status: 200 } // must never be reached
        ]);
    } catch {
        threw = true;
    }

    check(attemptCount === 1, "only one attempt was sent");
    check(threw === true, "asyncSend still rejects on abort, as before");
    check(request.didAbort() === true, "the request is marked aborted");
    check(delegate.counts.onRequestAbort === 1, "onRequestAbort sent once");
    check(delegate.counts.onRequestFailure === undefined, "no onRequestFailure for an abort");
}

async function testAbortDuringBackoffStopsTheLoop () {
    console.log("\nopted in: aborting during the backoff window stops the retry");
    const request = newRequest(3);
    const delegate = newRecordingDelegate();
    request.setDelegate(delegate);
    request.setRetryDelaySeconds(1); // wide enough to abort inside it

    scriptedOutcomes = [
        { kind: "status", status: 502 },
        { kind: "status", status: 200 } // must never be reached
    ];
    attemptCount = 0;

    const sendPromise = request.asyncSend();
    // Wait for the first attempt to fail and the loop to enter its backoff.
    while (!request.isWaitingToRetry()) {
        await new Promise((resolve) => setTimeout(resolve, 5));
    }
    request.abort();

    let threw = false;
    try {
        await sendPromise;
    } catch {
        threw = true;
    }

    check(attemptCount === 1, "the queued retry was never sent");
    check(threw === true, "asyncSend rejects, as it does for a mid-flight abort");
    check(request.didAbort() === true, "the request is marked aborted");
    check(delegate.counts.onRequestAbort === 1, "onRequestAbort sent once");
    check(delegate.counts.onRequestComplete === undefined, "no onRequestComplete for an abort");
}

async function testShouldRetryPredicate () {
    console.log("\nshouldRetryAfterAttempt() consults the status map");
    const request = newRequest(3);
    await runScript(request, [{ kind: "status", status: 200 }]);
    check(request.shouldRetryAfterAttempt() === false, "a success is never retried");
    check(request.didAttemptFail() === false, "a success did not fail");
}

async function main () {
    console.log("TestXhrAutoRetry: booting strvct…");
    await boot();

    testRetriesAreOffByDefault();
    await testNoRetryWhenDisabled();
    await testRetryThenSuccess();
    await testGivesUpAfterMaxRetries();
    await testNoRetryForFinalStatusCodes();
    await testRetriesTimeout();
    await testRetriesNetworkError();
    await testAbortIsNeverRetried();
    await testAbortDuringBackoffStopsTheLoop();
    await testShouldRetryPredicate();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
