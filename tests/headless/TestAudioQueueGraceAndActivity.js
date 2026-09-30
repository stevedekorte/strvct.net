#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvAudioQueue gives a skip-if-not-ready sound (a sound effect
 * whose bytes are still downloading) a short grace before skipping it —
 * skipping at once dropped nearly every first play mid-narration — and
 * announces when it goes active or idle (onAudioQueueActivityChanged), once
 * per change, not per sound, so a bed can duck under the narration.
 *
 * Usage (from this directory):  node TestAudioQueueGraceAndActivity.js
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
    const SvAudioQueue = SvGlobals.get("SvAudioQueue");
    const sleep = (ms) => new Promise(r => setTimeout(r, ms));
    const played = [];
    const fakeSound = (name, { readyAfterMs = 0, playMs = 50, effect = false } = {}) => {
        let ready = readyAfterMs === 0;
        const readyPromise = new Promise(r => setTimeout(() => { ready = true; r(); }, readyAfterMs));
        const s = {
            name, delegates: new Set(),
            skipIfNotReady: () => effect, isReadyToPlayNow: () => ready, promiseToDecode: () => readyPromise,
            addDelegate (d) { this.delegates.add(d); }, removeDelegate (d) { this.delegates.delete(d); },
            description: () => name, stop () {},
            async play () { played.push(name); await sleep(playMs); this.delegates.forEach(d => d.onSoundEnded && d.onSoundEnded(this)); }
        };
        return s;
    };

    console.log("\nA late effect gets a grace; a much later one is still skipped");
    const q = SvAudioQueue.clone();
    const notes = [];
    q.postNoteNamed = (name) => { notes.push(name + ":" + q.isActive()); return q; };
    q.queueSvWaSound(fakeSound("sentence 1"));
    q.queueSvWaSound(fakeSound("effect ready in 0.5s", { readyAfterMs: 500, effect: true }));
    q.queueSvWaSound(fakeSound("sentence 2"));
    q.queueSvWaSound(fakeSound("effect ready in 4s", { readyAfterMs: 4000, effect: true }));
    q.queueSvWaSound(fakeSound("sentence 3"));
    for (let i = 0; i < 80 && q.isActive(); i++) { await sleep(100); }
    await sleep(100);
    check(played.includes("effect ready in 0.5s"), "an effect whose bytes land within the grace plays: " + played.join(" > "));
    check(!played.includes("effect ready in 4s") && played.includes("sentence 3"), "one far past the grace is skipped, and the narration goes on");
    check(played.indexOf("effect ready in 0.5s") === 1, "…in its place beside its sentence");

    console.log("\nActivity is announced per change, not per sound");
    check(notes.length === 2 && notes[0] === "onAudioQueueActivityChanged:true" && notes[1] === "onAudioQueueActivityChanged:false", "one 'active' and one 'idle' for the whole run: " + notes.join(", "));

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
