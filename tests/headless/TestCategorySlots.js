#!/usr/bin/env node

"use strict";

/**
 * Headless test: category slot installation.
 *
 * Verifies that initThisCategory installs slots declared in
 * initPrototypeSlots_<categoryName> and runs initPrototype_<categoryName>
 * (see the gate in Object_categorySupport.js — it was previously an
 * own-property check that always failed, silently skipping category slots
 * for every class).
 *
 * Boots strvct standalone, then checks:
 *   1. the real in-tree consumer (SvAiParsedResponseMessage_streaming)
 *   2. a synthetic class + category defined at runtime
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # build build/_index.json if missing/stale
 *   node tests/headless/TestCategorySlots.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

// Boot expects cwd to be the site root (build/_index.json lives there).
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
    SvBootLoader._bootPath = "source/boot"; // default assumes a parent dir containing strvct/
    await SvBootLoader.asyncRun();
}

function testRealConsumer () {
    console.log("\nReal consumer: SvAiParsedResponseMessage_streaming");

    const msgClass = SvGlobals.get("SvAiParsedResponseMessage");
    check(!!msgClass, "SvAiParsedResponseMessage class loaded");
    const proto = msgClass.prototype;

    check(proto._slotsMap.has("htmlStreamReader"), "htmlStreamReader slot installed from category");
    check(proto._slotsMap.has("processStreamContentAction"), "processStreamContentAction slot installed from category");
    check(proto._allSlotsMap.has("htmlStreamReader"), "htmlStreamReader present in allSlotsMap");
    check(typeof (proto.htmlStreamReader) === "function", "htmlStreamReader getter defined");
    check(typeof (proto.setHtmlStreamReader) === "function", "setHtmlStreamReader setter defined");
    check(Object.hasOwn(proto, "_htmlStreamReader"), "ivar _htmlStreamReader defined on prototype");

    const slot = proto._slotsMap.get("processStreamContentAction");
    check(slot && slot.label() === "Process Stream Content", "category slot configuration (label) applied");
}

function testSyntheticCategory () {
    console.log("\nSynthetic class + category defined at runtime");

    const ProtoClass = SvGlobals.get("ProtoClass");

    (class TestCategoryHost extends ProtoClass {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("baseThing", null);
                slot.setSlotType("String");
            }
        }
    }).initThisClass();

    const host = SvGlobals.get("TestCategoryHost");
    check(!!host, "TestCategoryHost class initialized");
    check(host.prototype._slotsMap.has("baseThing"), "base class slot installed");

    (class TestCategoryHost_extras extends TestCategoryHost {
        initPrototypeSlots_extras () {
            {
                const slot = this.newSlot("extraThing", "extraDefault");
                slot.setSlotType("String");
            }
        }

        initPrototype_extras () {
            this._initPrototypeExtrasRan = true;
        }

        extraMethod () {
            return "extra";
        }
    }).initThisCategory();

    const proto = host.prototype;
    check(proto._slotsMap.has("extraThing"), "category slot installed via initPrototypeSlots_extras");
    check(proto._allSlotsMap.has("extraThing"), "category slot added to allSlotsMap");
    check(typeof (proto.extraThing) === "function", "category slot getter defined");
    check(typeof (proto.setExtraThing) === "function", "category slot setter defined");
    check(proto._extraThing === "extraDefault", "category slot initial value set on prototype");
    check(proto._initPrototypeExtrasRan === true, "initPrototype_extras ran");
    check(typeof (proto.extraMethod) === "function", "category method copied to class prototype");
    check(proto._slotsMap.has("baseThing"), "base slot still present after category install");

    // A subclass initialized AFTER the category sees the category slot through its chain.
    // (NOTE: a subclass initialized BEFORE the category would have a stale allSlotsMap —
    // the load-order convention "base, then categories, then subclasses" is load-bearing.)
    (class TestCategoryHostChild extends host {
        initPrototypeSlots () {
        }
    }).initThisClass();

    const child = SvGlobals.get("TestCategoryHostChild");
    check(child.prototype._allSlotsMap.has("extraThing"), "subclass initialized after category inherits category slot");
    check(typeof (child.prototype.extraThing) === "function", "subclass responds to category slot getter");
}

async function main () {
    console.log("Booting strvct standalone (headless)...");
    await boot();
    console.log("Boot complete.");

    testRealConsumer();
    testSyntheticCategory();

    console.log("\n=============================");
    console.log("Passed: " + passed + "  Failed: " + failed);
    console.log("=============================");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((error) => {
    console.error("Fatal error during test execution:");
    console.error(error);
    process.exit(1);
});
