#!/usr/bin/env node

"use strict";

/**
 * Headless test: the proxy's settled-cost frame reaches every vendor request.
 *
 * The proxy appends `{"type": "uo_billing", "vendorCostUsd": …}` to each
 * event-stream response after settling the request. Only the Anthropic
 * request used to read it; Groq, DeepSeek and xAI turns warned and dropped it,
 * and Gemini — streamed as a JSON array, not an event stream — never received
 * it at all. Now SvAiRequest.consumesBillingChunk is the one reader, every
 * vendor's onStreamJsonChunk consults it first, and Gemini streams in SSE mode
 * so the frame can be appended.
 *
 * Usage (from the strvct root):
 *   node tests/headless/TestBillingFrame.js
 */

const path = require("path");
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

async function main () {
    await boot();

    const frame = { type: "uo_billing", vendorCostUsd: 0.1234, model: "x", usedEstimate: false };

    console.log("Every vendor request consumes the billing frame through the shared reader");
    ["SvAnthropicRequest", "SvOpenAiRequest", "SvGroqRequest", "SvDeepSeekRequest", "SvXaiRequest", "SvGeminiRequest"].forEach(name => {
        const cls = SvGlobals.get(name);
        const request = cls.clone();
        let threw = null;
        try {
            request.onStreamJsonChunk(frame);
        } catch (e) {
            threw = e;
        }
        check(threw === null && request.vendorCostUsd() === 0.1234, name + " records the settled cost from onStreamJsonChunk" + (threw ? " (threw: " + threw.message + ")" : ""));
    });

    console.log("\nThe reader is strict about what it consumes");
    const SvAiRequest = SvGlobals.get("SvAiRequest");
    const r = SvGlobals.get("SvOpenAiRequest").clone();
    check(r.consumesBillingChunk({ candidates: [] }) === false && r.consumesBillingChunk(null) === false, "a vendor chunk or null is not consumed");
    check(r.consumesBillingChunk({ type: "uo_billing" }) === true && r.vendorCostUsd() === null, "a frame without a number is consumed but records nothing");
    check(typeof SvAiRequest.prototype.consumesBillingChunk === "function", "the reader lives on SvAiRequest, not on one vendor");

    console.log("\nGemini asks for an event stream, so the proxy can append the frame");
    const SvGeminiService = SvGlobals.get("SvGeminiService");
    check(SvGeminiService.withSseAlt("https://x/y:streamGenerateContent?key=abc") === "https://x/y:streamGenerateContent?key=abc&alt=sse", "alt=sse is appended after an existing query");
    check(SvGeminiService.withSseAlt("https://x/y:streamGenerateContent") === "https://x/y:streamGenerateContent?alt=sse", "…or starts the query when there is none");
    check(SvGeminiService.withSseAlt("https://x/y?alt=sse") === "https://x/y?alt=sse", "…and is not doubled");
    const SvGeminiRequest = SvGlobals.get("SvGeminiRequest");
    check(typeof SvGeminiRequest.prototype.isSseResponseText === "function"
        && SvGeminiRequest.prototype.isSseResponseText("data: {\"a\":1}\n") === true
        && SvGeminiRequest.prototype.isSseResponseText("[{\"a\":1}") === false
        && SvGeminiRequest.prototype.isSseResponseText("{\"error\":{}}") === false,
        "the Gemini reader tells an SSE body from a JSON body (errors still arrive as JSON)");

    console.log("\n" + pass + " passed, " + fail + " failed");
    process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
    console.error("Test run failed:", e);
    process.exit(1);
});
