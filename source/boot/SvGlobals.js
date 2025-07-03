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
 * console.log(globalThis === globalThis.globalThis); // true (everywhere)
 * console.log(window === window.window); // true (in a browser)
 * console.log(self === self.self); // true (in a browser or a Web Worker)
 * console.log(frames === frames.frames); // true (in a browser)
 * console.log(global === global.global); // true (in Node.js)
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
		if (typeof(globalThis) !== 'undefined') {
			// should work in all modern browsers and node.js
			return globalThis;
		}

		if (typeof(self) !== 'undefined') {
			// for browser and web workers
			return self;
		}

		if (typeof(window) !== 'undefined') { 
			// for older browsers that don't support globalThis
			window.global = window; 
			return window;
		}

		if (typeof(global) !== 'undefined') { 
			// for older node.js versions that don't support globalThis
			global.window = global; 
			return global;
		}

		// Note: this might still return the wrong result!
		if (typeof(this) !== 'undefined' && this.Math === Math) {
			return this;
		}
		
		throw new Error('Unable to locate global `this`');
	}

	static get (key) {
		return this.globals()[key];
	}

	static set (key, value) {
		this.globals()[key] = value;
	}

	static asMap () {
		const dict = this.globals();	
		const map = new Map(Object.entries(dict));
		return map;
	}
});

// Make SvGlobals globally available
SvGlobals.set("SvGlobals", SvGlobals);

if (SvGlobals.globals().SvGlobals === undefined) {
	throw new Error("SvGlobals is not defined");
}

console.log("--- setup SvGlobals ---");
