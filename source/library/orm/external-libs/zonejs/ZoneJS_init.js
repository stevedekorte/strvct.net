/**
 * Zone.js initialization for Node.js environments
 *
 * This module provides a safe way to load Zone.js in Node.js while avoiding
 * conflicts with existing Promise extensions (like STRVCT framework).
 */

"use strict";

/**
 * Initialize Zone.js for Node.js environment
 * Sets up browser compatibility and loads Zone.js if not already loaded
 */
function initZoneJS () {
    // Set up Node.js compatibility by polyfilling window as global
    if (typeof window === "undefined") {
        global.window = global;
    }

    // Only load Zone.js if it hasn't been loaded already
    if (!global.Zone) {
        require("./zone.js.js");
    }
}

module.exports = initZoneJS;
