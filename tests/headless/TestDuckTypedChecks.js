#!/usr/bin/env node

"use strict";

/**
 * Headless test: no new "does it have this method?" checks.
 *
 * `if (node && node.someHook)` asks whether an object has a method before
 * calling it. For an optional hook the better answer is a default on the
 * base class every receiver inherits, so callers just call it; for a real
 * multi-method contract it is a protocol (docs/Future Work/Complete
 * Protocols). This counts the `x && x.method` checks in source/, per file
 * and method, and fails when one appears that the baseline doesn't list.
 * Some are deliberate: a value that may be a string or a number, an object
 * from outside the framework. Those stay in the baseline.
 *
 * When you remove a check, the test passes and says the baseline can
 * shrink; when one is truly needed, add it to the baseline with --update.
 * A static scan of the source: no boot needed.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestDuckTypedChecks.js            # check
 *   node tests/headless/TestDuckTypedChecks.js --update   # rewrite the baseline to match the source
 */

const fs = require("fs");
const path = require("path");

const strvctRoot = path.join(__dirname, "..", "..");
const sourceRoot = path.join(strvctRoot, "source");
const baselinePath = path.join(__dirname, "fixtures", "duckTypedChecks.json");
const SKIPPED = new Set(["external-libs", "_unused", "node_modules"]);

// `x && x.method` followed by `)`, `&&` or `||`: the method's existence is
// being tested, not its result (a call would be followed by `(`).
const CHECK = /([A-Za-z_$][\w$]*(?:\(\))?)\s*&&\s*\1\.([A-Za-z_$][\w$]*)\s*(?=\)|&&|\|\|)/g;

function sourceFiles (dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return SKIPPED.has(entry.name) ? [] : sourceFiles(full);
        }
        return entry.name.endsWith(".js") ? [full] : [];
    });
}

/** "<file> <method>" → number of checks, for every check in source/. */
function currentChecks () {
    const counts = {};
    for (const file of sourceFiles(sourceRoot)) {
        const rel = path.relative(strvctRoot, file).split(path.sep).join("/");
        const code = fs.readFileSync(file, "utf8").split("\n").filter(line => !/^\s*(\/\/|\*)/.test(line)).join("\n");
        for (const m of code.matchAll(CHECK)) {
            const key = `${rel} ${m[2]}`;
            counts[key] = (counts[key] || 0) + 1;
        }
    }
    return Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
}

const current = currentChecks();

if (process.argv.includes("--update")) {
    fs.writeFileSync(baselinePath, JSON.stringify(current, null, 4) + "\n");
    console.log(`Wrote ${Object.keys(current).length} entries to ${path.relative(strvctRoot, baselinePath)}.`);
    process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
const added = Object.entries(current).filter(([key, n]) => n > (baseline[key] || 0));
const removed = Object.entries(baseline).filter(([key, n]) => (current[key] || 0) < n);

for (const [key, n] of added) {
    const [file, method] = key.split(" ");
    console.log(`  \x1b[31m✗\x1b[0m new check for ${method} in ${file} (${n}, baseline ${baseline[key] || 0}): give the base class a default, or declare a protocol; if the check is truly needed, run with --update`);
}
if (removed.length) {
    console.log(`  ${removed.length} baseline entr${removed.length === 1 ? "y is" : "ies are"} no longer in the source; run with --update to shrink the baseline.`);
}
console.log(`\n${Object.values(current).reduce((a, b) => a + b, 0)} checks in ${Object.keys(current).length} file/method pairs; ${added.length} new.`);
process.exit(added.length > 0 ? 1 : 0);
