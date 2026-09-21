#!/usr/bin/env node

"use strict";

/**
 * Headless test: windowed collections (Plans/Record Store §6, Phase C).
 *
 * A node with setSubnodesAreWindowed(true) stores no ref to its elements: each
 * element's row carries the node's id as parentId and an order key. Covers:
 * - the store pass: no subnodes entry in the node's record; element rows placed
 *   in order; elements attached before the node had a pool are enrolled when
 *   the node is stored; elements attached later enroll on attach
 * - reopen: the node comes up empty, subnodeCount() answers from the store,
 *   loadLatestWindow() brings the newest N in order, loadOlderWindow() prepends,
 *   hasUnloadedSubnodes(); loads mark nothing dirty
 * - appending after a reopen places the new element after the last stored one;
 *   removing an element deletes its row
 * - GC keeps windowed rows (and what they reference) while their node is reachable
 * - the pool.json shape carries placements, and a round trip keeps the order
 *
 * Usage (from this directory):  node TestWindowedCollections.js
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
    const SvStorableNode = SvGlobals.get("SvStorableNode");

    (class TestWinMessage extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("text", "");
                slot.setSlotType("String");
                slot.setShouldStoreSlot(true);
            }
            {
                const slot = this.newSlot("attachment", null);
                slot.setSlotType("TestWinMessage");
                slot.setAllowsNullValue(true);
                slot.setShouldStoreSlot(true);
            }
        }
    }).initThisClass();

    (class TestWinChat extends SvStorableNode {
        initPrototype () {
            this.setShouldStoreSubnodes(true);
            this.setSubnodesAreWindowed(true);
        }
        windowSize () {
            return 3;
        }
    }).initThisClass();

    (class TestWinSession extends SvStorableNode {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("chat", null);
                slot.setSlotType("TestWinChat");
                slot.setShouldStoreSlot(true);
                slot.setFinalInitProto(SvGlobals.get("TestWinChat"));
            }
        }
    }).initThisClass();
}

const texts = (chat) => chat.subnodes().map(m => m.text()).join(",");

async function main () {
    await boot();
    defineClasses();
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvLocalRecordStore = SvGlobals.get("SvLocalRecordStore");
    const SvObjectPool = SvGlobals.get("SvObjectPool");
    const TestWinMessage = SvGlobals.get("TestWinMessage");
    const newMessage = (text) => { const m = TestWinMessage.clone(); m.setText(text); return m; };

    console.log("\nThe store pass: elements are placed rows, the node holds no ref to them");
    const store = SvLocalRecordStore.clone().useMemoryMap();
    let pool = SvPersistentObjectPool.clone();
    pool.setName("TestWindowedCollections");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const session = pool.rootOrIfAbsentFromClosure(() => SvGlobals.get("TestWinSession").clone());
    const chat = session.chat();
    for (let i = 1; i <= 6; i++) { chat.addSubnode(newMessage("m" + i)); } // attached before the chat had a pool
    const attached = newMessage("m6-attachment");
    chat.subnodes().last().setAttachment(attached);
    await pool.commitStoreDirtyObjects();
    const chatRecord = pool.recordForPid(chat.puuid());
    check(!chatRecord.entries.some(e => e[0] === "subnodes"), "the windowed node's record has no subnodes entry");
    const rows = chat.subnodes().map(m => store.rowForKey(pool.poolId(), m.puuid()));
    check(rows.every(r => r && r.parentId === chat.puuid() && typeof r.orderKey === "string"), "every element has a row placed under the chat");
    check(rows.every((r, i) => i === 0 || rows[i - 1].orderKey < r.orderKey), "order keys ascend with the array order");
    check(pool.hasRecordForPid(attached.puuid()) && !store.rowForKey(pool.poolId(), attached.puuid()).parentId, "what an element references is stored near, without a placement");
    const m7 = newMessage("m7");
    chat.addSubnode(m7); // attached after the chat had a pool: enrolls on attach
    check(pool.hasActiveObject(m7) && pool.dirtyObjects().has(m7.puuid()), "an element attached later is enrolled and dirty on attach");
    await pool.commitStoreDirtyObjects();
    check(store.rowForKey(pool.poolId(), m7.puuid()).orderKey > rows[5].orderKey, "…and placed after the last one");
    check(chat.subnodeCount() === 7, "subnodeCount answers from the store (" + chat.subnodeCount() + ")");
    await pool.promiseClose();

    console.log("\nReopen: windows load from the store, in order, without dirtying");
    store.pools().clear();
    pool = SvPersistentObjectPool.clone();
    pool.setName("TestWindowedCollections");
    pool.setRecordStore(store);
    await pool.promiseOpen();
    const session2 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    const chat2 = session2.chat();
    check(chat2._subnodes === null || chat2._subnodes.length === 0, "the chat comes up with no elements loaded");
    check(chat2.subnodeCount() === 7 && chat2.hasUnloadedSubnodes(), "the store knows the count and the node knows it has unloaded elements");
    chat2.prepareToAccess(); // what a view does before showing a node: the newest window (3)
    check(texts(chat2) === "m5,m6,m7", "the newest window loaded in order (" + texts(chat2) + ")");
    check(chat2.subnodes().every(m => m.parentNode() === chat2), "loaded elements know their parent");
    check(chat2.subnodes().at(1).attachment().text() === "m6-attachment", "an element's near reference resolves");
    check(pool.dirtyObjects().size === 0, "the load dirtied nothing");
    const loaded = chat2.loadOlderWindow(2);
    check(loaded === 2 && texts(chat2) === "m3,m4,m5,m6,m7", "an older window prepends in order (" + texts(chat2) + ")");
    chat2.loadOlderWindow(10);
    check(texts(chat2) === "m1,m2,m3,m4,m5,m6,m7" && !chat2.hasUnloadedSubnodes() && chat2.loadOlderWindow(3) === 0, "loading past the beginning stops; everything is loaded");
    check(pool.dirtyObjects().size === 0, "none of the loads dirtied anything");

    console.log("\nEdits after a reopen");
    const m8 = newMessage("m8");
    chat2.addSubnode(m8);
    await pool.commitStoreDirtyObjects();
    check(store.rowForKey(pool.poolId(), m8.puuid()).orderKey > store.rowForKey(pool.poolId(), m7.puuid()).orderKey, "a new element is placed after the last stored one");
    const m1 = chat2.subnodes().first();
    chat2.removeSubnode(m1);
    m1.deleteWindowedRowIfDetached();
    await new Promise(resolve => setTimeout(resolve, 20));
    check(!store.hasRow(pool.poolId(), m1.puuid()) && chat2.subnodeCount() === 7, "a removed element's row is deleted and the count follows");

    console.log("\nGC keeps windowed rows while their node is reachable");
    const before = pool.count();
    const pidsBefore = pool.allPids();
    await pool.promiseCollect();
    const gone = pidsBefore.filter(pid => !pool.hasRecordForPid(pid)).map(pid => pid + ":" + (pool.activeObjectForPid(pid) ? pool.activeObjectForPid(pid).svType() : "?"));
    const lostElements = gone.filter(g => !g.endsWith(":SvSubnodesArray")); // the chat's never-referenced array row is an orphan and rightly swept
    check(lostElements.length === 0 && store.hasRow(pool.poolId(), m8.puuid()) && store.hasRow(pool.poolId(), attached.puuid()) && chat2.subnodeCount() === 7, "collect kept every element row and what elements reference (" + before + " → " + pool.count() + "; swept: " + gone.join(",") + ")");

    console.log("\nThe pool.json shape carries placements");
    const json = pool.asJson();
    check(typeof json._placements === "string" && Object.keys(JSON.parse(json._placements)).length === 7, "asJson holds the seven elements' placements");
    const memory = SvObjectPool.fromCloudJson(json);
    const chat3 = memory.rootObject().chat();
    chat3.prepareToAccess();
    check(texts(chat3) === "m6,m7,m8", "a pool opened from pool.json loads its newest window in the same order (" + texts(chat3) + ")");
    const store2 = SvLocalRecordStore.clone().useMemoryMap();
    await store2.asyncOpenStore();
    const imported = await store2.asyncImportPoolJson(json);
    const chat4 = imported.rootObject().chat();
    chat4.loadLatestWindow(); chat4.loadOlderWindow(10);
    check(texts(chat4) === "m2,m3,m4,m5,m6,m7,m8" && chat4.subnodeCount() === 7, "an imported pool has every element placed (" + texts(chat4) + ")");
    await pool.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
