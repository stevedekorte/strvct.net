#!/usr/bin/env node

"use strict";

/**
 * Headless test: every folder kind keeps the SvStorageFolder / SvStorageTx
 * contract. The same checks run against SvMemoryDbFolder (the browser's
 * Lockdown Mode store) and the server's SvIndexedDbFolder (LevelDB), so the
 * memory kind is held to the behaviour of a real one, not to its own idea of it.
 * Also checks that a kind missing a required method fails when it loads.
 *
 * Usage (from this directory):  node TestStorageFolders.js
 */

const fs = require("fs");
const os = require("os");
const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);
process.env.SV_LEVELDB_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "sv-storage-folders-")) + "/";

let passed = 0;
let failed = 0;
function check (condition, message) {
    if (condition) { passed++; console.log("  \x1b[32m✓\x1b[0m " + message); }
    else { failed++; console.log("  \x1b[31m✗\x1b[0m " + message); }
}

async function rejection (promise) {
    try { await promise; return null; } catch (e) { return e; }
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

const text = (buffer) => Buffer.from(buffer).toString("utf8");

async function checkKind (FolderClass) {
    const kind = FolderClass.svType() + (FolderClass.svType() === "SvIndexedDbFolder" ? " (LevelDB)" : "");
    console.log("\n" + kind);
    const folder = FolderClass.clone().setPath("contract-test-" + Date.now() + "/");
    await folder.promiseOpen();
    check(folder.isOpen(), "opens");
    check(folder.txClass().prototype instanceof SvGlobals.get("SvStorageTx"), "its transactions are SvStorageTxs");

    await folder.promiseAtPut("b", "two");
    await folder.promiseAtPut("a", new TextEncoder().encode("one").buffer);
    check(await folder.promiseAt("b") === "two", "a string reads back");
    const a = await folder.promiseAt("a");
    check(a !== undefined && text(a) === "one", "an ArrayBuffer reads back");
    check(await folder.promiseAt("missing") === undefined, "a missing key reads as undefined");
    check(await folder.promiseCount() === 2 && await folder.promiseCount("a") === 1 && await folder.promiseCount("zz") === 0, "counts: all, one key, a missing key");
    check(await folder.promiseHasKey("b") && !(await folder.promiseHasKey("zz")), "promiseHasKey");
    check((await folder.promiseAllKeys()).join(",") === "a,b", "keys in order");
    check(Array.from((await folder.promiseAsMap()).keys()).join(",") === "a,b", "promiseAsMap");
    await folder.promiseAtPut("b", "two again");
    check(await folder.promiseAt("b") === "two again", "promiseAtPut replaces");
    await folder.promiseAtPut("b", undefined);
    check(await folder.promiseCount("b") === 0, "promiseAtPut with undefined removes");

    let tx = folder.newTransaction();
    tx.setTxId("first").setIsDebugging(false); // as SvPersistentAtomicMap does
    tx.begin();
    tx.atAdd("c", "three");
    tx.atUpdate("a", "one, updated");
    tx.atAdd("d", "four");
    tx.removeAt("d");
    check(await folder.promiseCount("c") === 0, "a transaction's writes are not seen before commit");
    await tx.promiseCommit();
    check(tx.isCompleted() && await folder.promiseAt("c") === "three" && await folder.promiseAt("a") === "one, updated", "a committed transaction's writes are there");
    check(await folder.promiseCount("d") === 0, "writes apply in order (add then remove)");
    check(folder.lastTx() === tx, "the folder knows its last transaction");

    tx = folder.newTransaction();
    tx.begin();
    tx.atUpdate("e", "five");
    tx.abort();
    check(tx.isAborted() && await folder.promiseCount("e") === 0, "an aborted transaction writes nothing");

    tx = await folder.promiseNewTx();
    tx.begin();
    tx.atUpdate("f", "six");
    tx.atAdd("a", "clash");
    const clash = await rejection(tx.promiseCommit());
    check(clash !== null, "atAdd on an existing key fails the commit");
    check(await folder.promiseCount("f") === 0 && await folder.promiseAt("a") === "one, updated", "…and none of that transaction's writes are applied");

    await folder.promiseRemoveKeySet(new Set(["a", "c"]));
    check(await folder.promiseCount() === 0, "promiseRemoveKeySet");

    await folder.promiseAtPut("g", "seven");
    check(await folder.asyncTotalSize() > 0, "asyncTotalSize counts something");
    const child = folder.folderAt("child");
    check(child instanceof FolderClass && child.path() === folder.path() + "child/", "folderAt is the same kind, named below");

    await folder.close();
    check(!folder.isOpen(), "closes");
    const again = FolderClass.clone().setPath(folder.path());
    await again.promiseOpen();
    check(await again.promiseAt("g") === "seven", "a folder made again with the same path sees the contents");
    await again.promiseClear();
    check(await again.promiseCount() === 0, "promiseClear");
    await again.close();
    check(!(await rejection(again.promiseDelete())), "promiseDelete");
}

async function main () {
    await boot();
    const SvStorageFolder = SvGlobals.get("SvStorageFolder");

    console.log("choosing a kind");
    check(SvStorageFolder.usesMemory() === false, "under Node, folders are on disk");
    check(SvStorageFolder.newFolder() instanceof SvGlobals.get("SvIndexedDbFolder"), "newFolder() makes an SvIndexedDbFolder");

    await checkKind(SvGlobals.get("SvMemoryDbFolder"));
    await checkKind(SvGlobals.get("SvIndexedDbFolder"));

    console.log("\nthe contract is checked when a kind loads");
    let error = null;
    try {
        (class SvIncompleteFolder extends SvStorageFolder {
            isOpen () { return false; }
        }.initThisClass());
    } catch (e) { error = e; }
    check(error && /does not implement .*promiseAt\b/.test(error.message), "a kind missing methods fails to load: " + (error && error.message.slice(0, 90)));

    console.log("\n" + passed + " passed, " + failed + " failed");
    fs.rmSync(process.env.SV_LEVELDB_DIR, { recursive: true, force: true });
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
