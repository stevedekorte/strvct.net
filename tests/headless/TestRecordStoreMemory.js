#!/usr/bin/env node

"use strict";

/**
 * Headless test: the Record Store interface (SvRecordStoreProtocol) against its
 * reference backing, SvMemoryRecordStore, driven by the row fixture
 * (fixtures/record-store-rows.json, the worked example of Plans/Record Store §3)
 * and the row schema (fixtures/record-store-row.schema.json).
 *
 * This is the suite every other backing (IndexedDB, Firestore) must also pass:
 * keep it backing-neutral — it talks only through the protocol's methods.
 *
 * Usage (from this directory):  node TestRecordStoreMemory.js
 */

const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");
const Ajv = require("ajv");

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

function loadFixture () {
    const dir = path.join(__dirname, "fixtures");
    return {
        schema: JSON.parse(fs.readFileSync(path.join(dir, "record-store-row.schema.json"), "utf8")),
        data: JSON.parse(fs.readFileSync(path.join(dir, "record-store-rows.json"), "utf8"))
    };
}

const copy = (v) => JSON.parse(JSON.stringify(v));
const ids = (rows) => rows.map(r => r.objectId).join(",");

async function refusal (fn) {
    try { await fn(); return null; } catch (e) { return e.message; }
}

async function main () {
    await boot();
    const { schema, data } = loadFixture();
    const SvRecordRow = SvGlobals.get("SvRecordRow");
    const SvMemoryRecordStore = SvGlobals.get("SvMemoryRecordStore");
    const SvRecordStoreProtocol = SvGlobals.get("SvRecordStoreProtocol");
    const validate = new Ajv().compile(schema);

    console.log("\nThe fixture and the code agree on the row shape");
    check(data.rows.every(row => validate(row)), "every fixture row validates against the schema");
    check(data.rows.every(row => SvRecordRow.validationErrors(row).length === 0), "every fixture row passes SvRecordRow's checks");
    data.invalidRows.forEach(({ why, row }) => {
        check(!validate(row) || SvRecordRow.validationErrors(row).length > 0, "refused: " + why);
    });
    check(new Set(SvRecordRow.columnNames()).size === Object.keys(schema.properties).length
        && SvRecordRow.columnNames().every(name => schema.properties[name]), "the schema's columns are SvRecordRow's columns");

    console.log("\nThe backing declares the protocol");
    const store = SvMemoryRecordStore.clone();
    check(store.conformsToProtocol(SvRecordStoreProtocol), "SvMemoryRecordStore conforms to SvRecordStoreProtocol");

    console.log("\nOpen: root by key, live records only");
    await store.asyncPut(copy(data.rows));
    let opened = await store.asyncOpen("camp-Crypt");
    check(opened && opened.root.objectId === "camp-Crypt" && opened.root.poolId === "camp-Crypt", "the root is the row whose objectId equals the poolId");
    check(opened.version === 1234 && opened.state === "ready", "version and state come from the root row");
    check(opened.records.length === 5 && !opened.records.some(SvRecordRow.isRoot.bind(SvRecordRow)), "the records are the pool's other live rows (" + ids(opened.records) + ")");
    opened = await store.asyncOpen("sess-abc");
    check(opened.records.length === 4 && !opened.records.some(r => r.objectId === "r-msg-41"), "a tombstone is not a record of an open pool");
    check(opened.records.some(r => r.payloadJson.includes("{\"**\":\"char-de07\"}")), "a far ref rides inside the payload untouched");
    check((await store.asyncOpen("home-u123")).records.length === 0, "a folder pool holds only its root record");
    check((await store.asyncOpen("nope")) === null, "an unknown pool opens as null");
    check((await store.asyncResolveFar("char-de07")).root.objectId === "char-de07", "resolveFar opens the far pool");

    console.log("\nChildren: membership is a query, ordered by (orderKey, objectId)");
    check(ids(await store.asyncChildren("home-u123")) === "genre-4nQq", "a home's children are its child pools' root rows");
    check(ids(await store.asyncChildren("realm-ZF36")) === "lib-ZF36,defchars-ZF36", "a realm's children in orderKey order (\"10\" before \"20\")");
    check(ids(await store.asyncChildren("lib-ZF36")) === "camp-Crypt", "a library's children");
    check(ids(await store.asyncChildren("r-chat")) === "r-msg-42,r-msg-43", "a windowed collection's live elements, tombstone excluded, same index");
    check(ids(await store.asyncChildren("r-chat", { limit: 1 })) === "r-msg-42", "range: limit");
    check(ids(await store.asyncChildren("r-chat", { after: "0042", limit: 5 })) === "r-msg-43", "range: after an order key");
    check((await store.asyncChildren("r-loc1")).length === 0, "a core record that owns nothing has no children rows");

    console.log("\nPut is all-or-nothing");
    const before = (await store.asyncOpen("camp-Crypt")).records.length;
    const bad = copy(data.invalidRows[0].row);
    const good = SvRecordRow.newRow({ poolId: "camp-Crypt", objectId: "r-new", payloadJson: "{}" });
    let message = await refusal(() => store.asyncPut([good, bad]));
    check(message && message.includes("isDeleted"), "an invalid row refuses the batch with the reason (" + message + ")");
    check((await store.asyncOpen("camp-Crypt")).records.length === before, "…and the valid row in the same batch was not written");

    console.log("\nCommit: compare-and-set on the root's version");
    const changed = SvRecordRow.newRow({ poolId: "camp-Crypt", objectId: "r-loc1", payloadJson: "{\"type\":\"UoLocation\",\"entries\":[[\"name\",\"Antechamber (lit)\"]]}" });
    let result = await store.asyncCommit({ poolId: "camp-Crypt", baseVersion: 1234, requestId: "req-1", writes: [changed], deletes: [{ poolId: "camp-Crypt", objectId: "r-art1" }] });
    check(result.status === "committed" && result.version === 1235, "a commit at the current version advances it by one: " + JSON.stringify(result));
    opened = await store.asyncOpen("camp-Crypt");
    check(opened.version === 1235, "the root row carries the new version");
    const loc = opened.records.find(r => r.objectId === "r-loc1");
    check(loc.payloadJson.includes("(lit)") && loc.modifiedVersion === 1235, "the written row has the new payload and is stamped with the commit's version");
    check(!opened.records.some(r => r.objectId === "r-art1"), "the deleted record is gone from the open set");

    console.log("\nReadChanges: the catch-up protocol");
    let changes = await store.asyncReadChanges("camp-Crypt", 1234);
    check(ids(changes.rows) === "r-loc1" && ids(changes.tombstones) === "r-art1" && changes.version === 1235 && changes.reloadRequired === false,
        "since 1234: one row, one tombstone, the new version, no reload");
    changes = await store.asyncReadChanges("camp-Crypt", 1235);
    check(changes.rows.length === 0 && changes.tombstones.length === 0, "since the current version: nothing");
    store.setMinDeltaVersion("camp-Crypt", 1000);
    check((await store.asyncReadChanges("camp-Crypt", 900)).reloadRequired === true, "a reader older than the retention floor must reload");
    check((await store.asyncReadChanges("camp-Crypt", 1200)).reloadRequired === false, "a reader at or past the floor catches up");

    console.log("\nCommit: conflicts, retries and refusals");
    result = await store.asyncCommit({ poolId: "camp-Crypt", baseVersion: 1234, requestId: "req-2", writes: [changed], deletes: [] });
    check(result.status === "conflict" && result.version === 1235, "a stale baseVersion conflicts and reports the current version");
    result = await store.asyncCommit({ poolId: "camp-Crypt", baseVersion: 1234, requestId: "req-1", writes: [changed], deletes: [{ poolId: "camp-Crypt", objectId: "r-art1" }] });
    check(result.status === "committed" && result.version === 1235 && (await store.asyncOpen("camp-Crypt")).version === 1235, "a retry of an acknowledged request gets the same answer and changes nothing");
    result = await store.asyncCommit({ poolId: "camp-Crypt", baseVersion: 1235, requestId: "req-3", writes: [Object.assign(SvRecordRow.newRow({ poolId: "camp-Crypt", objectId: "r-det", payloadJson: "{}" }), { version: 7 })], deletes: [] });
    check(result.status === "refused" && result.reason.includes("server-owned"), "a write carrying a server-owned column is refused: " + result.reason);
    result = await store.asyncCommit({ poolId: "camp-Crypt", baseVersion: 1235, requestId: "req-4", writes: [SvRecordRow.newRow({ poolId: "sess-abc", objectId: "r-chat", payloadJson: "{}" })], deletes: [] });
    check(result.status === "refused" && result.reason.includes("another pool"), "a write for another pool is refused");
    result = await store.asyncCommit({ poolId: "camp-Crypt", baseVersion: 1235, requestId: "req-5", writes: [], deletes: [{ poolId: "camp-Crypt", objectId: "camp-Crypt" }] });
    check(result.status === "refused" && result.reason.includes("root"), "deleting the root through a commit is refused");
    result = await store.asyncCommit({ poolId: "nope", baseVersion: 0, requestId: "req-6", writes: [], deletes: [] });
    check(result.status === "refused", "a commit to an unknown pool is refused");
    check((await store.asyncOpen("camp-Crypt")).version === 1235, "no refused or conflicting commit moved the version");
    result = await store.asyncCommit({ poolId: "camp-Crypt", baseVersion: 1235, requestId: "req-7",
        writes: [SvRecordRow.newRow({ poolId: "camp-Crypt", objectId: "camp-Crypt", parentId: "lib-ZF36", orderKey: "Crypt", payloadJson: "{\"type\":\"UoCampaign\",\"entries\":[[\"title\",\"Crypt of Alatar II\"]]}" })], deletes: [] });
    opened = await store.asyncOpen("camp-Crypt");
    check(result.status === "committed" && opened.version === 1236 && opened.root.ownerUid === "u123" && opened.root.payloadJson.includes("II"),
        "writing the root record keeps the server-owned columns and advances the version");

    console.log("\nDelete removes from the mirror");
    await store.asyncDelete([{ poolId: "sess-abc", objectId: "r-msg-43" }]);
    check(ids(await store.asyncChildren("r-chat")) === "r-msg-42", "a deleted element leaves its collection");
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
