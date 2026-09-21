#!/usr/bin/env node

"use strict";

/**
 * Headless test: record size discipline (Plans/Record Store §5, Phase A step 3).
 *
 * - a stored String slot refuses a value over the cap on set (a programmer error
 *   or an AI patch to shorten), tolerates it on load, and advertises the cap as
 *   maxLength in its JSON schema
 * - a BlobString spills above the spill length: the record holds { "#": hash },
 *   the hash is the blob store's digest of the same bytes, and a reopen reads the
 *   text back through the prefetch (never on access)
 * - a collection warns once past its threshold; windowed candidates are exempt
 *
 * Usage (from this directory):  node TestRecordSizeDiscipline.js
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

    (class TestSizeDoc extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("label", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInJsonSchema(true);
            }
            {
                const slot = this.newSlot("body", "");
                slot.setSlotType("String");
                slot.setIsBlobString(true);
                slot.setShouldStoreSlot(true);
                slot.setIsInJsonSchema(true);
            }
            {
                const slot = this.newSlot("scratch", "");
                slot.setSlotType("String"); // not stored: no cap
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
    }).initThisClass();

    (class TestSizeExemptList extends SvStorableNode {
        subnodeCountWarningThreshold () {
            return Infinity;
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
    }).initThisClass();
}

const text = (n) => "x".repeat(n);

async function main () {
    await boot();
    defineClasses();
    const Slot = SvGlobals.get("Slot");
    const TestSizeDoc = SvGlobals.get("TestSizeDoc");
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");

    console.log("\nThe stored String cap");
    Slot.setStoredStringCapThrows(true); // the audit mode; shipped default warns once per slot
    const doc = TestSizeDoc.clone();
    doc.setLabel(text(Slot.storedStringCapLength()));
    check(doc.label().length === Slot.storedStringCapLength(), "a value at the cap is accepted");
    let message = null;
    try { doc.setLabel(text(Slot.storedStringCapLength() + 1)); } catch (e) { message = e.message; }
    check(message && message.includes("exceeds the stored String cap"), "one character over the cap throws: " + message);
    check(doc.label().length === Slot.storedStringCapLength(), "…and the slot keeps its previous value");
    doc.setScratch(text(100000));
    check(doc.scratch().length === 100000, "an unstored String slot is not capped");
    doc.setBody(text(100000));
    check(doc.body().length === 100000, "a BlobString is not capped");
    const schema = doc.thisClass().prototype.slotNamed("label").asJsonSchema(new Set());
    check(schema.maxLength === Slot.storedStringCapLength(), "the cap reaches the JSON schema as maxLength");
    const bodySchema = doc.thisClass().prototype.slotNamed("body").asJsonSchema(new Set());
    check(bodySchema.maxLength === undefined, "a BlobString advertises no maxLength");
    Slot.beginLoadingRecords();
    try { doc.setLabel(text(Slot.storedStringCapLength() + 5)); } finally { Slot.endLoadingRecords(); }
    check(doc.label().length === Slot.storedStringCapLength() + 5, "a load tolerates an over-cap value already on disk");
    Slot.setStoredStringCapThrows(false);
    const warnings0 = [];
    const warn0 = console.warn;
    console.warn = (...args) => { warnings0.push(args.join(" ")); };
    try {
        doc.setLabel(text(Slot.storedStringCapLength() + 9));
        doc.setLabel(text(Slot.storedStringCapLength() + 10));
    } finally { console.warn = warn0; }
    check(doc.label().length === Slot.storedStringCapLength() + 10 && warnings0.filter(w => w.includes("exceeds the stored String cap")).length === 1, "in the shipped mode an over-cap set warns once per slot and stores inline");
    Slot.setStoredStringCapThrows(true);

    console.log("\nBlobString spill and reload");
    const store = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestRecordSizeDiscipline");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const root = pool.rootOrIfAbsentFromClosure(() => TestSizeDoc.clone());
    root.setLabel("root");
    const long = "narration " + text(Slot.blobStringSpillLength());
    root.setBody(long);
    const short = TestSizeDoc.clone();
    short.setBody("short body");
    root.addSubnode(short);
    await pool.commitStoreDirtyObjects();
    const rootRecord = pool.recordForPid(root.puuid());
    const bodyEntry = rootRecord.entries.find(e => e[0] === "body")[1];
    check(bodyEntry && bodyEntry["#"] && /^[0-9a-f]{64}$/.test(bodyEntry["#"]), "a body over the spill length is stored as { \"#\": hash }");
    check(rootRecord.entries.find(e => e[0] === "label")[1] === "root", "short values stay inline");
    const shortEntry = pool.recordForPid(short.puuid()).entries.find(e => e[0] === "body")[1];
    check(shortEntry === "short body", "a BlobString under the spill length stays inline");
    const hash = bodyEntry["#"];
    check(hash === long.hexSha256Sync(), "the hash is the synchronous SHA-256 of the text");
    const blobHash = await new Blob([long]).asyncToArrayBuffer().then(b => b.asyncHexSha256());
    check(hash === blobHash, "…and equals the blob store's digest of the same bytes");
    await new Promise(resolve => setTimeout(resolve, 200)); // the blob store write is asynchronous
    check(await pool.blobPool().asyncHasBlob(hash), "the text blob was stored in the blob pool");

    await pool.promiseClose(); // one process, one home pool: the blob store is locked by whoever holds it
    store.pools().clear();
    store.textBlobs().clear();
    const pool2 = SvPersistentObjectPool.clone();
    pool2.setName("TestRecordSizeDiscipline");
    pool2.setRecordStore(store);
    await pool2.promiseOpen();
    check(store.textBlobs().has(hash), "opening the pool prefetched the spilled text before any record was materialized");
    const root2 = pool2.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    check(root2.body() === long && root2.label() === "root", "the reloaded document reads its spilled body back synchronously");
    check(root2.subnodes().first().body() === "short body", "…and the inline one as before");
    check(pool2.dirtyObjects().size === 0, "reading spilled text back marked nothing dirty");

    console.log("\nThe collection warning");
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => { warnings.push(args.join(" ")); };
    try {
        const list = TestSizeDoc.clone();
        list.subnodeCountWarningThreshold = () => 3;
        for (let i = 0; i < 6; i++) { list.addSubnode(TestSizeDoc.clone()); }
        const exempt = SvGlobals.get("TestSizeExemptList").clone();
        for (let i = 0; i < 6; i++) { exempt.addSubnode(TestSizeDoc.clone()); }
        const collectionWarnings = warnings.filter(w => w.includes("windowed collection"));
        check(collectionWarnings.length === 1 && collectionWarnings[0].includes("4 subnodes"), "one warning, at the first element past the threshold (" + collectionWarnings.length + ")");
    } finally {
        console.warn = originalWarn;
    }
    await pool2.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
