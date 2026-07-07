#!/usr/bin/env node

"use strict";

/**
 * Headless test: JSON patch path errors are self-describing.
 *
 * Regression test for the "flat-vs-nested location path" failure mode: a
 * session AI (which sees only the prompt + error text, never the source)
 * patched /campaign/locations/5/... when the campaign had ONE root location
 * whose rooms live under its `sublocations` array. The out-of-bounds error
 * reported only the array length, so the model had to re-derive the real
 * structure from memory. The fix makes bounds/missing-key errors list what
 * the container actually holds:
 *   - SvJsonArrayNode bounds errors append elementsSummaryString() —
 *     `[0] "Crypt of Alatar" (jsonId: …)`, capped at 10.
 *   - SvJsonGroup missing-subnode/missing-slot errors list available keys.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # re-index edited sources
 *   node tests/headless/TestJsonPatchErrors.js
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

function errorMessageFrom (fn) {
    try {
        fn();
        return null;
    } catch (e) {
        return e.message;
    }
}

function testArrayBoundsErrors () {
    console.log("\nSvJsonArrayNode bounds errors list elements");

    const SvJsonArrayNode = SvGlobals.get("SvJsonArrayNode");
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    check(!!SvJsonArrayNode && !!SvJsonGroup, "classes loaded");

    const arr = SvJsonArrayNode.clone();
    check(arr.elementsSummaryString() === "Array is empty.", "empty array summarizes as 'Array is empty.'");

    // One container element — the shape that produced the original bug.
    const crypt = SvJsonGroup.clone();
    crypt.setTitle("Crypt of Alatar");
    arr.addSubnode(crypt);

    const summary = arr.elementsSummaryString();
    check(summary.startsWith("Array elements: [0]"), "summary starts with indexed element");
    check(summary.includes("\"Crypt of Alatar\""), "summary includes the element's title");
    check(crypt.jsonId() ? summary.includes(crypt.jsonId()) : true, "summary includes the element's jsonId");

    // Navigation out of bounds (the original failure: index 5 into a 1-element array).
    const navMsg = errorMessageFrom(() => arr.childNodeForSegment("5"));
    check(navMsg !== null && navMsg.includes("out of bounds"), "navigate to index 5 throws out-of-bounds");
    check(navMsg !== null && navMsg.includes("Crypt of Alatar"), "…and the error lists what the array holds");

    // Remove out of bounds.
    const removeMsg = errorMessageFrom(() => arr.removeDirectly("7"));
    check(removeMsg !== null && removeMsg.includes("Crypt of Alatar"), "remove out-of-bounds error lists elements");

    // Cap: 12 elements → 10 listed + "+2 more".
    const big = SvJsonArrayNode.clone();
    for (let i = 0; i < 12; i++) {
        const n = SvJsonGroup.clone();
        n.setTitle("Room " + i);
        big.addSubnode(n);
    }
    const bigSummary = big.elementsSummaryString();
    check(bigSummary.includes("+2 more"), "summary caps at 10 elements with '+N more'");
    check(!bigSummary.includes("Room 11"), "…and does not list past the cap");
}

function testGroupMissingKeyErrors () {
    console.log("\nSvJsonGroup missing-key errors list available keys");

    const SvJsonGroup = SvGlobals.get("SvJsonGroup");

    // Slot-backed group (shouldStoreSubnodes false): missing slot lists schema slots.
    const group = SvJsonGroup.clone();
    group.setShouldStoreSubnodes(false);
    const slotMsg = errorMessageFrom(() => group.childNodeForSegment("noSuchSlot"));
    check(slotMsg !== null && slotMsg.includes("missing slot"), "missing slot throws");
    check(slotMsg !== null && slotMsg.includes("Available keys:"), "…and lists available keys");

    // Subnode-backed group: missing subnode lists subnode titles.
    const container = SvJsonGroup.clone();
    container.setShouldStoreSubnodes(true);
    const child = SvJsonGroup.clone();
    child.setTitle("sublocations");
    container.addSubnode(child);
    const subMsg = errorMessageFrom(() => container.childNodeForSegment("locations"));
    check(subMsg !== null && subMsg.includes("missing subnode"), "missing subnode throws");
    check(subMsg !== null && subMsg.includes("sublocations"), "…and lists the actual child keys");
}

(async () => {
    await boot();
    testArrayBoundsErrors();
    testGroupMissingKeyErrors();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test run failed to boot:", e);
    process.exit(1);
});
