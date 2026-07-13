#!/usr/bin/env node

"use strict";

/**
 * Headless test: an object mutated DURING the store pass no longer aborts the
 * commit ("attempt to double store <id>") — it is tripwire-logged with the
 * mutation-time stack and re-queued so the NEXT commit stores the fresh state.
 *
 * Two paths, matching the two detection points in SvObjectPool:
 *   1. Mutated AFTER its own store turn (addDirtyObject sees the pid in
 *      storingPids → defers immediately).
 *   2. Mutated BEFORE its own store turn but after entering the pass's bucket
 *      (addDirtyObject can't flag it; the loop guard finds the pid already in
 *      storingPids on the next loop → defers with the stack captured at
 *      mutation time).
 * Plus: forceAddDirtyObject's old silent skip of already-stored objects is now
 * the same defer (the skip dropped the change, leaving a stale record).
 *
 * Mutating during a store pass is still a defect to hunt at its source — the
 * TRIPWIRE console.error (which reaches error reports) carries the culprit's
 * stack. This test asserts the failure containment, not the culprits.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestMidStoreMutationDefer.js
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

function newPool () {
    return SvGlobals.get("SvObjectPool").clone();
}

function newStoredDoc (pool) {
    const doc = SvGlobals.get("SvSyncableJsonGroup").clone();
    pool.addActiveObject(doc);
    pool.dirtyObjects().set(doc.puuid(), doc);
    return doc;
}

// Wrap console.error to capture tripwire lines for the duration of fn.
async function captureTripwires (fn) {
    const tripwires = [];
    const realError = console.error;
    console.error = function (...args) {
        const line = args.join(" ");
        if (line.includes("TRIPWIRE")) {
            tripwires.push(line);
            return; // keep the test output readable
        }
        return realError.apply(console, args);
    };
    try {
        await fn();
    } finally {
        console.error = realError;
    }
    return tripwires;
}

// Make storing `mutator` set cloudLastModified on `victim` — a genuine write
// to a stored slot, mid-pass, from inside the store walk.
function sabotageStoreToMutate (mutator, victim, value) {
    const realFn = mutator.thisClass().prototype.recordForStore;
    mutator.recordForStore = function (aStore) {
        victim.setCloudLastModified(value);
        return realFn.call(this, aStore);
    };
}

// Records serialize slots as an entries array: { type, entries: [[k, v]…], id }
function storedSlotValue (pool, pid, slotName) {
    const record = pool.recordForPid(pid);
    if (!record || !record.entries) {
        return undefined;
    }
    const entry = record.entries.find(e => e[0] === slotName);
    return entry ? entry[1] : undefined;
}

// --- tests ---------------------------------------------------------------

async function testMutatedAfterItsStoreTurn () {
    console.log("\nPath 1: object mutated AFTER its store turn — deferred, next commit stores the fresh state");

    const pool = newPool();
    const victim = newStoredDoc(pool);  // inserted first → stored first
    const mutator = newStoredDoc(pool); // its serialization mutates victim

    sabotageStoreToMutate(mutator, victim, 777);

    let threw = null;
    const tripwires = await captureTripwires(async () => {
        try {
            await pool.commitStoreDirtyObjects();
        } catch (e) {
            threw = e;
        }
    });

    check(threw === null, "commit completed without the double-store throw");
    check(tripwires.length === 1, "exactly one TRIPWIRE logged");
    check(tripwires.length > 0 && tripwires[0].includes("SvSyncableJsonGroup"), "tripwire names the mutated object's type");
    check(tripwires.length > 0 && tripwires[0].includes("TestMidStoreMutationDefer"), "tripwire carries the mutation-time stack (names the culprit frame)");
    check(pool.dirtyObjects().has(victim.puuid()), "mutated object re-queued for the next commit");
    check(storedSlotValue(pool, victim.puuid(), "cloudLastModified") === null, "this pass's record is stale (pre-mutation) — the defer exists precisely because of this");

    await pool.commitStoreDirtyObjects();
    check(storedSlotValue(pool, victim.puuid(), "cloudLastModified") === 777, "next commit stored the fresh (post-mutation) state");
    check(pool.dirtyObjects().size === 0, "no residual dirt after the follow-up commit");
}

async function testMutatedBeforeItsStoreTurn () {
    console.log("\nPath 2: object mutated before its store turn (same bucket) — loop guard defers instead of throwing");

    const pool = newPool();
    const mutator = newStoredDoc(pool); // inserted first → stored first
    const victim = newStoredDoc(pool);  // mutated during mutator's store, then stored in the same bucket

    sabotageStoreToMutate(mutator, victim, 888);

    let threw = null;
    const tripwires = await captureTripwires(async () => {
        try {
            await pool.commitStoreDirtyObjects();
        } catch (e) {
            threw = e;
        }
    });

    check(threw === null, "commit completed without the double-store throw");
    check(tripwires.length === 1, "exactly one TRIPWIRE logged");
    check(tripwires.length > 0 && tripwires[0].includes("TestMidStoreMutationDefer"), "loop-guard tripwire still carries the mutation-time stack (captured at add time)");
    check(storedSlotValue(pool, victim.puuid(), "cloudLastModified") === 888, "victim's stored record has the mutation (it stored after being mutated)");

    await pool.commitStoreDirtyObjects(); // drains the deferred re-queue (same value — harmless)
    check(pool.dirtyObjects().size === 0, "no residual dirt after the follow-up commit");
}

async function testSelfMutatingSerializerGivesUpAfterCap () {
    console.log("\nPathology: a serializer that mutates its OWN stored slots re-defers, then gives up after the cap (no endless commit loop)");

    const pool = newPool();
    const doc = newStoredDoc(pool);
    const realFn = doc.thisClass().prototype.recordForStore;
    doc.recordForStore = function (aStore) {
        doc.setCloudLastModified((doc.cloudLastModified() || 0) + 1); // mutates itself on every serialization
        return realFn.call(this, aStore);
    };

    let commits = 0;
    const tripwires = await captureTripwires(async () => {
        while (pool.dirtyObjects().size > 0 && commits < 10) {
            await pool.commitStoreDirtyObjects();
            commits++;
        }
    });

    check(commits < 10, "commit cycle terminated (" + commits + " commits) instead of looping forever");
    check(pool.dirtyObjects().size === 0, "no dirt left after giving up");
    check(tripwires.some(t => t.includes("giving up")), "the final tripwire says it gave up on the self-mutator");
}

async function main () {
    console.log("TestMidStoreMutationDefer: booting strvct…");
    await boot();

    // Isolate from the scheduler's fire-and-forget auto-commits; we drive
    // commitStoreDirtyObjects() explicitly.
    SvGlobals.get("SvSyncScheduler").shared().pause();

    await testMutatedAfterItsStoreTurn();
    await testMutatedBeforeItsStoreTurn();
    await testSelfMutatingSerializerGivesUpAfterCap();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
