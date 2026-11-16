#!/usr/bin/env node

"use strict";

/**
 * Headless test: promise-wrapped slots (Slot_promiseWrapper).
 *
 * A slot marked setIsPromiseWrapped(true) gets an async<Name>() getter that
 * calls asyncCompute<Name>() once and caches the result. Invariants:
 *   - every caller gets THE SAME promise: those that arrive while the
 *     computation runs, and those that arrive after it (the getter used to
 *     throw on its first call: it never created the promise it resolved);
 *   - a computed null is a value: it is not computed again;
 *   - a failed computation rejects its callers and is NOT cached: the next
 *     call computes again;
 *   - when the slot named by setPromiseResetsOnChangeOfSlotName changes
 *     mid-computation, nobody is rejected: the stale result is dropped and
 *     the callers already waiting get the new value from the promise they
 *     hold; a change after the computation makes the next call compute again;
 *   - a value set with the setter is the value: no computation.
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
            return source === "none" ? null : source + "!";
        }
    }).initThisClass();
    return SvGlobals.get("TestPromiseWrapped");
}

async function main () {
    await boot();
    const TestPromiseWrapped = defineTestClass();

    console.log("Every caller gets the original promise");
    const a = TestPromiseWrapped.clone();
    const first = a.asyncDerived();
    const second = a.asyncDerived();
    check(second === first, "a second caller during the computation gets the same promise");
    const [r1, r2] = await Promise.all([outcome(first), outcome(second)]);
    check(r1.value === "a!" && r2.value === "a!", "both get the value (" + JSON.stringify(r1) + ")");
    check(a.computeCount() === 1, "…from one computation");
    check(a.asyncDerived() === first, "a caller after the computation gets the same promise too");
    check(a.derived() === "a!" && (await a.asyncDerived()) === "a!" && a.computeCount() === 1, "…and the value is in the slot, computed once");

    console.log("\nA computed null is a value");
    const n = TestPromiseWrapped.clone().setSource("none");
    const nullResult = await outcome(n.asyncDerived());
    check("value" in nullResult && nullResult.value === null, "the callers get null");
    check((await n.asyncDerived()) === null && n.computeCount() === 1, "…and it is not computed again");

    console.log("\nA failed computation is not cached");
    const b = TestPromiseWrapped.clone().setFailuresLeft(1);
    const [f1, f2] = await Promise.all([outcome(b.asyncDerived()), outcome(b.asyncDerived())]);
    check(f1.error === "compute failed" && f2.error === "compute failed", "the callers waiting on it are rejected");
    const retry = await outcome(b.asyncDerived());
    check(retry.value === "a!" && b.computeCount() === 2, "the next call computes again and succeeds (" + JSON.stringify(retry) + ")");

    console.log("\nA dependency change mid-computation: the waiting callers get the new value");
    const c = TestPromiseWrapped.clone();
    const waiting = c.asyncDerived();
    c.setSource("b"); // resets the value while it is being computed
    check(c.asyncDerived() === waiting, "a caller after the change still gets the original promise");
    const waited = await outcome(waiting);
    check(waited.value === "b!", "…which resolves to the value for the new dependency, not an error (" + JSON.stringify(waited) + ")");
    await tick(); await tick();
    check(c.derived() === "b!" && c.computeCount() === 2, "the stale computation's result was dropped (slot " + c.derived() + ", " + c.computeCount() + " computations)");

    console.log("\nA dependency change after the computation: the next call computes again");
    c.setSource("c");
    check(c.derived() === null, "the value is forgotten");
    const recomputed = c.asyncDerived();
    check(recomputed !== waiting && (await recomputed) === "c!" && c.computeCount() === 3, "the next call gets a new promise for the new value");

    console.log("\nA mid-computation change whose recomputation fails rejects the waiting callers");
    const d = TestPromiseWrapped.clone();
    const dWaiting = outcome(d.asyncDerived());
    d.setFailuresLeft(2); // the stale run and the new one both fail; only the new one may speak
    d.setSource("b");
    const dResult = await dWaiting;
    check(dResult.error === "compute failed", "they are rejected once, by the latest computation (" + JSON.stringify(dResult) + ")");
    check((await d.asyncDerived()) === "b!", "…and the next call computes again");

    console.log("\nA value set with the setter is the value");
    const e = TestPromiseWrapped.clone().setDerived("given");
    check((await e.asyncDerived()) === "given" && e.computeCount() === 0, "the async getter resolves to it without computing");
    const givenPromise = e.asyncDerived();
    e.setDerived("replaced");
    const replacedPromise = e.asyncDerived();
    check(replacedPromise !== givenPromise && (await replacedPromise) === "replaced" && e.computeCount() === 0, "…and to a later one, once the setter replaces it");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
