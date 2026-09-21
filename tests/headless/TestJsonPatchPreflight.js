#!/usr/bin/env node

"use strict";

/**
 * Headless test: the stage-1 JSON-patch preflight (Plans/Client Transactions
 * § Sequencing, step 0 — the stopgap for half-applied AI patch batches).
 *
 * A batch with a definite error is refused BEFORE anything is applied, and
 * the error says so (refusedBeforeApply, failedOpIndex, "NO operation … was
 * applied"). Covers:
 * - unknown slot, path through a null slot, path through a missing subnode,
 *   bad / out-of-range array index, '-' with a non-add op, malformed ops,
 *   move/copy with a bad 'from', a value whose shape cannot fit the slot
 * - a refused batch leaves the tree byte-identical
 * - what the preflight must NOT refuse: a later op targeting a container an
 *   earlier op adds; a later index in an array an earlier op inserted into or
 *   removed from; a plain-object slot navigated into
 * - a valid batch still applies exactly as before
 *
 * Usage (from this directory):  node TestJsonPatchPreflight.js
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

    (class TestPfItem extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("name", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("count", 0);
                slot.setSlotType("Number");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestPfItems extends SvJsonArrayNode {
        initPrototype () {
            this.setSubnodeClasses([SvGlobals.get("TestPfItem")]);
        }
    }).initThisClass();

    (class TestPfDetails extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("heading", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("extra", null);
                slot.setSlotType("JSON Object");
                slot.setAllowsNullValue(true);
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestPfDocs extends SvJsonArrayNode {
        initPrototype () {
            this.setSubnodeClasses([SvGlobals.get("TestPfItem")]);
            this.setSubnodesArePools(true); // a folder of documents (Record Store §6)
        }
    }).initThisClass();

    (class TestPfRoot extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("items", null);
                slot.setFinalInitProto(SvGlobals.get("TestPfItems"));
                slot.setIsSubnode(true);
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestPfItems");
            }
            {
                const slot = this.newSlot("details", null);
                slot.setFinalInitProto(SvGlobals.get("TestPfDetails"));
                slot.setIsSubnode(true);
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestPfDetails");
            }
            {
                // a nullable group slot that starts empty — writing inside it must be refused until it is added
                const slot = this.newSlot("optional", null);
                slot.setAllowsNullValue(true);
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestPfDetails");
            }
            {
                const slot = this.newSlot("label", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("docs", null);
                slot.setFinalInitProto(SvGlobals.get("TestPfDocs"));
                slot.setIsSubnode(true);
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestPfDocs");
            }
        }
    }).initThisClass();
}

function newRoot () {
    const root = SvGlobals.get("TestPfRoot").clone();
    root.setJsonId("root");
    ["a", "b", "c"].forEach((n) => {
        const it = SvGlobals.get("TestPfItem").clone();
        it.setName(n); it.setJsonId("it-" + n);
        root.items().addSubnode(it);
    });
    root.details().setHeading("d");
    root.setLabel("L");
    return root;
}

function snapshot (root) {
    return JSON.stringify(root.asJson());
}

function refusal (root, patches) {
    try {
        root.applyJsonPatches(patches);
        return null;
    } catch (e) {
        return e.patchError || { error: e.message };
    }
}

function expectRefused (root, patches, opIndex, needle, label) {
    const before = snapshot(root);
    const r = refusal(root, patches);
    const ok = r && r.refusedBeforeApply === true && r.failedOpIndex === opIndex && r.error.includes(needle);
    check(ok, label + (ok ? "" : " — got " + JSON.stringify(r)));
    check(snapshot(root) === before, "  …and nothing was applied");
}

async function main () {
    await boot();
    defineClasses();

    console.log("\nDefinite errors are refused before anything applies");
    let root = newRoot();
    expectRefused(root, [{ op: "replace", path: "/label", value: "x" }, { op: "add", path: "/noSuchSlot", value: 1 }], 1, "unknown slot 'noSuchSlot'", "unknown slot on the root (second op) — even though the first op was valid");
    expectRefused(root, [{ op: "replace", path: "/details/nope", value: "x" }], 0, "unknown slot 'nope'", "unknown slot on a nested group");
    expectRefused(root, [{ op: "replace", path: "/optional/heading", value: "x" }], 0, "has no value", "a path through a null slot");
    expectRefused(root, [{ op: "replace", path: "/items/7/name", value: "x" }], 0, "out of bounds", "an index past the end of an untouched array");
    expectRefused(root, [{ op: "replace", path: "/items/x/name", value: "x" }], 0, "not a valid array index", "a non-numeric index mid-path");
    expectRefused(root, [{ op: "remove", path: "/items/-" }], 0, "'/-' can only be used with add", "'-' with remove");
    expectRefused(root, [{ op: "copy", from: "/items/0", path: "/items/9" }], 0, "copy index 9 is beyond the end", "copy to an index beyond length");
    expectRefused(root, [{ op: "add", path: "/items/9", value: { name: "z" } }], 0, "beyond the end", "add at an index beyond length");
    expectRefused(root, [{ op: "frobnicate", path: "/label", value: 1 }], 0, "unsupported op", "an unknown op");
    expectRefused(root, [{ op: "add", path: "label", value: 1 }], 0, "starting with '/'", "a path without a leading slash");
    expectRefused(root, [{ op: "add", path: "/label" }], 0, "requires a value", "an add with no value");
    expectRefused(root, [{ op: "move", from: "/items/5", path: "/items/0" }], 0, "'from' index 5 is out of bounds", "a move whose from does not exist");
    expectRefused(root, [{ op: "copy", from: "/nothing", path: "/items/-" }], 0, "'from' unknown slot", "a copy whose from names an unknown slot");
    expectRefused(root, [{ op: "replace", path: "/label", value: { a: 1 } }], 0, "holds a String", "an object into a String slot");
    expectRefused(root, [{ op: "replace", path: "/details", value: "just a string" }], 0, "bare string", "a bare string into a group slot");
    expectRefused(root, [{ op: "add", path: "/", value: {} }], 0, "not the root", "the root as a target");
    const doc = SvGlobals.get("TestPfItem").clone(); doc.setName("doc"); root.docs().addSubnode(doc);
    expectRefused(root, [{ op: "replace", path: "/docs/0/name", value: "x" }], 0, "do not cross pool boundaries", "a path into a document that is its own pool");
    expectRefused(root, [{ op: "copy", from: "/docs/0", path: "/items/-" }], 0, "do not cross pool boundaries", "a copy from inside a pooled folder");
    check(refusal(root, [{ op: "replace", path: "/label", value: "still fine" }]) === null && root.label() === "still fine", "the folder itself stays addressable; only its documents are behind the boundary");

    console.log("\nWhat the preflight must not refuse");
    root = newRoot();
    let r = refusal(root, [{ op: "add", path: "/optional", value: { heading: "made" } }, { op: "replace", path: "/optional/heading", value: "then written" }]);
    check(r === null && root.optional() && root.optional().heading() === "then written", "a later op may write inside a container an earlier op added");
    root = newRoot();
    r = refusal(root, [{ op: "add", path: "/items/-", value: { name: "d" } }, { op: "replace", path: "/items/3/name", value: "D" }]);
    check(r === null && root.items().subnodes().at(3).name() === "D", "a later index in an array an earlier op appended to is not range-checked by the preflight");
    root = newRoot();
    r = refusal(root, [{ op: "remove", path: "/items/0" }, { op: "replace", path: "/items/1/name", value: "C" }]);
    check(r === null && root.items().subnodes().at(1).name() === "C", "a later index in an array an earlier op removed from is not range-checked");
    root = newRoot();
    root.details().setExtra({ nested: { deep: 1 } });
    r = refusal(root, [{ op: "replace", path: "/details/extra/nested/deep", value: 2 }]);
    check(r === null && root.details().extra().nested.deep === 2, "a plain-object slot is navigable without deeper validation");
    root = newRoot();
    r = refusal(root, [{ op: "move", from: "/items/2", path: "/items/0" }]);
    check(r === null && root.items().subnodes().at(0).name() === "c", "a legal move passes");
    root = newRoot();
    r = refusal(root, [{ op: "copy", from: "/items/0", path: "/items/-" }, { op: "move", from: "/items/1", path: "/items/3" }]);
    // copy appends a → [a,b,c,a]; move removes b then inserts at the end → [a,c,a,b]
    const names = () => root.items().subnodes().map(n => n.name()).join(",");
    check(r === null && names() === "a,c,a,b", "move and copy may append with '-' or insert at the end index (got " + names() + ")");

    console.log("\nApply-time failures still report the non-atomic state (unchanged behaviour)");
    root = newRoot();
    // the preflight cannot see this one: index 5 into an array the batch already touched
    const before = snapshot(root);
    r = refusal(root, [{ op: "add", path: "/items/-", value: { name: "d" } }, { op: "replace", path: "/items/9/name", value: "x" }]);
    check(r && !r.refusedBeforeApply && r.failedOpIndex === 1 && String(r.stateNote).includes("NOT atomic"), "an error only visible at apply time is reported as before, with the failing index");
    check(snapshot(root) !== before && root.items().subnodes().length === 4, "…and the earlier op stayed applied (this is what Client Transactions removes later)");

    console.log("\nA valid batch applies exactly as before");
    root = newRoot();
    r = refusal(root, [{ op: "replace", path: "/label", value: "new" }, { op: "add", path: "/items/-", value: { name: "d", count: 4 } }, { op: "remove", path: "/items/0" }]);
    check(r === null && root.label() === "new" && root.items().subnodes().length === 3 && root.items().subnodes().at(2).name() === "d", "replace, append, remove");
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
