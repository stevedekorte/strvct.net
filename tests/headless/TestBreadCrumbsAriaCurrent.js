#!/usr/bin/env node

"use strict";

/**
 * Headless test: the breadcrumb bar marks the last crumb as the current
 * location (aria-current="location", the ARIA breadcrumb pattern).
 *
 * SvBreadCrumbsTile did this; SvBreadCrumbsView, which replaced it on
 * 2026-06-12, did not, and nothing noticed until the plans were checked
 * against the code on 2026-11-23. Both of setupPathViews' branches (the full
 * path and the collapsed title) must mark it.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestBreadCrumbsAriaCurrent.js
 */

const path = require("path");
const fs = require("fs");
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

function crumbStub () {
    const stub = { ariaCurrent: "unset" };
    stub.setAriaCurrent = (v) => {
        stub.ariaCurrent = v;
        return stub;
    };
    return stub;
}

function markAll (count) {
    const crumbs = Array.from({ length: count }, crumbStub);
    const proto = SvGlobals.get("SvBreadCrumbsView").prototype;
    proto.markCurrentCrumb.call({}, crumbs);
    return crumbs.map((c) => c.ariaCurrent);
}

async function main () {
    await boot();

    console.log("The last crumb is the current location");
    const three = markAll(3);
    check(three[2] === "location", "the last of three is marked");
    check(three[0] === null && three[1] === null, "the others are cleared, not left unset");
    check(markAll(1)[0] === "location", "a single crumb is marked");
    check(markAll(0).length === 0, "no crumbs => no throw");

    console.log("\nBoth branches of setupPathViews mark it");
    const src = fs.readFileSync(path.join(strvctRoot,
        "source/library/node/node_views/browser/SvBreadCrumbsView.js"), "utf8");
    const setup = src.slice(src.indexOf("    setupPathViews () {"));
    const body = setup.slice(0, setup.indexOf("\n    }\n"));
    const collapsedBranch = body.slice(body.indexOf("if (collapsedTitle) {"), body.indexOf("return this;"));
    check(/markCurrentCrumb\(/.test(collapsedBranch), "the collapsed title is marked");
    check((body.match(/markCurrentCrumb\(/g) || []).length === 2, "and the full path is marked");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
