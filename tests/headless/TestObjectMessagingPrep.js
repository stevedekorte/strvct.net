#!/usr/bin/env node

"use strict";

/**
 * Headless test: AI Object Messaging preparation (see the app's
 * docs/Plans/AI Object Messaging § Preparation).
 *
 * Covers:
 * 1. Schema fixtures — the tool-call envelope schemas (SvToolCall /
 *    SvToolResult root JSON schemas) snapshot-compared against
 *    tests/headless/fixtures/*.json, so slot-flag drift (the June
 *    isTyping→rollRequest leak class) is a red test, not a live wedge.
 *    Regenerate deliberately with UPDATE_FIXTURES=1.
 * 2. jsonId continuity — serialize → deserialize reconstructs members with
 *    the source ids, re-deserialize merges BY id (object identity kept —
 *    a handle held across turns stays valid), and descendantWithJsonId
 *    resolves — the sendObjectMessage target path.
 * 3. Summary emit sets — a class declaring static summarySlotNames()
 *    emits only the curated slots at lod "summary"; full emission and
 *    undeclared classes are unchanged.
 * 4. invariantErrorMessage — the standard invariant-violation message
 *    shape (field / given / legal / hint).
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestObjectMessagingPrep.js
 */

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
const fixturesDir = path.join(__dirname, "fixtures");
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

// --- test classes (slot-based, the shape real Uo* model classes have) --------

function defineCreatureClasses () {
    const SvJsonGroup = SvGlobals.get("SvJsonGroup");

    const addSlots = (proto) => {
        ["name", "hitPoints", "armorClass", "notes", "backstory"].forEach((n) => {
            const slot = proto.newSlot(n, null);
            slot.setSlotType("String");
            slot.setIsInJsonSchema(true);
            slot.setShouldJsonArchive(true);
        });
    };

    (class TestPrepCuratedCreature extends SvJsonGroup {
        initPrototypeSlots () {
            addSlots(this);
        }
        static summarySlotNames () {
            return ["name", "hitPoints", "armorClass"];
        }
    }).initThisClass();

    (class TestPrepPlainCreature extends SvJsonGroup {
        initPrototypeSlots () {
            addSlots(this);
        }
    }).initThisClass();
}

// --- 1. schema fixtures ------------------------------------------------------

function checkSchemaFixture (name, schemaJson) {
    const fixturePath = path.join(fixturesDir, name + ".schema.json");
    const current = JSON.stableStringifyWithStdOptions(schemaJson);

    if (!fs.existsSync(fixturePath) || process.env.UPDATE_FIXTURES === "1") {
        fs.mkdirSync(fixturesDir, { recursive: true });
        fs.writeFileSync(fixturePath, current + "\n");
        check(true, name + " fixture " + (process.env.UPDATE_FIXTURES === "1" ? "updated" : "created") + " (" + fixturePath + ")");
        return;
    }

    const expected = fs.readFileSync(fixturePath, "utf8").trim();
    const matches = current === expected;
    check(matches, name + " generated schema matches fixture");
    if (!matches) {
        console.log("    schema drift detected — if intentional, rerun with UPDATE_FIXTURES=1 and commit the fixture");
        let i = 0;
        while (i < Math.min(current.length, expected.length) && current[i] === expected[i]) { i++; }
        console.log("    first difference at char " + i + ":");
        console.log("      fixture: ..." + expected.slice(Math.max(0, i - 40), i + 60) + "...");
        console.log("      current: ..." + current.slice(Math.max(0, i - 40), i + 60) + "...");
    }
}

function testSchemaFixtures () {
    console.log("\nSchema fixtures (tool-call envelope)");
    const SvToolCall = SvGlobals.get("SvToolCall");
    const SvToolResult = SvGlobals.get("SvToolResult");
    checkSchemaFixture("SvToolCall", SvToolCall.asRootJsonSchema(new Set()));
    checkSchemaFixture("SvToolResult", SvToolResult.asRootJsonSchema(new Set()));
}

// --- 2. jsonId continuity ----------------------------------------------------

