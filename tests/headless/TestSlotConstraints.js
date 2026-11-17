#!/usr/bin/env node

"use strict";

/**
 * Headless test: slot constraints (Slot_constraints), one declaration with
 * four readers.
 *
 * Checks:
 *   - asJsonSchema() emits each declared keyword, and nothing for a slot
 *     that declares none; a declared maxLength never raises a stored
 *     string's cap;
 *   - constraintErrorForValue() gives a sentence per broken constraint, and
 *     judges only the constraints for the value's type;
 *   - the setter WARNS and keeps the value, and so does loading JSON: a
 *     record stored before the constraint existed must still load;
 *   - a field refuses the edit with that sentence (SvField.validateValue,
 *     and SvNumberField beside its own checks);
 *   - a JSON patch that breaks a constraint is refused before anything is
 *     applied, for the patched slot and for a field inside an added value.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestSlotConstraints.js
 * (rebuild the index first if sources changed: node source/boot/index-builder/ImportsIndexer.js)
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let pass = 0, fail = 0;
const check = (c, m) => {
    if (c) {
        pass++;
        console.log("  \x1b[32m✓\x1b[0m " + m);
    } else {
        fail++;
        console.log("  \x1b[31m✗\x1b[0m " + m);
    }
};

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

function defineTestClasses () {
    (class TestScHero extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("level", 1);
                slot.setSlotType("Number");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
                slot.setMinimum(1);
                slot.setMaximum(20);
            }
            {
                const slot = this.newSlot("gold", 0);
                slot.setSlotType("Number");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
                slot.setExclusiveMinimum(-1);
                slot.setExclusiveMaximum(1000);
                slot.setMultipleOf(0.01);
            }
            {
                const slot = this.newSlot("name", "Hero");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
                slot.setMinLength(1);
                slot.setMaxLength(12);
            }
            {
                const slot = this.newSlot("bornOn", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setFormat("date-time");
            }
            {
                const slot = this.newSlot("tags", null);
                slot.setSlotType("Array");
                slot.setIsInJsonSchema(true);
                slot.setMinItems(1);
                slot.setMaxItems(2);
            }
            {
                const slot = this.newSlot("notes", "");
                slot.setSlotType("String");
                slot.setIsInJsonSchema(true);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestScHeroes extends SvJsonArrayNode {
        initPrototype () {
            this.setSubnodeClasses([SvGlobals.get("TestScHero")]);
        }
    }).initThisClass();

    (class TestScParty extends SvJsonGroup {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("heroes", null);
                slot.setFinalInitProto(SvGlobals.get("TestScHeroes"));
                slot.setIsSubnode(true);
                slot.setIsInJsonSchema(true);
                slot.setSlotType("TestScHeroes");
            }
        }
    }).initThisClass();
}

const heroSlot = (name) => SvGlobals.get("TestScHero").prototype.slotNamed(name);

function testSchema () {
    console.log("The schema");
    const schemaOf = (name) => heroSlot(name).asJsonSchema(new Set());
    const level = schemaOf("level");
    check(level.minimum === 1 && level.maximum === 20, "minimum and maximum are emitted");
    const gold = schemaOf("gold");
    check(gold.exclusiveMinimum === -1 && gold.exclusiveMaximum === 1000 && gold.multipleOf === 0.01, "exclusive bounds and multipleOf are emitted");
    const name = schemaOf("name");
    check(name.minLength === 1 && name.maxLength === 12, "minLength and maxLength are emitted");
    check(schemaOf("bornOn").format === "date-time", "format is emitted");
    const tags = schemaOf("tags");
    check(tags.minItems === 1 && tags.maxItems === 2, "minItems and maxItems are emitted");
    const notes = schemaOf("notes");
    const cap = Slot.storedStringCapLength();
    check(notes.minimum === undefined && notes.minLength === undefined && notes.maxLength === cap, "a slot that declares none gets none (a stored string keeps its cap)");
    heroSlot("notes").setMaxLength(cap * 2);
    check(schemaOf("notes").maxLength === cap, "a declared maxLength never raises a stored string's cap");
    heroSlot("notes").setMaxLength(undefined);
    check(heroSlot("notes").hasConstraints() === false, "a constraint set to undefined is removed");
    check(heroSlot("level").hasAnnotation("hasConstraints") && heroSlot("level").minimum() === 1, "the accessors read back what was declared");
}

function testMessages () {
    console.log("\nThe sentence for a broken constraint");
    const error = (name, v) => heroSlot(name).constraintErrorForValue(v);
    check(error("level", 0) === "Must be at least 1." && error("level", 21) === "Must be at most 20.", "minimum / maximum: " + error("level", 0) + " " + error("level", 21));
    check(error("level", 1) === null && error("level", 20) === null, "the bounds themselves are allowed");
    check(error("gold", -1) === "Must be greater than -1." && error("gold", 1000) === "Must be less than 1000.", "exclusive bounds exclude themselves");
    check(error("gold", 0.3) === null && error("gold", 12.34) === null, "multipleOf allows for floating point (0.3 is a multiple of 0.01)");
    check(error("gold", 0.005) === "Must be a multiple of 0.01.", "multipleOf: " + error("gold", 0.005));
    check(error("name", "") === "Must have at least 1 character." && error("name", "A very long name") === "Must have at most 12 characters.", "string lengths, singular and plural");
    check(error("tags", []) === "Must have at least 1 item." && error("tags", [1, 2, 3]) === "Must have at most 2 items.", "array sizes");
    check(error("level", "99") === null && error("name", 99) === null && error("level", null) === null, "a value of another type is not judged here");
    check(error("bornOn", "not a date") === null, "format is not checked");
    check(error("notes", "anything") === null, "a slot with no constraints has nothing to say");
}

function capturingWarnings (fn) {
    const original = console.warn;
    const warnings = [];
    console.warn = (...args) => warnings.push(args.join(" "));
    try {
        fn();
    } finally {
        console.warn = original;
    }
    return warnings;
}

function testSetterWarns () {
    console.log("\nThe setter warns and keeps the value");
    const hero = SvGlobals.get("TestScHero").clone();
    let warnings = capturingWarnings(() => hero.setLevel(5));
    check(warnings.length === 0, "a value inside the constraint: no warning");
    warnings = capturingWarnings(() => hero.setLevel(99));
    check(hero.level() === 99, "a value outside it is kept (a stored record must still load)");
    check(warnings.length === 1 && warnings[0].includes("setLevel(99)") && warnings[0].includes("Must be at most 20."), "…with one warning that names the setter and the constraint: " + warnings[0]);
    const loaded = SvGlobals.get("TestScHero").clone();
    warnings = capturingWarnings(() => loaded.setJson({ level: 42, name: "Old Record", gold: 3 }));
    check(loaded.level() === 42 && loaded.name() === "Old Record", "loading JSON that breaks a constraint keeps the values");
    check(warnings.filter(w => w.includes("breaks a constraint")).length === 1, "…and warns once, for the one broken constraint");
}

function testFields () {
    console.log("\nA field refuses the edit");
    const hero = SvGlobals.get("TestScHero").clone();
    const levelField = SvGlobals.get("SvNumberField").clone().setTarget(hero).setValueMethod("level");
    check(levelField.targetSlot() === heroSlot("level"), "a field finds the slot it edits");
    check(levelField.validateValue("25") === "Must be at most 20.", "a number field checks the number the text stands for: " + levelField.validateValue("25"));
    check(levelField.validateValue("7") === null, "a value inside the constraint is accepted");
    check(levelField.validateValue("abc") === "This needs to be a number.", "the field's own checks still come first");
    const nameField = SvGlobals.get("SvStringField").clone().setTarget(hero).setValueMethod("name");
    check(nameField.validateValue("") === "Must have at least 1 character.", "a string field, through SvField: " + nameField.validateValue(""));
    check(nameField.validateValue("Aria") === null, "…accepts a value that fits");
    const loose = SvGlobals.get("SvStringField").clone();
    check(loose.targetSlot() === null && loose.validateValue("x") === null, "a field with no target has no slot and no constraint");
    const methodField = SvGlobals.get("SvStringField").clone().setTarget(hero).setValueMethod("svType");
    check(methodField.targetSlot() === null && methodField.validateValue("x") === null, "a field on a plain method has no slot");
}

function refusal (root, patches) {
    try {
        root.applyJsonPatches(patches);
        return null;
    } catch (e) {
        return e.message;
    }
}

function testPatches () {
    console.log("\nA patch that breaks a constraint is refused");
    const party = SvGlobals.get("TestScParty").clone();
    const hero = SvGlobals.get("TestScHero").clone();
    hero.setJsonId("hero-1");
    party.heroes().addSubnode(hero);
    const before = JSON.stringify(party.asJson());

    let message = refusal(party, [
        { op: "replace", path: "/heroes/0/name", value: "Aria" },
        { op: "replace", path: "/heroes/0/level", value: 25 }
    ]);
    check(message !== null && message.includes("slot 'level' cannot be 25: Must be at most 20."), "a replace outside the range is refused with the sentence: " + message);
    check(JSON.stringify(party.asJson()) === before, "…before anything is applied (the earlier operation did not land)");

    message = refusal(party, [{ op: "add", path: "/heroes/-", value: { name: "Bram", level: 0 } }]);
    check(message !== null && message.includes("slot 'level' cannot be 0: Must be at least 1.") && message.includes("TestScHero"), "a field inside an added value is checked too: " + message);
    check(party.heroes().subnodeCount() === 1, "…and the element is not added");

    message = refusal(party, [
        { op: "replace", path: "/heroes/0/level", value: 20 },
        { op: "add", path: "/heroes/-", value: { name: "Bram", level: 3 } }
    ]);
    check(message === null && hero.level() === 20 && party.heroes().subnodeCount() === 2, "values inside the constraints apply as before" + (message ? ": " + message : ""));
}

async function main () {
    await boot();
    defineTestClasses();
    testSchema();
    testMessages();
    testSetterWarns();
    testFields();
    testPatches();
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
