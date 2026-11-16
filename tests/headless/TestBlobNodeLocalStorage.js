#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvBlobNode's reads and writes of the local blob pool.
 *
 * Writing (asyncWriteToLocalStorage):
 *   - a write asked for while one is in flight is a NEW write that starts
 *     when that one ends, so bytes that replaced the blob mid-write are
 *     stored (it used to return the old write's promise, and the new bytes
 *     were not written by that call);
 *   - a failed write rejects its caller and nothing else (it used to reject
 *     a second promise nobody held: an unhandled rejection).
 * Reading (asyncReadFromLocalStorage):
 *   - callers during a read share it;
 *   - a read waits for a write in flight but does not fail because it did;
 *   - a blob read for a hash the node no longer has is not kept.
 *
 * A Map-backed stand-in replaces the blob pool; the node's own code runs.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestBlobNodeLocalStorage.js
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
const tick = (ms = 5) => new Promise(resolve => setTimeout(resolve, ms));

/** A blob stand-in: the node only hands it to the pool. Its "hash" is its name. */
const fakeBlob = (name) => ({ name: name });

/** A blob pool over a Map, slow enough for calls to overlap; counts its work. */
function newFakePool () {
    const pool = { stored: new Map(), storeCalls: [], getCalls: [], failNextStore: false };
    pool.asyncStoreBlob = async (blob) => {
        pool.storeCalls.push(blob.name);
        await tick(10);
        if (pool.failNextStore) {
            pool.failNextStore = false;
            throw new Error("store failed");
        }
        pool.stored.set(blob.name, blob);
        return blob.name;
    };
    pool.asyncGetBlob = async (hash) => {
        pool.getCalls.push(hash);
        await tick(10);
        return pool.stored.get(hash) || null;
    };
    return pool;
}

/** A node whose store is the fake pool, holding a blob without triggering its hooks. */
function newNode (pool, blob, hash) {
    const node = SvGlobals.get("SvBlobNode").clone();
    node.defaultStore = () => ({ blobPool: () => pool });
    node._blobValue = blob;
    node._valueHash = hash;
    return node;
}

async function testWrites () {
    console.log("Writing");
    const pool = newFakePool();
    const node = newNode(pool, fakeBlob("A"), "A");
    const firstWrite = node.asyncWriteToLocalStorage();
    node._blobValue = fakeBlob("B"); // replaced while A is being written
    node._valueHash = "B";
    const secondWrite = node.asyncWriteToLocalStorage();
    check(secondWrite !== firstWrite, "a write asked for mid-write is a new write, not the one in flight");
    await Promise.all([firstWrite, secondWrite]);
    check(pool.stored.has("A") && pool.stored.has("B"), "the bytes that replaced the blob mid-write are stored (" + pool.storeCalls.join(",") + ")");
    check((await node.asyncWriteToLocalStorage()) === node, "a write answers with the node");

    pool.failNextStore = true;
    const failed = await outcome(node.asyncWriteToLocalStorage());
    check(failed.error === "store failed", "a failed write rejects its caller");
    check((await outcome(node.asyncWriteToLocalStorage())).value === node, "…and the next write runs");
}

async function testReads () {
    console.log("\nReading");
    const pool = newFakePool();
    pool.stored.set("A", fakeBlob("A"));
    pool.stored.set("B", fakeBlob("B"));
    const node = newNode(pool, null, "A");
    const first = node.asyncReadFromLocalStorage();
    check(node.asyncReadFromLocalStorage() === first, "callers during a read share it");
    const blob = await first;
    check(blob && blob.name === "A" && node.blobValue() === blob && pool.getCalls.length === 1, "the blob is read once and kept in memory");

    const replaced = newNode(pool, null, "A");
    const reading = replaced.asyncReadFromLocalStorage();
    replaced._valueHash = "B"; // the content is replaced while A is being read
    const got = await reading;
    check(got && got.name === "B" && replaced.blobValue().name === "B", "a read answers for the node's content now, not the hash it started with (" + (got && got.name) + ")");

    const missing = newNode(pool, null, "nowhere");
    check((await missing.asyncReadFromLocalStorage()) === null && missing.blobValue() === null, "a hash the pool lacks reads null");
    check((await newNode(pool, null, null).asyncReadFromLocalStorage()) === null, "no hash reads null");
}

async function testReadWaitsForWrite () {
    console.log("\nA read with a write in flight");
    const pool = newFakePool();
    const node = newNode(pool, fakeBlob("A"), "A");
    const writing = node.asyncWriteToLocalStorage();
    node._blobValue = null; // only the pool will have the bytes
    const read = await node.asyncReadFromLocalStorage();
    await writing;
    check(read && read.name === "A", "the read waits for the write, then finds the bytes");

    const failing = newNode(pool, fakeBlob("C"), "A");
    pool.failNextStore = true;
    const failedWrite = outcome(failing.asyncWriteToLocalStorage());
    failing._blobValue = null;
    const readAfterFailure = await outcome(failing.asyncReadFromLocalStorage());
    check((await failedWrite).error === "store failed" && readAfterFailure.value && readAfterFailure.value.name === "A", "a failed write does not fail the read (" + JSON.stringify(readAfterFailure.error || "read ok") + ")");
}

async function main () {
    await boot();
    const unhandled = [];
    process.on("unhandledRejection", (e) => unhandled.push(e));
    await testWrites();
    await testReads();
    await testReadWaitsForWrite();
    await tick(30);
    console.log("\nNo stray rejections");
    check(unhandled.length === 0, "every rejection went to a caller (" + unhandled.length + " unhandled)");
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
