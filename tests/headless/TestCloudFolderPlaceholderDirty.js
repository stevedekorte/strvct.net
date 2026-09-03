#!/usr/bin/env node

"use strict";

/**
 * Headless test: an unloaded cloud-folder child with a stale local>cloud
 * stamp must NOT make the folder report needsCloudSync.
 *
 * Origin (2026-09-01): five "New Character" placeholders had localLastModified
 * a day later than cloudLastModified, so hasUnsavedCloudChanges stayed true,
 * close was blocked, and the upload indicator never dropped — while
 * asyncSyncToCloud skipped them (isChildCloudSyncable) and finished in 0.0s.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestCloudFolderPlaceholderDirty.js
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

function defineTestFolderClass () {
    const SvCloudFolder = SvGlobals.get("SvCloudFolder");
    (class TestCloudFolder extends SvCloudFolder {
        defaultFsBackend () { return {}; }
        cloudFsScopeRootId () { return "uid"; }
        cloudFsFolderId () { return "chars-uid"; }
        cloudFsChildIdFromNodeId (id) { return id; }
        async asyncApplyChildFromCloud () {}
    }).initThisClass();
}

function newFolder () {
    const TestCloudFolder = SvGlobals.get("TestCloudFolder");
    const folder = TestCloudFolder.clone();
    folder.didSyncToCloud(1_000_000);
    return folder;
}

function addChildWithoutDirtyingFolder (folder, child) {
    folder._suppressLocalModifiedTouch = true;
    try {
        folder.addSubnode(child);
    } finally {
        folder._suppressLocalModifiedTouch = false;
    }
    folder.didSyncToCloud(1_000_000);
}

function newChild (opts) {
    const SvSyncableJsonGroup = SvGlobals.get("SvSyncableJsonGroup");
    const child = SvSyncableJsonGroup.clone();
    child._suppressLocalModifiedTouch = true;
    try {
        child.setCloudLastModified(opts.cloud);
        child.setLocalLastModified(opts.local);
    } finally {
        child._suppressLocalModifiedTouch = false;
    }
    if (opts.loaded === false) {
        child.cloudContentLoaded = () => false;
    }
    return child;
}

function testPlaceholderDoesNotDirtyFolder () {
    console.log("\nUnloaded placeholder with local>cloud is not folder-unsaved");

    const folder = newFolder();
    const placeholder = newChild({ cloud: 100, local: 999, loaded: false });
    addChildWithoutDirtyingFolder(folder, placeholder);

    check(folder.localLastModified() === folder.cloudLastModified(),
        "folder stamps equal (the logged 'characters folder' case)");
    check(placeholder.needsCloudSync() === true,
        "control: child's own timestamp walk still sees local>cloud");
    check(folder.isChildCloudSyncable(placeholder) === false,
        "placeholder is not save-eligible");
    check(folder.subnodes().length === 1, "folder has only the placeholder child (got " + folder.subnodes().length + ")");
    check(folder.needsCloudSync() === false,
        "folder does not report unsaved work it cannot push (the close-block symptom)");
}

function testLoadedDirtyChildDoesDirtyFolder () {
    console.log("\nLoaded dirty child still makes the folder unsaved");

    const folder = newFolder();
    const loaded = newChild({ cloud: 100, local: 999, loaded: true });
    addChildWithoutDirtyingFolder(folder, loaded);

    check(folder.localLastModified() === folder.cloudLastModified(),
        "folder stamps equal so the child walk is what decides");
    check(folder.isChildCloudSyncable(loaded) === true,
        "loaded dirty child is save-eligible");
    check(folder.needsCloudSync() === true,
        "folder reports unsaved work for a child it can actually push");
}

function testFolderTimestampDirtyIsNotPushable () {
    console.log("\nFolder-level timestamp dirt is not pushable work");

    const folder = newFolder();
    const placeholder = newChild({ cloud: 100, local: 999, loaded: false });
    addChildWithoutDirtyingFolder(folder, placeholder);
    folder._suppressLocalModifiedTouch = true;
    try {
        folder.setLocalLastModified(2_000_000); // folder stamps dirty, children still unsyncable
    } finally {
        folder._suppressLocalModifiedTouch = false;
    }

    check(folder.needsCloudSync() === true,
        "folder.needsCloudSync is true from its own stamps (the old hasUnsaved path)");
    check(folder.cloudSyncableSubnodes().length === 0,
        "cloudSyncableSubnodes is empty — a push would complete in 0.0s");
}

function testEqualStampsStayClean () {
    console.log("\nPlaceholder with equal stamps is clean at both levels");

    const folder = newFolder();
    const placeholder = newChild({ cloud: 500, local: 500, loaded: false });
    addChildWithoutDirtyingFolder(folder, placeholder);

    check(placeholder.needsCloudSync() === false, "equal stamps → child clean");
    check(folder.needsCloudSync() === false, "equal stamps → folder clean");
}

async function main () {
    console.log("Booting strvct standalone (headless)...");
    await boot();
    console.log("Boot complete.");
    defineTestFolderClass();

    testPlaceholderDoesNotDirtyFolder();
    testLoadedDirtyChildDoesDirtyFolder();
    testFolderTimestampDirtyIsNotPushable();
    testEqualStampsStayClean();

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
