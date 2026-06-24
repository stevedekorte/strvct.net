#!/usr/bin/env node

"use strict";

/**
 * Headless test: stable-id JSON-patch addressing for arrays.
 *
 * Verifies that SvJsonArrayNode JSON-patch operations address items by their
 * stable jsonId (not by positional index): resolve/replace/remove by id,
 * append (`/-`) mints a fresh unique id, and — the core safety property — a
 * path derived earlier still resolves to the same item after the array is
 * reordered (so a projection that prunes/reorders never desyncs a write).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if build/_index.json is stale
 *   node tests/headless/TestStableIdPatch.js
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

function idsOf (arr) {
    return arr.subnodes().map(sn => sn.jsonId());
}

const ITEM = { _type: "SvJsonGroup" }; // a minimal JSON item (carries a server-minted jsonId)

function testStableIdAddressing () {
    console.log("\nStable-id JSON-patch addressing (SvJsonArrayNode)");

    const SvJsonArrayNode = SvGlobals.get("SvJsonArrayNode");
    check(!!SvJsonArrayNode, "SvJsonArrayNode class loaded");

    const arr = SvJsonArrayNode.clone();
    arr.setJson([{ ...ITEM }, { ...ITEM }, { ...ITEM }]);
    check(arr.subnodes().length === 3, "array has 3 items after setJson");

    const ids = idsOf(arr);
    check(ids.every(id => typeof id === "string" && id.length > 0) && new Set(ids).size === 3,
        "each item has a distinct stable jsonId: " + JSON.stringify(ids));
    const [idA, idB, idC] = ids;

    const nodeB = arr.subnodeForJsonId(idB);
    check(!!nodeB && nodeB.jsonId() === idB, "subnodeForJsonId(idB) resolves the right item");

    // append mints a fresh unique id
    arr.applyPatch({ op: "add", path: "/-", value: { ...ITEM } });
    check(arr.subnodes().length === 4, "add '/-' appended a 4th item");
    const idsAfterAdd = idsOf(arr);
    const addedId = idsAfterAdd.find(id => ![idA, idB, idC].includes(id));
    check(!!addedId && new Set(idsAfterAdd).size === 4, "appended item got a fresh, unique jsonId");

    // THE safety property: reorder the array, then an earlier-derived id still resolves to the SAME node
    const posBefore = idsOf(arr).indexOf(idB);
    arr.applyPatch({ op: "remove", path: "/" + idA });                 // drop the front item
    arr.applyPatch({ op: "add", path: "/-", value: { ...ITEM } });     // re-append (shifts positions)
    const posAfter = idsOf(arr).indexOf(idB);
    check(arr.subnodeForJsonId(idB) === nodeB,
        `id-addressing SURVIVES REORDER: idB resolves to the SAME node object after the array shifted (pos ${posBefore} → ${posAfter})`);

    // remove by id
    arr.applyPatch({ op: "remove", path: "/" + idC });
    check(!arr.subnodeForJsonId(idC), "remove-by-id removed the item");

    // replace by id preserves the id and swaps in a new node
    arr.applyPatch({ op: "replace", path: "/" + idB, value: { ...ITEM } });
    const nodeBafter = arr.subnodeForJsonId(idB);
    check(!!nodeBafter && nodeBafter.jsonId() === idB, "replace-by-id preserved the item's jsonId");
    check(nodeBafter !== nodeB, "replace swapped in a new node at the same id");

    // unknown id -> clear error
    let msg = "";
    try { arr.applyPatch({ op: "replace", path: "/no-such-id", value: { ...ITEM } }); }
    catch (e) { msg = e.message || ""; }
    check(/no array item with jsonId/i.test(msg), "replace with unknown jsonId throws a clear error");

    // numeric index path no longer resolves (positional addressing retired)
    msg = "";
    try { arr.applyPatch({ op: "replace", path: "/0", value: { ...ITEM } }); }
    catch (e) { msg = e.message || ""; }
    check(/no array item with jsonId/i.test(msg), "numeric index '/0' is rejected (positional addressing retired)");

    // add ignores a client-supplied jsonId (server mints fresh; no collision)
    const countBefore = arr.subnodes().length;
    arr.applyPatch({ op: "add", path: "/-", value: { ...ITEM, jsonId: idB } });
    const newest = arr.subnodes().last();
    check(arr.subnodes().length === countBefore + 1 && newest.jsonId() !== idB && new Set(idsOf(arr)).size === arr.subnodes().length,
        "add ignores client-supplied jsonId (mints fresh, no collision)");
}

async function main () {
    console.log("Booting strvct standalone (headless)...");
    await boot();
    console.log("Boot complete.");

    testStableIdAddressing();

    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });
