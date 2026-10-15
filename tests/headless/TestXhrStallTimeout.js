#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvXhrRequest's stall watch for streamed responses.
 *
 * A streamed AI reply used to be cut off at timeoutPeriodInMs (4 minutes) of
 * TOTAL time — the native XHR timeout — even while it was still arriving
 * (2026-10-14, a Campaign Assistant writing a bestiary). With
 * setStallTimeoutPeriodInMs(n):
 *
 *   - a reply that keeps arriving runs past timeoutPeriodInMs and succeeds;
 *   - a reply that goes silent for n ms after its first byte fails as a
 *     timeout, says so, and is NOT replayed (the caller consumed its prefix);
 *   - a reply with no first byte still fails at timeoutPeriodInMs, and may be
 *     sent once more (retriesUnansweredFailureOnce) as before;
 *   - a caller's abort mid-stream is still an abort;
 *   - without the slot, the native total timeout is unchanged.
 *
 * The XHR is faked: a scripted global XMLHttpRequest streams chunks on real
 * timers, installed BEFORE boot (which also keeps XMLHttpRequestShim.js from
 * requiring xhr2). Limits are scaled down to milliseconds.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestXhrStallTimeout.js
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

// --- the scripted streaming fake XHR ---------------------------------------

// Each entry is one attempt's script: { chunkDelaysMs: [...], end: "complete" | "silent" }.
let scripts = [];
let sentXhrs = [];

class FakeStreamingXhr {

    constructor () {
        this.readyState = 0;
        this.status = 0;
        this.responseText = "";
        this.response = null;
        this.responseType = "";
        this.timeout = 0;
        this.listenersByName = new Map();
        this.timers = [];
    }

    addEventListener (name, handler) {
        if (!this.listenersByName.has(name)) {
            this.listenersByName.set(name, []);
        }
        this.listenersByName.get(name).push(handler);
    }

    fire (name) {
        (this.listenersByName.get(name) || []).forEach((handler) => handler({ type: name, target: this }));
    }

    open () {
        this.readyState = 1;
    }

    setRequestHeader () {
    }

    getResponseHeader (name) {
        return name.toLowerCase() === "content-type" ? "text/event-stream" : null;
    }

    send () {
        sentXhrs.push(this);
        const script = scripts.shift() || { chunkDelaysMs: [], end: "complete" };
        this.fire("loadstart");
        let at = 0;
        script.chunkDelaysMs.forEach((delay, i) => {
            at += delay;
            this.later(() => this.receiveChunk("data: chunk " + i + "\n"), at);
        });
        if (script.end === "complete") {
            this.later(() => this.complete(), at + 5);
        }
    }

    later (fn, ms) {
        this.timers.push(setTimeout(fn, ms));
    }

    receiveChunk (text) {
        this.readyState = 3;
        this.status = 200;
        this.responseText += text;
        this.fire("progress");
    }

    complete () {
        this.readyState = 4;
        this.status = 200;
        this.fire("load");
        this.fire("loadend");
    }

    // as the spec: an abort ends the request and empties the response, then fires abort and loadend synchronously
    abort () {
        this.timers.forEach((t) => clearTimeout(t));
        this.readyState = 4;
        this.status = 0;
        this.responseText = "";
        this.fire("abort");
        this.fire("loadend");
    }

}

global.XMLHttpRequest = FakeStreamingXhr;

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

// timeout 300 ms before the first byte, 150 ms of silence once streaming
function newStreamRequest () {
    const request = SvGlobals.get("SvXhrRequest").clone();
    request.setUrl("https://api.example.com/v1/messages");
    request.setMethod("POST");
    request.setHeaders({});
    request.setBody("{}");
    request.setTimeoutPeriodInMs(300);
    request.setStallTimeoutPeriodInMs(150);
    request.setRetriesUnansweredFailureOnce(true);
    request.setRetryDelaySeconds(0);
    return request;
}

function every (ms, count) {
    return new Array(count).fill(ms);
}

async function send (request, attemptScripts) {
    scripts = attemptScripts;
    sentXhrs = [];
    const delegate = newRecordingDelegate();
    request.setDelegate(delegate);
    const start = Date.now();
    await request.asyncSend();
    return { delegate, elapsed: Date.now() - start, attempts: sentXhrs.length };
}

// --- tests -----------------------------------------------------------------

