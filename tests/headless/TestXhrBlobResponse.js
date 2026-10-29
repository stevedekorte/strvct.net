#!/usr/bin/env node

"use strict";

/**
 * Headless test: binary downloads under Node (XMLHttpRequestShim over xhr2).
 *
 * xhr2 has no "blob" response type. It fell through to text and decoded the
 * bytes as UTF-8, so every responseType "blob" download in a Node process —
 * Firebase Storage blobs, images, audio — arrived corrupted: a 13,504-byte PNG
 * became 24,189 bytes with a different SHA-256. On a server-hosted table
 * (2026-10-28) a reference image's bytes then no longer matched its hash, the
 * reference lost its blob, and Krea was sent `url: null` — 422 "Validation
 * failed" on every scene image.
 *
 * Checked against a real local HTTP server, through the real shim:
 *   - a "blob" response is a Blob, byte-identical to what was served, typed
 *     with the response's Content-Type;
 *   - "arraybuffer" and text responses are unchanged;
 *   - an error body's per-field details reach the error message.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js   # if index is stale
 *   node tests/headless/TestXhrBlobResponse.js
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

// Every byte value, so any text decoding along the way changes the bytes.
const BINARY_BODY = Buffer.from(Array.from({ length: 1024 }, (_, i) => i % 256));
const KREA_422_BODY = JSON.stringify({
    error: "Validation failed",
    details: [{ field: "image_style_references.0.url", message: "Invalid input: expected string, received null", code: "invalid_type" }]
});

function sha256 (bytes) {
    return crypto.createHash("sha256").update(bytes).digest("hex");
}

function startServer () {
    const server = http.createServer((req, res) => {
        if (req.url === "/image.png") {
            res.writeHead(200, { "Content-Type": "image/png" });
            res.end(BINARY_BODY);
        } else if (req.url === "/text") {
            res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("hello, table");
        } else {
            res.writeHead(422, { "Content-Type": "application/json" });
            res.end(KREA_422_BODY);
        }
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

async function sentRequest (url, responseType) {
    const request = SvXhrRequest.clone();
    request.setUrl(url);
    request.setMethod("GET");
    request.setHeaders({});
    request.setResponseType(responseType);
    await request.asyncSend();
    return request;
}

async function testBlobResponseIsExactBytes (base) {
    console.log("\nresponseType \"blob\"");
    const request = await sentRequest(base + "/image.png", "blob");
    const blob = request.response();
    check(blob instanceof Blob, "the response is a Blob (got " + (blob && blob.constructor.name) + ")");
    if (!(blob instanceof Blob)) {
        return;
    }
    const bytes = Buffer.from(await blob.arrayBuffer());
    check(bytes.length === BINARY_BODY.length, "it has the served length (" + bytes.length + " of " + BINARY_BODY.length + " bytes)");
    check(sha256(bytes) === sha256(BINARY_BODY), "its bytes are the served bytes (same SHA-256)");
    check(blob.type === "image/png", "it is typed with the response's Content-Type (got \"" + blob.type + "\")");
    check(request.responseType() === "blob", "the request still reports responseType \"blob\"");
    check(request.contentByteCount() === BINARY_BODY.length, "contentByteCount() counts the bytes");
}

async function testOtherResponseTypesUnchanged (base) {
    console.log("\nother response types");
    const buffered = await sentRequest(base + "/image.png", "arraybuffer");
    const arrayBuffer = buffered.response();
    check(arrayBuffer instanceof ArrayBuffer, "\"arraybuffer\" is still an ArrayBuffer");
    check(arrayBuffer instanceof ArrayBuffer && sha256(Buffer.from(arrayBuffer)) === sha256(BINARY_BODY), "\"arraybuffer\" bytes are the served bytes");
    const text = await sentRequest(base + "/text", "");
    check(text.responseText() === "hello, table", "a text response is still text");
}

async function testErrorDetailsReachTheMessage (base) {
    console.log("\nerror bodies");
    const request = await sentRequest(base + "/fail", "");
    const message = request.responseJsonError();
    check(message.startsWith("Validation failed"), "the error string leads");
    check(message.includes("image_style_references.0.url: Invalid input: expected string, received null"), "each detail names its field and message (got \"" + message + "\")");
    check(request.jsonErrorDetailsSuffix(undefined) === "", "no details adds nothing");
}

async function main () {
    console.log("TestXhrBlobResponse: booting strvct…");
    await boot();
    check(SvPlatform.isNodePlatform(), "running on Node, through XMLHttpRequestShim");
    const server = await startServer();
    const base = "http://127.0.0.1:" + server.address().port;
    try {
        await testBlobResponseIsExactBytes(base);
        await testOtherResponseTypesUnchanged(base);
        await testErrorDetailsReachTheMessage(base);
    } finally {
        server.close();
    }
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
    console.error("TestXhrBlobResponse crashed:", error);
    process.exit(1);
});
