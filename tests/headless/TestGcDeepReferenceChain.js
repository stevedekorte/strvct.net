#!/usr/bin/env node

"use strict";

/**
 * Headless test: the object pool's GC mark phase survives a long reference chain.
 *
 * markPid() used to recurse once per reference, so a chain of records each
 * pointing at the next (a linked list) overflowed the call stack during
 * collection. It now walks with an explicit stack. This marks a chain far
 * deeper than the stack allows, with the pool's record lookup stubbed so the
 * chain needs no store, and checks cycles and shared references still mark once.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestGcDeepReferenceChain.js
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

/** A pool whose references come from a Map (pid → array of pids) instead of stored records. */
function poolWithRefs (refs) {
    const pool = SvGlobals.get("SvObjectPool").clone();
    pool.refSetForPuuid = (pid) => new Set(refs.get(pid) || []);
    pool.setMarkedSet(new Set());
    return pool;
}

async function main () {
    await boot();

    console.log("A chain deeper than the call stack");
    const depth = 300000;
    const chain = new Map();
    for (let i = 0; i < depth; i++) {
        chain.set("p" + i, ["p" + (i + 1)]);
    }
    const deepPool = poolWithRefs(chain);
    let threw = null;
    try {
        deepPool.markPid("p0");
    } catch (e) {
        threw = e;
    }
    check(threw === null, "marking does not overflow the stack" + (threw ? " (threw: " + threw.message + ")" : ""));
    check(deepPool.markedSet().size === depth + 1, "every record in the chain is marked (" + deepPool.markedSet().size + ")");

    console.log("\nCycles and shared references");
    const graph = new Map([["a", ["b", "c"]], ["b", ["c", "a"]], ["c", ["a"]], ["orphan", ["a"]]]);
    const pool = poolWithRefs(graph);
    check(pool.markPid("a") === true, "marking a new pid answers true");
    check(pool.markedSet().size === 3 && !pool.markedSet().has("orphan"), "a cycle marks each record once and nothing unreachable");
    check(pool.markPid("b") === false, "marking an already marked pid answers false");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
