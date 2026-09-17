#!/usr/bin/env node

"use strict";

/**
 * Headless test: a JSON-patch "move" moves the LIVE node.
 *
 * The old implementation serialized the source to JSON, cloned it, added a
 * new node and removed the original — so every stored-but-not-in-schema slot
 * was silently dropped and anything holding the object got a dead reference
 * (seen live 2026-09-17: an NPC moved into /party lost its pinned map cell).
 *
 * Covers:
 * - array → array move keeps object identity, puuid, non-schema stored slots,
 *   and updates parentNode; source no longer holds it
 * - move to an explicit index lands there; same-array reorder works
 * - copy still produces a NEW object (a copy is a new thing)
 * - a slot-valued source (not a container element) still moves by JSON
 *
 * Usage (from this directory):  node TestJsonPatchMove.js
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

function defineClasses () {
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    const SvJsonArrayNode = SvGlobals.get("SvJsonArrayNode");

    (class TestMoveItem extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("name", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
            {
                // stored but NOT in the schema — the kind of state a JSON clone drops
                const slot = this.newSlot("pinnedCell", null);
                slot.setSlotType("JSON Object");
                slot.setAllowsNullValue(true);
                slot.setIsInJsonSchema(false);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestMoveList extends SvJsonArrayNode {
        initPrototype () {
            this.setSubnodeClasses([SvGlobals.get("TestMoveItem")]);
        }
    }).initThisClass();

    (class TestMoveRoot extends SvJsonGroup {
        initPrototypeSlots () {
            ["left", "right"].forEach((name) => {
                const slot = this.newSlot(name, null);
                slot.setFinalInitProto(SvGlobals.get("TestMoveList"));
                slot.setIsSubnode(true);
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestMoveList");
            });
            {
                const slot = this.newSlot("spare", null);
                slot.setFinalInitProto(SvGlobals.get("TestMoveItem"));
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestMoveItem");
            }
        }
    }).initThisClass();
}

function item (name) {
    const it = SvGlobals.get("TestMoveItem").clone();
    it.setName(name);
    it.setJsonId("id-" + name);
    it.setPinnedCell({ x: 4, y: 7 });
    return it;
}

async function main () {
    await boot();
    defineClasses();
    const TestMoveRoot = SvGlobals.get("TestMoveRoot");

    console.log("\narray → array move keeps the live node");
    let root = TestMoveRoot.clone();
    const chimera = item("chimera");
    root.left().addSubnode(item("goblin"));
    root.left().addSubnode(chimera);
    const puuid = chimera.puuid();
    root.applyJsonPatches([{ op: "move", from: "/left/1", path: "/right/-" }]);
    check(root.left().subnodes().length === 1 && root.left().subnodes().at(0).name() === "goblin", "source array no longer holds it");
    check(root.right().subnodes().length === 1 && root.right().subnodes().at(0) === chimera, "target array holds the SAME object");
    check(chimera.puuid() === puuid && chimera.jsonId() === "id-chimera", "puuid and jsonId unchanged");
    check(chimera.pinnedCell() && chimera.pinnedCell().x === 4 && chimera.pinnedCell().y === 7, "a stored, non-schema slot survives the move");
    check(chimera.parentNode() === root.right(), "parentNode follows the move");

    console.log("\nexplicit index and same-array reorder");
    root = TestMoveRoot.clone();
    ["a", "b", "c"].forEach(n => root.left().addSubnode(item(n)));
    const c = root.left().subnodes().at(2);
    root.applyJsonPatches([{ op: "move", from: "/left/2", path: "/left/0" }]);
    check(root.left().subnodes().at(0) === c && root.left().subnodes().map(s => s.name()).join("") === "cab", "same-array move to index 0 reorders (c a b)");
    root.applyJsonPatches([{ op: "move", from: "/left/0", path: "/right/0" }]);
    check(root.right().subnodes().at(0) === c && root.left().subnodes().map(s => s.name()).join("") === "ab", "cross-array move to an explicit index");

    console.log("\ncopy still clones");
    root = TestMoveRoot.clone();
    const orig = item("orig");
    root.left().addSubnode(orig);
    root.applyJsonPatches([{ op: "copy", from: "/left/0", path: "/right/-" }]);
    const copy = root.right().subnodes().at(0);
    check(copy !== orig && copy.name() === "orig", "copy is a new object with the same schema data");
    check(copy.pinnedCell() === null, "…and, as a JSON clone, without the non-schema slot");
    check(root.left().subnodes().at(0) === orig, "the original stays put");

    console.log("\nslot-valued source falls back to the JSON path");
    root = TestMoveRoot.clone();
    root.spare().setName("spareItem");
    root.applyJsonPatches([{ op: "move", from: "/spare", path: "/right/-" }]);
    check(root.right().subnodes().length === 1 && root.right().subnodes().at(0).name() === "spareItem", "a slot value moves by JSON into the array");
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
