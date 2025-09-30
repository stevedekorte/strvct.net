"use strict";

/**
 * @description FontFace polyfill for Node.js environments.
 * This file is only executed when running in a Node.js environment.
 * Provides a minimal implementation of the FontFace API that pretends to work.
 */

// Only define FontFace if it doesn't already exist
if (typeof FontFace === 'undefined') {
    console.log("evaluating FontFaceShim.js");

    /**
     * Minimal FontFace implementation for Node.js environments.
     * This is a stub that pretends to initialize but doesn't actually load fonts.
     */
    class FontFace {
        constructor (family, source, descriptors = {}) {
            this.family = family;
            this.source = source;
            this.descriptors = descriptors;
            this.status = 'unloaded';
            this.loaded = Promise.resolve(this);
        }

        /**
         * Pretends to load the font. Always resolves successfully.
         * @returns {Promise<FontFace>} A promise that resolves to this FontFace instance
         */
        load () {
            this.status = 'loaded';
            return Promise.resolve(this);
        }

        /**
         * Returns the font family name
         * @returns {string} The font family name
         */
        get family () {
            return this._family;
        }

        set family (value) {
            this._family = value;
        }

        /**
         * Returns the font source
         * @returns {string} The font source
         */
        get source () {
            return this._source;
        }

        set source (value) {
            this._source = value;
        }

        /**
         * Returns the font loading status
         * @returns {string} The loading status ('unloaded', 'loading', 'loaded', 'error')
         */
        get status () {
            return this._status;
        }

        set status (value) {
            this._status = value;
        }

        /**
         * Returns a promise that resolves when the font is loaded
         * @returns {Promise<FontFace>} A promise that resolves to this FontFace instance
         */
        get loaded () {
            return this._loaded;
        }

        set loaded (value) {
            this._loaded = value;
        }
    }

    // Set global reference
    SvGlobals.set("FontFace", FontFace);
    global.FontFace = FontFace;

    console.log("defined FontFace shim for Node.js");
}