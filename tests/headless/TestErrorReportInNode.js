#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvErrorReport under Node. There is no page to post from, so
 * a report is written to the process's error output as one line —
 * "[error-report] " and its JSON — where the process's host collects it (the
 * table host's log; scripts/prod-health.js reads it back). Repeats of one
 * message within the window are held back, as in a browser, and the next
 * report sent carries their count.
 *
 * Usage (from this directory):  node TestErrorReportInNode.js
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

/** The report lines written while fn runs. */
async function reportLinesDuring (fn) {
    const lines = [];
    const original = console.error;
    console.error = (...args) => {
        const line = args.map(String).join(" ");
        if (line.startsWith("[error-report] ")) {
            lines.push(line);
        } else {
            original(...args);
        }
    };
    try {
        await fn();
    } finally {
        console.error = original;
    }
    return lines;
}

(async () => {
    await boot();
    const SvErrorReport = SvGlobals.get("SvErrorReport");
    check(globalThis.SvErrorReport === SvErrorReport, "SvErrorReport is a global (the table worker reaches it as globalThis.SvErrorReport)");

    let result = null;
    const first = await reportLinesDuring(async () => {
        result = await SvErrorReport.asyncSend(new Error("the portrait upload failed"), { kind: "test" });
    });
    check(first.length === 1, "a report writes one line (" + first.length + ")");
    check(result && result.success === true, "…and says it was sent");
    const body = JSON.parse(first[0].slice(first[0].indexOf("{")));
    check(body.error.message === "the portrait upload failed" && /Error/.test(body.error.stack), "the line carries the error's message and stack");
    check(body.additional && body.additional.kind === "test", "…what the caller added");
    check(body.general && body.general.pid === process.pid && typeof body.general.process === "string", "…and which process wrote it");

    const repeats = await reportLinesDuring(async () => {
        await SvErrorReport.asyncSend(new Error("the portrait upload failed"));
        await SvErrorReport.asyncSend(new Error("the portrait upload failed"));
    });
    check(repeats.length === 0, "the same message again within the window is held back (" + repeats.length + ")");

    SvErrorReport.setRepeatWindowMs(0);
    const after = await reportLinesDuring(async () => {
        await SvErrorReport.asyncSend(new Error("the portrait upload failed"));
    });
    const afterBody = after.length ? JSON.parse(after[0].slice(after[0].indexOf("{"))) : {};
    check(after.length === 1 && afterBody.additional && afterBody.additional.heldRepeats === 2, "after the window, the next report carries the count held back (" + JSON.stringify(afterBody.additional) + ")");

    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