function testJsonIdContinuity () {
    console.log("\njsonId continuity across serialize -> deserialize");
    const SvJsonArrayNode = SvGlobals.get("SvJsonArrayNode");
    const TestPrepPlainCreature = SvGlobals.get("TestPrepPlainCreature");

    const creature = (id, name) => {
        const c = TestPrepPlainCreature.clone();
        c.setJsonId(id);
        c.setName(name);
        return c;
    };

    const a = SvJsonArrayNode.clone();
    a.setTitle("creatures");
    a.setSubnodeClasses([TestPrepPlainCreature]);
    a.addSubnode(creature("cr-1", "Grib"));
    a.addSubnode(creature("cr-2", "Snarl"));

    const json = a.serializeToJson(null, []);
    check(json.length === 2 && json[0].jsonId === "cr-1" && json[1].jsonId === "cr-2",
        "serialized members carry their jsonIds");
    check(json[0]._type === "TestPrepPlainCreature", "serialized members carry _type");

    // Fresh, empty collection — the multiplayer client hydration case.
    // Deserializing must reconstruct members WITH the source ids.
    const b = SvJsonArrayNode.clone();
    b.setTitle("creatures");
    b.setSubnodeClasses([TestPrepPlainCreature]);
    b.deserializeFromJson(json, null, []);
    check(b.subnodes().length === 2, "fresh collection hydrated");
    check(b.subnodes().first().jsonId() === "cr-1" && b.subnodes().last().jsonId() === "cr-2",
        "hydrated members adopted the source jsonIds");

    // Handles must resolve — the sendObjectMessage target path.
    const found = b.descendantWithJsonId("cr-1");
    check(!!found && found === b.subnodes().first(), "descendantWithJsonId resolves to the live node");

    // Re-deserializing updated JSON must merge BY jsonId — same live object,
    // new value — not re-instantiate (a handle held across turns stays valid).
    const before = b.subnodes().first();
    const json2 = JSON.parse(JSON.stringify(json));
    json2[0].name = "Grib the Bold";
    b.deserializeFromJson(json2, null, []);
    check(b.subnodes().first() === before, "id-matched member updated in place (object identity preserved)");
    check(b.subnodes().first().name() === "Grib the Bold", "updated value adopted");

    // Round-trip stability: ids never re-mint across a full cycle.
    const json3 = b.serializeToJson(null, []);
    check(json3[0].jsonId === "cr-1" && json3[1].jsonId === "cr-2", "ids stable across the full round trip");
}

// --- 3. summary emit sets ----------------------------------------------------

function testSummaryEmitSets () {
    console.log("\nPer-class summary emit sets");

    const SvJsonGroup = SvGlobals.get("SvJsonGroup");
    const SvClientStateLens = SvGlobals.get("SvClientStateLens");
    const TestPrepCuratedCreature = SvGlobals.get("TestPrepCuratedCreature");
    const TestPrepPlainCreature = SvGlobals.get("TestPrepPlainCreature");

    const fill = (c) => {
        c.setName("Grib");
        c.setHitPoints("7/7");
        c.setArmorClass("13");
        c.setNotes("smells of mushrooms");
        c.setBackstory("Third son of the warren...");
        return c;
    };

    const root = SvJsonGroup.clone();
    root.setShouldStoreSubnodes(true);
    root.setTitle("root");
    const curated = fill(TestPrepCuratedCreature.clone());
    curated.setTitle("curated");
    curated.setJsonId("c-1");
    const plain = fill(TestPrepPlainCreature.clone());
    plain.setTitle("plain");
    plain.setJsonId("p-1");
    root.addSubnode(curated);
    root.addSubnode(plain);

    const summaryLens = SvClientStateLens.fromJson({
        select: [{ nodes: ["/curated", "/plain"], lod: "summary" }],
        default: "omit"
    }, root);
    const out = root.serializeWithLens(summaryLens, "omit", 0);

    check(out.curated.name === "Grib" && out.curated.hitPoints === "7/7" && out.curated.armorClass === "13",
        "curated summary emits the declared slots");
    check(out.curated.notes === undefined && out.curated.backstory === undefined,
        "curated summary omits undeclared slots");
    check(out.curated.jsonId === "c-1" && out.curated._lod === "summary",
        "curated summary still self-identifies (jsonId + _lod)");
    check(out.plain.notes === "smells of mushrooms" && out.plain.backstory !== undefined,
        "class without summarySlotNames keeps the all-slots summary");

    const fullLens = SvClientStateLens.fromJson({
        select: [{ nodes: ["/curated"], lod: "full" }],
        default: "omit"
    }, root);
    const outFull = root.serializeWithLens(fullLens, "omit", 0);
    check(outFull.curated.notes === "smells of mushrooms" && outFull.curated.backstory !== undefined,
        "full emission is unaffected by the summary emit set");
}

// --- 4. invariant error message ----------------------------------------------

function testInvariantErrorMessage () {
    console.log("\nInvariant error message shape");
    const SvToolCall = SvGlobals.get("SvToolCall");
    const tc = SvToolCall.clone();

    check(tc.invariantErrorMessage({ field: "targetNumber", given: 500, legal: "1..30", hint: "use the DC from the check being made" })
        === "invalid 'targetNumber'; got 500; legal: 1..30. Use the DC from the check being made.",
    "full spec composes field/given/legal/hint");
    check(tc.invariantErrorMessage({ field: "contextId", given: "xq12" })
        === "invalid 'contextId'; got \"xq12\".",
    "partial spec omits absent parts");
    check(tc.invariantErrorMessage({}) === "invariant violation.",
        "empty spec still names the class of failure");
}

// --- run ----------------------------------------------------------------------

(async () => {
    await boot();
    defineCreatureClasses();
    testSchemaFixtures();
    testJsonIdContinuity();
    testSummaryEmitSets();
    testInvariantErrorMessage();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
