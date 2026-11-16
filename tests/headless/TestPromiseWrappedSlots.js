#!/usr/bin/env node

"use strict";

/**
 * Headless test: promise-wrapped slots (Slot_promiseWrapper).
 *
 * A slot marked setIsPromiseWrapped(true) gets an async<Name>() getter that
 * calls asyncCompute<Name>() once and caches the value. Invariants:
 *   - the first call computes and returns the value (it used to throw: the
 *     getter never created the promise it then tried to resolve);
 *   - callers that arrive while the computation runs share it;
 *   - a failed computation rejects its callers and is NOT cached: the next
 *     call computes again (it used to return the same rejection forever);
 *   - when the slot named by setPromiseResetsOnChangeOfSlotName changes
 *     mid-computation, the waiting callers are rejected, the stale result is
 *     dropped, and the next call computes from the new value.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestPromiseWrappedSlots.js
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
const tick = () => new Promise(resolve => setTimeout(resolve, 5));

function defineTestClass () {
    (class TestPromiseWrapped extends ProtoClass {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("source", "a");
                slot.setSlotType("String");
            }
            {
                const slot = this.newSlot("derived", null);
                slot.setSlotType("String");
                slot.setIsPromiseWrapped(true);
                slot.setPromiseResetsOnChangeOfSlotName("source");
            }
            {
                const slot = this.newSlot("computeCount", 0);
                slot.setSlotType("Number");
            }
            {
                const slot = this.newSlot("failuresLeft", 0);
                slot.setSlotType("Number");
            }
        }

        async asyncComputeDerived () {
            this.setComputeCount(this.computeCount() + 1);
            const source = this.source();
            await tick();
            if (this.failuresLeft() > 0) {
                this.setFailuresLeft(this.failuresLeft() - 1);
                throw new Error("compute failed");
            }
            return source + "!";
        }
    }).initThisClass();
    return SvGlobals.get("TestPromiseWrapped");
}

async function main () {
    await boot();
    const TestPromiseWrapped = defineTestClass();

    console.log("The first call computes, and concurrent callers share one computation");
    const a = TestPromiseWrapped.clone();
    const [r1, r2] = await Promise.all([outcome(a.asyncDerived()), outcome(a.asyncDerived())]);
    check(r1.value === "a!" && r2.value === "a!", "both callers get the value (" + JSON.stringify(r1) + ")");
    check(a.computeCount() === 1, "…from one computation");
    check(a.derived() === "a!" && (await a.asyncDerived()) === "a!" && a.computeCount() === 1, "the value is cached in the slot");

    console.log("\nA failed computation is not cached");
    const b = TestPromiseWrapped.clone().setFailuresLeft(1);
    const [f1, f2] = await Promise.all([outcome(b.asyncDerived()), outcome(b.asyncDerived())]);
    check(f1.error === "compute failed" && f2.error === "compute failed", "the callers waiting on it are rejected");
    const retry = await outcome(b.asyncDerived());
    check(retry.value === "a!" && b.computeCount() === 2, "the next call computes again and succeeds (" + JSON.stringify(retry) + ")");

    console.log("\nA dependency change mid-computation drops the stale result");
    const c = TestPromiseWrapped.clone();
    const stale = outcome(c.asyncDerived());
    c.setSource("b"); // resets the wrapped promise
    const staleResult = await stale;
    check(typeof staleResult.error === "string" && /reset/.test(staleResult.error), "the waiting caller is rejected (" + JSON.stringify(staleResult) + ")");
    await tick(); await tick();
    check(c.derived() === null, "the stale computation does not set the slot");
    const fresh = await outcome(c.asyncDerived());
    check(fresh.value === "b!", "the next call computes from the new value (" + JSON.stringify(fresh) + ")");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
