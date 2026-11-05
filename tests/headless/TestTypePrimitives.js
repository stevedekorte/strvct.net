#!/usr/bin/env node

"use strict";

/**
 * Headless test: the Type primitives that persistence, serialization and
 * copying stand on (Plans/Cleanup § 2), starting with the JSON predicates.
 * isDeepJsonType used to ask whether JSON.stringify threw, so functions,
 * Maps and class instances passed as JSON, and the answer cost a full
 * serialization.
 *
 * Usage (from this directory):  node TestTypePrimitives.js
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

async function main () {
    await boot();
    const Type = SvGlobals.get("Type");
    const deep = (v) => Type.isDeepJsonType(v);

    console.log("\nJSON values pass");
    check(deep(null) && deep("s") && deep(0) && deep(true) && deep(false), "null, strings, numbers and booleans");
    check(deep([]) && deep({}) && deep([1, "a", null, { b: [true] }]), "arrays and plain objects, nested");
    check(deep(Object.create(null)), "an object with no prototype");
    check(deep({ a: undefined }) && deep([undefined]), "undefined inside (JSON drops it from an object, writes null in an array)");
    check(deep(NaN) && deep({ n: Infinity }), "non-finite numbers (JSON writes them as null)");
    check(deep({ when: new Date(0) }), "an object that serializes itself (Date's toJSON)");
    const shared = { x: 1 };
    check(deep({ a: shared, b: shared }), "the same object twice, not in a cycle");

    console.log("\nNon-JSON values fail");
    check(!deep(undefined), "undefined itself");
    check(!deep(() => 1) && !deep({ f: () => 1 }) && !deep([function () {}]), "functions, at any depth (stringify skipped them without throwing)");
    check(!deep(class Foo {}) && !deep({ c: class Bar {} }), "classes");
    check(!deep(new Map([["a", 1]])) && !deep({ m: new Set([1]) }), "Maps and Sets (stringify wrote them as {})");
    check(!deep(new (class Point { constructor () { this.x = 1; } })()), "class instances");
    check(!deep(Symbol("s")) && !deep({ s: Symbol("s") }), "symbols");
    check(!deep(BigInt(1)) && !deep([BigInt(2)]), "bigints");
    const loop = { a: {} };
    loop.a.back = loop;
    check(!deep(loop), "a cycle");
    const arrLoop = [];
    arrLoop.push(arrLoop);
    check(!deep(arrLoop), "an array that contains itself");

    console.log("\nisJsonType agrees, and isPlainObject classifies");
    check(Type.isJsonType({ a: [1] }) && !Type.isJsonType({ f: () => 1 }) && !Type.isJsonType(new Map()), "isJsonType gives the same answers");
    check(Type.isPlainObject({}) && Type.isPlainObject(Object.create(null)) && !Type.isPlainObject([]) && !Type.isPlainObject(new Date()) && !Type.isPlainObject(null), "isPlainObject: literals and null-prototype objects only");

    console.log("\nFaster than serializing (a GM request body is ~150k tokens)");
    const big = { messages: Array.from({ length: 4000 }, (_, i) => ({ role: i % 2 ? "assistant" : "user", content: "x".repeat(400) + i })) };
    const t0 = performance.now();
    for (let i = 0; i < 5; i++) { deep(big); }
    const walkMs = (performance.now() - t0) / 5;
    const t1 = performance.now();
    for (let i = 0; i < 5; i++) { JSON.stringify(big); }
    const stringifyMs = (performance.now() - t1) / 5;
    check(deep(big) && walkMs < stringifyMs * 2, "classifies a 1.6 MB body in " + walkMs.toFixed(1) + " ms (stringify: " + stringifyMs.toFixed(1) + " ms)");
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
