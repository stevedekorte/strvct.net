#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvApp's device-local state goes through the user
 * interface's device values, and values stored the old way survive.
 *
 * SvApp used to write localStorage directly, under bare keys and as plain
 * strings: the clear-on-boot flag ("1"), each user's accepted reset epoch
 * ("5") and the boot store stats (JSON). Device values live under "sv." +
 * key, as JSON. If the old values were not carried over, a device would
 * forget the reset epoch it had accepted and drop its local data again.
 *
 * Checks, with a Map standing in for the browser's localStorage:
 *   - SvWebUserInterface adopts a value stored under the bare key — parsed
 *     when it is JSON, kept as a string when not — moves it to the
 *     device-value key and removes the old one;
 *   - SvApp's clear-on-boot flag and accepted epochs read old and new values;
 *   - Object puuids and String base64 work headless (Web Crypto, btoa/atob).
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestDeviceValues.js
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

/** A Map behind the localStorage calls the web user interface makes. */
function fakeLocalStorage () {
    const map = new Map();
    return {
        map: map,
        getItem: (k) => (map.has(k) ? map.get(k) : null),
        setItem: (k, v) => map.set(k, String(v)),
        removeItem: (k) => map.delete(k)
    };
}

function testLegacyAdoption (ui, storage) {
    console.log("The web user interface adopts values stored under the bare key");
    storage.setItem("SvApp_acceptedResetEpoch_u1", "5");
    check(ui.deviceValue("SvApp_acceptedResetEpoch_u1") === 5, "a plain-string number reads as that number");
    check(storage.getItem("sv.SvApp_acceptedResetEpoch_u1") === "5" && storage.getItem("SvApp_acceptedResetEpoch_u1") === null, "…and moves to the device-value key, the old key removed");
    check(ui.deviceValue("SvApp_acceptedResetEpoch_u1") === 5, "…and reads the same the next time");

    storage.setItem("SvApp_lastBootStoreStats", JSON.stringify({ at: 1, records: 412 }));
    const stats = ui.deviceValue("SvApp_lastBootStoreStats");
    check(stats && stats.records === 412, "a JSON value reads as the object");

    storage.setItem("someName", "not json");
    check(ui.deviceValue("someName") === "not json", "a value that isn't JSON is kept as a string");
    check(ui.deviceValue("neverStored") === null, "a key stored neither way reads null");
}

function testSvAppState (ui, storage) {
    console.log("\nSvApp's flag and epochs go through device values");
    const SvApp = SvGlobals.get("SvApp");
    SvApp.sharedUserInterface = () => ui; // no app is running in this test

    storage.setItem("SvApp_clearStoreOnBoot", "1"); // requested by the old build
    check(SvApp.consumeClearStoreOnBootFlag() === true, "a clear-on-boot flag set by the old build is honored");
    check(SvApp.consumeClearStoreOnBootFlag() === false, "…once");
    SvApp.requestClearStoreOnBoot();
    check(SvApp.consumeClearStoreOnBootFlag() === true && SvApp.consumeClearStoreOnBootFlag() === false, "a new request is honored once");

    storage.setItem("SvApp_acceptedResetEpoch_u2", "7");
    check(SvApp.acceptedResetEpochForUser("u2") === 7, "an epoch accepted under the old build is remembered");
    SvApp.setAcceptedResetEpochForUser("u2", 8);
    check(SvApp.acceptedResetEpochForUser("u2") === 8, "a newly accepted epoch is remembered");
    check(SvApp.acceptedResetEpochForUser("u3") === 0 && SvApp.acceptedResetEpochForUser(null) === 0, "no epoch, or no user, reads 0");
}

function testHeadlessPrimitives () {
    console.log("\nPlatform primitives work headless");
    const ids = new Set(Array.from({ length: 100 }, () => Object.newUuid ? Object.newUuid() : ({}).puuid()));
    check(ids.size === 100, "puuids are generated with Web Crypto (100 distinct)");
    check("hello".base64Encoded() === "aGVsbG8=" && "aGVsbG8=".base64Decoded() === "hello", "String base64 round-trips (btoa / atob)");
}

async function main () {
    await boot();
    const storage = fakeLocalStorage();
    globalThis.window = { localStorage: storage };
    try {
        const ui = SvGlobals.get("SvWebUserInterface").clone();
        testLegacyAdoption(ui, storage);
        testSvAppState(ui, storage);
    } finally {
        delete globalThis.window;
    }
    testHeadlessPrimitives();
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
