"use strict";

/**
 * @module boot
 */

// ArrayBuffer and Uint8Array can't be extended via the normal category system
// because they are TypedArray constructors. We'll add methods directly to their prototypes.

// ArrayBuffer_sha256.js

/**
 * Computes SHA-256 hash of the ArrayBuffer and returns it as a hexadecimal string.
 * Works in both browser and Node.js environments.
 * @returns {Promise<string>} The SHA-256 hash as a hexadecimal string (64 characters, lowercase)
 */
ArrayBuffer.prototype.asyncHexSha256 = async function () {
    if (typeof crypto !== "undefined" && crypto.subtle) {
        // Browser environment or Node.js with Web Crypto API
        const hashArrayBuffer = await crypto.subtle.digest("SHA-256", this);
        const hashArray = Array.from(new Uint8Array(hashArrayBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        return hashHex;
    } else if (typeof require !== "undefined") {
        // Node.js environment - use Node's crypto module
        const nodeCrypto = require("crypto");
        const hash = nodeCrypto.createHash("sha256");
        hash.update(Buffer.from(this));
        return hash.digest("hex");
    } else {
        throw new Error("No crypto implementation available");
    }
};

/**
 * Converts the ArrayBuffer to a string using UTF-8 encoding.
 * @returns {string} The decoded string representation of the ArrayBuffer.
 * @throws {Error} If the bytes in the ArrayBuffer are not valid UTF-8.
 * @category Conversion
 */
ArrayBuffer.prototype.asString = function () {
    // Decoder assumes utf-8 encoding.
    // have to be careful with this. If the bytes are not valid utf-8, this will throw an error.
    return new TextDecoder().decode(this);
};

