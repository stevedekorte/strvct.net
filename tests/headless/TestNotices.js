#!/usr/bin/env node

"use strict";

/**
 * Headless test: notices (SvNotices / SvNotice / SvNoticeAction) — showing a
 * notice replaces another with its id, an action calls its target and closes
 * the notice, the close button runs the dismiss action, every change is
 * announced (onNoticesChanged) — and the headless defaults of the platform
 * capabilities the PWA work relies on (install, device values, push).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestNotices.js
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

async function main () {
    await boot();
    const g = (n) => SvGlobals.get(n);
    const SvNotices = g("SvNotices");
    const SvNotice = g("SvNotice");
    const notices = SvNotices.clone();
    let changes = 0;
    const observer = { onNoticesChanged: () => { changes++; } };
    g("SvNotificationCenter").shared().newObservation().setName("onNoticesChanged").setObserver(observer).setSender(notices).startWatching();

    console.log("Showing and replacing");
    const calls = [];
    const target = { refresh: (n) => calls.push("refresh:" + n.noticeId()), later: () => calls.push("later") };
    const update = SvNotice.idMessage("update", "A new version is ready").addAction("Refresh", target, "refresh");
    update.setDismissAction(g("SvNoticeAction").labelTargetMethod("", target, "later"));
    notices.show(update);
    await new Promise(r => setTimeout(r, 0));
    check(notices.currentNotice() === update && changes >= 1, "shown, and announced");
    const newer = SvNotice.idMessage("update", "A newer version is ready");
    notices.show(newer);
    check(notices.notices().length === 1 && notices.currentNotice() === newer, "a notice with the same id replaces it");
    notices.show(update);
    const bell = notices.show(SvNotice.idMessage("bell", "Get a nudge when it's your turn"));
    check(notices.notices().length === 2 && notices.currentNotice() === bell, "different ids stack; the newest shows");

    console.log("\nActions and dismissal");
    update.actions()[0].performFor(update);
    check(calls.join() === "refresh:update" && !notices.noticeWithId("update"), "an action calls its target and closes the notice");
    notices.show(update);
    update.dismiss();
    check(calls.join() === "refresh:update,later" && !notices.noticeWithId("update"), "the close button runs the dismiss action and closes it");
    notices.removeNoticeWithId("bell");
    check(notices.currentNotice() === null, "none left");

    console.log("\nHeadless platform capabilities");
    const ui = g("SvUserInterface").clone();
    check(ui.isInstalledApp() === false && ui.canPromptInstall() === false && ui.platformName() === "headless", "not installed, no prompt, headless");
    check(await ui.promptInstall() === false && await ui.asyncPushSubscriptionJson("key") === null && await ui.asyncCopyText("x") === false, "install, push and copy decline politely");
    ui.setDeviceValue("lastSeenRelease", "abc");
    check(ui.deviceValue("lastSeenRelease") === "abc" && ui.deviceValue("missing") === null, "device values for this run");

    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
