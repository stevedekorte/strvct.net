#!/usr/bin/env node

"use strict";

/**
 * Headless test: backend timestamp coercion (Date.asMillis) and the cloud-sync
 * call sites that depend on it.
 *
 * The bug this pins (prod, Safari, 2026-07-24): a manifest timestamp arrived as
 * a plain {seconds, nanoseconds} object — what a Firestore Timestamp degrades
 * into once it has crossed JSON or structured clone, losing toMillis — and was
 * handed straight to the Number slots cloudLastModified / localLastModified.
 * Slot validation rejected it and resolved BOTH stamps to null, which reads as
 * "never synced", which re-uploads the item (lease + write + release) on every
 * single startup. The same raw value was also compared with `>` in
 * shouldUpdateItem, where an object operand makes the comparison always false,
 * so cloud updates silently never applied either.
 *
 * A partial fix existed (2026-07-10) but handled only toMillis/getTime and
 * lived in didSyncFromCloud, which claimed to be "the single choke point for
 * all callers" while two direct setter call sites and a comparison bypassed it.
 * So this test asserts the whole category, not the one shape that was reported:
 * every timestamp shape, every uninterpretable input, and each call site that
 * stores or compares one.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # build build/_index.json if missing/stale
 *   node tests/headless/TestTimestampCoercion.js
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

function checkEquals (actual, expected, message) {
    check(actual === expected, message + " (got " + actual + ", expected " + expected + ")");
}

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");

    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot"; // default assumes a parent dir containing strvct/
    await SvBootLoader.asyncRun();
}

const NOW = 1753315200000; // fixed epoch ms, so nothing here depends on the clock

function testInterpretableShapes () {
    console.log("\nShapes that must coerce to millis");

    checkEquals(Date.asMillis(NOW), NOW, "number passes through");
    checkEquals(Date.asMillis(new Date(NOW)), NOW, "Date via getTime");
    checkEquals(Date.asMillis({ toMillis: () => NOW }), NOW, "Firestore Timestamp via toMillis");
    checkEquals(Date.asMillis({ seconds: NOW / 1000, nanoseconds: 0 }), NOW,
        "client SDK JSON shape {seconds, nanoseconds}");
    checkEquals(Date.asMillis({ _seconds: NOW / 1000, _nanoseconds: 0 }), NOW,
        "admin SDK JSON shape {_seconds, _nanoseconds}");
    checkEquals(Date.asMillis({ seconds: 1753315200, nanoseconds: 500000000 }), NOW + 500,
        "sub-second nanos fold into millis");
    checkEquals(Date.asMillis(new Date(NOW).toISOString()), NOW, "ISO 8601 string");
    checkEquals(Date.asMillis(String(NOW)), NOW, "numeric string");
}

function testUninterpretableShapes () {
    console.log("\nShapes that must return null rather than a bad value");

    checkEquals(Date.asMillis(null), null, "null");
    checkEquals(Date.asMillis(undefined), null, "undefined");
    checkEquals(Date.asMillis(""), null, "empty string");
    checkEquals(Date.asMillis(NaN), null, "NaN");
    checkEquals(Date.asMillis(Infinity), null, "Infinity");
    checkEquals(Date.asMillis("not a date"), null, "unparseable string");

    // Never let an uninterpretable value escape as a non-number: that is
    // exactly what nulled the slots and broke the comparisons.
    const results = [null, undefined, "", NaN, Infinity, "not a date", {}, { weird: true }, []]
        .map(v => Date.asMillis(v));
    check(results.every(r => r === null || typeof r === "number"),
        "every result is a number or null, never an object");
}

function testWarnsOncePerShape () {
    console.log("\nDiagnostics: an unknown shape names itself, once");

    let warnings = 0;
    const realWarn = console.warn;
    console.warn = () => { warnings++; };
    try {
        Date.asMillis({ mysteryField: 1 });
        Date.asMillis({ mysteryField: 2 }); // same shape — must not warn again
        Date.asMillis({ different: 1, fields: 2 }); // new shape — must warn
    } finally {
        console.warn = realWarn;
    }
    checkEquals(warnings, 2, "warns once per distinct shape, not once per call");
}

function testSyncStampsAcceptDegradedTimestamp () {
    console.log("\nCall site: didSyncFromCloud stores a degraded Timestamp as millis");

    const degraded = { seconds: NOW / 1000, nanoseconds: 0 }; // no toMillis — the prod shape

    const SvSyncableJsonGroup = SvGlobals.get("SvSyncableJsonGroup");
    check(!!SvSyncableJsonGroup, "SvSyncableJsonGroup class loaded");
    const group = SvSyncableJsonGroup.clone();
    group.didSyncFromCloud(degraded);
    checkEquals(group.cloudLastModified(), NOW, "cloudLastModified stored as millis");
    checkEquals(group.localLastModified(), NOW, "localLastModified stored as millis");

    const SvSyncableArrayNode = SvGlobals.get("SvSyncableArrayNode");
    check(!!SvSyncableArrayNode, "SvSyncableArrayNode class loaded");
    const arrayNode = SvSyncableArrayNode.clone();
    arrayNode.didSyncFromCloud(degraded);
    checkEquals(arrayNode.cloudLastModified(), NOW, "array node cloudLastModified stored as millis");
    checkEquals(arrayNode.localLastModified(), NOW, "array node localLastModified stored as millis");

    // needsCloudSync is the thing that re-uploads on every startup when the
    // stamps are null — assert the actual consequence, not just the field.
    check(group.needsCloudSync() === false,
        "a synced item does not report needsCloudSync (the re-save-every-startup symptom)");
}

function testShouldUpdateItemComparesMillis () {
    console.log("\nCall site: shouldUpdateItem compares millis, not raw objects");

    const SvSyncCollectionSource = SvGlobals.get("SvSyncCollectionSource");
    check(!!SvSyncCollectionSource, "SvSyncCollectionSource class loaded");
    const source = SvSyncCollectionSource.clone();

    // local item last synced an hour before the cloud's timestamp
    const localItem = {
        cloudLastModified: () => NOW - 3600000,
        localLastModified: () => NOW - 3600000
    };

    const degradedNewer = { seconds: NOW / 1000, nanoseconds: 0 };
    check(source.shouldUpdateItem(localItem, { lastModified: degradedNewer }) === true,
        "newer cloud timestamp in degraded shape is seen as newer");
    check(source.shouldUpdateItem(localItem, { lastModified: NOW }) === true,
        "newer cloud timestamp as millis is seen as newer");

    const degradedOlder = { seconds: (NOW - 7200000) / 1000, nanoseconds: 0 };
    check(source.shouldUpdateItem(localItem, { lastModified: degradedOlder }) === false,
        "older cloud timestamp is not seen as newer");
    check(source.shouldUpdateItem(localItem, { lastModified: "garbage" }) === false,
        "uninterpretable cloud timestamp does not trigger an update");

    // An item that has never synced (null stamp) must still accept the cloud copy.
    const freshItem = { cloudLastModified: () => null, localLastModified: () => null };
    check(source.shouldUpdateItem(freshItem, { lastModified: degradedNewer }) === true,
        "never-synced item accepts a degraded cloud timestamp");
}

async function main () {
    console.log("Booting strvct standalone (headless)...");
    await boot();
    console.log("Boot complete.");

    testInterpretableShapes();
    testUninterpretableShapes();
    testWarnsOncePerShape();
    testSyncStampsAcceptDegradedTimestamp();
    testShouldUpdateItemComparesMillis();

    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
    console.error("Fatal error during test execution:");
    console.error(error);
    process.exit(1);
});
