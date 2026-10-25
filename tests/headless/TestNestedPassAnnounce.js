#!/usr/bin/env node

"use strict";

/**
 * Headless test: content changes are announced after the OUTERMOST store pass.
 *
 * A folder whose documents are pools stores a new document by creating its
 * pool and running that pool's store pass inside its own
 * (ensureChildPoolForRoot). The inner pass announced its changes when it
 * ended — still inside the outer pass — and the announcement climbed to the
 * folder, whose answer (a syncable folder stamps localLastModified) mutated an
 * object the outer pass had already stored: a TRIPWIRE every time a document
 * was added, and on a table worker every pass (2026-10-25, UoSessions).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestNestedPassAnnounce.js
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
    const SvStorableNode = SvGlobals.get("SvStorableNode");

    (class TestNpDoc extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("label", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    // stamps a stored slot when its content changes, as a syncable folder does (SvSyncableArrayNode.touchLocalModified)
    (class TestNpFolder extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("changeCount", 0);
                slot.setSlotType("Number");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("caption", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
        }
        initPrototype () {
            this.setShouldStoreSubnodes(true);
            this.setSubnodesArePools(true);
        }
        didStoreChangedContent () {
            SvGlobals.get("SvObjectPool").applyAsNonEdit(() => this.setChangeCount(this.changeCount() + 1)); // bookkeeping, as touchLocalModified
            super.didStoreChangedContent();
        }
    }).initThisClass();

    (class TestNpHome extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("folder", null);
                slot.setSlotType("TestNpFolder");
                slot.setShouldStoreSlot(true);
                slot.setFinalInitProto(SvGlobals.get("TestNpFolder"));
            }
        }
    }).initThisClass();
}

function newDoc (label) {
    const doc = SvGlobals.get("TestNpDoc").clone();
    doc.setLabel(label);
    return doc;
}

// console.error lines mentioning TRIPWIRE while fn runs
async function tripwiresDuring (fn) {
    const lines = [];
    const original = console.error;
    console.error = (...args) => {
        const text = args.join(" ");
        if (text.includes("TRIPWIRE")) {
            lines.push(text.split("\n")[0]);
        }
        original.apply(console, args);
    };
    try {
        await fn();
    } finally {
        console.error = original;
    }
    return lines;
}

async function main () {
    await boot();
    defineClasses();
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");

    const store = SvLocalRecordStore.clone().useMemoryMap();
    const home = SvGlobals.get("SvPersistentObjectPool").clone();
    home.setName("TestNestedPassAnnounce");
    home.setRecordStore(store);
    await home.promiseOpen();
    const root = home.rootOrIfAbsentFromClosure(() => SvGlobals.get("TestNpHome").clone());
    const folder = root.folder();
    await home.commitStoreDirtyObjects();
    await home.commitStoreDirtyObjects();

    console.log("\nA new document's pool is stored inside the folder's pass");
    const tripwires = await tripwiresDuring(async () => {
        folder.setCaption("documents"); // the folder is dirty first, so the pass stores it before the far ref that creates the document's pool
        folder.addSubnode(newDoc("a"));
        await home.commitStoreDirtyObjects();
        await home.commitStoreDirtyObjects();
    });
    check(store.poolForId(folder.subnodes().first().puuid()) !== undefined, "setup: the document became its own pool");
    check(tripwires.length === 0, "no TRIPWIRE: the inner pass's announcement waited for the outer pass" + (tripwires.length ? " — got: " + tripwires.join(" | ") : ""));
    check(folder.changeCount() > 0, "the folder still heard that its content changed (" + folder.changeCount() + ")");
    const stored = home.recordForPid(folder.puuid()).entries.find(e => e[0] === "changeCount");
    check(stored && stored[1] === folder.changeCount(), "…and its stamp reached its stored record (" + (stored && stored[1]) + ")");
    check(home.dirtyObjects().size === 0, "nothing left dirty after the follow-up commit");

    console.log("\nAn edit inside the document announces as before");
    const before = folder.changeCount();
    const editTripwires = await tripwiresDuring(async () => {
        folder.subnodes().first().setLabel("a2");
        await SvGlobals.get("SvObjectPool").poolOfObject(folder.subnodes().first()).commitStoreDirtyObjects();
        await home.commitStoreDirtyObjects();
    });
    check(editTripwires.length === 0 && folder.changeCount() > before, "the document's own pass tells the folder, without a TRIPWIRE");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
