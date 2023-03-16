
"use strict";

// A single function to access globals that works
// in the browser (which uses 'window') and on node.js (which uses 'global')

function getGlobalThis () {
	const isDef = function (v) {
		return typeof(v) !== "undefined"
	}

	if (isDef(globalThis)) {
        return globalThis;
    }

	if (isDef(self)) {
        return self;
    }

	if (isDef(window)) {
		window.global = window;
		return window;
	}

	if (isDef(global)) {
		global.window = global;
		return global;
	}

	// Note: this might still return the wrong result!
	if (isDef(this)) {
        return this;
    }
    
	throw new Error("Unable to locate global `this`");
  };

  getGlobalThis().getGlobalThis = getGlobalThis;