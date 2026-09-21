#!/usr/bin/env node

"use strict";

/**
 * Headless test: a pool's cloud mirror through the commit protocol
 * (Plans/Record Store §4, §7) — SvObjectPool.asyncCommitToCloud against a
 * cloud record store, and SvLocalRecordStore.asyncImportOpenedPool bringing a
 * pool down from the cloud.
 *
 * The "cloud" here is SvMemoryRecordStore (the reference backing that
 * implements the commit protocol) behind SvCloudRecordStore with a fake
 * backend whose callFunction routes to it the way the Firebase routes do —
 * so the client-side protocol, the version mirroring and the import path are
 * exercised without a network.
 *
 * Usage (from this directory):  node TestRecordCloudSync.js
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
    (class TestCloudDoc extends SvStorableNode {
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
}

/** A backend routing callFunction to a memory store the way the Firebase routes do. */
function fakeBackendOver (memoryStore) {
    return {
        callFunction: async (name, args) => {
            switch (name) {
                case "records-open": return { pool: await memoryStore.asyncOpen(args.poolId) };
                case "records-changes": return { changes: await memoryStore.asyncReadChanges(args.poolId, args.sinceVersion) };
                case "records-children": return { rows: await memoryStore.asyncChildren(args.parentId, { after: args.after, limit: args.limit }) };
                case "records-commit": {
                    const result = await memoryStore.asyncCommit(args);
                    if (result.status === "refused") {
                        const e = new Error(result.reason); e.code = "failed-precondition"; throw e; // as the HTTP route maps refusals
                    }
                    return result;
                }
                default: throw new Error("fake backend: unknown function " + name);
            }
        }
    };
}

async function main () {
    await boot();
    defineClasses();
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const SvMemoryRecordStore = SvGlobals.get("SvMemoryRecordStore");
    const SvCloudRecordStore = SvGlobals.get("SvCloudRecordStore");
    const SvRecordRow = SvGlobals.get("SvRecordRow");
    const TestCloudDoc = SvGlobals.get("TestCloudDoc");

    const cloudMemory = SvMemoryRecordStore.clone();
    const cloud = SvCloudRecordStore.clone().setBackend(fakeBackendOver(cloudMemory));

    console.log("\nA pool's first commit creates it in the cloud");
    const store = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestRecordCloudSync");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const root = pool.rootOrIfAbsentFromClosure(() => TestCloudDoc.clone());
    root.setLabel("v1");
    const child = TestCloudDoc.clone(); child.setLabel("child");
    root.addSubnode(child);
    await pool.commitStoreDirtyObjects();
    // the memory "cloud" needs a scope-less root creation: the memory backing has no scopes; seed nothing
    // (SvMemoryRecordStore refuses unknown pools, so create the pool's root row there first the way a creating commit does)
    await cloudMemory.asyncPut([SvRecordRow.newRow({ poolId: pool.poolId(), objectId: pool.poolId(), ownerUid: "u1", version: 0, payloadJson: "{}" })]);
    let result = await pool.asyncCommitToCloud(cloud);
    check(result.status === "committed" && result.version === 1, "the whole pool is committed as writes (" + JSON.stringify(result) + ")");
    const opened = await cloud.asyncOpen(pool.poolId());
    check(opened.version === 1 && opened.records.length === pool.count() - 1 && opened.root.payloadJson.includes("v1"), "the cloud holds the root and every record at version 1");
    check(store.rowForKey(pool.poolId(), pool.poolId()).version === 1, "the version is mirrored onto the local root row");
    check(pool.dirtyObjects().size === 0, "mirroring the version dirtied nothing");
    check((await pool.asyncCommitToCloud(cloud)).status === "unchanged", "a second commit with no changes sends nothing");

    console.log("\nAn edit commits as a delta at the mirrored base version");
    root.setLabel("v2");
    const removed = child;
    root.removeSubnode(removed);
    await pool.commitStoreDirtyObjects();
    await pool.promiseCollect(); // the removed child's record is swept, so the delta carries its delete
    result = await pool.asyncCommitToCloud(cloud);
    check(result.status === "committed" && result.version === 2, "the delta commits at baseVersion 1 → version 2 (" + JSON.stringify(result) + ")");
    const changes = await cloud.asyncReadChanges(pool.poolId(), 1);
    check(changes.rows.some(r => r.objectId === pool.poolId() && r.payloadJson.includes("v2")) && changes.tombstones.some(t => t.objectId === removed.puuid()), "the cloud's changes since 1 are the edited root and the removed child's tombstone (rows " + changes.rows.map(r => r.objectId).join(",") + "; tombstones " + changes.tombstones.map(t => t.objectId).join(",") + "; removed " + removed.puuid() + "; local has removed row: " + store.hasRow(pool.poolId(), removed.puuid()) + ")");

    console.log("\nA conflict leaves the local mirror alone");
    await cloudMemory.asyncCommit({ poolId: pool.poolId(), baseVersion: 2, requestId: "other-device", writes: [SvRecordRow.newRow({ poolId: pool.poolId(), objectId: "from-elsewhere", payloadJson: "{\"type\":\"TestCloudDoc\",\"entries\":[]}" })], deletes: [] });
    root.setLabel("v3");
    await pool.commitStoreDirtyObjects();
    result = await pool.asyncCommitToCloud(cloud);
    check(result.status === "conflict" && result.version === 3, "another device's commit makes ours conflict, reporting the cloud's version");
    check(store.rowForKey(pool.poolId(), pool.poolId()).version === 2 && root.label() === "v3", "the local version and the local edit are untouched");

    console.log("\nA refusal comes back as a status, not a throw");
    result = await cloud.asyncCommit({ poolId: "nope", baseVersion: 0, requestId: "x", writes: [], deletes: [] });
    check(result.status === "refused" && /unknown pool/.test(result.reason), "refused: " + result.reason);

    console.log("\nImporting a pool from the cloud into a fresh local store");
    const store2 = SvLocalRecordStore.clone().useMemoryMap();
    await store2.asyncOpenStore();
    const fromCloud = await cloud.asyncOpen(pool.poolId());
    const imported = await store2.asyncImportOpenedPool(fromCloud);
    check(imported.rootObject().label() === "v2" && imported.rootObject().subnodes().length === 0, "the imported pool materializes the cloud's state (the conflicting local edit was not there)");
    check(store2.rowForKey(pool.poolId(), pool.poolId()).version === 3 && store2.rowForKey(pool.poolId(), pool.poolId()).ownerUid === "u1", "server-owned columns rode down with the rows");
    check(imported.collectDelta() && imported.collectDelta().isEmpty, "the imported pool's snapshot equals its rows: nothing to commit");
    imported.rootObject().setLabel("v4");
    await imported.commitStoreDirtyObjects();
    result = await imported.asyncCommitToCloud(cloud);
    check(result.status === "committed" && result.version === 4, "an edit on the imported pool commits at the cloud's version");
    await pool.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
