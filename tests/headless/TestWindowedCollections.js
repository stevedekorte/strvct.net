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
 * - placements travel as row columns, and a round trip through the record
 *   cloud's open shape keeps the order
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
            {
                const slot = this.newSlot("conversation", null); // a windowed SvAiConversation, set by the conversation check
                slot.setSlotType("SvStorableNode");
                slot.setAllowsNullValue(true);
                slot.setShouldStoreSlot(true);
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
    let session2 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
    let chat2 = session2.chat();
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

    console.log("\nA windowed conversation wires each loaded window's messages to itself");
    {
        const SvAiConversation = SvGlobals.get("SvAiConversation");
        (class TestWinConversation extends SvAiConversation {
            initPrototype () { this.setShouldStore(true); this.setShouldStoreSubnodes(true); this.setSubnodesAreWindowed(true); }
            windowSize () { return 2; }
        }).initThisClass();
        const SvConversationMessage = SvGlobals.get("SvConversationMessage");
        const conv = SvGlobals.get("TestWinConversation").clone();
        session2.setConversation(conv);
        ["c1", "c2", "c3"].forEach(() => { conv.addSubnode(SvConversationMessage.clone()); });
        await pool.commitStoreDirtyObjects();
        await pool.promiseClose();
        store.pools().clear();
        pool = SvPersistentObjectPool.clone();
        pool.setName("TestWindowedCollections");
        pool.setRecordStore(store);
        await pool.promiseOpen();
        const conv2 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); }).conversation();
        conv2.prepareToAccess();
        check(conv2.messages().length === 2 && conv2.messages().every(m => m.conversation() === conv2), "the newest window's messages know their conversation");
        conv2.loadOlderWindow(5);
        check(conv2.messages().length === 3 && conv2.messages().every(m => m.conversation() === conv2), "…and so do an older window's");
    }

    console.log("\nA collection stored before it was windowed (an inline subnodes ref) still loads, and the next store pass windows it");
    {
        const SvStorableNode = SvGlobals.get("SvStorableNode");
        (class TestLegacyChat extends SvStorableNode {
            initPrototype () { this.setShouldStoreSubnodes(true); } // NOT windowed yet: stores its subnodes inline, as the old build did
            windowSize () { return 2; }
        }).initThisClass();
        const legacy = SvGlobals.get("TestLegacyChat").clone();
        session2.setConversation(legacy);
        ["l1", "l2", "l3"].forEach(t => legacy.addSubnode(newMessage(t)));
        await pool.commitStoreDirtyObjects();
        check(pool.recordForPid(legacy.puuid()).entries.some(e => e[0] === "subnodes"), "the legacy record carries an inline subnodes ref");
        await pool.promiseClose();
        SvGlobals.get("TestLegacyChat").prototype.setSubnodesAreWindowed(true); // the new build: the class is windowed now
        store.pools().clear();
        pool = SvPersistentObjectPool.clone();
        pool.setName("TestWindowedCollections");
        pool.setRecordStore(store);
        await pool.promiseOpen();
        const legacy2 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); }).conversation();
        legacy2.prepareToAccess();
        check(texts(legacy2) === "l1,l2,l3", "the old inline list loads whole (" + texts(legacy2) + ")");
        legacy2.addSubnode(newMessage("l4"));
        await pool.commitStoreDirtyObjects();
        check(!pool.recordForPid(legacy2.puuid()).entries.some(e => e[0] === "subnodes") && legacy2.subnodeCount() === 4, "after a store pass the record has no subnodes ref and every element is a placed row (" + legacy2.subnodeCount() + ")");
        await pool.promiseClose();
        await new Promise(resolve => setTimeout(resolve, 100)); // the blob pool's LevelDB releases its lock after close returns
        store.pools().clear();
        pool = SvPersistentObjectPool.clone();
        pool.setName("TestWindowedCollections");
        pool.setRecordStore(store);
        await pool.promiseOpen();
        const legacy3 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); }).conversation();
        legacy3.prepareToAccess();
        check(texts(legacy3) === "l3,l4" && legacy3.loadOlderWindow(10) === 2 && texts(legacy3) === "l1,l2,l3,l4", "…and it reopens as a windowed collection (" + texts(legacy3) + ")");
        session2 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
        chat2 = session2.chat();
        chat2.prepareToAccess(); chat2.loadOlderWindow(10);
    }

    console.log("\nThe array is the truth of the order: a re-sorted collection re-keys its rows instead of asserting");
    {
        const array = chat2.subnodes();
        const first = array.first();
        array.unhooked_splice(0, 1); array.unhooked_splice(1, 0, first); // [m2, m1, m3, …] — as a re-sort would leave it
        const inserted = newMessage("m-between");
        chat2.addSubnodeAt(inserted, 2); // between m1 (now out of key order) and m3
        let threw = null;
        try { await pool.commitStoreDirtyObjects(); } catch (e) { threw = e; }
        check(threw === null, "the store pass survives an array order that disagrees with the stored keys" + (threw ? " (threw: " + threw.message + ")" : ""));
        const keysNow = chat2.subnodes().map(m => store.rowForKey(pool.poolId(), m.puuid()).orderKey);
        check(keysNow.every((k, i) => i === 0 || keysNow[i - 1] < k), "every row's key now follows the array order (" + keysNow.join(",") + ")");
        await pool.promiseClose();
        await new Promise(resolve => setTimeout(resolve, 100)); // the blob pool's LevelDB releases its lock after close returns
        store.pools().clear();
        pool = SvPersistentObjectPool.clone();
        pool.setName("TestWindowedCollections");
        pool.setRecordStore(store);
        await pool.promiseOpen();
        session2 = pool.rootOrIfAbsentFromClosure(() => { throw new Error("root should exist"); });
        chat2 = session2.chat();
        chat2.prepareToAccess(); chat2.loadOlderWindow(20);
        check(texts(chat2) === "m3,m2,m-between,m4,m5,m6,m7,m8", "a reopen loads the re-keyed order (" + texts(chat2) + ")"); // m1 was removed earlier; m2 was moved after m3
    }

    console.log("\nPlacements travel with the rows");
    const json = pool.asJson();
    check(typeof json._placements === "string" && Object.values(JSON.parse(json._placements)).filter(p => p[0] === chat2.puuid()).length === 8, "the synced snapshot (asJson) holds the chat's eight placements");
    const liveRows = store.rowsForPool(pool.poolId()).filter(row => !row.isDeleted);
    const opened = { root: liveRows.find(row => row.objectId === pool.poolId()), records: liveRows.filter(row => row.objectId !== pool.poolId()), version: 1, state: "ready" };
    const memoryStore = SvLocalRecordStore.clone().useMemoryMap();
    const memory = await memoryStore.asyncImportOpenedPool(JSON.parse(JSON.stringify(opened)));
    const chat3 = memory.rootObject().chat();
    chat3.prepareToAccess();
    check(texts(chat3) === "m6,m7,m8", "a pool opened from its rows loads its newest window in the same order (" + texts(chat3) + ")");
    const store2 = SvLocalRecordStore.clone().useMemoryMap();
    await store2.asyncOpenStore();
    const imported = await store2.asyncImportOpenedPool(JSON.parse(JSON.stringify(opened)));
    const chat4 = imported.rootObject().chat();
    chat4.loadLatestWindow(); chat4.loadOlderWindow(10);
    check(texts(chat4) === "m3,m2,m-between,m4,m5,m6,m7,m8" && chat4.subnodeCount() === 8, "an imported pool has every element placed, in the re-keyed order (" + texts(chat4) + ")");

    console.log("\nSeveral elements added in one tick, before any store pass, keep their order");
    {
        const chatFresh = SvGlobals.get("TestWinChat").clone(); // a new chat under a stored root: the store holds none of its elements yet
        session2.setChat(chatFresh);
        ["a1", "a2", "a3"].forEach(t => chatFresh.addSubnode(newMessage(t)));
        check(texts(chatFresh) === "a1,a2,a3", "three adds in one tick stay in insertion order (" + texts(chatFresh) + ")");
        await pool.commitStoreDirtyObjects();
        chatFresh.addSubnode(newMessage("a4")); chatFresh.addSubnode(newMessage("a5"));
        check(texts(chatFresh) === "a1,a2,a3,a4,a5", "…and after a store pass, with the store's count behind the array again (" + texts(chatFresh) + ")");
        session2.setChat(chat2);
        await pool.commitStoreDirtyObjects();
    }

    await pool.promiseClose();
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
