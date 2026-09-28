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

    console.log("\nA stored blob, in the store's blob database");
    const first = SvPersistentObjectPool.clone();
    first.setName(name);
    await first.promiseOpen();
    const hash = await first.blobPool().asyncStoreBlob(new Blob(["logout wipe probe"]));
    check(await first.blobPool().asyncHasBlob(hash), "the blob is stored");
    await first.blobPool().close();

    console.log("\nThe boot-time wipe: clear, then open");
    const booting = SvPersistentObjectPool.clone();
    booting.setName(name);
    let clearError = null;
    try { await booting.asyncClearBlobPool(); } catch (e) { clearError = e; }
    check(!clearError, "clearing before the store opens succeeds" + (clearError ? ": " + clearError.message : ""));
    let openError = null;
    try { await booting.promiseOpen(); } catch (e) { openError = e; }
    check(!openError && booting.blobPool().isOpen(), "…and the store then opens" + (openError ? ": " + openError.message : ""));
    check(booting.blobPool().name() === name + "/blobs", "the blob pool is the store's own: " + booting.blobPool().name());
    check(!(await booting.blobPool().asyncHasBlob(hash)), "the store's blobs were the ones cleared");

    console.log("\nA bare clear of an unopened blob pool is refused");
    await booting.blobPool().close();
    let bareError = null;
    try { await SvBlobPool.shared().asyncClear(); } catch (e) { bareError = e; }
    check(bareError && /not open/.test(bareError.message), "asyncClear asks to be opened first");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
