#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvAnthropicService.applyPromptCaching — cache_control
 * breakpoint placement on outbound request bodies.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestAnthropicCacheControl.js
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

function countMarkers (body) {
    let n = 0;
    if (Array.isArray(body.system)) {
        n += body.system.filter(b => b.cache_control).length;
    }
    (body.messages || []).forEach(m => {
        if (Array.isArray(m.content)) {
            n += m.content.filter(b => b.cache_control).length;
        }
    });
    return n;
}

function testCacheControl () {
    const service = SvGlobals.get("SvAnthropicService").shared();
    check(!!service.applyPromptCaching, "applyPromptCaching exists");

    console.log("\nSystem prompt breakpoint");
    const body1 = {
        system: "You are the Game Master. " + "x".repeat(100),
        messages: [
            { role: "user", content: "hello" },
            { role: "assistant", content: "hi" },
            { role: "user", content: "go north" }
        ]
    };
    service.applyPromptCaching(body1);
    check(Array.isArray(body1.system) && body1.system[0].type === "text", "system converted to block array");
    check(body1.system[0].cache_control && body1.system[0].cache_control.type === "ephemeral", "system block carries ephemeral marker");
    check(body1.system[0].text.startsWith("You are the Game Master."), "system text preserved");

    console.log("\nTurn anchors");
    const last1 = body1.messages[body1.messages.length - 1];
    check(Array.isArray(last1.content) && last1.content[0].cache_control, "final message marked");
    check(countMarkers(body1) === 2, "short conversation: 2 markers (system + final)");

    const manyMessages = [];
    for (let i = 0; i < 12; i++) {
        manyMessages.push({ role: (i % 2 === 0) ? "user" : "assistant", content: "message " + i });
    }
    const body2 = { system: "sys", messages: manyMessages };
    service.applyPromptCaching(body2);
    check(countMarkers(body2) === 3, "long conversation: 3 markers (system + final + lookback anchor)");
    const anchor = body2.messages[body2.messages.length - 6];
    check(Array.isArray(anchor.content) && anchor.content[0].cache_control, "lookback anchor sits 6 back");

    console.log("\nEdge cases");
    const body3 = { system: "", messages: [] };
    service.applyPromptCaching(body3);
    check(body3.system === "" && countMarkers(body3) === 0, "empty system/messages untouched");

    const body4 = { messages: [{ role: "user", content: [{ type: "text", text: "already blocks" }] }] };
    service.applyPromptCaching(body4);
    check(body4.messages[0].content[0].cache_control !== undefined, "block-array content gets marker on last block");

    const body5 = { system: "sys", messages: [{ role: "user", content: "" }] };
    service.applyPromptCaching(body5);
    check(typeof body5.messages[0].content === "string", "empty-content message left as string (API rejects empty blocks)");

    check(countMarkers(body2) <= 4, "within Anthropic's 4-marker budget");
}

(async () => {
    await boot();
    testCacheControl();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test run failed to boot:", e);
    process.exit(1);
});
