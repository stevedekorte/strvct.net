#!/usr/bin/env node

"use strict";

/**
 * Headless test: pools over one record store (Plans/Record Store Phase A step 1).
 *
 * A home pool holds a folder whose subnodes are pools (setSubnodesArePools):
 * each document is the root of its own pool in the same store, referenced from
 * the folder by a far ref { "**": poolId }. Covers:
 * - order keys: between, after, bytewise order
 * - the store pass: far refs in the folder's record, child pools created and
 *   placed (parentId = the folder node, ascending orderKeys), children as a query
 * - near refs inside a document stay in its pool
 * - a document's edit dirties only its pool
 * - reopen: far refs resolve to fresh instances from their own pools; loads mark
 *   nothing dirty (the load-is-not-an-edit invariant)
 * - GC by pool: a stray row is swept from its pool alone
 * - moving a document between folders re-places its pool
 * - deletion cascades: a detached document's pool (and its records) is gone
 * - a pool round-trips through the cloud pool.json shape
 *
 * Usage (from this directory):  node TestRecordPools.js
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

    (class TestPoolNote extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("text", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestPoolDoc extends SvStorableNode {
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
    }).initThisClass();

    (class TestPoolFolder extends SvStorableNode {
        initPrototype () {
            this.setShouldStoreSubnodes(true);
            this.setSubnodesArePools(true);
        }
    }).initThisClass();

    (class TestPoolHome extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("folder", null);
                slot.setSlotType("TestPoolFolder");
                slot.setShouldStoreSlot(true);
                slot.setFinalInitProto(SvGlobals.get("TestPoolFolder"));
            }
            {
                const slot = this.newSlot("otherFolder", null);
                slot.setSlotType("TestPoolFolder");
                slot.setShouldStoreSlot(true);
                slot.setFinalInitProto(SvGlobals.get("TestPoolFolder"));
            }
        }
    }).initThisClass();
}

function newHomePool (store) {
    const home = SvGlobals.get("SvPersistentObjectPool").clone();
    home.setName("TestRecordPools");
    home.setRecordStore(store);
    return home;
}

function newDoc (label) {
    const doc = SvGlobals.get("TestPoolDoc").clone();
    doc.setLabel(label);
    const note = SvGlobals.get("TestPoolNote").clone();
    note.setText("note of " + label);
    doc.addSubnode(note);
    return doc;
}

const labels = (folder) => folder.subnodes().map(d => d.label()).join(",");
const tick = () => new Promise(resolve => setTimeout(resolve, 20));

async function main () {
    await boot();
    defineClasses();
    const SvOrderKey = SvGlobals.get("SvOrderKey");
    const SvObjectPool = SvGlobals.get("SvObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const SvRecordRow = SvGlobals.get("SvRecordRow");

    console.log("\nOrder keys");
    const first = SvOrderKey.keyBetween(null, null);
    const second = SvOrderKey.keyBetween(first, null);
    const between = SvOrderKey.keyBetween(first, second);
    const before = SvOrderKey.keyBetween(null, first);
    check(first === "V" && second === "W", "the first key is one half, the next one unit up (" + first + ", " + second + ")");
    check(first < between && between < second, "a key between adjacent keys sorts between them (" + between + ")");
    check(before < first, "a key before the first sorts before it (" + before + ")");
    let keys = [before, first, between, second];
    for (let i = 0; i < 40; i++) { keys.splice(2, 0, SvOrderKey.keyBetween(keys[1], keys[2])); }
    check(keys.every((k, i) => i === 0 || keys[i - 1] < k), "forty insertions at one spot stay strictly ordered (longest " + Math.max(...keys.map(k => k.length)) + " digits)");
    check(SvOrderKey.keyBetween("z", null) === "zV" && SvOrderKey.keyBetween("Vz", "W") > "Vz", "appending past the last digit extends the key");

    console.log("\nThe store pass: documents become pools, the folder keeps far refs");
    const store = SvLocalRecordStore.clone().useMemoryMap();
    let home = newHomePool(store);
    await home.promiseOpen();
    const root = home.rootOrIfAbsentFromClosure(() => SvGlobals.get("TestPoolHome").clone());
    const folder = root.folder();
    const docA = newDoc("a"); const docB = newDoc("b"); const docC = newDoc("c");
    folder.addSubnode(docA); folder.addSubnode(docB); folder.addSubnode(docC);
    await home.commitStoreDirtyObjects();
    check(home.poolId() === root.puuid() && store.settingAt("homePoolId") === root.puuid(), "the home pool's id is its root's puuid, recorded in settings");
    const folderRecord = home.recordForPid(folder.puuid());
    const subnodesPid = folderRecord.entries.find(e => e[0] === "subnodes")[1]["*"];
    const arrayRecord = home.recordForPid(subnodesPid);
    check(arrayRecord.values.every(v => v["**"]) && arrayRecord.values.map(v => v["**"]).join(",") === [docA, docB, docC].map(d => d.puuid()).join(","), "the folder's subnodes array holds far refs to the documents' pool ids");
    check(!home.hasRecordForPid(docA.puuid()) && !home.hasRecordForPid(docA.subnodes().first().puuid()), "no document record lives in the home pool");
    const poolA = store.poolForId(docA.puuid());
    check(poolA && SvObjectPool.poolOfObject(docA) === poolA && poolA.rootObject() === docA, "the document is the root of its own pool, registered to it");
    check(poolA.hasRecordForPid(docA.puuid()) && poolA.hasRecordForPid(docA.subnodes().first().puuid()), "the document's records — its note too — are rows of the document's pool");
    const rootRowA = store.rootRowForPool(docA.puuid());
    check(rootRowA.parentId === folder.puuid() && typeof rootRowA.orderKey === "string", "the document's root row is placed under the folder node with an order key");
    const children = await store.asyncChildren(folder.puuid());
    check(children.map(r => r.poolId).join(",") === [docA, docB, docC].map(d => d.puuid()).join(","), "children(folder) lists the three pools in folder order");
    check(JSON.parse(poolA.recordForPid(docA.puuid()).entries.find(e => e[0] === "subnodes")[1] ? "1" : "0") === 1
        && poolA.recordForPid(docA.puuid()).entries.find(e => e[0] === "subnodes")[1]["*"] !== undefined, "inside the document the note is a near ref");

    console.log("\nAn edit dirties only the document's pool");
    docB.setLabel("b2");
    const poolB = store.poolForId(docB.puuid());
    check(poolB.dirtyObjects().size === 1 && home.dirtyObjects().size === 0 && poolA.dirtyObjects().size === 0, "only pool b is dirty");
    const homeCount = home.count();
    await poolB.commitStoreDirtyObjects();
    check(home.count() === homeCount && JSON.parse(store.rootRowForPool(docB.puuid()).payloadJson).entries.some(e => e[0] === "label" && e[1] === "b2"), "pool b stored the new label; the home pool is untouched");

    console.log("\nReopen: far refs resolve from their own pools, and loading marks nothing dirty");
    store.pools().clear();
    home = newHomePool(store);
    await home.promiseOpen();
    const root2 = home.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    const folder2 = root2.folder();
    check(root2 !== root && labels(folder2) === "a,b2,c", "the folder's documents come back, fresh instances, with the stored edit");
    const docA2 = folder2.subnodes().first();
    const poolA2 = SvObjectPool.poolOfObject(docA2);
    check(poolA2 && poolA2 !== home && poolA2.poolId() === docA2.puuid() && poolA2.rootObject() === docA2, "each document is active in its own reopened pool");
    check(docA2.subnodes().first().text() === "note of a" && SvObjectPool.poolOfObject(docA2.subnodes().first()) === poolA2, "the document's note loaded near, into the document's pool");
    check(home.dirtyObjects().size === 0 && [...store.pools().values()].every(p => p.dirtyObjects().size === 0), "no pool has a dirty object after the loads");

    console.log("\nGC by pool");
    await store.asyncPut([SvRecordRow.newRow({ poolId: docA2.puuid(), objectId: "stray-1", payloadJson: JSON.stringify({ type: "TestPoolNote", entries: [["text", "stray"]] }) })]);
    const countBefore = home.count();
    await poolA2.promiseCollect();
    check(!store.hasRow(docA2.puuid(), "stray-1") && poolA2.hasRecordForPid(docA2.subnodes().first().puuid()), "an unreachable row is swept from its pool; reachable ones stay");
    check(home.count() === countBefore, "the home pool was not touched");

    console.log("\nMoving a document between folders re-places its pool");
    const other = root2.otherFolder();
    const docC2 = folder2.subnodes().last();
    folder2.removeSubnode(docC2);
    other.addSubnode(docC2);
    await home.commitStoreDirtyObjects();
    await store.poolForId(docC2.puuid()).commitStoreDirtyObjects();
    check(store.rootRowForPool(docC2.puuid()) && store.rootRowForPool(docC2.puuid()).parentId === other.puuid(), "the moved document's root row now sits under the other folder");
    check((await store.asyncChildren(folder2.puuid())).length === 2 && (await store.asyncChildren(other.puuid())).length === 1, "children() follows the move");
    docC2.deletePoolIfDetached();
    await tick();
    check(store.rootRowForPool(docC2.puuid()) !== null, "a re-attached document keeps its pool");

    console.log("\nDeletion cascades");
    const docB2 = folder2.subnodes().last();
    const noteBPid = docB2.subnodes().first().puuid();
    folder2.removeSubnode(docB2);
    docB2.deletePoolIfDetached();
    await tick();
    await home.commitStoreDirtyObjects();
    check(store.rootRowForPool(docB2.puuid()) === null && !store.hasRow(docB2.puuid(), noteBPid) && store.poolForId(docB2.puuid()) === null, "a detached document's pool and its records are gone");
    check(labels(folder2) === "a" && (await store.asyncChildren(folder2.puuid())).length === 1, "the folder keeps only the remaining document");

    console.log("\nA pool round-trips through the cloud pool.json shape");
    const json = poolA2.asJson();
    check(json.root === docA2.puuid() && Object.keys(json).length === poolA2.count() + 1, "asJson is every record's JSON by puuid plus the root pointer");
    const store2 = SvLocalRecordStore.clone().useMemoryMap();
    await store2.asyncOpenStore();
    const imported = await store2.asyncImportPoolJson(json);
    check(imported.rootObject().label() === "a" && imported.rootObject().subnodes().first().text() === "note of a", "importing pool.json into another store reproduces the document");
    check(imported.collectDelta() === null, "a freshly imported pool has no synced snapshot yet (full upload)");
    imported.updateLastSyncedSnapshot();
    imported.rootObject().setLabel("a3");
    await imported.commitStoreDirtyObjects();
    const delta = imported.collectDelta();
    check(delta && Object.keys(delta.writes).length === 1 && delta.deletes.length === 0, "after an edit the delta is the one changed record");
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
