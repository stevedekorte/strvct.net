#!/usr/bin/env node

"use strict";

/**
 * Headless test: lazy-slot materialization is store-neutral but UI-visible.
 *
 * The invariant (two-sided):
 *   - Materializing a lazy slot is NOT a mutation with respect to the STORE —
 *     the store already contains exactly the value being loaded. So it must
 *     not mark any object dirty (not the materializing object, and not an
 *     ancestor reached by the didUpdateNode bubble), and it must not touch a
 *     syncable document's localLastModified cloud timestamp (which would
 *     schedule a spurious cloud push of an unchanged document).
 *   - Materializing IS an event with respect to the UI — memory's shape
 *     changed, views must re-sync — so didUpdateNode still fires and bubbles.
 *
 * Mechanism under test — DERIVED classification plus one narrow counter:
 *   - The SvStoreRef placeholder SURVIVES to the setter write
 *     (Slot.onInstanceMaterializeLazySlot no longer pre-clears it), so
 *     didUpdateSlot receives it as oldValue. The SvStoreRef → value
 *     transition is unforgeable evidence that the write is a LOAD:
 *     SvStorableNode.didUpdateSlot skips didMutate on it, and
 *     SvNode.didUpdateSlotSubnodes skips removeMutationObserver and the
 *     store half of didChangeSubnodeList. No per-instance flags. Objects
 *     genuinely CREATED or changed by hooks during someone else's
 *     materialization emit ordinary transitions and are stored normally.
 *   - GLOBAL counter Slot.isMaterializingAnyLazySlot() remains for exactly
 *     one consumer: SvSyncableJsonGroup/SvSyncableArrayNode
 *     .touchLocalModified() — the didUpdateNode bubble carries no oldValue,
 *     so the cross-object cloud-timestamp echo can't be derived and needs
 *     time-window attribution (sound in single-threaded JS; a counter
 *     because materializations can nest).
 *   - A throwing setter needs no restore logic: the SvStoreRef was never
 *     cleared, so it is still in the slot and the next access retries.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestLazyMaterializationNeutrality.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

// Boot expects cwd to be the site root (build/_index.json lives there).
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

// --- helpers -------------------------------------------------------------

let TestLazyDocument = null;
let lastSectionHookOldValue; // captured by the test class's slot hook

// A syncable document (stand-in for UoCharacter) with one LAZY stored slot,
// mirroring how character sheet sections are declared.
function defineTestClass () {
    const SvSyncableJsonGroup = SvGlobals.get("SvSyncableJsonGroup");
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    TestLazyDocument = (class TestLazyDocument extends SvSyncableJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("section", null);
                slot.setSlotType("SvJsonGroup");
                slot.setShouldStoreSlot(true);
                slot.setAllowsNullValue(true);
                slot.setFinalInitProto(SvJsonGroup);
                slot.setIsLazy(true);
            }
        }

        // Stand-in for the production hook chain: assigning a section slot
        // triggers hooks that bubble a didUpdateNode on the enclosing
        // document — the path that reaches SvSyncableJsonGroup.didUpdateNode
        // → touchLocalModified and (pre-fix) dirtied the document from a
        // materialization. Also captures its oldValue so the test can assert
        // the derived-evidence contract: during materialization the hook
        // receives the SvStoreRef placeholder.
        didUpdateSlotSection (oldValue /*, newValue*/) {
            lastSectionHookOldValue = oldValue;
            this.didUpdateNode();
        }
    }).initThisClass();
}

function newPool () {
    return SvGlobals.get("SvObjectPool").clone();
}

// Store the doc + section, then swap the section slot back to an SvStoreRef
// placeholder — the state a reloaded, not-yet-touched lazy slot is in.
function placeStoreRefInSectionSlot (pool, doc) {
    const SvStoreRef = SvGlobals.get("SvStoreRef");
    const section = doc.section(); // materialized instance (fresh doc)
    const ref = SvStoreRef.clone();
    ref.setPid(section.puuid());
    ref.setStore(pool);
    doc.thisPrototype().slotNamed("section").onInstanceRawSetValue(doc, ref);
    return ref;
}

async function storeDocAndSection (pool, doc) {
    pool.addActiveObject(doc);
    pool.addActiveObject(doc.section());
    pool.dirtyObjects().set(doc.puuid(), doc);
    pool.dirtyObjects().set(doc.section().puuid(), doc.section());
    await pool.commitStoreDirtyObjects();
}

// --- tests ---------------------------------------------------------------

