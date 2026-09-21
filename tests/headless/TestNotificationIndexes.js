#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvNotificationCenter's observation indexes are maintained as
 * observations come and go, and a post reaches exactly the observations the
 * brute-force match would — for every combination of sender / no sender and
 * name / no name — in the same delivery order as before (sender-agnostic
 * observers first). Also: removeObserver and stopWatching keep the indexes in
 * step with the observation map, and a rebuilt index equals the maintained one.
 *
 * Usage (from this directory):  node TestNotificationIndexes.js
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
    const SvNotificationCenter = SvGlobals.get("SvNotificationCenter");
    const SvNotification = SvGlobals.get("SvNotification");
    const ProtoClass = SvGlobals.get("ProtoClass");

    (class TestNcObserver extends ProtoClass {
        initPrototypeSlots () {
            {
                const slot = this.newSlot("received", null);
                slot.setSlotType("Array");
            }
        }
        init () { super.init(); this.setReceived([]); return this; }
        onAny (note) { this.received().push(note); }
    }).initThisClass();
    const TestNcObserver = SvGlobals.get("TestNcObserver");

    const center = SvNotificationCenter.clone(); // a private center: the shared one carries the boot's observers
    const senderA = ProtoClass.clone();
    const senderB = ProtoClass.clone();
    const observe = (sender, name) => {
        const observer = TestNcObserver.clone();
        const obs = center.newObservation().setObserver(observer).setSender(sender).setName(name).setSendName("onAny");
        obs.startWatching();
        return { observer, obs, sender, name };
    };

    console.log("\nEvery sender/name combination is matched exactly as a brute-force filter would");
    const combos = [
        observe(null, null), observe(null, "alpha"), observe(null, "beta"),
        observe(senderA, null), observe(senderA, "alpha"), observe(senderA, "beta"),
        observe(senderB, null), observe(senderB, "alpha")
    ];
    const bruteForce = (note) => combos.filter(c => (c.sender === null || c.sender === note.sender()) && (c.name === null || c.name === note.name())).map(c => c.obs);
    const notes = [
        [senderA, "alpha"], [senderA, "beta"], [senderA, "gamma"], [senderB, "alpha"], [senderB, "beta"],
        [null, "alpha"], [null, "gamma"], [ProtoClass.clone(), "alpha"]
    ];
    notes.forEach(([sender, name]) => {
        const note = SvNotification.clone().setSender(sender).setName(name);
        const matched = [...center.observationsMatchingNotification(note)];
        const expected = bruteForce(note);
        const same = matched.length === expected.length && expected.every(o => matched.includes(o));
        check(same, "note(" + (sender === null ? "null" : (sender === senderA ? "A" : (sender === senderB ? "B" : "other"))) + ", " + name + ") reaches " + matched.length + " observer(s)" + (same ? "" : " — expected " + expected.length));
    });

    console.log("\nDelivery order: sender-agnostic observers first, then the sender's own");
    {
        const note = SvNotification.clone().setSender(senderA).setName("alpha");
        const order = [...center.observationsMatchingNotification(note)].map(o => o.sender() === null ? "null" : "A");
        check(order.join(",") === "null,null,A,A", "order " + order.join(","));
    }

    console.log("\nPosting delivers through the indexes");
    {
        center.newNote().setSender(senderA).setName("alpha").post();
        center.processPostQueue();
        const got = combos.map(c => c.observer.received().length);
        check(got.join("") === "11011000", "received per combo: " + got.join(""));
    }

    console.log("\nRemoval keeps the indexes in step with the map");
    {
        combos[4].obs.stopWatching(); // A/alpha
        let note = SvNotification.clone().setSender(senderA).setName("alpha");
        check(!center.observationsMatchingNotification(note).has(combos[4].obs) && center.observationsMatchingNotification(note).size === 3, "a stopped observation no longer matches (" + center.observationsMatchingNotification(note).size + " left)");
        center.removeObserver(combos[1].observer); // null/alpha
        check(center.observationsMatchingNotification(note).size === 2 && !center.hasObservation(combos[1].obs), "removeObserver drops its observation from the map and the indexes");
        combos[2].obs.stopWatching(); // null/beta — the only "beta" observation besides A/beta
        combos[5].obs.stopWatching(); // A/beta
        check(!center.nameIndex().has("beta") && center.nameIndex().has("alpha"), "a name with no observations left has no index entry");
    }

    console.log("\nA rebuilt index equals the maintained one");
    {
        const before = notes.map(([sender, name]) => [...center.observationsMatchingNotification(SvNotification.clone().setSender(sender).setName(name))].map(o => o.obsHash()).sort().join("|"));
        center.calcIndexes();
        const after = notes.map(([sender, name]) => [...center.observationsMatchingNotification(SvNotification.clone().setSender(sender).setName(name))].map(o => o.obsHash()).sort().join("|"));
        check(before.join("\n") === after.join("\n"), "calcIndexes reproduces the maintained indexes for every note");
    }
}

main().then(() => {
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}).catch((e) => { console.error("Test run failed:", e); process.exit(1); });
