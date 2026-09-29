#!/usr/bin/env node

"use strict";

/**
 * Headless test: the boot-time logout wipe clears a store's blob pool BEFORE
 * the store opens (SvApp.initAndOpenStore → clear-on-boot). The blob pool is a
 * singleton with no name until its object pool opens it, so clearing it bare
 * opened and cleared some other database, then the store's open renamed an
 * open folder ("can't change the path on an open SvIndexedDbFolder instance",
 * 2026-09-28). The pool now clears its blob pool under its own name.
 *
 * Usage (from this directory):  node TestBlobPoolClearBeforeOpen.js
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

async function main () {
    await boot();
    const SvPersistentObjectPool = SvGlobals.get("SvPersistentObjectPool");
    const SvBlobPool = SvGlobals.get("SvBlobPool");
    const name = "TestBlobPoolClearBeforeOpen-" + Date.now();

    console.log("\nThe boot-time wipe: clear, then open");
    const bare = SvBlobPool.shared();
    let bareError = null;
    try { await bare.asyncClear(); } catch (e) { bareError = e; }
    check(bareError && /not open/.test(bareError.message), "a bare clear of the unnamed, unopened blob pool is refused (it cleared another database)");
    const booting = SvPersistentObjectPool.clone();
    booting.setName(name);
    let clearError = null;
    try { await booting.asyncClearBlobPool(); } catch (e) { clearError = e; }
    check(!clearError, "the store clears its blob pool before it opens" + (clearError ? ": " + clearError.message : ""));
    let openError = null;
    try { await booting.promiseOpen(); } catch (e) { openError = e; }
    check(!openError && booting.blobPool().isOpen(), "…and then opens (it asserted: \"can't change the path on an open SvIndexedDbFolder\")" + (openError ? ": " + openError.message : ""));
    check(booting.blobPool().name() === name + "/blobs", "the blob pool is the store's own: " + booting.blobPool().name());

    console.log("\nThe wipe clears the store's own blobs");
    const hash = await booting.blobPool().asyncStoreBlob(new Blob(["logout wipe probe"]));
    check(await booting.blobPool().asyncHasBlob(hash), "a stored blob is there");
    await booting.asyncClearBlobPool();
    check(!(await booting.blobPool().asyncHasBlob(hash)), "…and gone after the wipe");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
