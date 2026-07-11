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
 * Mechanism under test — two narrowly-scoped echo filters:
 *   - PER-INSTANCE: the materializing object's own didMutate is skipped
 *     (SvStorableNode.didMutate + isMaterializingLazySlot) — its state IS the
 *     stored state being written back. Deliberately per-instance so objects
 *     genuinely CREATED or changed by hooks during someone else's
 *     materialization still broadcast and get stored (a blanket time-window
 *     filter at the pool would drop them — never-stored objects have no other
 *     path into the store).
 *   - GLOBAL: Slot.isMaterializingAnyLazySlot(), a STATIC counter bracketing
 *     the setter write-back — needed because the didUpdateNode bubble reaches
 *     ANCESTORS whose per-instance flag is false. Consulted ONLY by
 *     SvSyncableJsonGroup/SvSyncableArrayNode.touchLocalModified() (loading is
 *     not a local modification; the cloud timestamp must not move). A counter
 *     because materializations can nest; single-threaded JS makes the
 *     attribution sound.
 *   - A throwing setter restores the SvStoreRef stub (catch + rethrow), so a
 *     failed materialization is retryable instead of leaving the slot
 *     permanently null.
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
        // triggers hooks (didChangeSubnodeList, subnode wiring, …) that bubble
        // a didUpdateNode on the enclosing document — which is exactly the
        // path that reaches SvSyncableJsonGroup.didUpdateNode →
        // touchLocalModified and (pre-fix) dirtied the document from a
        // materialization. The slot hook fires INSIDE the materialization
        // write-back window, like the real chain.
        didUpdateSlotSection (/*oldValue, newValue*/) {
            this.didUpdateNode();
        }
    }).initThisClass();
}

function newPool () {
    return SvGlobals.get("SvObjectPool").clone();
}

// Store the doc + section, then swap the section slot back to an SvStoreRef
// stub — the state a reloaded, not-yet-touched lazy slot is in.
function stubSectionSlot (pool, doc) {
    const SvStoreRef = SvGlobals.get("SvStoreRef");
    const section = doc.section(); // materialized instance (fresh doc)
    const ref = SvStoreRef.clone();
    ref.setPid(section.puuid());
    ref.setStore(pool);
    doc.thisPrototype().slotNamed("section").onInstanceRawSetValue(doc, ref);
    return ref;
}

// --- tests ---------------------------------------------------------------

async function testMaterializationIsStoreNeutralButUiVisible () {
    console.log("\nMaterialization: store-neutral (no dirty, no timestamp) but UI-visible (didUpdateNode bubbles)");

    const Slot = SvGlobals.get("Slot");
    const pool = newPool();
    const doc = TestLazyDocument.clone();

    // Persist doc + section so the store genuinely holds the section's record.
    pool.addActiveObject(doc);
    pool.addActiveObject(doc.section());
    pool.dirtyObjects().set(doc.puuid(), doc);
    pool.dirtyObjects().set(doc.section().puuid(), doc.section());
    await pool.commitStoreDirtyObjects();
    check(pool.dirtyObjects().size === 0, "setup: both objects stored, dirty set drained");

    // Swap the slot to a stub (simulated reload state) and set baselines.
    stubSectionSlot(pool, doc);
    doc.setLocalLastModified(12345);
    pool.dirtyObjects().clear(); // discard baseline-setting dirt; we assert deltas from here
    const timestampBaseline = doc.localLastModified();

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
    check(!(doc.thisPrototype().slotNamed("section").onInstanceRawGetValue(doc) instanceof SvGlobals.get("SvStoreRef")), "stub replaced by the real value");
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

    pool.addActiveObject(doc);
    pool.addActiveObject(doc.section());
    pool.dirtyObjects().set(doc.puuid(), doc);
    pool.dirtyObjects().set(doc.section().puuid(), doc.section());
    await pool.commitStoreDirtyObjects();

    stubSectionSlot(pool, doc);
    pool.dirtyObjects().clear();

    // Hook side effect INSIDE the write-back window: create a brand-new
    // stored object (a blanket time-window dirty filter would drop it — the
    // store has never seen it, so its didMutate is its only path to being
    // persisted).
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
    check(!pool.dirtyObjects().has(doc.puuid()), "…while the materializing doc's own write-back echo was still filtered");

    await pool.commitStoreDirtyObjects();
    check(pool.kvMap().hasKey(created.puuid()), "the new object was stored by the next commit");
}

async function testThrowingSetterRestoresStub () {
    console.log("\nA throwing setter restores the stub (failure is retryable, exception propagates)");

    const Slot = SvGlobals.get("Slot");
    const SvStoreRef = SvGlobals.get("SvStoreRef");
    const pool = newPool();
    const doc = TestLazyDocument.clone();

    pool.addActiveObject(doc);
    pool.addActiveObject(doc.section());
    pool.dirtyObjects().set(doc.puuid(), doc);
    pool.dirtyObjects().set(doc.section().puuid(), doc.section());
    await pool.commitStoreDirtyObjects();

    stubSectionSlot(pool, doc);

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
    check(doc.thisPrototype().slotNamed("section").onInstanceRawGetValue(doc) instanceof SvStoreRef, "stub RESTORED after the throw (slot not left null)");
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
    await testThrowingSetterRestoresStub();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
