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

    duplicate () {
        return this; // blobs are immutable, so we can just return the same instance
    }

    /**
     * @static
     * @description Creates a Blob from a data URL string
     * @param {string} dataUrl - The data URL to convert
     * @returns {Blob} The created Blob
     * @category Conversion
     */
    static fromDataUrl (dataUrl) {
        // Validate data URL format
        if (!dataUrl || typeof dataUrl !== "string") {
            throw new Error("Invalid data URL: must be a string, not a '" + typeof dataUrl + "'");
        }
        if (!dataUrl.startsWith("data:")) {
            throw new Error("Invalid data URL: must start with 'data:'");
        }

        // Split the data URL to get the mime type and base64 data
        const commaIndex = dataUrl.indexOf(",");
        if (commaIndex === -1) {
            throw new Error("Invalid data URL: missing comma separator");
        }

        const header = dataUrl.substring(0, commaIndex);
        const data = dataUrl.substring(commaIndex + 1);

        // Extract MIME type (e.g., "data:image/png;base64" -> "image/png")
        const mimeMatch = header.match(/data:([^;]+)/);
        const mimeString = mimeMatch ? mimeMatch[1] : "application/octet-stream";

        // Check if it's base64 encoded
        const isBase64 = header.includes(";base64");

        let uint8Array;
        if (isBase64) {
            // Decode base64 (works in both browser and Node.js)
            let byteString;
            if (typeof atob !== "undefined") {
                // Browser environment
                byteString = atob(data);
            } else {
                // Node.js environment
                byteString = Buffer.from(data, "base64").toString("binary");
            }

            uint8Array = new Uint8Array(byteString.length);
            for (let i = 0; i < byteString.length; i++) {
                uint8Array[i] = byteString.charCodeAt(i);
            }
        } else {
            // URL-encoded data (rare but valid)
            const decoded = decodeURIComponent(data);
            uint8Array = new Uint8Array(decoded.length);
            for (let i = 0; i < decoded.length; i++) {
                uint8Array[i] = decoded.charCodeAt(i);
            }
        }

        // Create and return the Blob
        return new Blob([uint8Array], { type: mimeString });
    }

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

        if (this._asyncToArrayBufferPromise) {
            return this._asyncToArrayBufferPromise;
        }

        // Extract and cache the ArrayBuffer
        this._asyncToArrayBufferPromise = FileReader.promiseReadAsArrayBuffer(this);
        const arrayBuffer = await this._asyncToArrayBufferPromise;
        this._cachedArrayBuffer = arrayBuffer;
        this._asyncToArrayBufferPromise = null;
        return this._cachedArrayBuffer;
    }

    /**
     * @description Converts this Blob to a data URL
     * @returns {Promise<string>} The data URL
     * @category Conversion
     */
    async asyncAsDataUrl () {
        if (this._cachedDataUrl) {
            return this._cachedDataUrl;
        }

        if (this._asyncDataUrlPromise) {
            return this._asyncDataUrlPromise;
        }

        this._dataUrlPromise = FileReader.promiseReadAsDataURL(this);
        const dataUrl = await this._dataUrlPromise;
        this._cachedDataUrl = dataUrl;
        this._dataUrlPromise = null;
        return this._cachedDataUrl;
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

        if (this._asyncHexSha256Promise) {
            return this._asyncHexSha256Promise;
        }

        // Compute and cache the hash
        this._asyncHexSha256Promise = Promise.clone();
        const arrayBuffer = await this.asyncToArrayBuffer();
        const hash = await arrayBuffer.asyncHexSha256();
        this._cachedHash = hash;
        this._asyncHexSha256Promise.callResolveFunc(hash);
        this._asyncHexSha256Promise = null;
        return this._cachedHash;
    }

    /**
     * @description Converts this Blob to an Image object
     * @returns {Promise<Image>} The loaded Image object
     * @category Conversion
     */
    async asyncAsImageObject () {
        // Use URL.createObjectURL for much better performance than data URLs
        const url = URL.createObjectURL(this);
        const image = new Image();

        return new Promise((resolve, reject) => {
            image.onload = () => {
                URL.revokeObjectURL(url); // Clean up the object URL
                resolve(image);
            };
            image.onerror = (error) => {
                URL.revokeObjectURL(url); // Clean up on error too
                reject(new Error(`Failed to load image: ${error}`));
            };
            image.src = url;
        });
    }

    async asyncAsString (encoding = "utf-8") {
        assert(Type.isString(encoding), "encoding must be a string");
        assert(encoding.length > 0, "encoding is empty");
        const arrayBuffer = await this.asyncToArrayBuffer();
        return new TextDecoder().decode(arrayBuffer);
    }

}.initThisCategory());
