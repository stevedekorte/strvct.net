#!/usr/bin/env node

"use strict";

/**
 * Headless test: a browser's navigation has one entry point
 * (docs/Plans/Browser Cleanup, part 1).
 *
 * Two halves:
 *
 * 1. A static scan of the view layer. SvBrowserView.navigate(aRequest) is the
 *    one way a path is selected in a browser from outside its columns, so
 *    that every navigation carries its cause. The scan fails when code other
 *    than the browser and the stack's own recursion calls the stack's
 *    selectNodePathArray(), or when one of the retired entry points
 *    (navigateToNode, selectNodePathString, selectPathWithRetry, ...) is
 *    defined or called again.
 *
 * 2. SvNavigationRequest itself, with no DOM: how each kind of target
 *    resolves against a browser's root, and the causes.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestNavigationEntryPoint.js
 */

const fs = require("fs");
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

// --- 1. the scan ---

const ROOTS = ["source/library"];
const SKIPPED_DIRS = new Set(["_unused", "external-libs", "node_modules"]);

// Files that may call the stack's selectNodePathArray(), and why.
const MAY_SELECT_IN_THE_STACK = {
    "source/library/node/node_views/browser/SvBrowserView.js": "selectPathNow(), reached only from navigate()",
    "source/library/node/node_views/browser/stack/SvStackView.js": "the walk's own recursion into the next column"
};

const RETIRED = ["navigateToNode", "selectNodePathString", "selectPathWithRetry", "trySelectPendingPath", "setSelectedPathTitlesArray", "setSelectedPathTitlesString"];
const RETIRED_USE = new RegExp("(^|[^A-Za-z0-9_])(" + RETIRED.join("|") + ")\\s*\\(");

function sourceFiles (dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return SKIPPED_DIRS.has(entry.name) ? [] : sourceFiles(full);
        }
        return entry.name.endsWith(".js") ? [full] : [];
    });
}

// Code lines with their numbers, without comments.
function codeLines (file) {
    let inBlock = false;
    const kept = [];
    fs.readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (!inBlock && /^\s*\/\*/.test(line)) {
            inBlock = !line.includes("*/");
        } else if (inBlock) {
            inBlock = !line.includes("*/");
        } else if (!/^\s*\/\//.test(line)) {
            kept.push({ n: i + 1, text: line.replace(/(^|[^:])\/\/.*$/, "$1") });
        }
    });
    return kept;
}

