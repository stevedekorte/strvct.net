#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvOptionsNode closure-backed valid-items behavior.
 *
 * Regression test for the "campaign picker shows zero options" bug: an options
 * field whose validItemsClosure reads an ASYNCHRONOUSLY-populated source (a
 * cloud-loaded catalog) used to cache the first — empty — result into
 * _validItems forever, because computedValidItems() returned the cache before
 * the closure and validItemsMatch() then stayed true. The fix makes a
 * closure-backed field re-evaluate its closure (closure-first) and compares
 * valid items STRUCTURALLY (by value/label/subtitle) so it:
 *   - self-heals once the async source populates, and
 *   - does NOT wipe-and-rebuild on every call just because the closure returns
 *     a fresh array of fresh dicts with the same values (the churn that
 *     previously forced closure re-evaluation to be disabled).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # re-index edited sources
 *   node tests/headless/TestOptionsNodeClosure.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

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

function testOptionsNodeClosure () {
    console.log("\nSvOptionsNode closure-backed valid items");

    const SvOptionsNode = SvGlobals.get("SvOptionsNode");
    check(!!SvOptionsNode, "SvOptionsNode class loaded");

    // A mutable "catalog" the closure reads — starts empty (race lost), then populates.
    let source = [];
    const opt = SvOptionsNode.clone();
    opt.setValidItemsClosure(() => source.map(c => ({ label: c.name, subtitle: c.sub || null, value: c.id })));

    // (A) Closure-first: even with a STALE cached _validItems, computedValidItems
    //     must reflect the live closure (currently empty), not the cache.
    opt.setValidItems([{ label: "STALE", subtitle: null, value: "stale" }]);
    check(opt.computedValidItems().length === 0,
        "closure-first: computedValidItems() uses the live closure (0), not the cached _validItems");

    // (B) Self-heal: stored snapshot is the empty first-build result; the async
    //     source then populates. computedValidItems re-evaluates to 2, and
    //     validItemsMatch() is FALSE → setupSubnodes() would rebuild.
    opt.setValidItems([]);
    source = [{ name: "Crypt of Alatar", id: "LAsvCj5Qki" }, { name: "The Eternal Arena", id: "L3NPPerE9K" }];
    check(opt.computedValidItems().length === 2,
        "closure re-evaluates to 2 items once the async source populates");
    check(opt.validItemsMatch() === false,
        "validItemsMatch() is FALSE when stored=[] but closure now returns 2 (drives the self-heal rebuild)");

    // (C) No churn: after a build the stored snapshot equals the current values,
    //     but the closure returns a FRESH array each call. validItemsMatch() must
    //     still be true (structural compare), so the option column is NOT torn down
    //     on every didUpdateNode bubble.
    opt.setValidItems(source.map(c => ({ label: c.name, subtitle: null, value: c.id })));
    const a1 = opt.computedValidItems();
    const a2 = opt.computedValidItems();
    check(a1 !== a2, "closure returns a FRESH array instance on each call (identity differs)");
    check(opt.validItemsMatch() === true,
        "validItemsMatch() is TRUE for fresh arrays with equal values (no rebuild churn)");

    // (D) Real change detected: a value actually changing flips validItemsMatch false.
    source = [{ name: "Crypt of Alatar", id: "LAsvCj5Qki" }]; // one removed
    check(opt.validItemsMatch() === false,
        "validItemsMatch() is FALSE when the underlying values actually change");

    // (E) A label/subtitle change (same value) is also detected.
    source = [{ name: "Crypt of Alatar", id: "LAsvCj5Qki" }, { name: "Arena RENAMED", id: "L3NPPerE9K" }];
    opt.setValidItems([{ label: "Crypt of Alatar", subtitle: null, value: "LAsvCj5Qki" }, { label: "The Eternal Arena", subtitle: null, value: "L3NPPerE9K" }]);
    check(opt.validItemsMatch() === false,
        "validItemsMatch() is FALSE when a label changes even though values are identical");

    // (F) Static (no-closure) fields are unaffected by the change.
    const opt2 = SvOptionsNode.clone();
    opt2.setValidItems([{ label: "A", subtitle: null, value: "a" }, { label: "B", subtitle: null, value: "b" }]);
    check(opt2.computedValidItems().length === 2,
        "no-closure field still computes items from static validItems()");
    check(opt2.validItemsMatch() === true,
        "no-closure field validItemsMatch() is TRUE (same stored array reference)");
}

async function main () {
    console.log("Booting strvct standalone (headless)...");
    await boot();
    console.log("Boot complete.");

    testOptionsNodeClosure();

    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
