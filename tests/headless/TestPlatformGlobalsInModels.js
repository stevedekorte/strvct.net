#!/usr/bin/env node

"use strict";

/**
 * Headless test: no new browser globals in model and service code.
 *
 * Models must not reach into window / navigator / document / localStorage /
 * sessionStorage (docs/Plans/Naked Objects Issues): that pins them to the
 * browser, so they can't run headless and the UI can't be swapped. They ask
 * the platform instead — SvPlatform for environment info (pageUrl(),
 * userAgent(), referrer(), isOnline()), the user interface for actions
 * (reloadApp(), deviceValue(), asyncCopyText()).
 *
 * This counts uses of those globals in source/library/, per file and global,
 * skipping the view layer and browser-only code, and fails when one appears
 * that the baseline doesn't list. `document.` counts only when followed by
 * a DOM member, so a local variable named `document` (a Firestore document)
 * does not. The baseline holds the uses still to be moved; when you remove
 * one, the test passes and says the baseline can shrink.
 * A static scan of the source: no boot needed.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestPlatformGlobalsInModels.js            # check
 *   node tests/headless/TestPlatformGlobalsInModels.js --update   # rewrite the baseline to match the source
 */

const fs = require("fs");
const path = require("path");

const strvctRoot = path.join(__dirname, "..", "..");
const libraryRoot = path.join(strvctRoot, "source", "library");
const baselinePath = path.join(__dirname, "fixtures", "platformGlobalsInModels.json");

// The view layer and browser-only code may use the platform directly.
const SKIPPED_DIRS = new Set(["view", "node_views", "browser-only", "_unused", "external-libs", "node_modules"]);
const SKIPPED_PATHS = ["source/library/node/app/ui/"];

const DOM_MEMBERS = [
    "createElement", "createTextNode", "createRange", "body", "head", "documentElement", "referrer",
    "fonts", "addEventListener", "removeEventListener", "querySelector", "querySelectorAll",
    "getElementById", "getElementsByTagName", "getElementsByClassName", "hidden", "visibilityState",
    "readyState", "activeElement", "cookie", "location", "title", "execCommand", "getSelection",
    "defaultView", "styleSheets", "fullscreenElement", "hasFocus"
];

const GLOBALS = [
    { name: "window", pattern: /(?<![\w$.])window\s*\./g },
    { name: "navigator", pattern: /(?<![\w$.])navigator\s*\./g },
    { name: "localStorage", pattern: /(?<![\w$.])localStorage\b/g },
    { name: "sessionStorage", pattern: /(?<![\w$.])sessionStorage\b/g },
    { name: "document", pattern: new RegExp("(?<![\\w$.])document\\.(?:" + DOM_MEMBERS.join("|") + ")\\b", "g") }
];

function isSkipped (rel) {
    return SKIPPED_PATHS.some(prefix => rel.startsWith(prefix));
}

function sourceFiles (dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return SKIPPED_DIRS.has(entry.name) ? [] : sourceFiles(full);
        }
        return entry.name.endsWith(".js") ? [full] : [];
    });
}

// Drops comments: blocks that open at the start of a line (doc comments and
// commented-out code), `//` lines, and trailing `// …` (a `//` after `:` is a URL).
function codeWithoutComments (file) {
    let inBlock = false;
    const kept = [];
    for (const line of fs.readFileSync(file, "utf8").split("\n")) {
        if (!inBlock && /^\s*\/\*/.test(line)) {
            inBlock = !line.includes("*/");
        } else if (inBlock) {
            inBlock = !line.includes("*/");
        } else if (!/^\s*\/\//.test(line)) {
            kept.push(line.replace(/(^|[^:])\/\/.*$/, "$1"));
        }
    }
    return kept.join("\n");
}

/** "<file> <global>" → number of uses, for every use in source/library/. */
function currentUses () {
    const counts = {};
    for (const file of sourceFiles(libraryRoot)) {
        const rel = path.relative(strvctRoot, file).split(path.sep).join("/");
        if (isSkipped(rel)) {
            continue;
        }
        const code = codeWithoutComments(file);
        for (const global of GLOBALS) {
            const n = (code.match(global.pattern) || []).length;
            if (n > 0) {
                counts[`${rel} ${global.name}`] = n;
            }
        }
    }
    return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

const current = currentUses();

if (process.argv.includes("--update")) {
    fs.writeFileSync(baselinePath, JSON.stringify(current, null, 4) + "\n");
    console.log(`Wrote ${Object.keys(current).length} entries to ${path.relative(strvctRoot, baselinePath)}.`);
    process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const added = Object.entries(current).filter(([key, n]) => n > (baseline[key] || 0));
const removed = Object.entries(baseline).filter(([key, n]) => (current[key] || 0) < n);

for (const [key, n] of added) {
    const [file, global] = key.split(" ");
    console.log(`  \x1b[31m✗\x1b[0m new use of ${global} in ${file} (${n}, baseline ${baseline[key] || 0}): ask SvPlatform or the user interface instead, or move the code to the view layer; if it is truly needed, run with --update`);
}
if (removed.length) {
    console.log(`  ${removed.length} baseline entr${removed.length === 1 ? "y is" : "ies are"} no longer in the source; run with --update to shrink the baseline.`);
}
console.log(`\n${Object.values(current).reduce((a, b) => a + b, 0)} uses in ${Object.keys(current).length} file/global pairs; ${added.length} new.`);
process.exit(added.length > 0 ? 1 : 0);
