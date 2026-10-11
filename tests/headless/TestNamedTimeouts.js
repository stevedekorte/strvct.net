#!/usr/bin/env node

"use strict";

/**
 * Headless test: named timeouts (Object_timeouts).
 *
 * clearTimeoutNamed(name) used to cancel the timer but leave the name in the
 * name -> id map (it removed an entry keyed by the timer id instead), so
 * hasTimeoutNamed stayed true after a clear and re-arming the name warned
 * "timeout with that name already exists".
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # build build/_index.json if missing/stale
 *   node tests/headless/TestNamedTimeouts.js
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

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function main () {
    await boot();
    const target = SvGlobals.get("SvNode").clone();
    let fired = 0;

    console.log("\nA cleared named timeout is gone, and never fires");
    target.addTimeout(() => fired++, 50, "t");
    check(target.hasTimeoutNamed("t"), "armed");
    target.clearTimeoutNamed("t");
    check(!target.hasTimeoutNamed("t"), "cleared: the name is gone");
    await sleep(120);
    check(fired === 0, "and it did not fire");

    console.log("\nRe-arming a name replaces the timer quietly");
    const warnings = [];
    const realWarn = console.warn;
    console.warn = (m) => warnings.push(String(m));
    target.addTimeout(() => fired++, 50, "t");
    target.addTimeout(() => fired++, 50, "t");
    console.warn = realWarn;
    check(warnings.length === 0, "no warning: " + JSON.stringify(warnings));
    await sleep(120);
    check(fired === 1, "only the second fired: " + fired);
    check(!target.hasTimeoutNamed("t"), "and its name is gone once it fired");

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
