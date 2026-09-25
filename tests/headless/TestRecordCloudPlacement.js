#!/usr/bin/env node

"use strict";

/**
 * Headless test: a windowed collection's elements keep their place through the
 * record cloud (Plans/Record Store §6, §7) — a commit sends each element's
 * parentId/orderKey as row columns (not the snapshot's "_placements" string, and
 * not the "root" pointer, which are not records), an import from the cloud
 * restores them so windows load in order, and a re-key commits the element.
 *
 * Usage (from this directory):  node TestRecordCloudPlacement.js
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

    (class TestWinMessage extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("text", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("attachment", null);
                slot.setSlotType("TestWinMessage");
                slot.setAllowsNullValue(true);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestWinChat extends SvStorableNode {
        initPrototype () {
            this.setShouldStoreSubnodes(true);
            this.setSubnodesAreWindowed(true);
        }
        windowSize () {
            return 3;
        }
    }).initThisClass();

    (class TestWinSession extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("chat", null);
                slot.setSlotType("TestWinChat");
                slot.setShouldStoreSlot(true);
                slot.setFinalInitProto(SvGlobals.get("TestWinChat"));
            }
            {
                const slot = this.newSlot("conversation", null); // a windowed SvAiConversation, set by the conversation check
                slot.setSlotType("SvStorableNode");
                slot.setAllowsNullValue(true);
                slot.setShouldStoreSlot(true);
            }
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
                case "records-stage-begin": return memoryStore.asyncStageBegin(args);
                case "records-stage-write": return memoryStore.asyncStageWrite(args);
                case "records-stage-finalize": return memoryStore.asyncStageFinalize(args);
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
    const TestWinMessage = SvGlobals.get("TestWinMessage");
    const newMessage = (text) => { const m = TestWinMessage.clone(); m.setText(text); return m; };
    const cloudMemory = SvMemoryRecordStore.clone();
    const cloud = SvCloudRecordStore.clone().setBackend(fakeBackendOver(cloudMemory)).setBusyRetryDelays([]);

    console.log("\nA commit sends placements as row columns");
    const store = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestRecordCloudPlacement");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const session = pool.rootOrIfAbsentFromClosure(() => SvGlobals.get("TestWinSession").clone());
    const chat = session.chat();
    for (let i = 1; i <= 6; i++) { chat.addSubnode(newMessage("m" + i)); }
    await pool.commitStoreDirtyObjects();
    await cloudMemory.asyncPut([SvRecordRow.newRow({ poolId: pool.poolId(), objectId: pool.poolId(), ownerUid: "u1", version: 0, payloadJson: "{}" })]);
    const first = await pool.asyncCommitToCloud(cloud);
    check(first.status === "committed", "committed: " + JSON.stringify(first));
    const opened = await cloud.asyncOpen(pool.poolId());
    check(!opened.records.some(r => r.objectId === "root" || r.objectId === "_placements"), "no snapshot bookkeeping keys became records");
    const cloudPlaced = opened.records.filter(r => r.parentId === chat.puuid());
    check(cloudPlaced.length === 6 && cloudPlaced.every(r => r.orderKey === store.rowForKey(pool.poolId(), r.objectId).orderKey), "each element's row carries its parentId and orderKey");
    check(opened.records.filter(r => r.parentId && r.parentId !== chat.puuid()).length === 0, "core records carry no placement");

    console.log("\nAn import from the cloud restores the order");
    const store2 = SvLocalRecordStore.clone().useMemoryMap();
    const pool2 = await store2.asyncImportOpenedPool(opened);
    const chat2 = pool2.rootObject().chat();
    chat2.loadLatestWindow();
    check(chat2.subnodes().map(m => m.text()).join(",") === "m4,m5,m6", "the latest window loads in order: " + chat2.subnodes().map(m => m.text()).join(","));
    check(chat2.subnodeCount() === 6, "the count answers from the imported placements");

    console.log("\nA re-key commits the moved element");
    const last = chat.subnodes().last();
    await store.asyncBeginBatch();
    pool.rekeyPlacedRow(last.puuid(), "0"); // before every other key, as the store pass re-keys a re-sorted collection
    await store.asyncCommitBatch();
    const moved = await pool.asyncCommitToCloud(cloud);
    const after = (await cloud.asyncOpen(pool.poolId())).records.find(r => r.objectId === last.puuid());
    check(moved.status === "committed" && after && after.parentId === chat.puuid() && after.orderKey === store.rowForKey(pool.poolId(), last.puuid()).orderKey, "the cloud row has the new order key");
    check(after.orderKey < (await cloud.asyncOpen(pool.poolId())).records.filter(r => r.parentId === chat.puuid() && r.objectId !== last.puuid()).map(r => r.orderKey).sort()[0], "…first in the collection");
    check((await pool.asyncCommitToCloud(cloud)).status === "unchanged", "nothing left to send");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
