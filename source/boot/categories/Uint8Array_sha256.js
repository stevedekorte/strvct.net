"use strict";

/**
 * @module boot
 */

// ArrayBuffer and Uint8Array can't be extended via the normal category system
// because they are TypedArray constructors. We'll add methods directly to their prototypes.

/**
 * Computes SHA-256 hash of the Uint8Array and returns it as a base64 string.
 * Works in both browser and Node.js environments.
 * @returns {Promise<string>} The SHA-256 hash as a base64 string
 */
Uint8Array.prototype.asyncSha256 = async function () {
    // Convert to ArrayBuffer and use its asyncSha256 method
    // the purpose of this is to allow for hashing of Uint8Arrays that are not contiguous in memory
    const chunk = this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength);
    return await chunk.asyncSha256();
};
