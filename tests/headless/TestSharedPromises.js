#!/usr/bin/env node

"use strict";

/**
 * Headless test: Object_sharedPromises — async work several callers may ask
 * for at once.
 *
 *   sharedPromiseNamed    ONCE: one run for the life of the object; every
 *                         caller gets its promise; a failure is forgotten.
 *   inFlightPromiseNamed  ONE AT A TIME: callers share the run in flight; the
 *                         next call after it settles runs again.
 *   freshPromiseNamed     FRESH: a caller that arrives mid-run is promised the
 *                         next run, which all such callers share.
 *
 * Also: a failure before the function's first await is forgotten like any
 * other (the hand-written versions cached it forever); forgetting a run in
 * flight means it can no longer clear a newer one, and it can tell
 * (run.isCurrent()); a failed run rejects only the promise its callers hold;
 * classes keep their own runs.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestSharedPromises.js
 * (rebuild the index first if sources changed: node source/boot/index-builder/ImportsIndexer.js)
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let pass = 0, fail = 0;
const check = (c, m) => {
    if (c) {
        pass++;
        console.log("  \x1b[32m✓\x1b[0m " + m);
    } else {
        fail++;
        console.log("  \x1b[31m✗\x1b[0m " + m);
    }
};

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

const outcome = (promise) => promise.then(v => ({ value: v }), e => ({ error: e.message }));
const tick = (ms = 5) => new Promise(resolve => setTimeout(resolve, ms));

/** A piece of work that counts its runs and can be told to fail. */
function newWork () {
    const work = { runs: 0, failures: 0, value: "v" };
    work.fn = async () => {
        const n = ++work.runs;
        const value = work.value;
        await tick();
        if (work.failures > 0) {
            work.failures--;
            throw new Error("failed run " + n);
        }
        return value + n;
    };
    return work;
}

async function testOnce () {
    console.log("ONCE (sharedPromiseNamed)");
    const o = {};
    const work = newWork();
    const first = o.sharedPromiseNamed("load", work.fn);
    check(o.sharedPromiseNamed("load", work.fn) === first, "a caller during the run gets the same promise");
    check((await first) === "v1" && o.sharedPromiseNamed("load", work.fn) === first && work.runs === 1, "…and so does a caller after it: one run");

    const failing = newWork();
    failing.failures = 1;
    const [a, b] = await Promise.all([outcome(o.sharedPromiseNamed("flaky", failing.fn)), outcome(o.sharedPromiseNamed("flaky", failing.fn))]);
    check(a.error === "failed run 1" && b.error === "failed run 1", "a failure rejects the callers waiting on it");
    check((await o.sharedPromiseNamed("flaky", failing.fn)) === "v2", "…and is forgotten: the next call runs again");

    let syncRuns = 0;
    const throwsFirst = () => {
        if (++syncRuns === 1) {
            throw new Error("threw before any await");
        }
        return "ok";
    };
    const early = await outcome(o.sharedPromiseNamed("early", throwsFirst));
    check(early.error === "threw before any await", "a throw before the first await rejects the promise");
    check((await o.sharedPromiseNamed("early", throwsFirst)) === "ok", "…and is forgotten too");
}

async function testInFlight () {
    console.log("\nONE AT A TIME (inFlightPromiseNamed)");
    const o = {};
    const work = newWork();
    const first = o.inFlightPromiseNamed("read", work.fn);
    check(o.inFlightPromiseNamed("read", work.fn) === first && o.hasSharedPromiseNamed("read"), "a caller during the run shares it");
    check((await first) === "v1" && !o.hasSharedPromiseNamed("read"), "the run is forgotten when it settles");
    check((await o.inFlightPromiseNamed("read", work.fn)) === "v2", "the next call runs again");
    work.failures = 1;
    check((await outcome(o.inFlightPromiseNamed("read", work.fn))).error === "failed run 3" && !o.hasSharedPromiseNamed("read"), "a failed run is forgotten as well");
}

async function testFresh () {
    console.log("\nFRESH (freshPromiseNamed)");
    const o = {};
    const work = newWork();
    const first = o.freshPromiseNamed("update", work.fn);
    work.value = "w"; // what the work reads changes after the first run started
    const second = o.freshPromiseNamed("update", work.fn);
    const third = o.freshPromiseNamed("update", work.fn);
    check(second !== first && third === second, "callers that arrive mid-run share the next run, not the one in flight");
    check((await first) === "v1" && (await second) === "w2" && work.runs === 2, "the next run starts after the first ends and sees the change (" + work.runs + " runs)");
    check((await o.freshPromiseNamed("update", work.fn)) === "w3", "with nothing in flight, a call runs at once");

    const failing = newWork();
    failing.failures = 1;
    const doomed = outcome(o.freshPromiseNamed("refresh", failing.fn));
    const after = o.freshPromiseNamed("refresh", failing.fn);
    check((await doomed).error === "failed run 1" && (await after) === "v2", "a failed run still lets the queued one run");
}

async function testForget () {
    console.log("\nForgetting a run in flight");
    const o = {};
    const seen = [];
    const fn = async (run) => {
        await tick(10);
        seen.push(run.isCurrent());
        if (!run.isCurrent()) {
            throw new Error("abandoned");
        }
        return "kept";
    };
    const abandoned = outcome(o.sharedPromiseNamed("join", fn));
    o.forgetSharedPromiseNamed("join");
    check(!o.hasSharedPromiseNamed("join"), "the work is no longer under way");
    const newer = o.sharedPromiseNamed("join", fn);
    check((await abandoned).error === "abandoned" && seen[0] === false, "the abandoned run can tell (run.isCurrent() is false)");
    check(o.sharedPromiseNamed("join", fn) === newer, "…and its failure does not clear the newer run");
    check((await newer) === "kept" && seen[1] === true, "the newer run is current and completes");
}

async function testClasses () {
    console.log("\nClasses keep their own runs");
    class Base {
        static load () {
            return this.sharedPromiseNamed("load", async () => this.name);
        }
    }
    class Derived extends Base {}
    check((await Base.load()) === "Base" && (await Derived.load()) === "Derived", "a subclass does not share its superclass's run");
    check(Base.load() === Base.load(), "…and each class has one");
    check(Object.keys({ a: 1 }.sharedPromiseNamed ? { a: 1 } : {}).join() === "a" && !Object.keys(Base).includes("_sharedPromiseRunsMap"), "the bookkeeping is not enumerable");
}

async function main () {
    await boot();
    const unhandled = [];
    process.on("unhandledRejection", (e) => unhandled.push(e));
    await testOnce();
    await testInFlight();
    await testFresh();
    await testForget();
    await testClasses();
    await tick(20);
    console.log("\nNo stray rejections");
    check(unhandled.length === 0, "every rejection went to a caller (" + unhandled.length + " unhandled)");
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