async function testMaterializationIsStoreNeutralButUiVisible () {
    console.log("\nMaterialization: store-neutral (no dirty, no timestamp) but UI-visible (didUpdateNode bubbles)");

    const Slot = SvGlobals.get("Slot");
    const SvStoreRef = SvGlobals.get("SvStoreRef");
    const pool = newPool();
    const doc = TestLazyDocument.clone();

    await storeDocAndSection(pool, doc);
    check(pool.dirtyObjects().size === 0, "setup: both objects stored, dirty set drained");

    // Swap the slot to an SvStoreRef (simulated reload state) and set baselines.
    placeStoreRefInSectionSlot(pool, doc);
    doc.setLocalLastModified(12345);
    pool.dirtyObjects().clear(); // discard baseline-setting dirt; we assert deltas from here
    const timestampBaseline = doc.localLastModified();
    lastSectionHookOldValue = undefined;

    // Spy: the UI-facing channel — didUpdateNode on the DOCUMENT (the bubble's
    // destination) must still fire during materialization.
    let docDidUpdateNodeCount = 0;
    const realDidUpdateNode = doc.didUpdateNode.bind(doc);
    doc.didUpdateNode = function () {
        docDidUpdateNodeCount++;
        return realDidUpdateNode();
    };

    // Materialize via the public getter — the real trigger path.
    const materialized = doc.section();

    check(materialized === pool.objectForPid(materialized.puuid()), "getter returned the identity-mapped section instance");
    check(!(doc.thisPrototype().slotNamed("section").onInstanceRawGetValue(doc) instanceof SvStoreRef), "SvStoreRef replaced by the real value");
    check(lastSectionHookOldValue instanceof SvStoreRef, "DERIVED evidence: the slot hook received the SvStoreRef as oldValue");
    check(pool.dirtyObjects().size === 0, "STORE-neutral: no object was marked dirty by materialization");
    check(doc.localLastModified() === timestampBaseline, "STORE-neutral: localLastModified unchanged (no spurious cloud touch)");
    check(docDidUpdateNodeCount > 0, "UI-visible: didUpdateNode bubbled to the document during materialization");
    check(Slot.isMaterializingAnyLazySlot() === false, "materialization counter back to zero");

    // A REAL change afterwards still dirties + touches normally.
    doc.setCloudLastModified(999);
    check(pool.dirtyObjects().size > 0, "control: a genuine slot change after materialization still marks dirty");
    doc.didUpdateNode();
    check(doc.localLastModified() > timestampBaseline, "control: a genuine didUpdateNode still touches localLastModified");
}

async function testNewObjectCreatedDuringMaterializationStillStores () {
    console.log("\nAn object genuinely CREATED by a hook during materialization is still dirtied and stored");

    const pool = newPool();
    const doc = TestLazyDocument.clone();

    await storeDocAndSection(pool, doc);
    placeStoreRefInSectionSlot(pool, doc);
    pool.dirtyObjects().clear();

    // Hook side effect INSIDE the write-back: create a brand-new stored
    // object. Its own transitions are ordinary (no SvStoreRef oldValue), so
    // it must be dirtied and stored — the never-stored object's didMutate is
    // its only path into the store.
    let created = null;
    const realHook = doc.didUpdateSlotSection.bind(doc);
    doc.didUpdateSlotSection = function (oldValue, newValue) {
        if (created === null) {
            created = SvGlobals.get("SvJsonGroup").clone();
            pool.addActiveObject(created);
            created.didMutate(); // genuinely new state announcing itself
        }
        return realHook(oldValue, newValue);
    };

    doc.section(); // materialize

    check(created !== null, "hook ran during materialization and created a new object");
    check(pool.dirtyObjects().has(created.puuid()), "the NEW object was marked dirty despite the materialization window");
    check(!pool.dirtyObjects().has(doc.puuid()), "…while the materializing doc's own write-back echo was still filtered (derived)");

    await pool.commitStoreDirtyObjects();
    check(pool.kvMap().hasKey(created.puuid()), "the new object was stored by the next commit");
}

async function testThrowingSetterLeavesStoreRefInPlace () {
    console.log("\nA throwing setter leaves the SvStoreRef in place (failure is retryable, exception propagates)");

    const Slot = SvGlobals.get("Slot");
    const SvStoreRef = SvGlobals.get("SvStoreRef");
    const pool = newPool();
    const doc = TestLazyDocument.clone();

    await storeDocAndSection(pool, doc);
    placeStoreRefInSectionSlot(pool, doc);

    // Sabotage the setter for one call.
    const realSetSection = doc.setSection.bind(doc);
    doc.setSection = function () {
        throw new Error("simulated setter failure");
    };

    let threw = null;
    try {
        doc.section();
    } catch (e) {
        threw = e;
    }
    check(threw !== null && /simulated setter failure/.test(threw.message), "exception propagated (not hidden)");
    check(doc.thisPrototype().slotNamed("section").onInstanceRawGetValue(doc) instanceof SvStoreRef, "SvStoreRef still in the slot after the throw (never cleared — no restore logic needed)");
    check(Slot.isMaterializingAnyLazySlot() === false, "materialization counter reset by the finally");

    // Heal the setter; the next access retries and succeeds.
    doc.setSection = realSetSection;
    const materialized = doc.section();
    check(materialized !== null && !(materialized instanceof SvStoreRef), "retry after repair materializes successfully");
}

async function main () {
    console.log("TestLazyMaterializationNeutrality: booting strvct…");
    await boot();

    // Isolate from the scheduler's fire-and-forget auto-commits; we drive
    // commitStoreDirtyObjects() explicitly.
    SvGlobals.get("SvSyncScheduler").shared().pause();

    defineTestClass();

    await testMaterializationIsStoreNeutralButUiVisible();
    await testNewObjectCreatedDuringMaterializationStillStores();
    await testThrowingSetterLeavesStoreRefInPlace();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
