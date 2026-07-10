#!/usr/bin/env node

"use strict";

/**
 * Headless test: conversation messages are never user-deletable.
 *
 * SvJsonArrayNode.prepareSubnode forces canDelete(true) on every added entry
 * (the right default for inspector JSON arrays). SvConversation overrides it
 * so a transcript's messages stay non-user-deletable — the bug this pins:
 * live-added chat messages were swipe-deletable while the same messages after
 * a reload (store rehydrate skips prepareSubnode) were not.
 *
 * Invariants under test:
 * - A message added to a conversation (any add path) has canDelete() false,
 *   so tiles offer no swipe-delete (offersUserEdit false).
 * - newResponseMessage / newUserMessage results are non-user-deletable.
 * - The SvJsonArrayNode base behavior (entries user-deletable) is unchanged
 *   for plain arrays.
 * - Programmatic message.delete() still works (canDelete gates the user
 *   affordance only).
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestConversationMessageDeletability.js
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

function newConversation () {
    const SvAiConversation = SvGlobals.get("SvAiConversation");
    const conv = SvAiConversation.clone();
    conv.setService({ serviceRoleNameForRole: (r) => r });
    return conv;
}

async function main () {
    console.log("TestConversationMessageDeletability: booting strvct (headless)...");
    await boot();

    console.log("\nmessages added to a conversation are never user-deletable");
    const conv = newConversation();

    const response = conv.newResponseMessage(); // adds via addSubnode → prepareSubnode
    check(response.canDelete() === false, "newResponseMessage: canDelete false after add");
    check(response.offersUserEdit(response.canDelete()) === false, "newResponseMessage: no swipe-delete affordance");

    const userMsg = SvGlobals.get("SvAiMessage").clone();
    userMsg.setRole("user");
    conv.addSubnode(userMsg);
    check(userMsg.canDelete() === false, "addSubnode(message): canDelete false after add");

    console.log("\nbase SvJsonArrayNode behavior unchanged (entries user-deletable)");
    const arr = SvGlobals.get("SvJsonArrayNode").clone();
    const entry = SvGlobals.get("SvJsonGroup").clone();
    arr.addSubnode(entry);
    check(entry.canDelete() === true, "plain array entry: canDelete true after add (inspector arrays keep their default)");

    console.log("\nprogrammatic delete unaffected");
    const before = conv.subnodes().length;
    userMsg.delete();
    check(conv.subnodes().length === before - 1, "message.delete() still removes despite canDelete false");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error("TestConversationMessageDeletability crashed:", e);
    process.exit(1);
});
