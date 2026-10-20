#!/usr/bin/env node

"use strict";

/**
 * Headless test: a target unscheduled DURING a sync pass does not receive
 * an action that pass already took from the queue.
 *
 * The pass snapshots and clears the queue before sending, so a view retired
 * by an earlier action of the pass (a list re-sync replacing a tile) used to
 * get its own queued syncFromNode anyway — on a view with no element
 * ("Cannot read properties of null (reading 'getAttribute')" in
 * UoChatInputTile.syncFromNode, 2026-10-20).
 *
 * Usage (from this directory):  node TestSyncSchedulerRetire.js
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

function newTarget (log, name, onSync) {
    const t = SvGlobals.get("ProtoClass").clone();
    t.svDebugId = () => name;
    t.syncFromNode = () => { log.push(name); if (onSync) { onSync(); } };
    t.otherSync = () => log.push(name + ".other");
    return t;
}

async function main () {
    await boot();
    const scheduler = SvGlobals.get("SvSyncScheduler").shared();
    scheduler.fullSyncNow(); // drain whatever boot queued

    console.log("\nUnscheduling a whole target mid-pass");
    let log = [];
    const tile = newTarget(log, "tile");
    const list = newTarget(log, "list", () => scheduler.unscheduleTarget(tile)); // the list retires the tile
    scheduler.scheduleTargetAndMethod(list, "syncFromNode", 0);
    scheduler.scheduleTargetAndMethod(tile, "syncFromNode", 1);
    scheduler.scheduleTargetAndMethod(tile, "otherSync", 2);
    scheduler.fullSyncNow();
    check(log.join(",") === "list", "the retired target received nothing (got " + log.join(",") + ")");

    console.log("\nUnscheduling one method mid-pass");
    log = [];
    const tile2 = newTarget(log, "tile2");
    const list2 = newTarget(log, "list2", () => scheduler.unscheduleTargetAndMethod(tile2, "syncFromNode"));
    scheduler.scheduleTargetAndMethod(list2, "syncFromNode", 0);
    scheduler.scheduleTargetAndMethod(tile2, "syncFromNode", 1);
    scheduler.scheduleTargetAndMethod(tile2, "otherSync", 2);
    scheduler.fullSyncNow();
    check(log.join(",") === "list2,tile2.other", "only that method was skipped (got " + log.join(",") + ")");

    console.log("\nThe next pass is unaffected");
    log = [];
    const tile3 = newTarget(log, "tile3");
    scheduler.scheduleTargetAndMethod(tile3, "syncFromNode", 0);
    scheduler.fullSyncNow();
    check(log.join(",") === "tile3", "a later pass sends normally (got " + log.join(",") + ")");
    check(scheduler.passActions().size === 0, "the pass's snapshot is cleared afterwards");
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
