#!/usr/bin/env node

"use strict";

/**
 * Headless test: staged commits (Plans/Record Store §7 point 5) — a commit too
 * large for one transaction goes begin → batches → finalize through
 * SvStagedRecordCommit; readers and other writers see "busy" meanwhile; an
 * abandoned stage rolls back to the pool as it was. Run against the reference
 * SvMemoryRecordStore directly and behind SvCloudRecordStore (fake backend),
 * with a real pool committing through asyncCommitToCloud.
 *
 * Usage (from this directory):  node TestRecordStagedCommit.js
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
    const SvStagedRecordCommit = SvGlobals.get("SvStagedRecordCommit");
    const SvRecordRow = SvGlobals.get("SvRecordRow");
    const TestCloudDoc = SvGlobals.get("TestCloudDoc");
    const row = (poolId, objectId, payload) => ({ poolId, objectId, payloadJson: JSON.stringify(payload) });
    const seed = async (mem, poolId, ids) => {
        await mem.asyncPut([SvRecordRow.newRow({ poolId, objectId: SvRecordRow.localPoolId(poolId), ownerUid: "u1", version: 1, modifiedVersion: 1, payloadJson: "{\"v\":1}" })]
            .concat(ids.map(id => SvRecordRow.newRow({ poolId, objectId: id, modifiedVersion: 1, payloadJson: "{\"v\":1}" }))));
    };

    console.log("\nSizing: batches by operations and bytes; the root waits for finalize");
    const commit = { poolId: "p", baseVersion: 1, requestId: "s1", writes: [row("p", "p", { v: 2 })].concat(Array.from({ length: 450 }, (_, i) => row("p", "k" + i, { v: 2 }))), deletes: [{ poolId: "p", objectId: "old" }] };
    check(SvStagedRecordCommit.needsStaging(commit, 450, Infinity) && !SvStagedRecordCommit.needsStaging({ writes: commit.writes.slice(0, 10) }, 450, Infinity), "needsStaging past the op limit only");
    check(SvStagedRecordCommit.needsStaging({ writes: [row("p", "big", "x".repeat(100))] }, 450, 50), "…or past the byte limit");
    const batches = SvStagedRecordCommit.clone().setCommit(commit).batches();
    check(batches.length === 3 && batches[0].writes.length === 200 && batches[2].deletes.length === 1 && batches.every(b => b.writes.every(r => r.objectId !== "p")), "451 ops → 200/200/51, root excluded: " + batches.map(b => b.writes.length + "+" + b.deletes.length).join(","));
    const byBytes = SvStagedRecordCommit.clone().setCommit({ writes: [row("p", "a", "x".repeat(60)), row("p", "b", "x".repeat(60)), row("p", "c", "x".repeat(10))] }).setMaxBytesPerWrite(100).batches();
    check(byBytes.length === 2 && byBytes[0].writes.length === 1, "a batch closes before it passes the byte budget: " + byBytes.map(b => b.writes.length).join(","));

    console.log("\nThe memory store stages a large commit into one version");
    const mem = SvMemoryRecordStore.clone().setMaxOpsPerCommit(200);
    await seed(mem, "p", ["old", "k0"]);
    const committed = await mem.asyncCommit(commit);
    check(committed.status === "committed" && committed.version === 2, "committed as one version: " + JSON.stringify(committed));
    const openedP = await mem.asyncOpen("p");
    check(openedP.state === "ready" && openedP.records.length === 450 && JSON.parse(openedP.root.payloadJson).v === 2 && openedP.root.version === 2, "every row and the root at v2");
    check((await mem.asyncReadChanges("p", 1)).tombstones.length === 1, "the delete is a tombstone at v2");
    check(mem.stages().size === 0, "no stage left open");
    check((await mem.asyncCommit(commit)).version === 2, "a retry of the same request gets the first answer");

    console.log("\nWhile a stage is open the pool is busy; finalize ends it");
    const m2 = SvMemoryRecordStore.clone();
    await seed(m2, "q", ["a"]);
    await m2.asyncStageBegin({ poolId: "q", baseVersion: 1, requestId: "s" });
    await m2.asyncStageWrite({ poolId: "q", requestId: "s", writes: [row("q", "a", { v: 2 }), row("q", "n", { v: 2 })], deletes: [] });
    check((await m2.asyncOpen("q")).state === "busy" && (await m2.asyncReadChanges("q", 1)).state === "busy", "open and changes answer busy");
    check((await m2.asyncCommit({ poolId: "q", baseVersion: 1, requestId: "o", writes: [row("q", "a", {})], deletes: [] })).status === "busy", "another commit answers busy");
    check((await m2.asyncStageBegin({ poolId: "q", baseVersion: 1, requestId: "o2" })).status === "busy", "another stage answers busy");
    check((await m2.asyncStageBegin({ poolId: "q", baseVersion: 0, requestId: "s" })).status === "staging", "the same request resumes its stage");
    await m2.asyncStageFinalize({ poolId: "q", requestId: "s", rootWrite: null });
    check((await m2.asyncOpen("q")).version === 2, "finalize without a root row still advances the version");

    console.log("\nAn abandoned stage rolls back on the next access");
    const m3 = SvMemoryRecordStore.clone();
    await seed(m3, "r", ["a", "gone"]);
    await m3.asyncStageBegin({ poolId: "r", baseVersion: 1, requestId: "s" });
    await m3.asyncStageWrite({ poolId: "r", requestId: "s", writes: [row("r", "a", { v: 2 }), row("r", "n", { v: 2 })], deletes: [{ poolId: "r", objectId: "gone" }] });
    await m3.asyncStageWrite({ poolId: "r", requestId: "s", writes: [row("r", "a", { v: 3 })], deletes: [] });
    m3.stages().get("r").expiresAt = 0;
    const back = await m3.asyncOpen("r");
    check(back.state === "ready" && back.version === 1, "the pool opens at its old version");
    check(back.records.map(r => r.objectId).sort().join(",") === "a,gone" && back.records.every(r => JSON.parse(r.payloadJson).v === 1), "every row as it was (the first pre-image wins; new rows gone)");
    let late = null;
    try { await m3.asyncStageFinalize({ poolId: "r", requestId: "s" }); } catch (e) { late = e.code; }
    check(late === "failed-precondition", "the abandoned stage cannot finalize");

    console.log("\nA pool commits a large change through the cloud store; a busy pool is retried");
    const cloudMemory = SvMemoryRecordStore.clone();
    const cloud = SvCloudRecordStore.clone().setBackend(fakeBackendOver(cloudMemory)).setBusyRetryDelays([5, 5, 5]);
    const store = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestRecordStagedCommit");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const root = pool.rootOrIfAbsentFromClosure(() => TestCloudDoc.clone());
    root.setLabel("big");
    for (let i = 0; i < 520; i++) { const c = TestCloudDoc.clone(); c.setLabel("c" + i); root.addSubnode(c); }
    await pool.commitStoreDirtyObjects();
    await cloudMemory.asyncPut([SvRecordRow.newRow({ poolId: pool.poolId(), objectId: pool.poolId(), ownerUid: "u1", version: 0, payloadJson: "{}" })]);
    let calls = []; const inner = cloud.backend().callFunction; cloud.backend().callFunction = async (n, a) => { calls.push(n); return inner(n, a); };
    const result = await pool.asyncCommitToCloud(cloud);
    check(result.status === "committed" && result.version === 1, "committed: " + JSON.stringify(result) + " (" + pool.count() + " records)");
    check(calls[0] === "records-stage-begin" && calls[calls.length - 1] === "records-stage-finalize" && calls.filter(c => c === "records-stage-write").length === Math.ceil((pool.count() - 1) / 200), "staged: " + calls.join(" "));
    check((await cloud.asyncOpen(pool.poolId())).records.length === pool.count() - 1, "the cloud holds every record");
    check(store.rowForKey(pool.poolId(), pool.poolId()).version === 1, "the version is mirrored locally");

    await cloudMemory.asyncStageBegin({ poolId: pool.poolId(), baseVersion: 1, requestId: "other" });
    let opened = "none";
    try { opened = await cloud.asyncOpen(pool.poolId()); } catch (e) { opened = e.message; }
    check(/stayed busy/.test(String(opened)), "open waits, then reports a pool that stays busy: " + opened);
    setTimeout(() => cloudMemory.asyncStageFinalize({ poolId: pool.poolId(), requestId: "other" }), 8);
    cloud.setBusyRetryDelays([20, 20, 20]);
    const afterWait = await cloud.asyncOpen(pool.poolId());
    check(afterWait && afterWait.state === "ready" && afterWait.version === 2, "open retries through a stage that finishes");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
