#!/usr/bin/env node

"use strict";

/**
 * Headless test: serialization must not mutate stored state (double-store fix).
 *
 * SvObjectPool.storeDirtyObjects() runs a synchronous pass over the dirty
 * objects: for each it adds the puuid to storingPids and serializes it via
 * recordForStore(), which invokes real slot getters. SvSyncableJsonGroup
 * touches its STORED localLastModified slot in didUpdateNode() whenever any
 * descendant bubbles an update up the parent chain. If a descendant getter
 * fires didUpdateNode() on the group mid-pass, the group is re-marked dirty;
 * on the next sweep the pool finds its puuid both in the fresh dirty map and
 * in storingPids and throws "attempt to double store". Because
 * storeDirtyObjects() had no try/finally, that throw also left storingPids set
 * forever, poisoning the pool.
 *
 * The fix:
 *   - SvObjectPool exposes a static isAnyPoolStoring() predicate, bracketed by
 *     begin/endStoringPass() around the (synchronous) store pass.
 *   - SvSyncableJsonGroup.didUpdateNode() skips touchLocalModified() while a
 *     store pass is in progress (and warns with a stack so the culprit getter
 *     is identifiable), so serialization no longer mutates stored state.
 *   - storeDirtyObjects() wraps the pass in try/finally so a throw can no
 *     longer poison the pool (storingPids is always reset).
 *
 * Commit 2 additionally guards commitStoreDirtyObjects() against re-entry so a
 * fire-and-forget second commit scheduled while the first is suspended at an
 * await cannot interleave two kvMap transactions.
 *
 * The pool is driven directly with its default synchronous SvAtomicMap kvMap;
 * the culprit getter is simulated by overriding recordForStore() on a child
 * instance to fire the mid-pass mutation through the real
 * SvSyncableJsonGroup.didUpdateNode() code path.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestStorePassMutation.js
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

// A pool with its default (synchronous) SvAtomicMap kvMap, which is open by
// default. No blob store or async open needed for these checks.
function newPool () {
    const SvObjectPool = SvGlobals.get("SvObjectPool");
    return SvObjectPool.clone();
}

// A fully-fetched syncable group standing in for a stored document root.
function makeSyncableGroup () {
    const group = SvGlobals.get("SvSyncableJsonGroup").clone();
    // fetchState defaults to "fetched"
    return group;
}

// A plain stored group whose serialization fires a caller-supplied side effect
// on a target node — the stand-in for a descendant getter that bubbles a
// didUpdateNode() up to the group while recordForStore() reads it mid-pass.
function makeSerializingChild (targetNode, sideEffectFn) {
    const child = SvGlobals.get("SvJsonGroup").clone();
    const superRecordForStore = child.recordForStore.bind(child);
    child.recordForStore = function (aStore) {
        sideEffectFn(targetNode);
        return superRecordForStore(aStore);
    };
    return child;
}

// Register both objects as active/observed, then seed the dirty bucket with the
// CHILD ordered BEFORE the group. This ordering is what reproduces the bug: the
// group is not yet in storingPids when the child's serialization touches it, so
// the re-dirty slips into the fresh dirty map and re-appears next sweep.
function primeDirty (pool, child, group) {
    pool.addActiveObject(child);
    pool.addActiveObject(group);
    pool.dirtyObjects().set(child.puuid(), child);
    pool.dirtyObjects().set(group.puuid(), group);
}

// --- tests ---------------------------------------------------------------

async function testTouchSuppressedDuringStorePass () {
    console.log("\nStore pass: a group didUpdateNode() mid-serialize does not re-dirty or throw");

    const SvObjectPool = SvGlobals.get("SvObjectPool");
    const pool = newPool();
    const group = makeSyncableGroup();
    const child = makeSerializingChild(group, (g) => g.didUpdateNode());

    group.setLocalLastModified(12345); // known baseline
    primeDirty(pool, child, group);
    const baseline = group.localLastModified();

    let threw = null;
    try {
        await pool.commitStoreDirtyObjects();
    } catch (e) {
        threw = e;
    }

    check(threw === null, "commit completed WITHOUT an 'attempt to double store' throw" + (threw ? " (threw: " + threw.message + ")" : ""));
    check(group.localLastModified() === baseline, "group localLastModified unchanged across the store pass (serialization did not mutate stored state)");
    check(pool.storingPids() === null, "pool.storingPids() === null after the pass");
    check(SvObjectPool.isAnyPoolStoring() === false, "SvObjectPool.isAnyPoolStoring() === false after the pass");
    check(pool.kvMap().hasKey(group.puuid()), "the group was actually stored");

    // Pool not poisoned: mutate the group again and commit; it stores cleanly.
    group.setCloudLastModified(99999);
    let threw2 = null;
    try {
        await pool.commitStoreDirtyObjects();
    } catch (e) {
        threw2 = e;
    }
    check(threw2 === null, "a second commit after the pass stores cleanly (pool not poisoned)");
}

async function testGenuineLoopStillTripsAndPoolRecovers () {
    console.log("\nRegression guard: a genuine mid-pass re-dirty (different stored slot) still trips the double-store guard");

    const SvObjectPool = SvGlobals.get("SvObjectPool");
    const pool = newPool();
    const group = makeSyncableGroup();
    // Mutate a DIFFERENT stored slot (cloudLastModified) mid-pass — a real
    // model change the fix does NOT suppress. The pool's loop/double-store
    // detection must still fire, proving we didn't disable it.
    let n = 0;
    const child = makeSerializingChild(group, (g) => g.setCloudLastModified(1000 + (n++)));
    primeDirty(pool, child, group);

    let threw = null;
    try {
        await pool.commitStoreDirtyObjects();
    } catch (e) {
        threw = e;
    }

    check(threw !== null && /double store/i.test(threw.message), "genuine mid-pass re-dirty still throws a double-store error");
    // try/finally hardening: even though storeObject threw, the pool's storing
    // state is cleared, so the pool is not left poisoned.
    check(pool.storingPids() === null, "storingPids reset to null even after a throw (try/finally hardening)");
    check(SvObjectPool.isAnyPoolStoring() === false, "isAnyPoolStoring() false even after a throw");
}

async function testCommitReentrancyGuard () {
    console.log("\nRe-entrancy guard: a concurrent commit does not interleave a second kvMap transaction");

    const pool = newPool();
    const group = makeSyncableGroup();
    pool.addActiveObject(group);
    pool.dirtyObjects().set(group.puuid(), group);

    const kvMap = pool.kvMap();
    let beginCount = 0;
    let commitCount = 0;
    let releaseCommit = null;
    const commitGate = new Promise((resolve) => { releaseCommit = resolve; });

    const realBegin = kvMap.promiseBegin.bind(kvMap);
    const realCommit = kvMap.promiseCommit.bind(kvMap);
    kvMap.promiseBegin = async function () {
        beginCount++;
        return realBegin();
    };
    kvMap.promiseCommit = async function () {
        commitCount++;
        if (commitCount === 1) {
            await commitGate; // hang the first commit AFTER storeDirtyObjects() has run
        }
        return realCommit();
    };

    const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

    // First commit: begins, stores the group, then suspends inside promiseCommit.
    const p1 = pool.commitStoreDirtyObjects();
    await tick();

    check(beginCount === 1, "first commit began exactly one transaction");
    check(pool._isCommitting === true, "first commit is marked in-flight");

    // A new object is dirtied while the first commit is suspended mid-transaction.
    const late = makeSyncableGroup();
    pool.addActiveObject(late);
    pool.dirtyObjects().set(late.puuid(), late);

    // Second commit attempt while the first is still in flight.
    await pool.commitStoreDirtyObjects();
    check(beginCount === 1, "second concurrent commit did NOT begin a second transaction");
    check(!kvMap.hasKey(late.puuid()), "object dirtied during the in-flight commit not yet stored");

    // Release the first commit and let it finish.
    releaseCommit();
    await p1;
    check(pool._isCommitting === false, "in-flight flag cleared after the first commit completes");

    // A follow-up commit stores the object that arrived during the in-flight commit.
    await pool.commitStoreDirtyObjects();
    check(beginCount === 2, "follow-up commit began a second transaction");
    check(kvMap.hasKey(late.puuid()), "object dirtied during the in-flight commit is stored by the follow-up commit");
}

async function main () {
    console.log("TestStorePassMutation: booting strvct…");
    await boot();

    // Isolate the pool logic from the scheduler's fire-and-forget auto-commits;
    // we drive commitStoreDirtyObjects() explicitly.
    SvGlobals.get("SvSyncScheduler").shared().pause();

    await testTouchSuppressedDuringStorePass();
    await testGenuineLoopStillTripsAndPoolRecovers();
    await testCommitReentrancyGuard();

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("BOOT FAILURE:", e);
    process.exit(1);
});
