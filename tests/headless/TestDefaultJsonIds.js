#!/usr/bin/env node

"use strict";

/**
 * Headless test: a default value created for a loaded node (its record lacks
 * a slot added later, or a lazy slot's first access) gets jsonIds derived
 * from the node's own, so every load of the same record makes the same ids.
 *
 * Origin (2026-10-04): catalog characters stored before `voice.castVoice`
 * existed got a new random castVoice jsonId on every load (a player never
 * saves a catalog document), so two loads of the same pool never compared
 * equal — syncCatalog planned a replace for nearly every document.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestDefaultJsonIds.js
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
    (class TestDefaultLeaf extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("leafText", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();
    (class TestDefaultChild extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("inner", null);
                slot.setFinalInitProto(SvGlobals.get("TestDefaultLeaf"));
                slot.setSlotType("TestDefaultLeaf");
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();
    (class TestDefaultParent extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("child", null);
                slot.setFinalInitProto(SvGlobals.get("TestDefaultChild"));
                slot.setSlotType("TestDefaultChild");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("lazyChild", null);
                slot.setFinalInitProto(SvGlobals.get("TestDefaultChild"));
                slot.setSlotType("TestDefaultChild");
                slot.setShouldStoreSlot(true);
                slot.setIsLazy(true);
            }
        }
    }).initThisClass();
}

/** A parent as a load leaves it: its id from the record, the slot absent, then finalInit's default. */
function loadedParentLackingChild (id) {
    const Parent = SvGlobals.get("TestDefaultParent");
    const parent = Parent.clone();
    parent.setJsonId(id);
    const slot = parent.thisPrototype().allSlotsMap().get("child");
    slot.onInstanceSetValue(parent, null);
    slot.onInstanceFinalInitSlot(parent);
    return parent;
}

(async () => {
    await boot();
    defineClasses();
    const SvJsonIdNode = SvGlobals.get("SvJsonIdNode");

    console.log("\nA default for a loaded node follows the node's id");
    const a = loadedParentLackingChild("P1");
    check(a.child().jsonId() === SvJsonIdNode.jsonIdForSeed("P1/child"), "the default's id is derived from its owner's id and slot: " + a.child().jsonId());
    check(a.child().inner().jsonId() === SvJsonIdNode.jsonIdForSeed(a.child().jsonId() + "/inner"), "and so are its own defaults' ids: " + a.child().inner().jsonId());
    const b = loadedParentLackingChild("P1");
    check(b.child().jsonId() === a.child().jsonId() && b.child().inner().jsonId() === a.child().inner().jsonId(), "a second load of the same record makes the same ids");
    const c = loadedParentLackingChild("P2");
    check(c.child().jsonId() !== a.child().jsonId(), "another document's default gets another id");

    console.log("\nA lazy slot's default, first accessed on a loaded node");
    check(a.lazyChild().jsonId() === SvJsonIdNode.jsonIdForSeed("P1/lazyChild"), "its id is derived the same way: " + a.lazyChild().jsonId());
    check(b.lazyChild().jsonId() === a.lazyChild().jsonId(), "and repeats across loads");
    check(a.lazyChild().inner().jsonId() === SvJsonIdNode.jsonIdForSeed(a.lazyChild().jsonId() + "/inner"), "its own defaults too");

    console.log("\nA new node keeps random ids");
    const Parent = SvGlobals.get("TestDefaultParent");
    const n1 = Parent.clone();
    const n2 = Parent.clone();
    check(n1.child().jsonId() !== n2.child().jsonId(), "two new nodes' defaults have different ids (" + n1.child().jsonId() + ", " + n2.child().jsonId() + ")");

    console.log("\nThe derived ids");
    const id = SvJsonIdNode.jsonIdForSeed("P1/child");
    check(/^[A-Za-z0-9]{10}$/.test(id), "are ten characters of the uuid alphabet: " + id);
    const seen = new Set();
    for (let i = 0; i < 20000; i++) {
        seen.add(SvJsonIdNode.jsonIdForSeed("doc" + i + "/castVoice"));
    }
    check(seen.size === 20000, "20,000 different seeds give 20,000 different ids");

    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
