"use strict";

/**
 * @module boot
 */

/**
 * @class URL_promises
 * @classdesc A StrvctFile-based replacement for URL handling that works in both browser and Node.js.
 */
(class URL_promises extends Object {

    /**
     * Creates a new URL_promises instance with the given path.
     * @param {string} path - The file path to load.
     * @returns {URL_promises} A new URL_promises instance.
     */
    static with (path) {
        const instance = new URL_promises();
        instance.href = path;
        instance.pathname = path;
        return instance;
    }

    /**
     * Constructor for URL_promises.
     */
    constructor () {
        super();

        this.href = "";
        this.pathname = "";
        this.response = null;
    }

    /**
     * Loads the content of the URL using StrvctFile.
     * @returns {Promise<ArrayBuffer>} A promise that resolves with the response as an ArrayBuffer.
     */
    async promiseLoad () {
        const path = this.href;
        console.log("[URL] promiseLoad() (over NETWORK) ", path);

        try {
            const file = StrvctFile.with(path);
            const textContent = await file.asyncLoad();

            // Convert text to ArrayBuffer to maintain API compatibility
            const encoder = new TextEncoder();
            const arrayBuffer = encoder.encode(textContent).buffer;

            this.response = arrayBuffer;
            //console.log("URL loaded ", path)
            return arrayBuffer;
        } catch (error) {
            console.log("URL error loading ", path, error);
            throw new Error(`Error loading ${path}: ${error.message}`);
        }
    }

}).initThisCategory();
