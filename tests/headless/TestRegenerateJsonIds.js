#!/usr/bin/env node

"use strict";

/**
 * Headless test: regenerateJsonIds re-ids EVERYTHING a copy carries — lazy
 * sections still holding their loaded JSON, and slots that are in the copy
 * (shouldJsonArchive) but not in the AI schema.
 *
 * Origin (2026-10-06): it walked raw slot values of schema slots only, so a
 * lazy section kept its original ids and a cast voice (out of the schema)
 * kept its id. A spawned creature shared 67 nested jsonIds with its bestiary
 * prototype and every sibling, so a patch or update addressed by id could
 * land on the wrong copy.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestRegenerateJsonIds.js
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
    for (const rel of ["SvGlobals.js", "SvPlatform.js", "StrvctFile.js", "SvBootLoader.js"]) {
        await bootFile(path.join("source/boot", rel));
    }
    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot";
    await SvBootLoader.asyncRun();
}

function defineClasses () {
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    (class TestRegenLeaf extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("leafText", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
                slot.setShouldJsonArchive(true);
                slot.setIsInJsonSchema(true);
            }
        }
    }).initThisClass();
    (class TestRegenRoot extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSubnodeFieldSlot("eager", SvGlobals.get("TestRegenLeaf"));
            }
            {
                const slot = this.newSubnodeFieldSlot("lazy", SvGlobals.get("TestRegenLeaf"));
                slot.setIsLazy(true);
            }
            {
                // in the copy, not in the AI schema (like a cast voice)
                const slot = this.newSubnodeFieldSlot("bookkeeping", SvGlobals.get("TestRegenLeaf"));
                slot.setIsInJsonSchema(false);
            }
        }
    }).initThisClass();
}

function idsOf (json, out = []) {
    if (json && typeof json === "object") {
        if (typeof json.jsonId === "string") {
            out.push(json.jsonId);
        }
        Object.values(json).forEach(v => idsOf(v, out));
    }
    return out;
}

(async () => {
    await boot();
    defineClasses();
    const Root = SvGlobals.get("TestRegenRoot");

    const original = Root.clone();
    original.lazy().setLeafText("lazy text");
    const json = original.asJson();
    const originalIds = idsOf(json);
    check(originalIds.length >= 3, "the original's copy JSON carries the root's and its sections' jsonIds: " + originalIds.length);

    const copy = Root.clone();
    copy.setJson(json); // a copy, as spawn makes one
    copy.regenerateJsonIds();
    const copyIds = idsOf(copy.asJson());
    const shared = copyIds.filter(id => originalIds.includes(id));
    check(shared.length === 0, "after regenerateJsonIds the copy shares no jsonId with its original (shared: " + JSON.stringify(shared) + ")");
    check(copy.lazy().leafText() === "lazy text", "the lazy section's content survives the re-iding");
    check(copyIds.length === originalIds.length, "and the copy carries as many ids as the original (" + copyIds.length + ")");

    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
