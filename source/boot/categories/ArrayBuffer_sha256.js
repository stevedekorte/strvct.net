"use strict";

/**
 * @module boot
 */

// ArrayBuffer and Uint8Array can't be extended via the normal category system
// because they are TypedArray constructors. We'll add methods directly to their prototypes.

/**
 * Computes SHA-256 hash of the ArrayBuffer and returns it as a base64 string.
 * Works in both browser and Node.js environments.
 * @returns {Promise<string>} The SHA-256 hash as a base64 string
 */
ArrayBuffer.prototype.asyncSha256 = async function () {
    if (typeof crypto !== "undefined" && crypto.subtle) {
        // Browser environment or Node.js with Web Crypto API
        const hashArrayBuffer = await crypto.subtle.digest("SHA-256", this);
        const hashString = btoa(String.fromCharCode.apply(null, new Uint8Array(hashArrayBuffer)));
        return hashString;
    } else if (typeof require !== "undefined") {
        // Node.js environment - use Node's crypto module
        const nodeCrypto = require("crypto");
        const hash = nodeCrypto.createHash("sha256");
        hash.update(Buffer.from(this));
        return hash.digest("base64");
    } else {
        throw new Error("No crypto implementation available");
    }
};