function scan () {
    const sideDoors = [];
    const retired = [];
    for (const root of ROOTS) {
        for (const file of sourceFiles(path.join(strvctRoot, root))) {
            const rel = path.relative(strvctRoot, file).split(path.sep).join("/");
            for (const { n, text } of codeLines(file)) {
                if (/\.selectNodePathArray\s*\(/.test(text) && !MAY_SELECT_IN_THE_STACK[rel]) {
                    sideDoors.push(rel + ":" + n + "  " + text.trim());
                }
                if (RETIRED_USE.test(text)) {
                    retired.push(rel + ":" + n + "  " + text.trim());
                }
            }
        }
    }
    return { sideDoors, retired };
}

function testScan () {
    console.log("\nOne entry point (static scan)");
    const { sideDoors, retired } = scan();
    check(sideDoors.length === 0, "nothing selects a path in the stack except the browser's navigate()");
    sideDoors.forEach(line => console.log("      " + line));
    check(retired.length === 0, "no retired entry point is defined or called");
    retired.forEach(line => console.log("      " + line));
    const browser = fs.readFileSync(path.join(strvctRoot, "source/library/node/node_views/browser/SvBrowserView.js"), "utf8");
    check((browser.match(/\.selectNodePathArray\s*\(/g) || []).length === 1, "the browser itself selects in the stack in one place");
    check(/^\s*navigate \(aRequest\)/m.test(browser), "SvBrowserView defines navigate(aRequest)");
}

// --- 2. the request ---

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    for (const rel of ["SvGlobals.js", "SvPlatform.js", "StrvctFile.js", "SvBootLoader.js"]) {
        await bootFile(path.join("source/boot", rel));
    }
    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot";
    await SvBootLoader.asyncRun();
}

function newNode (title, parent) {
    const node = SvGlobals.get("SvFolderNode").clone().setTitle(title);
    if (parent) {
        parent.addSubnode(node);
    }
    return node;
}

// What a request asks of a browser: its root node and its base path.
function browserOver (root, basePath = []) {
    return { node: () => root, basePathArray: () => basePath.slice() };
}

function titles (path) {
    return path === null ? null : path.map(node => node.title()).join("/");
}

function testRequest () {
    console.log("\nSvNavigationRequest");
    const Request = SvGlobals.get("SvNavigationRequest");
    const top = newNode("Top");
    const root = newNode("Root", top);
    const a = newNode("A", root);
    const b = newNode("B", a);
    const browser = browserOver(root);

    check(titles(Request.toPath([a, b]).pathIn(browser)) === "A/B", "a path after the root is taken as it is");
    check(titles(Request.toPath([root, a, b]).pathIn(browser)) === "A/B", "a path beginning with the root has it skipped");
    check(titles(Request.toPath([]).pathIn(browser)) === "", "an empty path is the root itself");
    check(titles(Request.toNode(b).pathIn(browser)) === "A/B", "a node resolves by its parent chain, from after the browser's root (which need not be the top)");

    const given = [a, b];
    const request = Request.toPath(given);
    given.push(root);
    check(titles(request.pathIn(browser)) === "A/B", "a request keeps its own copy of the path it was given");

    check(titles(Request.toPathString("A/B").pathIn(browser)) === "A/B", "a title path resolves under the root");
    check(titles(Request.toPathString("Root/A/B").pathIn(browser)) === "A/B", "a title path may begin with the root's title");
    check(titles(Request.toPathString("/Root/A").pathIn(browser)) === "A", "a leading slash is tolerated");
    check(Request.toPathString("A/Nowhere").pathIn(browser) === null, "a title path to no node resolves to null");
    const later = newNode("Later", a);
    check(titles(Request.toPathString("A/Later").pathIn(browser)) === "A/Later", "a node that appears later is found when asked again");
    check(later.parentNode() === a, "(the later node is under A)");

    const withBase = browserOver(root, [a]);
    check(Request.toPathString("").isBaseState(), "an empty title path is the base state");
    check(titles(Request.toBaseState().pathIn(withBase)) === "A", "the base state is the browser's base path");
    check(titles(Request.toPathString("Root").pathIn(withBase)) === "A", "a title path naming the root itself is shown in its base state");

    check(Request.toPath([a]).cause() === "program", "a request is the program's unless it says otherwise");
    check(Request.toBaseState().cause() === "base", "a base-state request's cause is the base");
    check(Request.toPath([a]).setCause("user").isUsersOwn(), "the user's own request says so");
    check(!Request.toPath([a]).setCause("url").isUsersOwn(), "a URL's request is not the user's own");
    check(["user", "url", "program", "base"].every(cause => Request.toPath([a]).setCause(cause).cause() === cause), "the four causes are kept");
    check(Request.toPath([a]).setCause("user").setCause("whim").cause() === "program", "an unknown cause is not kept: the request is the program's");

    check(Request.toBaseState().announcesArrivalAt([]) === false, "a base state with nothing to select announces nothing");
    check(Request.toBaseState().announcesArrivalAt([a]) === true, "a base state that selects something is announced");
    check(Request.toPath([]).setCause("user").announcesArrivalAt([]) === true, "going to the root on request is announced");
    check(Request.toPathString("A/B").setCause("url").summary() === "'A/B' (url)", "a request can describe itself");
}

// Browser Cleanup part 1, second pass: a model's focus note is selected in the
// columns on behalf of a "program" request, and only code's moves are spoken.
function testFocusNotes () {
    const Request = SvGlobals.get("SvNavigationRequest");
    const a = newNode("A", newNode("Root"));

    console.log("\nWhat a screen reader is told");
    check(Request.toPath([a]).setCause("program").isSpokenToScreenReader(), "code moving the user is spoken");
    check(["user", "url", "base"].every(cause => !Request.toPath([a]).setCause(cause).isSpokenToScreenReader()), "the user's own move, an address and the base state are not");

    console.log("\nSelection in the columns on behalf of a request");
    const proto = SvGlobals.get("SvBrowserView").prototype;
    const browser = { pending: null, pendingNavigationRequest () {
        return this.pending;
    }, setPendingNavigationRequest (r) {
        this.pending = r;
        return this;
    }, selectInColumnsFor: proto.selectInColumnsFor };
    const focus = Request.toNode(a).setCause("program");
    let seen = null;
    browser.selectInColumnsFor(focus, () => {
        seen = browser.pendingNavigationRequest();
    });
    check(seen === focus, "a path change made inside is recorded as the focus request's");
    check(browser.pendingNavigationRequest() === null, "and the browser has no pending request afterwards");
    const outer = Request.toPath([a]).setCause("url");
    browser.pending = outer;
    browser.selectInColumnsFor(focus, () => {
        seen = browser.pendingNavigationRequest();
    });
    check(seen === outer && browser.pendingNavigationRequest() === outer, "a navigation already under way keeps its own cause, and stays pending");
    browser.pending = null;
    try {
        browser.selectInColumnsFor(focus, () => {
            throw new Error("selection failed");
        });
    } catch (e) {
        // expected
    }
    check(browser.pendingNavigationRequest() === null, "a selection that throws still leaves nothing pending");

    console.log("\nBoth focus notes go through it (static scan)");
    const src = fs.readFileSync(path.join(strvctRoot, "source/library/node/node_views/browser/stack/SvTilesView/SvTilesView_selection.js"), "utf8");
    ["shouldFocusAndExpandSubnode", "shouldFocusSubnode"].forEach(name => {
        const body = src.slice(src.indexOf("    " + name + " (aNote) {"));
        check(/^[\s\S]*?selectForModel\(/.test(body.slice(0, body.indexOf("\n    }\n"))), name + " selects on behalf of a program request");
    });
}

async function main () {
    testScan();
    await boot();
    testRequest();
    testFocusNotes();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
