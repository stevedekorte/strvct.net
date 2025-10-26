#!/usr/bin/env node

"use strict";

/**
 * @description Test xhr2 package for proper binary responseType="arraybuffer" support
 */

const XMLHttpRequest = require("xhr2");

// Test configuration - use a reliable PNG URL
const TEST_IMAGE_URL = "https://raw.githubusercontent.com/mathiasbynens/small/master/png-transparent.png";

console.log("Testing xhr2 package with responseType='arraybuffer'...\n");

const xhr = new XMLHttpRequest();
xhr.open("GET", TEST_IMAGE_URL, true);
xhr.responseType = "arraybuffer";

xhr.onload = () => {
    console.log(`Status: ${xhr.status}`);
    console.log(`Response Type: ${xhr.responseType}`);
    console.log(`Response is ArrayBuffer: ${xhr.response instanceof ArrayBuffer}`);

    if (xhr.status !== 200) {
        console.log("\n✗ HTTP error - status:", xhr.status);
        console.log("\n=== TEST FAILED ===\n");
        process.exit(1);
    }

    if (xhr.response instanceof ArrayBuffer) {
        console.log(`Byte length: ${xhr.response.byteLength}`);

        const bytes = new Uint8Array(xhr.response);
        const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];

        console.log("\nFirst 16 bytes:");
        for (let i = 0; i < Math.min(16, bytes.length); i++) {
            const byte = bytes[i];
            const hex = "0x" + byte.toString(16).padStart(2, "0");
            let status = "";
            if (i < 8) {
                const expected = pngSignature[i];
                const match = byte === expected;
                status = match ? " ✓" : ` ✗ (expected ${expected})`;
            }
            console.log(`  [${i}]: ${byte.toString().padStart(3)} ${hex}${status}`);
        }

        const signatureMatch = pngSignature.every((expected, i) => bytes[i] === expected);

        if (signatureMatch) {
            console.log("\n✓ PNG signature is PERFECT - all bytes intact!");
            console.log("✓ xhr2 properly supports responseType='arraybuffer'");
            console.log("\n=== TEST PASSED ===\n");
            process.exit(0);
        } else {
            console.log("\n✗ PNG signature is INCORRECT - binary data is corrupted!");
            console.log("\n=== TEST FAILED ===\n");
            process.exit(1);
        }
    } else {
        console.log("✗ Response is NOT an ArrayBuffer");
        console.log(`  Actual type: ${Object.prototype.toString.call(xhr.response)}`);
        console.log("\n=== TEST FAILED ===\n");
        process.exit(1);
    }
};

xhr.onerror = (error) => {
    console.error("✗ Request failed:", error);
    console.log("\n=== TEST FAILED ===\n");
    process.exit(1);
};

xhr.send();
