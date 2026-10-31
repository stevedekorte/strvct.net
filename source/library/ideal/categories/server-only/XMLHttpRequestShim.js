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

    // The "blob" fix below overrides xhr2's private parser; xhr2 is pinned to
    // 0.2.1 for that reason. Say so loudly if an upgrade removed it.
    if (typeof NodeXMLHttpRequest.prototype._parseResponse !== "function") {
        console.error("XMLHttpRequestShim: xhr2 has no _parseResponse() (expected xhr2 0.2.1) — responseType \"blob\" downloads will be CORRUPTED under Node (decoded as text). Re-check the blob override against this xhr2.");
    }

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

        /**
         * @description xhr2 cannot send a Blob ("Unsupported send() data
         * [object Blob]", thrown from inside the caller's timer, so uncaught):
         * it takes strings, ArrayBuffers and typed arrays only. Node has a
         * global Blob, so libraries build Blob bodies under Node as they do in
         * a browser — the Firebase Storage SDK assembles its upload body as
         * one — and a server-hosted table crashed seating a character whose
         * portrait it uploaded (2026-10-31). Send the Blob's bytes instead,
         * once read; a Blob's type becomes the Content-Type if none was set.
         * strvct/tests/headless/TestXhrBlobUpload.js pins it.
         * @param {*} body
         */
        send (body) {
            if (typeof Blob === "undefined" || !(body instanceof Blob)) {
                return super.send(body);
            }
            body.arrayBuffer().then((bytes) => {
                if (body.type && !this.hasContentTypeHeader()) {
                    this.setRequestHeader("Content-Type", body.type);
                }
                super.send(new Uint8Array(bytes));
            }, (error) => {
                console.error("XMLHttpRequestShim: could not read the Blob to send:", error);
                if (this._onerror) {
                    this._onerror({ type: "error", target: this });
                }
            });
            return undefined;
        }

        /**
         * @description Whether this request already names its Content-Type
         * (a header set by setRequestHeader, in any letter case).
         * @returns {Boolean}
         */
        hasContentTypeHeader () {
            const headers = this._headers || {};
            return Object.keys(headers).some((name) => name.toLowerCase() === "content-type");
        }

        /**
         * @description xhr2 has no "blob" response type: it falls through to
         * text and decodes the bytes as UTF-8, so every binary download
         * (Storage blobs, images, audio) arrived corrupted under Node — a
         * 13,504-byte PNG became 24,189 bytes with a different hash. Parse a
         * "blob" response as raw bytes and hand back a Blob typed with the
         * response's Content-Type, as a browser does.
         *
         * Overrides xhr2's private parser (hence the underscore), so
         * strvct/tests/headless/TestXhrBlobResponse.js pins it.
         */
        _parseResponse () {
            if (this.responseType !== "blob") {
                return super._parseResponse();
            }
            this.responseType = "buffer";
            super._parseResponse();
            this.responseType = "blob";
            this.response = new Blob([this.response], { type: this.getResponseHeader("Content-Type") || "" });
            return undefined;
        }
    }

    // Set global references
    SvGlobals.setIfAbsent("XMLHttpRequest", XMLHttpRequest);
    global.XMLHttpRequest = XMLHttpRequest;

}
