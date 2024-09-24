"use strict";

/**
 * @module boot.getGlobalThis
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
 * 
 * @function getGlobalThis
 * @returns {Object} The global object
 * @throws {Error} If unable to locate global `this`
 */
function getGlobalThis() {
	if (typeof(globalThis) !== 'undefined') {
		// should word in all modern browsers and node.js
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
};

getGlobalThis().getGlobalThis = getGlobalThis; // to make sure we can access this globally