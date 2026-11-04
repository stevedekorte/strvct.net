#!/usr/bin/env node

"use strict";

/**
 * Headless test: a live node (/live/{sessionId}/{uid}) is written again after
 * the realtime database reconnects. RTDB runs onDisconnect on the server when
 * a connection drops, removing the node, and a reconnect does not restore it:
 * a table worker whose connection blipped read as "The host is offline" to
 * every player while it ran on (dev e2e, 2026-11-04).
 *
 * A fake firebase.database() stands in for RTDB: it records each set and
 * onDisconnect arm, and lets the test drive .info/connected.
 *
 * Usage (from this directory):  node TestLiveNodeReannounce.js
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

/** A minimal RTDB: sets and onDisconnect arms by path, and a drivable .info/connected. */
function fakeFirebase () {
    const db = { sets: [], arms: [], removes: [], connectedListeners: [] };
    const refAt = (p) => ({
        child: (c) => refAt(p + "/" + c),
        set: async (v) => { db.sets.push({ path: p, value: v }); },
        remove: async () => { db.removes.push(p); },
        onDisconnect: () => ({
            remove: () => { db.arms.push(p); return Promise.resolve(); },
            cancel: () => Promise.resolve()
        }),
        on: (event, cb) => { if (p === ".info/connected") { db.connectedListeners.push(cb); } }
    });
    const database = () => ({ ref: refAt });
    database.ServerValue = { TIMESTAMP: "<ts>" };
    db.setConnected = (isConnected) => db.connectedListeners.forEach(cb => cb({ val: () => isConnected }));
    return { firebase: { database }, db };
}

async function main () {
    await boot();
    const { firebase, db } = fakeFirebase();
    globalThis.firebase = firebase;
    const backend = SvGlobals.get("SvFirebaseFsBackend").clone();
    const quiet = console.warn;
    console.warn = () => {};
    try {
        console.log("\nA member announces itself");
        db.setConnected(false);
        await backend.setLiveNode("session1", "uidA", { uid: "uidA", isHost: true });
        db.setConnected(true); // the first connection
        await new Promise(r => setTimeout(r, 0));
        const firstSets = db.sets.length;
        check(firstSets === 1, "the first connection is not taken for a reconnect: one write, not two (" + firstSets + ")");
        check(db.sets.some(s => s.path === "live/session1/uidA" && s.value.isHost === true), "its live node is written");
        check(db.arms.includes("live/session1/uidA"), "with its onDisconnect removal armed");

        console.log("\nThe connection drops and comes back");
        db.sets.length = 0; db.arms.length = 0;
        db.setConnected(false);
        db.setConnected(true);
        await new Promise(r => setTimeout(r, 0));
        check(db.sets.length === 1 && db.sets[0].path === "live/session1/uidA" && db.sets[0].value.isHost === true, "the node is written again (" + db.sets.length + " write)");
        check(db.arms.length === 1, "and its onDisconnect re-armed");

        console.log("\nA member that left is not brought back");
        await backend.clearLiveNode("session1", "uidA");
        db.sets.length = 0;
        db.setConnected(false);
        db.setConnected(true);
        await new Promise(r => setTimeout(r, 0));
        check(db.sets.length === 0, "a cleared node is not re-announced");
        check(db.connectedListeners.length === 1, "one connection watch, however many announces (" + db.connectedListeners.length + ")");
        check(firstSets >= 1, "(sanity) the first announce wrote");
    } finally {
        console.warn = quiet;
    }
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
