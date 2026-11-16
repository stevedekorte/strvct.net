#!/usr/bin/env node

"use strict";

/**
 * Runs every headless test, each in its own process.
 *
 * Rebuilds build/_index.json first (tests boot from it, and a stale index
 * makes them fail confusingly), then runs tests/headless/Test*.js. A test
 * passes when its process exits 0 within the timeout.
 *
 * Tests run one at a time: they share LevelDB databases under data/leveldb/
 * (the hash cache among them), and LevelDB allows one process per database.
 *
 * Usage (from the strvct root):
 *   npm test                         # everything
 *   npm test -- Record Xhr           # only files whose name contains a filter
 *   npm test -- --verbose            # print every test's output, not just failures'
 *   npm test -- --timeout=120        # seconds per test (default: 60)
 *   npm test -- --no-index           # skip the index rebuild
 */

const path = require("path");
const fs = require("fs");
const { spawn, spawnSync } = require("child_process");

const strvctRoot = path.join(__dirname, "..");
const testsDir = path.join(__dirname, "headless");

function parseArgs (argv) {
    const options = { filters: [], verbose: false, timeoutSeconds: 60, rebuildsIndex: true };
    for (const arg of argv) {
        if (arg === "--verbose" || arg === "-v") {
            options.verbose = true;
        } else if (arg === "--no-index") {
            options.rebuildsIndex = false;
        } else if (arg.startsWith("--timeout=")) {
            options.timeoutSeconds = Math.max(1, parseFloat(arg.slice(10)) || 60);
        } else {
            options.filters.push(arg.toLowerCase());
        }
    }
    return options;
}

function testFiles (filters) {
    return fs.readdirSync(testsDir)
        .filter(name => /^Test.*\.js$/.test(name))
        .filter(name => filters.length === 0 || filters.some(f => name.toLowerCase().includes(f)))
        .sort();
}

function rebuildIndex () {
    process.stdout.write("Rebuilding build/_index.json … ");
    const result = spawnSync(process.execPath, ["source/boot/index-builder/ImportsIndexer.js"], { cwd: strvctRoot, encoding: "utf8" });
    if (result.status !== 0) {
        console.log("failed\n" + result.stdout + result.stderr);
        process.exit(1);
    }
    console.log("done");
}

function runTest (name, timeoutSeconds) {
    return new Promise(resolve => {
        const start = Date.now();
        const child = spawn(process.execPath, [path.join(testsDir, name)], { cwd: strvctRoot });
        let output = "";
        child.stdout.on("data", chunk => { output += chunk; });
        child.stderr.on("data", chunk => { output += chunk; });
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGKILL");
        }, timeoutSeconds * 1000);
        child.on("close", code => {
            clearTimeout(timer);
            resolve({ name, code, timedOut, output, seconds: (Date.now() - start) / 1000 });
        });
    });
}

function reportResult (result, verbose) {
    const passed = result.code === 0 && !result.timedOut;
    const mark = passed ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
    const note = result.timedOut ? " (timed out)" : (passed ? "" : " (exit " + result.code + ")");
    console.log(mark + " " + result.name + " " + result.seconds.toFixed(1) + "s" + note);
    if ((verbose || !passed) && result.output.trim()) {
        console.log(result.output.replace(/^/gm, "    ").trimEnd());
    }
    return passed;
}

async function runAll (names, options) {
    const results = [];
    for (const name of names) {
        const result = await runTest(name, options.timeoutSeconds);
        result.passed = reportResult(result, options.verbose);
        results.push(result);
    }
    return results;
}

function summarize (results, seconds) {
    const failures = results.filter(r => !r.passed).map(r => r.name);
    console.log("\n" + (results.length - failures.length) + " passed, " + failures.length + " failed, " + results.length + " total (" + seconds.toFixed(1) + "s)");
    failures.forEach(name => console.log("  \x1b[31m✗\x1b[0m " + name));
    return failures.length === 0;
}

async function main () {
    const options = parseArgs(process.argv.slice(2));
    const names = testFiles(options.filters);
    if (names.length === 0) {
        console.log("No tests match " + options.filters.join(", "));
        process.exit(1);
    }
    if (options.rebuildsIndex) {
        rebuildIndex();
    }
    const start = Date.now();
    const results = await runAll(names, options);
    process.exit(summarize(results, (Date.now() - start) / 1000) ? 0 : 1);
}

main();
