#!/usr/bin/env node

"use strict";

/**
 * Headless test: a stored record whose class can't be loaded (renamed or
 * removed with no conversion for its pool) is reported — once per class name
 * per process — as an error report of kind "missing-class" (Cleanup § 4).
 *
 * Why it matters: such a record loads as null, so its parent's list in memory
 * is short by it, and the next edit of that list rewrites it without the
 * entry; collection then deletes the entry and its subtree, and the next
 * cloud commit deletes them at the current version. The report tells us
 * whether any stored data is in that state before we decide on a fix.
 *
 * Usage (from this directory):  node TestMissingClassReport.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let passed = 0;
let failed = 0;
function check (condition, message) {
    if (condition) { passed++; console.log("  \x1b[32m✓\x1b[0m " + message); }
    else { failed++; console.log("  \x1b[31m✗\x1b[0m " + message); }
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

function defineClasses () {
    const SvStorableNode = SvGlobals.get("SvStorableNode");
    for (const name of ["TestMissingDoc", "TestMissingKid"]) {
        const aClass = ({ [name]: class extends SvStorableNode {
            initPrototypeSlots () {
                {
                    const slot = this.newSlot("label", "");
                    slot.setSlotType("String");
                    slot.setShouldStoreSlot(true);
                }
            }
            initPrototype () {
                this.setShouldStoreSubnodes(true);
            }
        } })[name];
        aClass.initThisClass();
    }
}

/** Captures what the pool and the error report write, while `fn` runs. */
async function capturingLogs (fn) {
    const lines = [];
    const orig = { warn: console.warn, error: console.error };
    console.warn = (...args) => { lines.push(args.join(" ")); };
    console.error = (...args) => { lines.push(args.join(" ")); };
    try {
        await fn();
        await new Promise(resolve => setTimeout(resolve, 50)); // the report is sent asynchronously
    } finally {
        console.warn = orig.warn;
        console.error = orig.error;
    }
    return lines;
}

async function main () {
    await boot();
    defineClasses();
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const TestMissingDoc = SvGlobals.get("TestMissingDoc");
    const TestMissingKid = SvGlobals.get("TestMissingKid");

    console.log("\nA pool stored on a build that has every class");
    const store = SvLocalRecordStore.clone().useMemoryMap();
    store.setOutlivesItsPools(true);
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestMissingClassReport");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const root = pool.rootOrIfAbsentFromClosure(() => TestMissingDoc.clone());
    for (let i = 0; i < 4; i++) {
        const kid = TestMissingKid.clone(); kid.setLabel("kid " + i);
        root.addSubnode(kid);
    }
    await pool.commitStoreDirtyObjects();
    const opened = await store.asyncOpen(pool.poolId());
    check(opened.records.filter(r => r.payloadJson.includes("\"TestMissingKid\"")).length === 4, "four records of TestMissingKid are stored");

    console.log("\nLoaded again on a build where TestMissingKid is gone");
    const saved = SvGlobals.globals().TestMissingKid;
    SvGlobals.globals().TestMissingKid = undefined;
    let reloaded = null;
    let lines = [];
    try {
        const reader = SvLocalRecordStore.clone().useMemoryMap();
        reader.setOutlivesItsPools(true);
        await reader.asyncOpenStore();
        lines = await capturingLogs(async () => {
            reloaded = await reader.asyncImportOpenedPool(opened);
        });
    } finally {
        SvGlobals.globals().TestMissingKid = saved;
    }
    const warnings = lines.filter(l => /missing class 'TestMissingKid'/.test(l) && !l.startsWith("[error-report]"));
    const reports = lines.filter(l => l.startsWith("[error-report]") && l.includes("\"missing-class\""));
    check(reloaded && reloaded.rootObject() && reloaded.rootObject().subnodes().length === 0, "the root loads, its list short by the four (" + (reloaded && reloaded.rootObject() ? reloaded.rootObject().subnodes().length : "no root") + " left)");
    check(warnings.length === 4, "each missing record is logged (" + warnings.length + ")");
    check(reports.length === 1, "one error report for the class, not one per record (" + reports.length + ")");
    check(reports.length === 1 && reports[0].includes("\"className\":\"TestMissingKid\"") && reports[0].includes(pool.poolId()), "the report names the class and the pool");

    console.log("\nThe same class missing again later in the process");
    SvGlobals.globals().TestMissingKid = undefined;
    try {
        const again = SvLocalRecordStore.clone().useMemoryMap();
        again.setOutlivesItsPools(true);
        await again.asyncOpenStore();
        lines = await capturingLogs(async () => { await again.asyncImportOpenedPool(opened); });
    } finally {
        SvGlobals.globals().TestMissingKid = saved;
    }
    check(lines.filter(l => l.startsWith("[error-report]")).length === 0, "is not reported a second time");
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
