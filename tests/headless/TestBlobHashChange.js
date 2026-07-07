#!/usr/bin/env node

"use strict";

/**
 * Headless test: stale-blob-on-valueHash-change guard.
 *
 * SvBlobNode caches the loaded blob bytes in the transient blobValue slot,
 * keyed by valueHash. When a node instance is REUSED and its valueHash is
 * updated in place (the multiplayer case: a guest's node is mutated by
 * envelope deserialization, hashA → hashB), the cached blobValue still holds
 * hashA's bytes. Without a guard, asyncBlobValue() returns the stale bytes for
 * hashB forever (concretely: a chat image preview swapped host-side keeps
 * rendering the old image on the guest).
 *
 * The fix is a slot hook, didUpdateSlotValueHash(oldValue, newValue), that
 * clears the stale cache when — and only when — the hash transitions between
 * two DIFFERENT non-null values:
 *   - SvBlobNode      clears blobValue
 *   - SvCloudBlobNode also resets hasInCloud / downloadUrl / in-flight push
 *   - SvImageNode     also clears the cached publicUrl
 *
 * The both-non-null-and-different guard must NOT fire during the legitimate
 * asyncJustSetBlobValue() sequence (setBlobValue(blob) → setValueHash(null) →
 * setValueHash(computedHash)), where each transition has a null on one side,
 * nor when the same hash is re-set.
 *
 * These checks set slots directly (no network / no store) and drive the real
 * deserialize path via Slot.onInstanceSetValue(), which is what
 * SvJsonGroup.setSlotsJson() uses during envelope deserialization.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestBlobHashChange.js
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

const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);

// A sentinel standing in for loaded blob bytes. We only ever compare it by
// identity and check whether the hook nulls it, so real bytes are unnecessary
// (and would trigger async hashing that overwrites the valueHash we control).
// Set it via the raw ivar so the blobValue setter's own hook does not fire.
function seedBlob (node, hash) {
    const fakeBlob = { marker: "bytes-for-" + hash };
    node._blobValue = fakeBlob; // raw set: bypass setBlobValue()'s recompute hook
    node.setValueHash(hash); // null → hash: guard leaves the seeded blob intact
    return fakeBlob;
}

function testBaseClearsOnHashChange () {
    console.log("\nSvBlobNode: different non-null hash clears the stale blob");

    const node = SvGlobals.get("SvBlobNode").clone();
    const blob = seedBlob(node, HASH_A);
    check(node.blobValue() === blob, "seeded blob present before the hash change");

    node.setValueHash(HASH_B);
    check(node.valueHash() === HASH_B, "valueHash updated to the new hash");
    check(node.blobValue() === null, "stale blob cleared on hashA → hashB");
}

function testCloudResetsBookkeeping () {
    console.log("\nSvCloudBlobNode: hash change also resets cloud bookkeeping");

    const node = SvGlobals.get("SvCloudBlobNode").clone();
    const blob = seedBlob(node, HASH_A);
    node.setHasInCloud(true);
    node.setDownloadUrl("https://example.com/old-content");
    check(node.blobValue() === blob && node.hasInCloud() === true, "old content state present before the hash change");

    node.setValueHash(HASH_B);
    check(node.blobValue() === null, "stale blob cleared");
    check(node.hasInCloud() === false, "hasInCloud reset (so schedulePushToCloud won't skip the new bytes)");
    check(node.downloadUrl() === null, "stale downloadUrl cleared");
}

function testImageResetsPublicUrl () {
    console.log("\nSvImageNode: hash change also clears the cached publicUrl");

    const node = SvGlobals.get("SvImageNode").clone();
    seedBlob(node, HASH_A);
    node.setHasInCloud(true);
    node.setDownloadUrl("https://example.com/old-download");
    node.setPublicUrl("https://example.com/old-public");
    check(node.publicUrl() === "https://example.com/old-public", "old publicUrl present before the hash change");

    node.setValueHash(HASH_B);
    check(node.blobValue() === null, "stale blob cleared (inherited)");
    check(node.hasInCloud() === false, "hasInCloud reset (inherited)");
    check(node.downloadUrl() === null, "downloadUrl cleared (inherited)");
    check(node.publicUrl() === null, "stale publicUrl cleared");
}

function testHashToNullKeepsBlob () {
    console.log("\nGuard: non-null → null keeps the blob (asyncJustSetBlobValue intermediate)");

    const node = SvGlobals.get("SvImageNode").clone();
    const blob = seedBlob(node, HASH_A);

    node.setValueHash(null);
    check(node.blobValue() === blob, "blob kept when hash cleared to null (fresh bytes awaiting recompute)");
}

function testNullToHashKeepsBlob () {
    console.log("\nGuard: null → non-null keeps the blob (asyncJustSetBlobValue final)");

    const node = SvGlobals.get("SvImageNode").clone();
    const fakeBlob = { marker: "fresh-bytes" };
    node._blobValue = fakeBlob; // seed bytes with valueHash still null

    check(node.valueHash() === null, "precondition: valueHash is null");
    node.setValueHash(HASH_B); // the computed-hash assignment
    check(node.blobValue() === fakeBlob, "freshly-set blob kept when its computed hash is assigned");
}

function testSameHashIsNoOp () {
    console.log("\nGuard: re-setting the SAME hash keeps the blob (no-op)");

    const node = SvGlobals.get("SvImageNode").clone();
    const blob = seedBlob(node, HASH_A);

    node.setValueHash(HASH_A);
    check(node.blobValue() === blob, "blob kept when the identical hash is re-set");
}

function testDeserializePathClears () {
    console.log("\nDeserialize path: Slot.onInstanceSetValue() (the real bug path) clears the stale blob");

    const node = SvGlobals.get("SvImageNode").clone();
    seedBlob(node, HASH_A);
    node.setHasInCloud(true);
    node.setPublicUrl("https://example.com/old-public");

    // Exact mechanism SvJsonGroup.setSlotsJson() uses for a primitive slot
    // during envelope deserialization.
    const slot = node.thisPrototype().slotNamed("valueHash");
    check(!!slot && typeof (slot.onInstanceSetValue) === "function", "resolved the valueHash slot for the deserialize path");
    slot.onInstanceSetValue(node, HASH_B);

    check(node.valueHash() === HASH_B, "valueHash updated via onInstanceSetValue");
    check(node.blobValue() === null, "stale blob cleared through the deserialize path");
    check(node.hasInCloud() === false, "hasInCloud reset through the deserialize path");
    check(node.publicUrl() === null, "stale publicUrl cleared through the deserialize path");
}

async function main () {
    console.log("TestBlobHashChange: booting strvct…");
    await boot();

    testBaseClearsOnHashChange();
    testCloudResetsBookkeeping();
    testImageResetsPublicUrl();
    testHashToNullKeepsBlob();
    testNullToHashKeepsBlob();
    testSameHashIsNoOp();
    testDeserializePathClears();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
