#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvMemoryIndexedDb, the in-memory stand-in SvIndexedDbFolder
 * stores through where the browser has no IndexedDB (Safari in Lockdown Mode).
 * Drives it with the same calls SvIndexedDbFolder and SvIndexedDbTx make.
 *
 * Usage (from this directory):  node TestMemoryIndexedDb.js
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");

let passed = 0;
let failed = 0;
function check (condition, message) {
    if (condition) { passed++; console.log("  \x1b[32m✓\x1b[0m " + message); }
    else { failed++; console.log("  \x1b[31m✗\x1b[0m " + message); }
}

const answer = (request) => new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
});

const completion = (tx) => new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve("complete");
    tx.onabort = () => resolve("aborted");
    tx.onerror = (event) => reject(event.target.error);
});

async function openDb (idb, name) {
    const request = idb.open(name, 2);
    let upgrades = 0;
    request.onupgradeneeded = (event) => {
        upgrades++;
        const store = event.target.result.createObjectStore(name, { keyPath: "key" }, false);
        if (!store.indexNames.contains("key")) { store.createIndex("key", "key", { unique: true }); }
    };
    const db = await answer(request);
    return { db, upgrades };
}

async function main () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvMemoryIndexedDb.js");
    const idb = SvGlobals.get("SvMemoryIndexedDb").shared();
    const name = "test/";

    console.log("open");
    const first = await openDb(idb, name);
    check(first.upgrades === 1, "a new database asks for its store once");
    const db = first.db;
    check(db.objectStoreNames.length === 1 && db.objectStoreNames[0] === name, "the store is listed");

    console.log("write in a transaction, read back");
    let tx = db.transaction(name, "readwrite", { durability: "strict" });
    let store = tx.objectStore(name);
    const buffer = new Uint8Array([1, 2, 3]).buffer;
    store.add({ key: "b", value: "two" });
    store.add({ key: "a", value: buffer });
    store.put({ key: "c", value: "three" });
    const done = completion(tx);
    tx.commit();
    check(await done === "complete", "the transaction completes");
    const read = () => db.transaction([name], "readonly").objectStore(name);
    check((await answer(read().get("b"))).value === "two", "a string reads back");
    check((await answer(read().get("a"))).value === buffer, "an ArrayBuffer reads back");
    check(await answer(read().get("missing")) === undefined, "a missing key reads as undefined");
    check(await answer(read().count()) === 3 && await answer(read().count("a")) === 1 && await answer(read().count("zz")) === 0, "counts: all, one key, a missing key");
    check((await answer(read().getAllKeys())).join(",") === "a,b,c", "keys come back in order");
    check((await answer(read().getAll())).map((e) => e.key).join(",") === "a,b,c", "entries come back in order");

    console.log("check then write in one transaction (promiseAtPut's shape)");
    tx = db.transaction(name, "readwrite");
    store = tx.objectStore(name);
    const finished = completion(tx);
    const countRequest = store.count("b");
    countRequest.onsuccess = () => {
        if (countRequest.result > 0) { store.put({ key: "b", value: "two again" }); } else { store.add({ key: "b", value: "new" }); }
        tx.commit();
    };
    check(await finished === "complete", "it completes after the write made from the callback");
    check((await answer(read().get("b"))).value === "two again", "the update is there");

    console.log("a transaction left alone completes by itself");
    tx = db.transaction(name, "readwrite");
    const auto = completion(tx);
    tx.objectStore(name).delete("c");
    check(await auto === "complete", "no commit() needed");
    check(await answer(read().count("c")) === 0, "the delete took effect");
    let threw = null;
    try { tx.objectStore(name).put({ key: "late", value: "x" }); } catch (e) { threw = e; }
    check(threw && threw.name === "TransactionInactiveError", "a finished transaction refuses more requests");

    console.log("abort undoes the transaction's writes");
    tx = db.transaction(name, "readwrite");
    store = tx.objectStore(name);
    store.put({ key: "a", value: "overwritten" });
    store.add({ key: "d", value: "added" });
    store.delete("b");
    const aborted = completion(tx);
    store.count().onsuccess = () => tx.abort(); // from a callback: a transaction left idle has already completed
    check(await aborted === "aborted", "abort is reported");
    check((await answer(read().get("a"))).value === buffer, "an overwrite is undone");
    check(await answer(read().count("d")) === 0, "an add is undone");
    check((await answer(read().get("b"))).value === "two again", "a delete is undone");

    console.log("adding an existing key fails and aborts");
    tx = db.transaction(name, "readwrite");
    store = tx.objectStore(name);
    store.put({ key: "e", value: "before the failure" });
    const duplicate = store.add({ key: "a", value: "again" });
    let failure = null;
    await new Promise((resolve) => { duplicate.onerror = (event) => { failure = event.target.error; resolve(); }; });
    check(failure && failure.name === "ConstraintError", "the request reports a ConstraintError");
    check(await answer(read().count("e")) === 0, "the rest of that transaction is undone");

    console.log("a read-only transaction refuses writes");
    threw = null;
    try { read().put({ key: "x", value: "y" }); } catch (e) { threw = e; }
    check(threw && threw.name === "ReadOnlyError", "put throws");

    console.log("cursor, close and reopen, clear, delete");
    const sizes = [];
    await new Promise((resolve) => {
        const cursorTx = db.transaction(db.objectStoreNames, "readonly");
        cursorTx.oncomplete = resolve;
        cursorTx.objectStore(name).openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) { sizes.push(cursor.value.key); cursor.continue(); }
        };
    });
    check(sizes.join(",") === "a,b", "a cursor walks every entry, then the transaction completes");
    db.close();
    threw = null;
    try { db.transaction(name, "readwrite"); } catch (e) { threw = e; }
    check(threw && /connection is closing/i.test(threw.message), "a closed connection refuses transactions, as SvIndexedDbTx expects");
    const second = await openDb(idb, name);
    check(second.upgrades === 0, "reopening does not ask for the store again");
    check(await answer(second.db.transaction([name], "readonly").objectStore(name).count()) === 2, "the data is still there after close and reopen");
    const clearTx = second.db.transaction([name], "readwrite");
    const cleared = completion(clearTx);
    clearTx.objectStore(name).clear();
    await cleared;
    check(await answer(second.db.transaction([name], "readonly").objectStore(name).count()) === 0, "clear empties the store");
    check((await idb.databases()).some((d) => d.name === name), "the database is listed");
    await answer(idb.deleteDatabase(name));
    check(!(await idb.databases()).some((d) => d.name === name), "and gone after deleteDatabase");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed ? 1 : 0);
}

main().catch((error) => { console.error(error); process.exit(1); });
