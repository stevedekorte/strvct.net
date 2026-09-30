#!/usr/bin/env node

"use strict";

/**
 * Headless test: a pool stored locally is brought up to the cloud's version
 * from the changes since the version it holds (SvLocalRecordStore
 * asyncImportPoolChanges) — a returning device opens a document with one small
 * read instead of re-reading every record. Edits, deletes and a commit that
 * doesn't rewrite the root all land; the result matches a full open.
 *
 * Usage (from this directory):  node TestRecordPoolChangesImport.js
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

    // the writing device: a session with a chat of six messages, committed (v1)
    const store = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestRecordPoolChangesImport");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const session = pool.rootOrIfAbsentFromClosure(() => SvGlobals.get("TestWinSession").clone());
    const chat = session.chat();
    for (let i = 1; i <= 6; i++) { chat.addSubnode(newMessage("m" + i)); }
    await pool.commitStoreDirtyObjects();
    await cloudMemory.asyncPut([SvRecordRow.newRow({ poolId: pool.poolId(), objectId: pool.poolId(), ownerUid: "u1", version: 0, payloadJson: "{}" })]);
    check((await pool.asyncCommitToCloud(cloud)).status === "committed", "the writer commits v1");

    console.log("\nA returning device holds v1");
    const reader = SvLocalRecordStore.clone().useMemoryMap();
    reader.setOutlivesItsPools(true); // as in the app, closing a document's pool leaves the shared store open
    await reader.asyncImportOpenedPool(await cloud.asyncOpen(pool.poolId()));
    check(reader.rootRowForPool(pool.poolId()).version === 1, "its stored root is at v1");

    console.log("\nThe writer edits and deletes (v2), then edits without touching the root (v3)");
    chat.subnodes().first().setText("m1 edited");
    await pool.commitStoreDirtyObjects();
    check((await pool.asyncCommitToCloud(cloud)).status === "committed", "v2 committed");
    chat.subnodes().last().setText("m6 edited");
    await pool.commitStoreDirtyObjects();
    const third = await pool.asyncCommitToCloud(cloud);
    check(third.status === "committed" && third.version === 3, "v3 committed");

    console.log("\nThe reader catches up from the changes since v1");
    const changes = await cloud.asyncReadChanges(pool.poolId(), 1);
    check(changes && !changes.reloadRequired && changes.version === 3, "the cloud answers with the changes to v3");
    const caughtUp = await reader.asyncImportPoolChanges(changes, pool.poolId());
    const full = await cloud.asyncOpen(pool.poolId());
    const local = await reader.asyncOpen(pool.poolId());
    const payloads = (opened) => opened.records.map(r => r.objectId + "=" + r.payloadJson).sort().join("|");
    check(local.version === 3 && reader.rootRowForPool(pool.poolId()).version === 3, "its root is at v3");
    check(payloads(local) === payloads(full), "its records are the cloud's (" + local.records.length + " of " + full.records.length + ")");
    const texts = caughtUp.rootObject().chat();
    texts.loadLatestWindow();
    check(texts.subnodes().map(m => m.text()).join(",") === "m4,m5,m6 edited", "the reopened chat's latest window shows the v3 edit: " + texts.subnodes().map(m => m.text()).join(","));
    check(local.records.some(r => (r.payloadJson || "").includes("m1 edited")), "…and the v2 edit is stored");
    check(caughtUp.collectDelta() === null || Object.keys(caughtUp.collectDelta().writes).length === 0, "nothing to send: what it holds is what the cloud holds");

    console.log("\nA tombstone removes its row");
    const victim = full.records.find(r => r.parentId); // a message
    await reader.asyncImportPoolChanges({ rows: [], tombstones: [{ poolId: pool.poolId(), objectId: victim.objectId }], version: 4 }, pool.poolId());
    check(!reader.rowForKey(pool.poolId(), victim.objectId) && reader.rootRowForPool(pool.poolId()).version === 4, "the tombstoned row is gone and the root is at the new version");
    const reopened = reader.poolForId(pool.poolId()).rootObject().chat();
    check(reopened.subnodeCount() === 5, "the chat counts five messages");

    console.log("\nNo changes: nothing to import, same version");
    const none = await cloud.asyncReadChanges(pool.poolId(), 3);
    check(none.rows.length === 0 && none.tombstones.length === 0 && none.version === 3, "an up-to-date pool gets an empty answer");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
