"use strict";

/**
 * @module library.ideal
 * @description Category methods for FileReader
 */

/**
 * @static
 * @description Promise-based wrapper for readAsArrayBuffer
 * @param {Blob} blob - The data to read
 * @returns {Promise<ArrayBuffer>} Promise that resolves with the ArrayBuffer result
 */
FileReader.promiseReadAsArrayBuffer = function (blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (event) => reject(event.target.error);
        reader.readAsArrayBuffer(blob);
    });
};

/**
 * @static
 * @description Promise-based wrapper for readAsDataURL
 * @param {Blob} blob - The data to read
 * @returns {Promise<string>} Promise that resolves with the data URL string
 */
FileReader.promiseReadAsDataURL = function (blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (event) => reject(event.target.error);
        reader.readAsDataURL(blob);
    });
};

/**
 * @static
 * @description Promise-based wrapper for readAsText
 * @param {Blob} blob - The data to read
 * @param {string} [encoding] - Optional encoding
 * @returns {Promise<string>} Promise that resolves with the text result
 */
FileReader.promiseReadAsText = function (blob, encoding) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (event) => reject(event.target.error);
        reader.readAsText(blob, encoding);
    });
};
