#!/usr/bin/env node

"use strict";

/**
 * Headless test: a pool opened from the local store, whose rows are in sync with
 * the cloud, commits only what changes from then on.
 *
 * A pool's commit sends the records that differ from its synced snapshot. That
 * snapshot is set when a pool is imported from the cloud or committed — but a
 * document whose local copy is current opens from disk with no cloud read, so
 * its pool had no snapshot and its first commit sent every record (measured on
 * dev 2026-10-01: one title edit after a reload sent all 65 records of a new
 * session; a played session holds thousands). SvLocalRecordStore.openPoolWithId
 * now takes the snapshot when the stored root shows the copy in sync. A collect
 * after opening then reaches the cloud as deletes, too.
 *
 * Interim: Plans/Record Store's persistent outbox replaces the snapshot.
 *
 * Usage (from this directory):  node TestReopenedPoolCommitsChanges.js
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

function defineClasses () {
    const SvStorableNode = SvGlobals.get("SvStorableNode");
    const SvSyncableJsonGroup = SvGlobals.get("SvSyncableJsonGroup");
    (class TestReopenItem extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("text", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();
    (class TestReopenList extends SvStorableNode {
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
    }).initThisClass();
    (class TestReopenDoc extends SvSyncableJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("items", null);
                slot.setSlotType("TestReopenList");
                slot.setShouldStoreSlot(true);
                slot.setFinalInitProto(SvGlobals.get("TestReopenList"));
            }
        }
    }).initThisClass();
}

function fakeBackendOver (memoryStore) {
    return {
        callFunction: async (name, args) => {
            switch (name) {
                case "records-open": return { pool: await memoryStore.asyncOpen(args.poolId) };
                case "records-commit": {
                    const result = await memoryStore.asyncCommit(args);
                    if (result.status === "refused") {
                        const e = new Error(result.reason); e.code = "failed-precondition"; throw e;
                    }
                    return result;
                }
                case "records-stage-begin": return memoryStore.asyncStageBegin(args);
                case "records-stage-write": return memoryStore.asyncStageWrite(args);
                case "records-stage-finalize": return memoryStore.asyncStageFinalize(args);
                default: throw new Error("fake backend: unknown function " + name);
            }
        }
    };
}

/** Wraps the cloud store so each commit's size is recorded. */
function recordingCloud (cloud) {
    const sent = [];
    const original = cloud.asyncCommit.bind(cloud);
    cloud.asyncCommit = async (commit) => {
        sent.push({ writes: commit.writes.map(w => w.objectId), deletes: commit.deletes.map(d => d.objectId) });
        return original(commit);
    };
    return sent;
}

async function main () {
    await boot();
    defineClasses();
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const SvMemoryRecordStore = SvGlobals.get("SvMemoryRecordStore");
    const SvCloudRecordStore = SvGlobals.get("SvCloudRecordStore");
    const SvRecordRow = SvGlobals.get("SvRecordRow");
    const TestReopenItem = SvGlobals.get("TestReopenItem");

    const cloudMemory = SvMemoryRecordStore.clone();
    const cloud = SvCloudRecordStore.clone().setBackend(fakeBackendOver(cloudMemory)).setBusyRetryDelays([]);
    const sent = recordingCloud(cloud);

    // the writing device: a document of twenty items, committed (v1)
    const writer = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestReopenedPoolCommitsChanges");
    pool.setRecordStore(writer);
    await pool.promiseOpen();
    const doc = pool.rootOrIfAbsentFromClosure(() => SvGlobals.get("TestReopenDoc").clone());
    for (let i = 1; i <= 20; i++) {
        const item = TestReopenItem.clone();
        item.setText("item " + i);
        doc.items().addSubnode(item);
    }
    await pool.commitStoreDirtyObjects();
    await cloudMemory.asyncPut([SvRecordRow.newRow({ poolId: pool.poolId(), objectId: pool.poolId(), ownerUid: "u1", version: 0, payloadJson: "{}" })]);
    check((await pool.asyncCommitToCloud(cloud)).status === "committed", "the writer commits v1");
    const recordCount = sent[0].writes.length;

    console.log("\nA device imports it, then reopens it from its local store (no cloud read)");
    const device = SvLocalRecordStore.clone().useMemoryMap();
    device.setOutlivesItsPools(true);
    const imported = await device.asyncImportOpenedPool(await cloud.asyncOpen(pool.poolId()));
    imported.rootObject().didSyncFromCloud(1000); // as a document does after a cloud load
    await imported.asyncFlushDirty();
    check(device.inSyncVersionOfPool(pool.poolId()) === 1, "its stored copy is in sync at v1");
    device.closeLivePool(pool.poolId()); // a reload: the pool is gone from memory, its rows remain
    const reopened = device.poolForId(pool.poolId());
    check(!!reopened && !!reopened.lastSyncedSnapshot(), "the reopened pool starts with a synced snapshot");

    console.log("\nOne edit commits one record");
    sent.length = 0;
    reopened.readRootObject();
    const reopenedDoc = reopened.rootObject();
    reopenedDoc.items().subnodes().first().setText("item 1 edited");
    await reopened.asyncFlushDirty();
    check((await reopened.asyncCommitToCloud(cloud)).status === "committed", "the edit commits (v2)");
    check(sent.length === 1 && sent[0].writes.length === 1 && sent[0].deletes.length === 0,
        "it sends 1 record, not all " + recordCount + " (" + (sent[0] ? sent[0].writes.length : "none") + " writes)");
    reopenedDoc.didSyncToCloud(2000); // as a document does after a successful save
    await reopened.asyncFlushDirty();

    console.log("\nWhat a collect sweeps after opening reaches the cloud as deletes");
    device.closeLivePool(pool.poolId());
    const again = device.poolForId(pool.poolId());
    again.readRootObject();
    const list = again.rootObject().items();
    const dropped = list.subnodes().last();
    list.removeSubnode(dropped); // unreferenced from here: a collect sweeps it
    await again.asyncFlushDirty();
    await again.promiseCollect();
    check(!again.hasRecordForPid(dropped.puuid()), "the collect swept the dropped item locally");
    sent.length = 0;
    check((await again.asyncCommitToCloud(cloud)).status === "committed", "the next commit lands (v3)");
    check(sent[0].deletes.includes(dropped.puuid()), "and deletes the swept item in the cloud");
    check(sent[0].writes.length <= 2, "while writing only what changed (" + sent[0].writes.length + " writes)");

    console.log("\nA copy holding an unsent edit is not taken as in sync");
    const dirtyRoot = again.rootObject();
    dirtyRoot.items().subnodes().first().setText("unsent");
    await again.asyncFlushDirty();
    check(device.inSyncVersionOfPool(pool.poolId()) === null, "an unsent edit leaves the copy out of sync (its first commit sends the whole pool, as before)");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
