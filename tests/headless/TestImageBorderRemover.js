#!/usr/bin/env node

"use strict";

/**
 * Headless test: SvImageBorderRemover border detection.
 *
 * The detection core works on plain {width, height, data} RGBA buffers, so
 * these tests build synthetic images (no canvas needed): white side bars,
 * black letterbox bars, off-white mats within tolerance, pale-but-nonuniform
 * content that must NOT be treated as border, and degenerate all-white
 * images that must not be cropped to nothing.
 *
 * Usage (from the strvct root):
 *   node source/boot/index-builder/ImportsIndexer.js
 *   node tests/headless/TestImageBorderRemover.js
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

// --- synthetic image builder -------------------------------------------------

// makeImage(w, h, painter) — painter(x, y) returns [r,g,b]; alpha fixed 255.
function makeImage (width, height, painter) {
    const data = new Uint8ClampedArray(width * height * 4);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const [r, g, b] = painter(x, y);
            const i = (y * width + x) * 4;
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
            data[i + 3] = 255;
        }
    }
    return { width, height, data };
}

const CONTENT = [120, 60, 180]; // arbitrary mid-tone "art"
const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];

function testDetection () {
    const SvImageBorderRemover = SvGlobals.get("SvImageBorderRemover");
    check(!!SvImageBorderRemover, "SvImageBorderRemover class loaded");
    const remover = SvImageBorderRemover.clone();

    console.log("\nWhite side bars (the generated-image case)");
    const sideBars = makeImage(100, 80, (x) => (x < 12 || x >= 88) ? WHITE : CONTENT);
    let insets = remover.detectInsets(sideBars);
    check(insets.left === 12 && insets.right === 12, "left/right insets found (12px each)");
    check(insets.top === 0 && insets.bottom === 0, "no top/bottom border reported");

    console.log("\nBlack letterbox (top+bottom only)");
    const letterbox = makeImage(100, 80, (x, y) => (y < 8 || y >= 72) ? BLACK : CONTENT);
    insets = remover.detectInsets(letterbox);
    check(insets.top === 8 && insets.bottom === 8, "top/bottom insets found (8px each)");
    check(insets.left === 0 && insets.right === 0, "no side border reported");

    console.log("\nAll four sides, mixed colors");
    const framed = makeImage(100, 100, (x, y) => {
        if (y < 6 || y >= 94) { return WHITE; }
        if (x < 10 || x >= 90) { return BLACK; }
        return CONTENT;
    });
    insets = remover.detectInsets(framed);
    check(insets.top === 6 && insets.bottom === 6 && insets.left === 10 && insets.right === 10,
        "independent per-side colors and widths all detected");

    console.log("\nNo border");
    insets = remover.detectInsets(makeImage(60, 60, () => CONTENT));
    check(remover.insetsAreEmpty(insets), "plain content image reports no insets");

    console.log("\nOff-white mat within tolerance");
    const offWhite = makeImage(100, 80, (x) => (x < 10) ? [246, 244, 240] : CONTENT);
    insets = remover.detectInsets(offWhite);
    check(insets.left === 10, "slightly off-white border still detected (tolerance)");

    console.log("\nPale but non-uniform content is NOT a border");
    // 90% white row pixels with content interruptions — below uniformity.
    const snowy = makeImage(100, 80, (x, y) => (y < 10 && x % 10 !== 0) ? WHITE : CONTENT);
    insets = remover.detectInsets(snowy);
    check(insets.top === 0, "non-uniform pale region left alone");

    console.log("\nSafety rails");
    const allWhite = makeImage(50, 50, () => WHITE);
    insets = remover.detectInsets(allWhite);
    check(remover.insetsAreEmpty(insets), "degenerate all-white image is not cropped");

    const thin = makeImage(100, 80, (x) => (x < 2) ? WHITE : CONTENT);
    insets = remover.detectInsets(thin);
    check(insets.left === 0, "borders thinner than minInset ignored");

    const huge = makeImage(100, 80, (x) => (x < 60) ? WHITE : CONTENT);
    insets = remover.detectInsets(huge);
    check(insets.left === 0, "border wider than maxInsetFraction refused (content edge not found within cap)");

    // A border exactly at a plausible-but-large size still under the cap works.
    const wide = makeImage(100, 80, (x) => (x < 40) ? WHITE : CONTENT);
    insets = remover.detectInsets(wide);
    check(insets.left === 40, "wide-but-legitimate border under the cap still cropped");
}

(async () => {
    await boot();
    testDetection();
    console.log("\n" + passed + " passed, " + failed + " failed");
    process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
    console.error("Test run failed to boot:", e);
    process.exit(1);
});
