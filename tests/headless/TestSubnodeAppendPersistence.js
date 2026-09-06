#!/usr/bin/env node

"use strict";

/**
 * Headless test: how an appended subnode reaches storage.
 *
 * SvNode.didChangeSubnodeList relays a subnodes-array mutation to the node's
 * own mutation observers (`this.didMutate("subnodes")`). Its comment (May
 * 2026) claimed the storage layer could not otherwise learn about the append,
 * because "the pool observes the node, not the array". That is not how the
 * pool works: SvObjectPool.addActiveObject installs the pool as a mutation
 * observer on EVERY active object, and the subnodes array is one (it has
 * shouldStore true and is referenced from the parent's record), so the pool
 * hears the array mutate directly, dirties the array, and enrolls the new
 * child when it serializes the array.
 *
 * This test pins that channel — with the parent's relay DISABLED, so the
 * assertion is about the array path alone — for the base pool and for the
 * sub-object pool the original symptom was reported against, including the
 * reported scenario itself: an AI response message appended to a parent and
 * then streamed into.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestSubnodeAppendPersistence.js
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

const names = (m) => Array.from(m.values()).map(o => o.svType()).sort().join(", ");

// In the running app every node has finished init long before an append; a
// fresh clone in a test has not, and didChangeSubnodeList gates on it.
function doneInit (node) {
    if (!node.hasDoneInit()) {
        node.setHasDoneInit(true);
    }
    return node;
}

// Isolate the array channel: the parent's own relay is silenced so nothing
// below can be credited to it.
function silenceRelay (node) {
    node.didMutate = function () {};
    return node;
}

async function main () {
    await boot();
    const SvObjectPool = SvGlobals.get("SvObjectPool");
    const SvSubObjectPool = SvGlobals.get("SvSubObjectPool");
    const SvStorableNode = SvGlobals.get("SvStorableNode");

    (0, eval)(`
    (class TAPParent extends SvStorableNode {
        initPrototype () { this.setShouldStore(true); this.setShouldStoreSubnodes(true); }
    }.initThisClass());
    `);
    const newParent = () => doneInit(SvGlobals.get("TAPParent").clone().setTitle("parent"));
    const newChild = (title) => { const c = SvStorableNode.clone().setTitle(title); c.setShouldStore(true); return doneInit(c); };

    console.log("Base pool: the pool observes the subnodes array itself");
    {
        const pool = SvObjectPool.clone();
        const parent = newParent();
        parent.addSubnode(newChild("c1"));
        pool.addActiveObject(parent);
        pool.dirtyObjects().set(parent.puuid(), parent);
        await pool.commitStoreDirtyObjects();
        const arr = parent.subnodes();
        check(pool.hasActiveObject(arr), "after the first commit the subnodes array is an active object");
        check(arr.mutationObservers().has(pool) && arr.mutationObservers().has(parent), "…observed by the pool AND the parent");

        silenceRelay(parent);
        pool.dirtyObjects().clear();
        const c2 = newChild("c2");
        parent.addSubnode(c2);
        check(names(pool.dirtyObjects()) === "SvSubnodesArray", "an append dirties the array (relay silenced): [" + names(pool.dirtyObjects()) + "]");
        check(!pool.hasActiveObject(c2), "the new child is not active until the array is serialized");
        await pool.commitStoreDirtyObjects();
        check(pool.hasActiveObject(c2) && c2.mutationObservers().has(pool), "serializing the array enrolls the child and observes it");
        check(pool.recordForPid(c2.puuid()) !== undefined && pool.recordForPid(c2.puuid()) !== null, "…and the child has a record");
        pool.dirtyObjects().clear();
        c2.setTitle("c2 after");
        check(names(pool.dirtyObjects()) === "SvStorableNode", "a later slot change on the child is heard: [" + names(pool.dirtyObjects()) + "]");
    }

    console.log("\nSub-object pool, the reported scenario: a response message appended, then streamed into");
    for (const relay of ["silenced", "enabled"]) {
        const pool = SvSubObjectPool.clone();
        const parent = newParent();
        parent.addSubnode(newChild("seed"));
        await pool.initializeFromRoot(parent);
        if (relay === "silenced") {
            silenceRelay(parent);
        }
        const message = doneInit(SvGlobals.get("SvAiResponseMessage").clone());
        parent.addSubnode(message);
        message.setContent("<sentence>first, before any flush</sentence>");
        await pool.asyncFlushDirty();
        const afterFirst = JSON.stringify(pool.recordForPid(message.puuid()) || null);
        check(afterFirst.includes("before any flush"), "[relay " + relay + "] content streamed BEFORE the first flush is in the message's record");
        message.setContent("<sentence>first, before any flush</sentence><sentence>second, after the flush</sentence>");
        check(pool.hasDirtyObjects(), "[relay " + relay + "] streaming after the flush dirties the message (it is observed now)");
        await pool.asyncFlushDirty();
        const afterSecond = JSON.stringify(pool.recordForPid(message.puuid()) || null);
        check(afterSecond.includes("after the flush"), "[relay " + relay + "] content streamed AFTER the first flush reaches the record");
    }

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
