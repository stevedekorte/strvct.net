#!/usr/bin/env node

"use strict";

/**
 * Headless test: a deploy going live while a page loads. A resource that
 * still mismatches its index hash after a cache-bypassing fetch throws an
 * SvBuildMismatchError; the resource manager then reloads the page once if
 * the served index changed (a new build), and lets the error stand if it
 * didn't (a broken build), if this tab already reloaded for that build, or
 * if the error is anything else. No network, no browser: the served hash,
 * the reload and the session flag are stand-ins.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestBuildMismatchRecovery.js
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

const OLD = "a".repeat(64);
const NEW = "b".repeat(64);

// a resource manager whose network, reload and session flag are stand-ins
function managerWith ({ served = NEW, browser = true, reloadedFor = null } = {}) {
    const m = SvGlobals.get("SvResourceManager").clone();
    m._indexHash = OLD;
    m.reloads = 0;
    m.flag = reloadedFor;
    m.asyncServedIndexHash = async () => served;
    m.canReloadPage = () => browser;
    m.reloadPage = () => { m.reloads++; };
    m.reloadedForIndexHash = () => m.flag;
    m.setReloadedForIndexHash = (h) => { m.flag = h; };
    return m;
}

function mismatchError () {
    const e = new Error("resource 'x' does not match its index hash");
    e.name = "SvBuildMismatchError";
    return e;
}

// "rethrew" | "reloading" (the recovery never settles once it reloads)
async function outcome (m, error) {
    const settled = m.asyncRecoverFromBuildMismatch(error).then(() => "returned", (e) => (e === error ? "rethrew" : "threw " + e.message));
    const pending = new Promise((resolve) => setTimeout(() => resolve("reloading"), 50));
    return await Promise.race([settled, pending]);
}

async function main () {
    await boot();

    console.log("The resource names its error");
    const r = SvGlobals.get("SvUrlResource").clone().setPath("app-version.json");
    r.promiseJustLoad = async function () { this._data = new TextEncoder().encode("another build's bytes").buffer; return this; };
    let thrown = null;
    try {
        await r.promiseJustLoadVerified(OLD);
    } catch (e) {
        thrown = e;
    }
    check(thrown && thrown.name === "SvBuildMismatchError", "a second mismatch throws an SvBuildMismatchError (got " + (thrown ? thrown.name : "nothing") + ")");

    console.log("\nA new build went live mid-load: reload once");
    let m = managerWith();
    check(await outcome(m, mismatchError()) === "reloading" && m.reloads === 1, "the served index changed: the page reloads");
    check(m.flag === NEW, "...and the tab remembers it reloaded for that build");

    console.log("\nOtherwise the error stands");
    m = managerWith({ reloadedFor: NEW });
    check(await outcome(m, mismatchError()) === "rethrew" && m.reloads === 0, "already reloaded for this build: no loop");
    m = managerWith({ served: OLD });
    check(await outcome(m, mismatchError()) === "rethrew" && m.reloads === 0, "the index hasn't changed (a broken build): a reload won't help");
    m = managerWith({ served: null });
    check(await outcome(m, mismatchError()) === "rethrew" && m.reloads === 0, "the served index can't be read: no reload");
    m = managerWith({ browser: false });
    check(await outcome(m, mismatchError()) === "rethrew" && m.reloads === 0, "not in a browser (headless): no reload");
    m = managerWith();
    check(await outcome(m, new Error("something else")) === "rethrew" && m.reloads === 0, "any other error passes through untouched");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
