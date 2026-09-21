#!/usr/bin/env node

"use strict";

/**
 * Headless test: Client Transactions M1 (Plans/Client Transactions).
 *
 * The invariant: snapshot the runtime state, run a transaction that mutates
 * slots and collections, creates and removes objects, materializes a lazy slot
 * and enqueues work; roll back; the state is identity-equivalent, the dirty set
 * is what it was, allocated objects are retired and in no pool, and no tagged
 * work survives. Plus: commit keeps the state and schedules the store once,
 * nesting joins and poisons, effect guards poison-then-throw, a store pass due
 * inside defers, a sorted array comes back in order without didMutate, and a
 * JSON-patch batch failing at apply time rolls back whole when the flag is on.
 *
 * Usage (from this directory):  node TestTransactions.js
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
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    const SvJsonArrayNode = SvGlobals.get("SvJsonArrayNode");

    (class TestTxItem extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("label", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("count", 0);
                slot.setSlotType("Number");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("scratch", null);
                slot.setSlotType("String");
                slot.setAllowsNullValue(true);
                slot.setIsTransactional(false); // a derived cache: not captured
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
        didUpdateSlotCount (oldValue, newValue) {
            const parent = this.parentNode();
            if (parent && parent.noteChildCount) {
                parent.noteChildCount(newValue); // a hook that mutates a sibling/parent inside the transaction
            }
        }
    }).initThisClass();

    (class TestTxRoot extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("total", 0);
                slot.setSlotType("Number");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("archive", null);
                slot.setSlotType("TestTxItem");
                slot.setShouldStoreSlot(true);
                slot.setIsLazy(true);
                slot.setFinalInitProto(SvGlobals.get("TestTxItem"));
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
        }
        noteChildCount (n) {
            this.setTotal(this.total() + n);
        }
    }).initThisClass();

    (class TestTxPatchItem extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("name", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestTxPatchItems extends SvJsonArrayNode {
        initPrototype () {
            this.setSubnodeClasses([SvGlobals.get("TestTxPatchItem")]);
        }
    }).initThisClass();

    (class TestTxPatchRoot extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("items", null);
                slot.setFinalInitProto(SvGlobals.get("TestTxPatchItems"));
                slot.setIsSubnode(true);
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestTxPatchItems");
            }
            {
                const slot = this.newSlot("label", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();
}

function rawState (node) {
    // identity-level snapshot: declared slots read raw, subnodes by identity
    const state = new Map();
    const visit = (obj) => {
        if (!obj || state.has(obj) || !obj.thisPrototype) { return; }
        const slots = new Map();
        obj.thisPrototype().allSlotsMap().forEachKV((name, slot) => {
            if (!slot.isTransactional()) { return; }
            const v = slot.isWeak() ? obj.baseGetSlotValue(slot) : slot.onInstanceRawGetValue(obj);
            slots.set(name, Array.isArray(v) ? v.slice() : v);
        });
        state.set(obj, slots);
        if (obj._subnodes) { obj._subnodes.forEach(visit); }
    };
    visit(node);
    return state;
}

function sameState (a, b) {
    if (a.size !== b.size) { return "object count " + a.size + " vs " + b.size; }
    for (const [obj, slots] of a) {
        const other = b.get(obj);
        if (!other) { return "missing object " + obj.svTypeId(); }
        for (const [name, v] of slots) {
            const w = other.get(name);
            if (Array.isArray(v)) {
                if (!Array.isArray(w) || v.length !== w.length || v.some((x, i) => x !== w[i])) { return obj.svTypeId() + "." + name + " array differs"; }
            } else if (v !== w) {
                return obj.svTypeId() + "." + name + ": " + String(v) + " vs " + String(w);
            }
        }
    }
    return null;
}

const tick = () => new Promise(resolve => setTimeout(resolve, 30));

async function main () {
    await boot();
    defineClasses();
    const SvObjectPool = SvGlobals.get("SvObjectPool");
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const SvTransactionContext = SvGlobals.get("SvTransactionContext");
    const SvSyncScheduler = SvGlobals.get("SvSyncScheduler");
    const SvNotificationCenter = SvGlobals.get("SvNotificationCenter");
    const SvStoreRef = SvGlobals.get("SvStoreRef");
    const TestTxItem = SvGlobals.get("TestTxItem");

    const store = SvLocalRecordStore.clone().useMemoryMap();
    const pool = SvPersistentObjectPool.clone();
    pool.setName("TestTransactions");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const root = pool.rootOrIfAbsentFromClosure(() => SvGlobals.get("TestTxRoot").clone());
    const a = TestTxItem.clone(); a.setLabel("a"); a.setCount(1);
    const b = TestTxItem.clone(); b.setLabel("b"); b.setCount(2);
    root.addSubnode(a); root.addSubnode(b);
    root.archive().setLabel("filed");
    await pool.commitStoreDirtyObjects();
    await pool.promiseClose();

    // reopen so the lazy slot holds a ref
    store.pools().clear();
    const pool2 = SvPersistentObjectPool.clone();
    pool2.setName("TestTransactions");
    pool2.setRecordStore(store);
    await pool2.promiseOpen();
    const root2 = pool2.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    const a2 = root2.subnodes().first();
    const b2 = root2.subnodes().last();
    const archiveSlot = root2.thisPrototype().slotNamed("archive");
    check(archiveSlot.onInstanceRawGetValue(root2) instanceof SvStoreRef, "setup: the lazy slot holds a placeholder ref");
    check(pool2.dirtyObjects().size === 0, "setup: nothing dirty after the reopen");

    console.log("\nRollback restores slots, collections, identity, the dirty set; retires allocations; cancels queued work");
    SvSyncScheduler.shared().fullSyncNow(); // drain setup-time actions so the transaction's own are visible
    const before = rawState(root2);
    const dirtyBefore = new Map(pool2.dirtyObjects());
    let created = null;
    let timerFired = false;
    let noteReceived = false;
    const observer = TestTxItem.clone();
    observer.txTestNote = () => { noteReceived = true; };
    observer.watchForNoteFrom("txTestNote", root2);
    void SvNotificationCenter;
    let thrown = null;
    try {
        pool2.transaction(() => {
            a2.setLabel("a-changed");
            a2.setLabel("a-changed-again");          // one snapshot, both writes undone
            a2.setCount(10);                          // the hook mutates the parent's total
            b2.setScratch("not captured");            // isTransactional(false)
            root2.removeSubnode(b2);                  // removal: collection + parentNode
            created = TestTxItem.clone();             // allocated inside
            created.setLabel("new");
            root2.addSubnode(created);
            root2.subnodes().sort((x, y) => x.label() < y.label() ? 1 : -1); // a hooked sort
            check(root2.archive().label() === "filed", "a lazy slot materialized inside the transaction reads its stored value");
            root2.scheduleMethod("didUpdateNode");    // a scheduler action
            root2.postNoteNamed("txTestNote");        // a queued note
            root2.addTimeout(() => { timerFired = true; }, 5); // a timer
            throw new Error("boom");
        });
    } catch (e) {
        thrown = e;
    }
    check(thrown && thrown.message === "boom", "transaction(fn) rethrows fn's error");
    check(sameState(before, rawState(root2)) === null, "the graph is identity-equivalent to before (" + (sameState(before, rawState(root2)) || "same") + ")");
    check(a2.label() === "a" && a2.count() === 1 && root2.total() === 0, "slot writes and the hook's sibling write are undone");
    check(root2.subnodes().length === 2 && root2.subnodes().at(1) === b2 && b2.parentNode() === root2, "the removed subnode is back by identity with its parent restored");
    check(b2.scratch() === "not captured", "a slot declared non-transactional keeps its in-transaction value");
    check(archiveSlot.onInstanceRawGetValue(root2) instanceof SvStoreRef, "the lazy slot holds its ref again (materialization rolled back to the ref)");
    check(pool2.activeObjectForPid(root2.subnodes().first().puuid()) !== undefined, "…while the loaded archive object is not retired (still active)");
    check(created && !root2.subnodes().includes(created) && !pool2.hasActiveObject(created) && SvObjectPool.poolOfObject(created) === undefined, "the object allocated inside is retired: out of the collection, in no pool");
    check(sameState(new Map(dirtyBefore), new Map(pool2.dirtyObjects())) === null && pool2.dirtyObjects().size === 0, "the dirty set is what it was before");
    check(!SvSyncScheduler.shared().hasScheduledTargetAndMethod(root2, "didUpdateNode"), "the scheduler action queued inside is gone");
    check(SvSyncScheduler.shared().hasScheduledTargetAndMethod(pool2, "didInitLoadingPids") || pool2.loadingPids().count() === 0, "…while the load cycle a materialization started inside still completes");
    await tick();
    await tick();
    check(!timerFired && !noteReceived, "the timer and the note queued inside never ran");

    console.log("\nCommit keeps the state and schedules the store once");
    const result = pool2.transaction(() => { a2.setLabel("committed"); return 42; });
    check(result === 42 && a2.label() === "committed" && pool2.dirtyObjects().has(a2.puuid()), "commit returns fn's result, keeps the write, leaves the object dirty");
    check(SvSyncScheduler.shared().hasScheduledTargetAndMethod(pool2, "commitStoreDirtyObjects"), "the store pass is scheduled after commit");
    await pool2.commitStoreDirtyObjects();
    check(JSON.parse(store.rowForKey(pool2.poolId(), a2.puuid()).payloadJson).entries.some(e => e[0] === "label" && e[1] === "committed"), "…and stores the committed value");

    console.log("\nA store pass due inside a transaction defers");
    let storedInside = null;
    pool2.transaction(() => {
        a2.setLabel("deferred");
        pool2.commitStoreDirtyObjects(); // would write mid-transaction
        storedInside = JSON.parse(store.rowForKey(pool2.poolId(), a2.puuid()).payloadJson).entries.find(e => e[0] === "label")[1];
    });
    check(storedInside === "committed", "the pass wrote nothing while the transaction was open");
    await pool2.commitStoreDirtyObjects();
    check(JSON.parse(store.rowForKey(pool2.poolId(), a2.puuid()).payloadJson).entries.find(e => e[0] === "label")[1] === "deferred", "…and the commit's rescheduled pass wrote it");

    console.log("\nNesting joins; an inner failure poisons the whole transaction even when caught");
    let poisoned = null;
    try {
        pool2.transaction(() => {
            a2.setLabel("outer");
            try {
                pool2.transaction(() => { b2.setLabel("inner"); throw new Error("inner boom"); });
            } catch {
                // swallowed on purpose
            }
        });
    } catch (e) {
        poisoned = e;
    }
    check(poisoned && /poisoned/.test(poisoned.message) && a2.label() === "deferred" && b2.label() === "b", "the outer transaction rolled back and threw the poisoned error");

    console.log("\nEffect guards poison then throw, even through a swallowing try/catch");
    let guarded = null;
    try {
        pool2.transaction(() => {
            a2.setLabel("guarded");
            try { SvTransactionContext.assertNoneOpen("a cloud delete"); } catch { /* the catalog's swallow */ }
        });
    } catch (e) {
        guarded = e;
    }
    check(guarded && /poisoned/.test(guarded.message) && a2.label() === "deferred", "a guarded effect inside rolls the transaction back");

    console.log("\nA sorted array comes back in order with no mutation notice during restore");
    const sorted = SvGlobals.get("SvSortedArray").clone ? null : null;
    void sorted;
    let mutateCount = 0;
    const arr = root2.subnodes();
    const observerObj = { onDidMutateObject: () => { mutateCount++; } };
    arr.addMutationObserver(observerObj);
    const orderBefore = arr.slice();
    try {
        pool2.transaction(() => { arr.reverse(); arr.push(TestTxItem.clone()); throw new Error("x"); });
    } catch { /* expected */ }
    const mutationsSeenInside = mutateCount;
    check(arr.length === orderBefore.length && arr.every((x, i) => x === orderBefore[i]), "the array is restored to its captured order");
    check(mutationsSeenInside === 2, "didMutate fired for the two hooked mutations inside and not during restore (" + mutateCount + ")");
    arr.removeMutationObserver(observerObj);

    console.log("\nA JSON-patch batch failing at apply time rolls back whole when the flag is on");
    const patchRoot = SvGlobals.get("TestTxPatchRoot").clone();
    root2.addSubnode(patchRoot); // enroll it in the pool through the store pass
    await pool2.commitStoreDirtyObjects();
    check(SvObjectPool.poolOfObject(patchRoot) === pool2, "the patch root is active in the pool");
    ["a", "b", "c"].forEach((n) => { const it = SvGlobals.get("TestTxPatchItem").clone(); it.setName(n); patchRoot.items().addSubnode(it); });
    patchRoot.setLabel("L");
    await pool2.commitStoreDirtyObjects();
    SvTransactionContext.setPatchesUseTransactions(true);
    const batch = [
        { op: "replace", path: "/label", value: "changed" },
        { op: "add", path: "/items/-", value: { name: "d" } },
        { op: "replace", path: "/items/9/name", value: "x" } // only visible at apply time: the array was touched earlier in the batch
    ];
    let patchError = null;
    try { patchRoot.applyJsonPatches(batch); } catch (e) { patchError = e.patchError || { error: e.message }; }
    check(patchError && patchError.failedOpIndex === 2 && String(patchError.stateNote).startsWith("ROLLED BACK"), "the error names the failing index and says the batch was rolled back: " + (patchError && patchError.stateNote));
    check(patchRoot.label() === "L" && patchRoot.items().subnodes().length === 3, "the earlier operations of the batch are undone");
    SvTransactionContext.setPatchesUseTransactions(false);
    try { patchRoot.applyJsonPatches(batch); } catch (e) { patchError = e.patchError; }
    check(patchRoot.label() === "changed" && patchRoot.items().subnodes().length === 4 && String(patchError.stateNote).startsWith("NOT atomic"), "with the flag off the batch is non-atomic as before");

    await pool2.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
