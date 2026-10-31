#!/usr/bin/env node

"use strict";

/**
 * Headless test: Blob uploads under Node (XMLHttpRequestShim over xhr2).
 *
 * xhr2 cannot send a Blob: it throws "Unsupported send() data [object Blob]",
 * from inside the caller's timer, so the throw is uncaught and ends the
 * process. Node has a global Blob, so libraries build Blob bodies there as
 * they do in a browser — the Firebase Storage SDK assembles its upload body as
 * one. On a server-hosted table (2026-10-31) seating a freshly made character
 * uploaded its portrait and the table's worker died, twice.
 *
 * Checked against a real local HTTP server, through the real shim:
 *   - a Blob body arrives byte-identical, and the Blob's type becomes the
 *     Content-Type when the request set none;
 *   - a Content-Type the request did set is kept;
 *   - typed-array and string bodies are unchanged.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestXhrBlobUpload.js
 */

const path = require("path");
const http = require("http");
const crypto = require("crypto");
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

// Every byte value, so any text encoding along the way changes the bytes.
const BINARY_BODY = Buffer.from(Array.from({ length: 300 * 1024 }, (_, i) => i % 256));

function sha256 (bytes) {
    return crypto.createHash("sha256").update(bytes).digest("hex");
}

/** Echoes what it received: the body's length and hash, and its Content-Type. */
function startServer () {
    const server = http.createServer((req, res) => {
        const chunks = [];
        req.on("data", (c) => chunks.push(c));
        req.on("end", () => {
            const body = Buffer.concat(chunks);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ length: body.length, sha256: sha256(body), contentType: req.headers["content-type"] || null }));
        });
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

/** POSTs `body` with the raw XMLHttpRequest (as the Firebase SDK does): what the server saw. */
function post (url, body, headers = {}) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", url);
        Object.keys(headers).forEach((name) => xhr.setRequestHeader(name, headers[name]));
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = (e) => reject(new Error("request failed: " + (e && e.type)));
        try {
            xhr.send(body);
        } catch (e) {
            reject(e);
        }
    });
}

async function testBlobBody (url) {
    console.log("\na Blob body");
    let seen = null;
    try {
        seen = await post(url, new Blob([BINARY_BODY], { type: "image/jpeg" }));
    } catch (e) {
        check(false, "a Blob can be sent (" + e.message + ")");
        return;
    }
    check(seen.length === BINARY_BODY.length, "it arrives whole (" + seen.length + " of " + BINARY_BODY.length + " bytes)");
    check(seen.sha256 === sha256(BINARY_BODY), "its bytes are the Blob's bytes (same SHA-256)");
    check(seen.contentType === "image/jpeg", "the Blob's type is the Content-Type (got " + seen.contentType + ")");
    const typed = await post(url, new Blob([BINARY_BODY], { type: "image/jpeg" }), { "Content-Type": "multipart/related; boundary=x" });
    check(typed.contentType === "multipart/related; boundary=x", "a Content-Type the request set is kept (got " + typed.contentType + ")");
}

async function testOtherBodiesUnchanged (url) {
    console.log("\nother bodies");
    const bytes = await post(url, new Uint8Array(BINARY_BODY));
    check(bytes.sha256 === sha256(BINARY_BODY), "a Uint8Array body arrives as sent");
    const text = await post(url, "hello, table", { "Content-Type": "text/plain" });
    check(text.length === 12 && text.contentType === "text/plain", "a string body arrives as sent");
}

async function main () {
    console.log("TestXhrBlobUpload: booting strvct…");
    await boot();
    check(SvPlatform.isNodePlatform(), "running on Node, through XMLHttpRequestShim");
    const server = await startServer();
    const url = "http://127.0.0.1:" + server.address().port + "/upload";
    try {
        await testBlobBody(url);
        await testOtherBodiesUnchanged(url);
    } finally {
        server.close();
    }
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
    console.error("TestXhrBlobUpload crashed:", error);
    process.exit(1);
});
