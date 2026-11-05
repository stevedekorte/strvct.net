#!/usr/bin/env node

"use strict";

/**
 * Headless test: spilled text (BlobString, Plans/Record Store §5) that is not
 * there when its pool opens, and the save path's hashing.
 *
 * - a blob missing at open reads as "" — and a later save of that object
 *   writes the original { "#": hash } back, not "" (it used to write "",
 *   dropping the only reference to the text)
 * - the missing blob is reported once (SvErrorReport kind "missing-text-blob")
 * - a real new value replaces the kept hash
 * - a save does not rehash text it already knows the hash of
 * - the prefetch fetches several missing blobs at once, not one after another
 *
 * Usage (from this directory):  node TestSpilledTextMissing.js
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
    (class TestSpillDoc extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("label", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("body", "");
                slot.setSlotType("String");
                slot.setIsBlobString(true);
                slot.setShouldStoreSlot(true);
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
    }).initThisClass();
}

const settle = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function bodyEntryOf (pool, obj) {
    return pool.recordForPid(obj.puuid()).entries.find(e => e[0] === "body")[1];
}

async function openPool (store) {
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestSpilledTextMissing");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    return pool;
}

async function reopen (pool, store) {
    await pool.promiseClose();
    store.pools().clear();
    store.textBlobs().clear();
    return openPool(store);
}

async function main () {
    await boot();
    defineClasses();
    const Slot = SvGlobals.get("Slot");
    const SvObjectPool = SvGlobals.get("SvObjectPool");
    const TestSpillDoc = SvGlobals.get("TestSpillDoc");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const SvErrorReport = SvGlobals.get("SvErrorReport");
    const reports = [];
    SvErrorReport.asyncSend = async (error, info) => { reports.push({ message: error.message, info: info }); };
    SvObjectPool.setMissingTextBlobFetcher(null);

    const store = SvLocalRecordStore.clone().useMemoryMap();
    let pool = await openPool(store);
    const root = pool.rootOrIfAbsentFromClosure(() => TestSpillDoc.clone());
    root.setLabel("root");
    const long = "narration " + "x".repeat(Slot.blobStringSpillLength());
    root.setBody(long);
    await pool.commitStoreDirtyObjects();
    await settle(200); // the blob store write is asynchronous
    const hash = bodyEntryOf(pool, root)["#"];
    check(/^[0-9a-f]{64}$/.test(hash || ""), "the long body is stored as { \"#\": hash }");

    console.log("\nA save does not rehash text it knows");
    const proto = String.prototype;
    const originalHash = proto.hexSha256Sync;
    let hashCalls = 0;
    proto.hexSha256Sync = function () { hashCalls++; return originalHash.call(this); };
    try {
        root.setLabel("root, edited");
        await pool.commitStoreDirtyObjects();
    } finally { proto.hexSha256Sync = originalHash; }
    check(hashCalls === 0, "saving the record again hashed the unchanged body " + hashCalls + " times (0 expected)");
    check(bodyEntryOf(pool, root)["#"] === hash, "…and still wrote its hash");

    console.log("\nA blob missing at open");
    await pool.blobPool().asyncRemoveBlob(hash);
    const warn = console.warn;
    console.warn = () => {};
    try {
        pool = await reopen(pool, store);
    } finally { console.warn = warn; }
    const root2 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    check(root2.body() === "", "the missing text reads as an empty string");
    check(reports.filter(r => r.info && r.info.kind === "missing-text-blob").length === 1, "the missing blob was reported once, as kind missing-text-blob (" + JSON.stringify(reports.map(r => r.info && r.info.kind)) + ")");
    const report = reports.find(r => r.info && r.info.kind === "missing-text-blob");
    check(report && report.info.hash === hash && report.info.slotName === "body" && report.info.type === "TestSpillDoc", "…naming the hash, the slot and the object's type");

    root2.setLabel("edited while the text was missing");
    await pool.commitStoreDirtyObjects();
    const kept = bodyEntryOf(pool, root2);
    check(kept && kept["#"] === hash, "saving that object wrote the original hash back, not \"\" (got " + JSON.stringify(kept) + ")");

    console.log("\nA new value replaces the kept hash");
    root2.setBody("rewritten");
    await pool.commitStoreDirtyObjects();
    check(bodyEntryOf(pool, root2) === "rewritten", "a real new value is stored as itself");
    root2.setBody("");
    await pool.commitStoreDirtyObjects();
    check(bodyEntryOf(pool, root2) === "", "…and clearing it afterwards stores \"\" (the hash is not resurrected)");

    console.log("\nThe prefetch fetches missing blobs at once");
    const bodies = [1, 2, 3, 4, 5].map(i => "body " + i + " " + "y".repeat(Slot.blobStringSpillLength()));
    bodies.forEach(b => { const d = TestSpillDoc.clone(); d.setBody(b); root2.addSubnode(d); });
    await pool.commitStoreDirtyObjects();
    await settle(300);
    for (const b of bodies) { await pool.blobPool().asyncRemoveBlob(b.hexSha256Sync()); }
    let inFlight = 0;
    let maxInFlight = 0;
    SvObjectPool.setMissingTextBlobFetcher(async (h) => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await settle(50);
        inFlight--;
        return bodies.find(b => b.hexSha256Sync() === h) || null;
    });
    pool = await reopen(pool, store);
    const root3 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    check(root3.subnodes().map(d => d.body()).join("|") === bodies.join("|"), "every fetched body reads back");
    check(maxInFlight > 1, "the five fetches overlapped (at most " + maxInFlight + " at once)");

    console.log("\nFetched text that does not match its hash");
    const wrongDoc = root3.subnodes().first();
    const wrongHash = bodies[0].hexSha256Sync();
    await settle(300);
    await pool.blobPool().asyncRemoveBlob(wrongHash);
    SvObjectPool.setMissingTextBlobFetcher(async () => "<html>an error page served as 200</html>");
    reports.length = 0;
    const warn2 = console.warn;
    console.warn = () => {};
    try {
        pool = await reopen(pool, store);
    } finally { console.warn = warn2; }
    const root4 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    const doc4 = root4.subnodes().find(d => d.puuid() === wrongDoc.puuid());
    check(doc4 && doc4.body() === "", "the wrong content is not shown as the text");
    check(reports.some(r => r.info && r.info.kind === "missing-text-blob" && r.info.hash === wrongHash), "…it is reported as a missing blob");
    doc4.setLabel("edited");
    await pool.commitStoreDirtyObjects();
    check(bodyEntryOf(pool, doc4)["#"] === wrongHash, "…and a save keeps the real hash");

    SvObjectPool.setMissingTextBlobFetcher(null);
    await settle(300); // fetched text is written to the blob store in the background
    await pool.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
