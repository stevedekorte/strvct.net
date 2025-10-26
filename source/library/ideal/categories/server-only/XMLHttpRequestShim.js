"use strict";

/**
 * @description XMLHttpRequest polyfill for Node.js environments.
 * This file is only executed when running in a Node.js environment.
 * Provides XMLHttpRequest functionality using the xhr2 package.
 *
 * The xhr2 package properly supports responseType="arraybuffer" for binary data,
 * unlike the older xmlhttprequest package which corrupts binary responses.
 */

// Only define XMLHttpRequest if it doesn't already exist
if (typeof XMLHttpRequest === "undefined") {

    const NodeXMLHttpRequest = require("xhr2");

    // Wrapper class to fix event handling compatibility
    // Note: xhr2 properly supports responseType="arraybuffer" so no conversion needed
    class XMLHttpRequest extends NodeXMLHttpRequest {
        constructor () {
            super();
            this._onerror = null;
            this._onload = null;
            this._onreadystatechange = null;
        }

        set onerror (callback) {
            this._onerror = callback;
            super.onerror = (error) => {
                if (callback) {
                    // Create a proper event-like object if one wasn't provided
                    const event = error || { type: "error", target: this };
                    callback(event);
                }
            };
        }

        get onerror () {
            return this._onerror;
        }

        set onload (callback) {
            this._onload = callback;
            super.onload = (event) => {
                if (callback) {
                    // Ensure event object exists
                    const eventObj = event || { type: "load", target: this };
                    callback(eventObj);
                }
            };
        }

        get onload () {
            return this._onload;
        }

        set onreadystatechange (callback) {
            this._onreadystatechange = callback;
            super.onreadystatechange = (event) => {
                if (callback) {
                    // Ensure event object exists
                    const eventObj = event || { type: "readystatechange", target: this };
                    callback(eventObj);
                }
            };
        }

        get onreadystatechange () {
            return this._onreadystatechange;
        }
    }

    // Set global references
    SvGlobals.setIfAbsent("XMLHttpRequest", XMLHttpRequest);
    global.XMLHttpRequest = XMLHttpRequest;

}
