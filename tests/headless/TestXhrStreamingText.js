#!/usr/bin/env node

"use strict";

/**
 * Headless test: streamed text under Node (XMLHttpRequestShim over xhr2).
 *
 * xhr2 fires progress events as data arrives but sets responseText only when
 * the response ends. Streamed AI responses are read from responseText in the
 * progress handler (SvXhrRequest), so under Node a streamed GM turn reached
 * the table worker whole, at its end — players saw no text until the model had
 * finished (dev, 2026-10-31: 7–9 s after the first words could have shown).
 *
 * Checked against a real local HTTP server that sends its body in chunks,
 * with pauses, through the real shim:
 *   - responseText grows during the response, chunk by chunk;
 *   - a multi-byte character split across two chunks is not garbled;
 *   - the final responseText is the whole body, as before;
 *   - an "arraybuffer" response is untouched (no text while it arrives).
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestXhrStreamingText.js
 */

const path = require("path");
const http = require("http");
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

// "data: Wélcome\n\n" etc., with "é" (two bytes, C3 A9) split across chunks 1 and 2.
const WHOLE = Buffer.from("data: {\"t\":\"Wélcome to the table\"}\n\ndata: {\"t\":\"— the GM\"}\n\n", "utf8");
const SPLIT_AT = WHOLE.indexOf(0xC3) + 1; // between the two bytes of "é"
const CHUNKS = [WHOLE.subarray(0, SPLIT_AT), WHOLE.subarray(SPLIT_AT, 40), WHOLE.subarray(40)];

/** Sends the body in three chunks, 150 ms apart. */
function startServer () {
    const server = http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/event-stream; charset=utf-8" });
        CHUNKS.forEach((chunk, i) => setTimeout(() => {
            res.write(chunk);
            if (i === CHUNKS.length - 1) {
                res.end();
            }
        }, 150 * i));
    });
    return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

async function boot () {
    const bootFile = (p) => import(pathToFileURL(path.join(strvctRoot, p)).href);
    await bootFile("source/boot/SvGlobals.js");
    await bootFile("source/boot/SvPlatform.js");
    await bootFile("source/boot/StrvctFile.js");
    await bootFile("source/boot/SvBootLoader.js");

    const SvBootLoader = SvGlobals.get("SvBootLoader");
    SvBootLoader._bootPath = "source/boot";
    await SvPlatform.promiseReady();
    await StrvctFile.asyncLoadAndSequentiallyEvalPaths(SvBootLoader.fullPaths());

    const originalSerialForEach = Array.prototype.promiseSerialForEach;
    Array.prototype.promiseSerialForEach = async function (callback) {
        for (let i = 0; i < this.length; i++) {
            try {
                await callback(this[i], i, this);
            } catch {
                // intentionally swallow (native modules unavailable here)
            }
        }
    };
    await SvResourceManager.shared().setupAndRun();
    await SvResourceManager.shared().promiseCompleted();
    Array.prototype.promiseSerialForEach = originalSerialForEach;
}

/** GETs the stream: the responseText seen at each progress event, and at load. */
function readStream (url, responseType = "") {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const seen = [];
        xhr.open("GET", url);
        xhr.responseType = responseType;
        xhr.addEventListener("progress", () => seen.push(responseType === "" ? xhr.responseText : null));
        xhr.onload = () => resolve({ seen, final: responseType === "" ? xhr.responseText : xhr.response });
        xhr.onerror = (e) => reject(new Error("request failed: " + (e && e.type)));
        xhr.send();
    });
}

async function main () {
    console.log("TestXhrStreamingText: booting strvct…");
    await boot();
    check(SvPlatform.isNodePlatform(), "running on Node, through XMLHttpRequestShim");
    const server = await startServer();
    const url = "http://127.0.0.1:" + server.address().port + "/stream";
    try {
        console.log("\na text stream");
        const { seen, final } = await readStream(url);
        const whole = WHOLE.toString("utf8");
        check(seen.length >= 3, "a progress event per chunk (" + seen.length + ")");
        check(seen[0].length > 0 && seen[0].length < whole.length, "responseText holds the first chunk before the response ends (" + JSON.stringify(seen[0]) + ")");
        check(seen.every((t, i) => i === 0 || t.length >= seen[i - 1].length), "and grows with each chunk");
        check(!seen.some((t) => t.includes("\uFFFD")), "a character split across chunks is never garbled");
        check(seen[1] && seen[1].includes("Wélcome"), "…and reads whole once its second byte arrives (" + JSON.stringify(seen[1]) + ")");
        check(final === whole, "the final responseText is the whole body");

        console.log("\nan arraybuffer response");
        const binary = await readStream(url, "arraybuffer");
        check(binary.final instanceof ArrayBuffer && binary.final.byteLength === WHOLE.length, "arrives whole, as bytes (" + (binary.final && binary.final.byteLength) + " of " + WHOLE.length + ")");
    } finally {
        server.close();
    }
    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
