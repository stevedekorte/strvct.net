"use strict";

/**
 * @module boot
 */

/**
 * A single function which can be used either from the browser or node.js to get the global object.
 *
 * Notes:
 *
 * From: https://developer.mozilla.org/en-US/docs/Glossary/Global_object
 *
 * globalThis === globalThis.globalThis // true (everywhere)
 * window === window.window // true (in a browser)
 * self === self.self // true (in a browser or a Web Worker)
 * frames === frames.frames // true (in a browser)
 * global === global.global // true (in Node.js)
 */

const SvGlobals = (class SvGlobals extends Object {

    static globals () {
        if (this._globals) {
            return this._globals;
        }

        this._globals = this.privateSetupGlobals();
        return this._globals;
    }

    static privateSetupGlobals () {
        if (typeof(globalThis) !== "undefined") {
            // should work in all modern browsers and node.js
            return globalThis;
        }

        if (typeof(self) !== "undefined") {
            // for browser and web workers
            return self;
        }

        if (typeof(window) !== "undefined") {
            // for older browsers that don't support globalThis
            window.global = window;
            return window;
        }

        if (typeof(global) !== "undefined") {
            // for older node.js versions that don't support globalThis
            global.window = global;
            return global;
        }

        // Note: this might still return the wrong result!
        if (typeof(this) !== "undefined" && this.Math === Math) {
            return this;
        }

        throw new Error("Unable to locate global `this`");
    }

    static get (key) {
        return this.globals()[key];
    }

    static set (key, value) {
        if (this.has(key)) {
            throw new Error(`SvGlobals.set("${key}") is already defined`);
        }
        this.globals()[key] = value;
    }

    static update (key, value) {
        this.globals()[key] = value;
    }

    static setIfAbsent (key, value) {
        if (!this.has(key)) {
            this.globals()[key] = value;
        }
    }

    static has (key) {
        return this.globals()[key] !== undefined;
    }

    static assertHas (key, errorMessage) {
        if (!this.has(key)) {
            throw new Error(errorMessage ? errorMessage : `SvGlobals.assertHas("${key}") is not defined`);
        }
    }

    static asMap () {
        const dict = this.globals();
        const map = new Map(Object.entries(dict));
        return map;
    }

});

// Make SvGlobals globally available
SvGlobals.update("SvGlobals", SvGlobals);

if (SvGlobals.globals().SvGlobals === undefined) {
    throw new Error("SvGlobals is not defined");
}
