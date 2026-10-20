#!/usr/bin/env node

"use strict";

/**
 * Headless test: a pool's projection (SvPoolProjection) committed with the
 * truth (Plans/Server-Hosted Sessions, M1a).
 *
 * The projection holds the records reachable from the root without passing
 * through anything host-only: host-only slots are dropped, host-only objects
 * are left out with everything reachable only through them, and references
 * to them are cut. It is committed in the same transaction as the truth when
 * the two fit, else after it; a replica imports it as an ordinary pool.
 *
 * The "cloud" is SvMemoryRecordStore behind SvCloudRecordStore with a fake
 * backend, as in TestRecordCloudSync.
 *
 * Usage (from this directory):  node TestPoolProjection.js
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

    (class TestPjDoc extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("label", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
    }).initThisClass();

    (class TestPjNpc extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("name", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
            }
            {
                const slot = this.newSlot("lastToolCallId", ""); // stored bookkeeping nobody marked for players
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("notes", ""); // the GM's private notes on this NPC
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true); // in the host's cloud JSON, like unknownToPlayers…
                slot.setIsHostOnly(true); // …but kept from its players
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(false);
        }
    }).initThisClass();

    (class TestPjSecret extends SvStorableNode { // a GM-only container
        static isHostOnly () {
            return true;
        }
        initPrototypeSlots () {
            {
                const slot = this.newSlot("plot", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
    }).initThisClass();
}

function fakeBackendOver (memoryStore, calls) {
    return {
        callFunction: async (name, args) => {
            calls.push({ name, args });
            switch (name) {
                case "records-open": return { pool: await memoryStore.asyncOpen(args.poolId) };
                case "records-changes": return { changes: await memoryStore.asyncReadChanges(args.poolId, args.sinceVersion) };
                case "records-commit": {
                    const result = await memoryStore.asyncCommit(args);
                    if (result.status === "refused") {
                        const e = new Error(result.reason); e.code = "failed-precondition"; throw e;
                    }
                    return result;
                }
                default: throw new Error("fake backend: unknown function " + name);
            }
        }
    };
}

function payloadOf (opened, objectId) {
    const row = objectId === opened.root.objectId ? opened.root : opened.records.find(r => r.objectId === objectId);
    return row ? row.payloadJson : null;
}

async function main () {
    await boot();
    defineClasses();
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const SvMemoryRecordStore = SvGlobals.get("SvMemoryRecordStore");
    const SvCloudRecordStore = SvGlobals.get("SvCloudRecordStore");
    const SvPoolProjection = SvGlobals.get("SvPoolProjection");
    const SvRecordRow = SvGlobals.get("SvRecordRow");
    const [TestPjDoc, TestPjNpc, TestPjSecret] = ["TestPjDoc", "TestPjNpc", "TestPjSecret"].map(n => SvGlobals.get(n));

    const calls = [];
    const cloudMemory = SvMemoryRecordStore.clone();
    const cloud = SvCloudRecordStore.clone().setBackend(fakeBackendOver(cloudMemory, calls));

    const store = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestPoolProjection");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const root = pool.rootOrIfAbsentFromClosure(() => TestPjDoc.clone());
    root.setLabel("the table");
    const npc = TestPjNpc.clone(); npc.setName("Vorn"); npc.setNotes("secretly the vampire's thrall"); npc.setLastToolCallId("call_123");
    const secret = TestPjSecret.clone(); secret.setPlot("the abbot is the vampire");
    const hidden = TestPjNpc.clone(); hidden.setName("The Abbot"); // ordinary class, reachable only through the secret
    secret.addSubnode(hidden);
    root.addSubnode(npc);
    root.addSubnode(secret);
    await pool.commitStoreDirtyObjects();
    await cloudMemory.asyncPut([SvRecordRow.newRow({ poolId: pool.poolId(), objectId: pool.poolId(), ownerUid: "u1", version: 0, payloadJson: "{}" })]);

    const projectionId = "mp1:" + pool.poolId();
    const projection = SvPoolProjection.clone().setPool(pool).setCloudPoolId(projectionId).setCreate({ scopeId: "mp1", ownerUid: "u1" });

    console.log("\nThe first commit carries the truth and its projection in one transaction");
    calls.length = 0;
    let result = await pool.asyncCommitToCloud(cloud, { projection });
    check(result.status === "committed" && result.version === 1 && result.projection && result.projection.version === 1 && result.projection.baseVersion === 0, "both pools at version 1 (" + JSON.stringify({ status: result.status, version: result.version, projection: result.projection && { version: result.projection.version, baseVersion: result.projection.baseVersion } }) + ")");
    check(calls.length === 1 && calls[0].args.projection && calls[0].args.projection.poolId === projectionId, "one records-commit call, the projection paired in it");
    let opened = await cloud.asyncOpen(projectionId);
    const ids = new Set([opened.root.objectId].concat(opened.records.map(r => r.objectId)));
    check(ids.has(pool.poolId()) && ids.has(npc.puuid()), "the projection holds the root and the ordinary NPC");
    check(!ids.has(secret.puuid()), "the host-only object is left out");
    check(!ids.has(hidden.puuid()), "…and so is what is reachable only through it (The Abbot)");
    check(!payloadOf(opened, npc.puuid()).includes("thrall") && payloadOf(opened, npc.puuid()).includes("Vorn"), "a host-only slot is dropped from its record; the rest stays");
    check(!payloadOf(opened, npc.puuid()).includes("call_123"), "a stored slot not marked for players (isInCloudJson) is left out");
    check(![...opened.records, opened.root].some(r => r.payloadJson.includes(secret.puuid())), "no projected record references the left-out object");
    check(!JSON.stringify(opened).includes("the abbot is the vampire") && !JSON.stringify(opened).includes("thrall"), "no secret text reaches the projection at all");
    const truth = await cloud.asyncOpen(pool.poolId());
    check(truth.records.some(r => r.objectId === secret.puuid()) && truth.records.some(r => r.payloadJson.includes("thrall")), "the truth keeps everything");

    console.log("\nA replica imports the projection as an ordinary pool");
    const replicaStore = SvLocalRecordStore.clone().useMemoryMap();
    await replicaStore.asyncOpenStore();
    const replica = await replicaStore.asyncImportOpenedPool(opened, pool.poolId());
    const replicaRoot = replica.rootObject();
    check(replicaRoot && replicaRoot.label() === "the table" && replicaRoot.subnodes().length === 1 && replicaRoot.subnodes().at(0).name() === "Vorn", "the replica's root has the NPC and nothing else");
    check(replicaRoot.subnodes().at(0).notes() === "", "the NPC's private notes are at their default");

    console.log("\nLater commits send only what changed, paired");
    npc.setName("Vorn the Grey");
    await pool.commitStoreDirtyObjects();
    calls.length = 0;
    result = await pool.asyncCommitToCloud(cloud, { projection });
    check(result.status === "committed" && result.version === 2 && result.projection.version === 2 && result.projection.writes.length === 1 && result.projection.writes[0].objectId === npc.puuid(), "a renamed NPC: one projected write (" + result.projection.writes.map(w => w.objectId).join(",") + ")");
    check(calls.length === 1, "still one call");

    console.log("\nA change only the host can see commits the truth alone");
    npc.setNotes("now openly hostile");
    secret.setPlot("the abbot fled");
    await pool.commitStoreDirtyObjects();
    calls.length = 0;
    result = await pool.asyncCommitToCloud(cloud, { projection });
    check(result.status === "committed" && result.version === 3 && !result.projection, "the truth commits; the projection has nothing to send");
    check(calls.length === 1 && !calls[0].args.projection, "no projection rides along");
    check((await cloud.asyncOpen(projectionId)).version === 2, "the projection stays at its version");

    console.log("\nA removal is a projected delete");
    root.removeSubnode(npc);
    await pool.commitStoreDirtyObjects();
    await pool.promiseCollect();
    result = await pool.asyncCommitToCloud(cloud, { projection });
    check(result.projection && result.projection.deletes.some(d => d.objectId === npc.puuid()), "the NPC's projection is deleted");
    opened = await cloud.asyncOpen(projectionId);
    check(!opened.records.some(r => r.objectId === npc.puuid()), "…and gone from the cloud projection");

    console.log("\nWhen the two don't fit in one transaction, the truth commits first, then the projection");
    const extras = [1, 2, 3, 4].map((i) => { const n = TestPjNpc.clone(); n.setName("Guard " + i); root.addSubnode(n); return n; });
    await pool.commitStoreDirtyObjects();
    cloud.maxOpsPerCommit = () => 8; // smaller than truth + projection together
    calls.length = 0;
    result = await pool.asyncCommitToCloud(cloud, { projection });
    delete cloud.maxOpsPerCommit;
    const commitCalls = calls.filter(c => c.name === "records-commit");
    check(result.status === "committed" && result.projection && commitCalls.length === 2 && commitCalls[0].args.poolId === pool.poolId() && commitCalls[1].args.poolId === projectionId, "two commits, truth then projection");
    opened = await cloud.asyncOpen(projectionId);
    check(extras.every(n => opened.records.some(r => r.objectId === n.puuid())), "the projection caught up");

    console.log("\nA host reopening a session it committed marks the projection in sync");
    const reopened = SvPoolProjection.clone().setPool(pool).setCloudPoolId(projectionId).markInSync(opened.version);
    check(reopened.changes().isEmpty && reopened.version() === opened.version, "nothing to send until something changes");

    await pool.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
