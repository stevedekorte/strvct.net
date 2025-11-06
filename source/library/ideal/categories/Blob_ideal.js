"use strict";

/**
 * @module library.ideal.categories
 */

/**
 * @class Blob_ideal
 * @extends Blob
 * @classdesc Category extending the native Blob class with helper methods.
 *
 * NOTE: ArrayBuffer is preferred over Blob for better cross-platform compatibility.
 * Works in both browser and Node.js environments (Node.js 18+ has native Blob support).
 */

(class Blob_ideal extends Blob {

    /**
     * @static
     * @description Creates a Blob from a data URL string
     * @param {string} dataUrlString - The data URL to convert
     * @returns {Promise<Blob>} The created Blob
     * @category Conversion
     * @deprecated Use ArrayBuffer.asyncFromDataUrlString() for cross-platform compatibility
     */
    static async asyncFromDataUrlString (dataUrlString) {
        const response = await fetch(dataUrlString);
        return await response.blob();
    }

    /**
     * @description Converts this Blob to an ArrayBuffer
     * @returns {Promise<ArrayBuffer>} The ArrayBuffer (cached on first call)
     * @category Conversion
     */
    async asyncToArrayBuffer () {
        // Return cached ArrayBuffer if already extracted
        if (this._cachedArrayBuffer) {
            return this._cachedArrayBuffer;
        }

        // Extract and cache the ArrayBuffer
        const arrayBuffer = await FileReader.promiseReadAsArrayBuffer(this);
        this._cachedArrayBuffer = arrayBuffer;
        return this._cachedArrayBuffer;
    }

    /**
     * @description Converts this Blob to a data URL
     * @returns {Promise<string>} The data URL
     * @category Conversion
     */
    asyncToDataUrl () {
        return FileReader.promiseReadAsDataURL(this);
    }

    /**
     * @description Computes the SHA-256 hash of this Blob
     * @returns {Promise<string>} The SHA-256 hash as a hexadecimal string (cached on first call)
     * @category Hash
     */
    async asyncHexSha256 () {
        // Return cached hash if already computed
        if (this._cachedHash) {
            return this._cachedHash;
        }

        // Compute and cache the hash
        const arrayBuffer = await this.asyncToArrayBuffer();
        const hash = await arrayBuffer.asyncHexSha256();
        this._cachedHash = hash;
        return this._cachedHash;
    }


}.initThisCategory());
