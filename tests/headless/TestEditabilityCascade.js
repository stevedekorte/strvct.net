#!/usr/bin/env node

"use strict";

/**
 * Headless test: the editability cascade (SvNode_editability), the one
 * answer views ask before offering an edit.
 *
 * Checks:
 *   - a node with no opinion (null) asks its parent, then its owner; a chain
 *     with no opinion is editable;
 *   - the nearest opinion wins, so a read-only subtree can hold an editable
 *     one and the other way round;
 *   - a pool's root with no opinion is read-only when the store its pool
 *     commits to refuses the caller's writes: the default for the document,
 *     which a node opinion overrides; a store that takes them is no opinion;
 *   - offersUserEdit(raw) is the raw capability AND the cascade;
 *   - a refused edit is not silent: noteUserEditRefused() posts
 *     onRequestUserAlert naming the node.
 *
 * Which view paths ask the cascade is checked statically by
 * TestEditabilityInViews.js.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestEditabilityCascade.js
 * (rebuild the index first if sources changed: node source/boot/index-builder/ImportsIndexer.js)
 */

const path = require("path");
const { pathToFileURL } = require("url");

const strvctRoot = path.join(__dirname, "..", "..");
process.chdir(strvctRoot);

let pass = 0, fail = 0;
const check = (c, m) => {
    if (c) {
        pass++;
        console.log("  \x1b[32m✓\x1b[0m " + m);
    } else {
        fail++;
        console.log("  \x1b[31m✗\x1b[0m " + m);
    }
};

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");
    SvGlobals.get("SvBootLoader")._bootPath = "source/boot";
    await SvGlobals.get("SvBootLoader").asyncRun();
}

function titled (title) {
    return SvGlobals.get("SvTitledNode").clone().setTitle(title);
}

function testCascade () {
    console.log("The cascade");
    const root = titled("Catalog");
    const list = titled("Monsters");
    const item = titled("Goblin");
    root.addSubnode(list);
    list.addSubnode(item);

    check(item.effectiveUserEditability() === true, "a chain with no opinion is editable");
    root.setSubtreeIsUserEditable(false);
    check(list.effectiveUserEditability() === false && item.effectiveUserEditability() === false, "a read-only root makes the whole subtree read-only");
    list.setSubtreeIsUserEditable(true);
    check(item.effectiveUserEditability() === true, "the nearest opinion wins: an editable subtree inside a read-only one");
    list.setSubtreeIsUserEditable(null);
    item.setSubtreeIsUserEditable(true);
    check(item.effectiveUserEditability() === true && list.effectiveUserEditability() === false, "a node's own opinion covers itself, not its parent");
    item.setSubtreeIsUserEditable(null);

    const field = titled("hit points");
    field.setOwnerNode(item);
    check(field.effectiveUserEditability() === false, "a node with no parent asks its owner (a field asks the node it belongs to)");
}

// Stands in for the pool `root` is the root of, with the store's answer.
function placeInPool (root, callerCanWrite) {
    const pool = { rootObject: () => root, callerCanWrite: () => callerCanWrite };
    SvGlobals.get("SvObjectPool").objectPoolRegistry().set(root, pool);
    return pool;
}

function testPoolAnswer () {
    console.log("\nThe pool's answer is the document's default");
    const folder = titled("Characters");
    const doc = titled("Shared Character");
    const sheet = titled("Abilities");
    folder.addSubnode(doc);
    doc.addSubnode(sheet);
    const pool = placeInPool(doc, null);
    check(sheet.effectiveUserEditability() === true, "a store that has not said: the chain goes on up (editable)");
    pool.callerCanWrite = () => false;
    check(doc.effectiveUserEditability() === false && sheet.effectiveUserEditability() === false, "a store that refuses the caller's writes makes the document read-only");
    check(folder.effectiveUserEditability() === true, "…and nothing above it");
    folder.setSubtreeIsUserEditable(true);
    check(sheet.effectiveUserEditability() === false, "the pool's refusal is nearer than an ancestor's opinion");
    sheet.setSubtreeIsUserEditable(true);
    check(sheet.effectiveUserEditability() === true && doc.effectiveUserEditability() === false, "a node inside may say its input is offered (it does not travel through the pool's commit)");
    doc.setSubtreeIsUserEditable(true);
    check(doc.effectiveUserEditability() === true, "the root's own opinion comes before its pool's answer (a guest's session)");
    doc.setSubtreeIsUserEditable(null);
    sheet.setSubtreeIsUserEditable(null);
    pool.callerCanWrite = () => true;
    folder.setSubtreeIsUserEditable(null);
    check(sheet.effectiveUserEditability() === true, "a store that takes the caller's writes: editable");
    folder.setSubtreeIsUserEditable(false);
    check(sheet.effectiveUserEditability() === false, "…but that is no opinion: a read-only ancestor still applies");
}

function testOffers () {
    console.log("\nOffering an edit");
    const root = titled("Catalog");
    const item = titled("Goblin");
    root.addSubnode(item);
    check(item.offersUserEdit(true) === true && item.offersUserEdit(false) === false, "editable: offers what the raw capability says");
    root.setSubtreeIsUserEditable(false);
    check(item.offersUserEdit(true) === false, "read-only: offers nothing, whatever the raw capability says");
    check(item.offersUserEdit(undefined) === false, "a missing capability is not offered");
}

async function testRefusalIsAnnounced () {
    console.log("\nA refused edit is announced");
    const list = titled("Monster Catalog");
    const alerts = [];
    const observer = { onRequestUserAlert: (note) => alerts.push(note.info()) };
    SvGlobals.get("SvNotificationCenter").shared().newObservation().setName("onRequestUserAlert").setObserver(observer).setSender(list).startWatching();
    list.noteUserEditRefused();
    await new Promise(r => setTimeout(r, 0));
    check(alerts.length === 1, "noteUserEditRefused() posts onRequestUserAlert");
    const info = alerts[0] || {};
    check(info.message === "You can't edit 'Monster Catalog'.", "the message names the thing, not a role: " + JSON.stringify(info.message));
    check(info.level === "warning" && info.name === "userEditRefused", "a warning, with a name for the log");
    check(titled("").userEditRefusedMessage() === "You can't edit 'this'.", "an untitled node is 'this'");
    check(list.userDeleteConfirmSubtitle() === "Delete 'Monster Catalog'?", "the delete confirmation names it the same way");
}

async function main () {
    await boot();
    testCascade();
    testPoolAnswer();
    testOffers();
    await testRefusalIsAnnounced();
    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