async function testLongReplyStillArrivingSucceeds () {
    console.log("\na reply still arriving runs past the total timeout");
    const request = newStreamRequest();
    const { delegate, elapsed, attempts } = await send(request, [{ chunkDelaysMs: every(50, 14), end: "complete" }]);
    check(elapsed > 600, "streamed for " + elapsed + " ms, twice the 300 ms timeout");
    check(!request.didTimeout() && !request.hasError(), "did not time out or fail");
    check(delegate.counts.onRequestSuccess === 1, "onRequestSuccess sent once");
    check(attempts === 1, "one attempt");
    check(sentXhrs[0].timeout === 0, "the native XHR timeout is off");
}

async function testSilenceMidReplyTimesOut () {
    console.log("\na reply that goes silent fails after the stall period");
    const request = newStreamRequest();
    const { delegate, elapsed, attempts } = await send(request, [{ chunkDelaysMs: every(40, 3), end: "silent" }]);
    check(request.didTimeout(), "marked timed out");
    check(elapsed >= 120 + 150 && elapsed < 120 + 150 + 120, "failed " + elapsed + " ms in: last byte at 120 + 150 of silence");
    check(/^Request timeout \(no data for 0\.15 seconds mid-reply\)/.test(request.error().message), "says the reply went silent: \"" + request.error().message.split("\n")[0] + "\"");
    check(/timed out: the reply stopped arriving/.test(request.timeoutErrorMessage()), "timeoutErrorMessage says so too");
    check(attempts === 1, "not replayed (its prefix was already delivered)");
    check(!request.didAbort(), "not reported as the caller's abort");
    check(delegate.counts.onRequestTimeout === 1, "onRequestTimeout sent once");
    check(delegate.counts.onRequestFailure === 1 && delegate.counts.onRequestComplete === 1, "failure and completion sent once each");
    check(delegate.counts.onRequestAbort === undefined, "no onRequestAbort");
}

async function testNoFirstByteTimesOutAndRetriesOnce () {
    console.log("\nno first byte: the full timeout applies, and an unanswered attempt is sent once more");
    const request = newStreamRequest();
    const { elapsed, attempts } = await send(request, [
        { chunkDelaysMs: [], end: "silent" },
        { chunkDelaysMs: every(40, 3), end: "complete" }
    ]);
    check(attempts === 2, "sent twice");
    check(elapsed >= 300 && elapsed < 300 + 200, "the first attempt waited the 300 ms timeout (" + elapsed + " ms total)");
    check(!request.hasError() && !request.didTimeout(), "the second attempt succeeded");
}

async function testFirstByteLimitIsNotTheStallLimit () {
    console.log("\na slow first byte within the timeout is fine");
    const request = newStreamRequest();
    await send(request, [{ chunkDelaysMs: [250, 40, 40], end: "complete" }]);
    check(!request.didTimeout() && !request.hasError(), "250 ms to the first byte (> 150 stall, < 300 timeout) succeeded");
}

async function testCallerAbortIsStillAnAbort () {
    console.log("\na caller's abort mid-stream is still an abort");
    const request = newStreamRequest();
    scripts = [{ chunkDelaysMs: every(40, 10), end: "complete" }];
    sentXhrs = [];
    const delegate = newRecordingDelegate();
    request.setDelegate(delegate);
    const sending = request.asyncSend();
    setTimeout(() => request.abort(), 100);
    let threw = false;
    try {
        await sending;
    } catch {
        threw = true;
    }
    check(threw && request.didAbort(), "asyncSend rejects and the request is marked aborted");
    check(!request.didTimeout(), "not a timeout");
    check(delegate.counts.onRequestAbort === 1, "onRequestAbort sent once");
    await new Promise((resolve) => setTimeout(resolve, 250));
    check(!request.didTimeout() && delegate.counts.onRequestTimeout === undefined, "the stall watch stayed quiet after the abort");
}

async function testUnwatchedRequestKeepsTheTotalTimeout () {
    console.log("\nwithout a stall period the native total timeout is unchanged");
    const request = SvGlobals.get("SvXhrRequest").clone();
    request.setTimeoutPeriodInMs(1234);
    check(request.stallTimeoutPeriodInMs() === null, "stallTimeoutPeriodInMs defaults to null");
    check(request.xhrTimeoutPeriodInMs() === 1234, "the XHR gets the total timeout");
}

async function main () {
    console.log("TestXhrStallTimeout: booting strvct…");
    await boot();

    await testLongReplyStillArrivingSucceeds();
    await testSilenceMidReplyTimesOut();
    await testNoFirstByteTimesOutAndRetriesOnce();
    await testFirstByteLimitIsNotTheStallLimit();
    await testCallerAbortIsStillAnAbort();
    await testUnwatchedRequestKeepsTheTotalTimeout();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
