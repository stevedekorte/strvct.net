"use strict";

/**
 * @module library.ideal
 * @class ArrayBuffer_ideal
 * @extends ArrayBuffer
 * @classdesc Category extending the native ArrayBuffer class with async helper methods.
 *
 * ArrayBuffer is preferred over Blob for cross-platform compatibility (works in both Node.js and browsers).
 */
(class ArrayBuffer_ideal extends ArrayBuffer {

    /**
     * @static
     * @description Creates an ArrayBuffer from a data URL string
     * @param {string} dataUrlString - The data URL to convert
     * @returns {Promise<ArrayBuffer>} The created ArrayBuffer
     * @category Conversion
     */
    static async asyncFromDataUrlString (dataUrlString) {
        const response = await fetch(dataUrlString);
        return await response.arrayBuffer();
    }

    async asyncToDataUrlWithMimeType (mimeType) {
        assert(mimeType, "mimeType is required");
        assert(Type.isString(mimeType), "mimeType must be a string");
        assert(mimeType.length > 0, "mimeType is empty");
        return await this.asyncToDataUrl(mimeType);
    }

    /**
     * @description Converts this ArrayBuffer to a data URL (browser-only)
     * @param {string} [mimeType="application/octet-stream"] - The MIME type for the data URL
     * @returns {Promise<string>} The data URL
     * @category Conversion
     */
    async asyncToDataUrl (mimeType = "application/octet-stream") {
        if (typeof Blob === "undefined") {
            throw new Error("asyncToDataUrl requires Blob API (browser-only)");
        }
        const blob = new Blob([this], { type: mimeType });
        return FileReader.promiseReadAsDataURL(blob);
    }

    /**
     * @description Converts this ArrayBuffer to a Blob (browser-only)
     * @param {string} [mimeType="application/octet-stream"] - The MIME type for the Blob
     * @returns {Blob} The created Blob
     * @category Conversion
     */
    toBlob (mimeType = "application/octet-stream") {
        if (typeof Blob === "undefined") {
            throw new Error("toBlob requires Blob API (browser-only)");
        }
        return new Blob([this], { type: mimeType });
    }

    /*
    // already defined in ArrayBuffer_sha256.js
    asString () {
        // assumes utf-8 encoding
        return new TextDecoder().decode(this);
    }
    */

}).initThisCategory();

