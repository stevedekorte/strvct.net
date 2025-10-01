"use strict";

/**
 * @module library.ideal.categories
 */

/**
 * @class Blob_ideal
 * @extends Blob
 * @classdesc Category extending the native Blob class with helper methods.
 *
 * NOTE: ArrayBuffer is preferred over Blob for cross-platform compatibility.
 * These methods are browser-only and will not work in Node.js.
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
        console.warn("Blob.asyncFromDataUrlString() is browser-only. Consider using ArrayBuffer.asyncFromDataUrlString() for cross-platform compatibility.");
        const response = await fetch(dataUrlString);
        return await response.blob();
    }

    /**
     * @description Converts this Blob to an ArrayBuffer
     * @returns {Promise<ArrayBuffer>} The ArrayBuffer
     * @category Conversion
     */
    asyncToArrayBuffer () {
        console.warn("Blob.asyncToArrayBuffer() is browser-only. Consider using ArrayBuffer directly for cross-platform compatibility.");
        return FileReader.promiseReadAsArrayBuffer(this);
    }

    /**
     * @description Converts this Blob to a data URL
     * @returns {Promise<string>} The data URL
     * @category Conversion
     */
    asyncToDataUrl () {
        console.warn("Blob.asyncToDataUrl() is browser-only. Consider using ArrayBuffer.asyncToDataUrl() for cross-platform compatibility.");
        return FileReader.promiseReadAsDataURL(this);
    }

}.initThisCategory());
