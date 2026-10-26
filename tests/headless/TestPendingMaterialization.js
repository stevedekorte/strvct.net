#!/usr/bin/env node

"use strict";

/**
 * Headless test: a lazy slot still holding JSON is pending materialization.
 *
 * slotIsPendingMaterialization recognized only a stored record not yet loaded
 * (SvStoreRef). A slot holding JSON not yet deserialized (SvLazyJsonRef) read
 * as loaded, so "if loaded" readers built it: a character's subtitle, read
 * while its record was serialized, materialized its combat block and mutated
 * the character mid store pass (TRIPWIRE on a table worker, 2026-10-25).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestPendingMaterialization.js
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

function defineClasses () {
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");

    (class TestPmStats extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("hits", 0);
                slot.setSlotType("Number");
                slot.setShouldStoreSlot(true);
                slot.setShouldJsonArchive(true);
            }
        }
    }).initThisClass();

    (class TestPmSheet extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSubnodeFieldSlot("stats", SvGlobals.get("TestPmStats"));
                slot.setIsLazy(true);
            }
        }
    }).initThisClass();
}

async function main () {
    await boot();
    defineClasses();
    const SvLazyJsonRef = SvGlobals.get("SvLazyJsonRef");

    console.log("\nA lazy slot holding JSON");
    const sheet = SvGlobals.get("TestPmSheet").clone();
    sheet.deserializeFromJson({ stats: { hits: 7 } }, null, []);
    const raw = () => sheet.thisPrototype().slotNamed("stats").onInstanceRawGetValue(sheet);
    check(raw() instanceof SvLazyJsonRef, "setup: deserializing parks the JSON in the slot (" + (raw() && raw().svType ? raw().svType() : typeof raw()) + ")");
    check(sheet.slotIsPendingMaterialization("stats") === true, "is pending materialization");
    check(raw() instanceof SvLazyJsonRef, "…and asking does not build it");
    check(sheet.stats().hits() === 7, "the getter builds it from the JSON");
    check(sheet.slotIsPendingMaterialization("stats") === false, "once built it is no longer pending");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
