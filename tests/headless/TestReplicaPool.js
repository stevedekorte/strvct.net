#!/usr/bin/env node

"use strict";

/**
 * Headless test: a replica pool (SvObjectPool_replica) — the player's side of
 * Plans/Server-Hosted Sessions M1a.
 *
 * A replica imports the host's projection with isReplica set: each record
 * loads as its class's replicaClass(), and local changes are never stored.
 * The host's later changes (a commit's projection: version, baseVersion,
 * writes, deletes — what its notice carries) apply to the LIVE objects in
 * place: an edited object keeps its identity and takes the new values, a new
 * subnode appears under its parent, a removed one goes. A replica that missed
 * a notice can't apply the next (its base is not the replica's version) and
 * pulls the changes since its version instead.
 *
 * Usage (from this directory):  node TestReplicaPool.js
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

    (class TestRpMessage extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("text", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
            }
        }
    }).initThisClass();

    (class TestRpChat extends SvStorableNode { // a windowed collection, like a session's chat
        initPrototype () {
            this.setShouldStoreSubnodes(true);
            this.setSubnodesAreWindowed(true);
        }
    }).initThisClass();

    (class TestRpTableBase extends SvStorableNode { // what host and player share (as UoSession is to its two)
        initPrototypeSlots () {
            {
                const slot = this.newSlot("chat", null);
                slot.setSlotType("TestRpChat");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
                slot.setFinalInitProto(SvGlobals.get("TestRpChat"));
            }
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

    (class TestRpTable extends SvGlobals.get("TestRpTableBase") { // the host's class
        static replicaClass () {
            return SvGlobals.get("TestRpTableReplica");
        }
        initPrototypeSlots () {
            {
                const slot = this.newSlot("hostDeskNote", ""); // in the host's cloud JSON, but the replica class has no such slot
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
            }
        }
    }).initThisClass();

    (class TestRpTableReplica extends SvGlobals.get("TestRpTableBase") { // the player's behavior over the same state
        initPrototypeSlots () {
            {
                const slot = this.newSlot("listChanges", 0);
                slot.setSlotType("Number");
            }
        }
        didChangeSubnodeList () {
            super.didChangeSubnodeList();
            this._listChanges = (this._listChanges || 0) + 1;
            return this;
        }
    }).initThisClass();

    (class TestRpNpc extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("name", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
            }
            {
                const slot = this.newSlot("hitPoints", 10);
                slot.setSlotType("Number");
                slot.setShouldStoreSlot(true);
                slot.setIsInCloudJson(true);
            }
            {
                const slot = this.newSlot("notes", "");
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
}

function fakeBackendOver (memoryStore) {
    return {
        callFunction: async (name, args) => {
            switch (name) {
                case "records-open": return { pool: await memoryStore.asyncOpen(args.poolId) };
                case "records-changes": return { changes: await memoryStore.asyncReadChanges(args.poolId, args.sinceVersion) };
                case "records-commit": return memoryStore.asyncCommit(args);
                default: throw new Error("fake backend: unknown function " + name);
            }
        }
    };
}

/** What the host's poolVersion notice carries: the commit's projection. */
function noticeOf (result) {
    const p = result.projection;
    return { version: p.version, baseVersion: p.baseVersion, rows: p.writes, tombstones: p.deletes };
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
    const [TestRpTable, TestRpTableReplica, TestRpNpc] = ["TestRpTable", "TestRpTableReplica", "TestRpNpc"].map(n => SvGlobals.get(n));

    const cloudMemory = SvMemoryRecordStore.clone();
    const cloud = SvCloudRecordStore.clone().setBackend(fakeBackendOver(cloudMemory));

    // --- the host ---
    const hostStore = SvLocalRecordStore.clone().useMemoryMap();
    const host = SvPersistentObjectPool.clone();
    host.setName("TestReplicaPoolHost");
    host.setRecordStore(hostStore);
    await host.promiseOpen();
    const table = host.rootOrIfAbsentFromClosure(() => TestRpTable.clone());
    table.setLabel("Round 1");
    table.setHostDeskNote("the abbot is the vampire");
    const goblin = TestRpNpc.clone(); goblin.setName("Goblin"); goblin.setNotes("carries the key");
    table.addSubnode(goblin);
    await host.commitStoreDirtyObjects();
    await cloudMemory.asyncPut([SvRecordRow.newRow({ poolId: host.poolId(), objectId: host.poolId(), ownerUid: "u1", version: 0, payloadJson: "{}" })]);
    const projectionId = "mp1:" + host.poolId();
    const projection = SvPoolProjection.clone().setPool(host).setCloudPoolId(projectionId).setCreate({ scopeId: "mp1", ownerUid: "u1" });
    let result = await host.asyncCommitToCloud(cloud, { projection });

    const hostCommit = async () => {
        await host.commitStoreDirtyObjects();
        await host.promiseCollect();
        return host.asyncCommitToCloud(cloud, { projection });
    };

    // --- the player ---
    console.log("\nA player imports the projection as a replica");
    const playerStore = SvLocalRecordStore.clone().useMemoryMap();
    playerStore.setOutlivesItsPools(true); // as in the app: closing a document's pool leaves the shared store open
    await playerStore.asyncOpenStore();
    const replica = await playerStore.asyncImportOpenedPool(await cloud.asyncOpen(projectionId), host.poolId(), { isReplica: true });
    const rTable = replica.rootObject();
    check(replica.isReplica() && rTable.thisClass() === TestRpTableReplica, "the root loads as the class's replica class (" + rTable.svType() + ")");
    const rGoblin = rTable.subnodes().at(0);
    check(rGoblin.name() === "Goblin" && rGoblin.notes() === "" && replica.replicaVersion() === 1, "it holds the projection at version 1, without the host-only notes");
    check(!JSON.stringify(await cloud.asyncOpen(projectionId)).includes("abbot"), "a slot only the host's class has is not projected (the replica could not hold it)");

    console.log("\nThe host's next commit applies to the live objects, in place");
    goblin.setHitPoints(3);
    const orc = TestRpNpc.clone(); orc.setName("Orc");
    table.addSubnode(orc);
    table.setLabel("Round 2");
    result = await hostCommit();
    let notice = noticeOf(result);
    check(replica.canApplyReplicaChangesFrom(notice.baseVersion), "the notice builds on the replica's version");
    const changesBefore = rTable._listChanges || 0;
    await replica.asyncApplyReplicaChanges(notice);
    check(rTable.subnodes().at(0) === rGoblin && rGoblin.hitPoints() === 3, "the same goblin object now has 3 hit points");
    check(rTable.label() === "Round 2" && rTable.subnodes().length === 2 && rTable.subnodes().at(1).name() === "Orc", "the label changed and the orc appeared");
    check(rTable.subnodes().at(1).parentNode() === rTable, "the new subnode's parent is the table");
    check((rTable._listChanges || 0) > changesBefore, "the table heard its subnode list change (views update)");
    check(replica.replicaVersion() === 2, "the replica is at version 2");

    console.log("\nA removal applies in place");
    table.removeSubnode(goblin);
    result = await hostCommit();
    await replica.asyncApplyReplicaChanges(noticeOf(result));
    check(rTable.subnodes().length === 1 && rTable.subnodes().at(0).name() === "Orc", "the goblin is gone from the table");
    check(!replica.activeObjectForPid(goblin.puuid()), "…and from the replica's live objects");

    console.log("\nA missed notice: the next one does not apply, and a pull catches up");
    orc.setHitPoints(7);
    await hostCommit(); // this notice is lost
    orc.setName("Orc Chief");
    result = await hostCommit();
    notice = noticeOf(result);
    check(!replica.canApplyReplicaChangesFrom(notice.baseVersion), "the notice's base (" + notice.baseVersion + ") is not the replica's version (" + replica.replicaVersion() + ")");
    const pulled = await cloud.asyncReadChanges(projectionId, replica.replicaVersion());
    await replica.asyncApplyReplicaChanges(pulled);
    const rOrc = rTable.subnodes().at(0);
    check(rOrc.name() === "Orc Chief" && rOrc.hitPoints() === 7 && replica.replicaVersion() === notice.version, "after the pull the replica has both changes, at the host's version");

    console.log("\nChat messages (a windowed collection) join and leave the loaded window");
    const rChat = rTable.chat();
    rChat.loadLatestWindowIfNoneLoaded();
    const said = SvGlobals.get("TestRpMessage").clone(); said.setText("The orc snarls.");
    table.chat().addSubnode(said);
    result = await hostCommit();
    await replica.asyncApplyReplicaChanges(noticeOf(result));
    check(rChat.subnodes().length === 1 && rChat.subnodes().at(0).text() === "The orc snarls." && rChat.subnodes().at(0).parentNode() === rChat, "a new message appears in the player's chat");
    const said2 = SvGlobals.get("TestRpMessage").clone(); said2.setText("Roll initiative.");
    table.chat().addSubnode(said2);
    result = await hostCommit();
    await replica.asyncApplyReplicaChanges(noticeOf(result));
    check(rChat.subnodes().map(m => m.text()).join(" | ") === "The orc snarls. | Roll initiative.", "the next lands after it, in order");
    check(replica.dirtyObjects().size === 0, "receiving them dirtied nothing");
    table.chat().removeSubnode(said);
    await host.asyncDeleteRecordRow(said.puuid()); // a windowed element's row goes explicitly, as a deleted chat message's does
    result = await hostCommit();
    await replica.asyncApplyReplicaChanges(noticeOf(result));
    check(rChat.subnodes().map(m => m.text()).join(" | ") === "Roll initiative.", "a removed message leaves the player's chat (" + rChat.subnodes().map(m => m.text()).join(" | ") + ")");

    console.log("\nA replica reopens as a replica");
    playerStore.closeLivePool(host.poolId());
    const reopened = playerStore.openPoolWithId(host.poolId());
    reopened.readRootObject();
    check(reopened.isReplica() && reopened.rootObject().thisClass() === TestRpTableReplica && reopened.replicaVersion() === replica.replicaVersion(), "after closing, the store opens it as a replica again, at its version (" + reopened.rootObject().svType() + ")");
    const caughtUp = await playerStore.asyncImportPoolChanges(await cloud.asyncReadChanges(projectionId, reopened.replicaVersion()), host.poolId());
    check(caughtUp.isReplica(), "and catching up from the changes keeps it one");

    console.log("\nA replica stores nothing of its own");
    rOrc.setName("renamed by the player");
    check(replica.dirtyObjects().size === 0, "a local change marks nothing dirty");
    await replica.asyncDeleteRecordRow(rOrc.puuid());
    check(!!playerStore.rowForKey(host.poolId(), rOrc.puuid()), "a local delete removes no row (a node's delete deletes its row directly)");

    await host.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
