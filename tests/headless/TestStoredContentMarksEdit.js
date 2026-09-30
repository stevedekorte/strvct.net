#!/usr/bin/env node

"use strict";

/**
 * Headless test: a syncable document is "locally modified" only when its
 * stored content changes.
 *
 * SvObjectPool notices, as it writes a row, whether the row's content changed
 * (payload as the cloud holds it, or placement) and tells the object when the
 * flush ends (didStoreChangedContent), which climbs to every syncable ancestor.
 * A didUpdateNode alone no longer stamps: loading, recomputing a derived
 * value, and setup code wiring views all update nodes without editing, and
 * stamping on them made every opened document look edited (2026-09-30 —
 * dirty-local-wins kept stale session copies; catalog documents were pushed
 * on load and conflicted).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestStoredContentMarksEdit.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

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

let TestEditDocument = null;

// A syncable document with one stored slot (content) and one unstored slot
// (derived / UI state), and a stored child group.
function defineTestClass () {
    const SvSyncableJsonGroup = SvGlobals.get("SvSyncableJsonGroup");
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    TestEditDocument = (class TestEditDocument extends SvSyncableJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("entryText", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("derivedText", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(false);
            }
            {
                const slot = this.newSlot("section", null);
                slot.setSlotType("SvJsonGroup");
                slot.setShouldStoreSlot(true);
                slot.setFinalInitProto(SvJsonGroup);
            }
        }
    }).initThisClass();
}

// A document stored and in sync with the cloud: both stamps equal.
async function syncedDocument () {
    const pool = SvGlobals.get("SvObjectPool").clone();
    const doc = TestEditDocument.clone();
    pool.setRootObject(doc);
    pool.addActiveObject(doc);
    pool.addActiveObject(doc.section());
    pool.dirtyObjects().set(doc.puuid(), doc);
    pool.dirtyObjects().set(doc.section().puuid(), doc.section());
    await pool.commitStoreDirtyObjects();
    doc.didSyncFromCloud(1000);
    await pool.commitStoreDirtyObjects();
    return { pool, doc };
}

async function flush (pool) {
    await pool.commitStoreDirtyObjects();
}

async function testNoEditIsNotAnEdit () {
    console.log("\nUpdates that store nothing new do not mark the document edited");
    const { pool, doc } = await syncedDocument();
    check(!doc.needsCloudSync(), "setup: in sync after didSyncFromCloud");

    doc.didUpdateNode();
    doc.section().didUpdateNode();
    await flush(pool);
    check(!doc.needsCloudSync(), "a bare didUpdateNode (here and on a child) is not an edit");

    doc.setDerivedText("recomputed " + Date.now());
    await flush(pool);
    check(!doc.needsCloudSync(), "an unstored slot changing is not an edit");

    doc.setEntryText("");
    pool.dirtyObjects().set(doc.puuid(), doc); // forced re-store of the same content
    await flush(pool);
    check(!doc.needsCloudSync(), "re-storing the same content is not an edit");
}

async function testRealEditsAreEdits () {
    console.log("\nStored content changes mark the document edited");
    {
        const { pool, doc } = await syncedDocument();
        doc.setEntryText("a real edit");
        await flush(pool);
        check(doc.needsCloudSync(), "a stored slot on the document changing is an edit");
    }
    {
        const { pool, doc } = await syncedDocument();
        doc.section().setTitle("section edit");
        pool.dirtyObjects().set(doc.section().puuid(), doc.section());
        await flush(pool);
        check(doc.needsCloudSync(), "a descendant's stored content changing is the document's edit");
    }
}

async function testCloudAppliesAreNotEdits () {
    console.log("\nState applied from elsewhere is not an edit");
    {
        const { pool, doc } = await syncedDocument();
        doc.setEntryText("from the cloud");
        doc.didSyncFromCloud(2000);
        await flush(pool);
        check(!doc.needsCloudSync(), "content applied, then didSyncFromCloud: in sync");
        check(doc.localLastModified() === 2000, "local stamp is the cloud's (" + doc.localLastModified() + ")");
    }
    {
        const { pool, doc } = await syncedDocument();
        doc.applyAsNonEdit(() => doc.setEntryText("host state"));
        await flush(pool);
        check(!doc.needsCloudSync(), "applyAsNonEdit stores without marking an edit");
        doc.setEntryText("then a real edit");
        await flush(pool);
        check(doc.needsCloudSync(), "an edit after applyAsNonEdit still counts");
    }
}

async function testStampingSettles () {
    console.log("\nA stamp is bookkeeping: stamping never counts as the edit that stamps it");
    const SvSyncableArrayNode = SvGlobals.get("SvSyncableArrayNode");
    const pool = SvGlobals.get("SvObjectPool").clone();
    const folder = SvSyncableArrayNode.clone();
    pool.setRootObject(folder);
    pool.addActiveObject(folder);
    pool.dirtyObjects().set(folder.puuid(), folder);
    await pool.commitStoreDirtyObjects();
    folder.didSyncFromCloud(1000);
    await pool.asyncFlushDirty();
    folder.addSubnode(TestEditDocument.clone()); // a real change: a child added
    let passes = 0;
    while (pool.hasDirtyObjects() && passes < 10) {
        await pool.commitStoreDirtyObjects();
        passes++;
    }
    check(!pool.hasDirtyObjects(), "a folder's edit settles in a few store passes (" + passes + "), no restamp loop");
    check(folder.needsCloudSync(), "…and the folder reads as edited");
}

async function main () {
    await boot();
    defineTestClass();
    await testNoEditIsNotAnEdit();
    await testRealEditsAreEdits();
    await testCloudAppliesAreNotEdits();
    await testStampingSettles();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
