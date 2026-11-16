#!/usr/bin/env node

"use strict";

/**
 * Headless test: framework code that moved onto the shared-promise helpers
 * (Object_sharedPromises) keeps — or gains — the behavior it should have.
 *
 *   Blob.asyncToArrayBuffer / asyncAsDataUrl
 *     read once, callers share the read; a failed read is tried again (it
 *     used to be cached for the life of the Blob).
 *   SvWebBrowserNotifications
 *     requestPermission() asks again on a later call (the first answer used
 *     to be cached for the session, so a dismissed prompt could never be
 *     offered again) and resolves false when the browser call throws (its
 *     callers used to wait forever); posting asks unprompted only once, and
 *     sees permission granted later.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestSharedPromiseAdopters.js
 * (rebuild the index first if sources changed: node source/boot/index-builder/ImportsIndexer.js)
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

const outcome = (promise) => promise.then(v => ({ value: v }), e => ({ error: e.message }));

async function testBlob () {
    console.log("Blob conversions");
    const blob = new Blob(["hello"], { type: "text/plain" });
    const first = blob.asyncToArrayBuffer();
    check(blob.asyncToArrayBuffer() === first, "concurrent asyncToArrayBuffer callers share one read");
    const buffer = await first;
    check(buffer.byteLength === 5 && (await blob.asyncToArrayBuffer()) === buffer, "…and later callers get the same buffer");

    const dataUrl = await blob.asyncAsDataUrl();
    check(/^data:text\/plain;base64,aGVsbG8=$/.test(dataUrl) && blob.asyncAsDataUrl() === blob.asyncAsDataUrl(), "asyncAsDataUrl reads once (" + dataUrl + ")");

    const flaky = new Blob(["x"]);
    const realArrayBuffer = flaky.arrayBuffer.bind(flaky);
    let reads = 0;
    flaky.arrayBuffer = () => (++reads === 1 ? Promise.reject(new Error("read failed")) : realArrayBuffer());
    check((await outcome(flaky.asyncToArrayBuffer())).error === "read failed", "a failed read rejects");
    const retried = await outcome(flaky.asyncToArrayBuffer());
    check(retried.value && retried.value.byteLength === 1, "…and the next call reads again instead of repeating the failure");
}

async function testNotifications () {
    console.log("\nNotification permission");
    const notifications = SvGlobals.get("SvWebBrowserNotifications").clone();
    let asks = 0;
    let answer = "default"; // the user dismisses the prompt
    const FakeNotification = {
        permission: "default",
        requestPermission: async () => {
            asks++;
            if (answer === "throw") {
                throw new Error("blocked");
            }
            FakeNotification.permission = answer;
            return answer;
        }
    };
    globalThis.window = { Notification: FakeNotification };
    globalThis.Notification = FakeNotification;
    try {
        const [a, b] = await Promise.all([notifications.requestPermission(), notifications.requestPermission()]);
        check(a === false && b === false && asks === 1, "concurrent requests share one ask; a dismissed prompt answers false");
        answer = "granted";
        check((await notifications.requestPermission()) === true && asks === 2, "a later request asks again and can be granted");

        answer = "throw";
        check((await notifications.requestPermission()) === false, "a browser call that throws answers false instead of leaving callers waiting");

        const posting = SvGlobals.get("SvWebBrowserNotifications").clone();
        FakeNotification.permission = "default";
        answer = "default";
        asks = 0;
        let posted = 0;
        const note = { justPost: () => posted++ };
        await posting.postNote(note);
        await posting.postNote(note);
        check(asks === 1 && posted === 0, "posting asks unprompted once a session, not on every post (" + asks + " asks)");
        FakeNotification.permission = "granted"; // granted later, from a user gesture
        await posting.postNote(note);
        check(posted === 1 && asks === 1, "permission granted later is seen, with no further ask");
    } finally {
        delete globalThis.window;
        delete globalThis.Notification;
    }
}

async function main () {
    await boot();
    await testBlob();
    await testNotifications();
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
