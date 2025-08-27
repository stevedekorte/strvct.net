"use strict";

/**
 * Shim to make ajv7 available globally in Node.js
 * This ensures AjvValidator can find the ajv7 library in Node.js environments
 */

if (typeof globalThis === 'undefined') {
    // For older Node.js versions that don't have globalThis
    if (typeof global !== 'undefined') {
        global.globalThis = global;
    }
}

// Check if we're in Node.js and ajv7 hasn't been set up globally yet
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    if (typeof globalThis.ajv7 === 'undefined') {
        // The ajv7.js file will have been loaded and should be available as a module
        // We need to check where it ended up and make it available globally
        
        // Try to find ajv7 - it might have been loaded as a module
        try {
            // Check if it's available through eval context (since files are eval'd)
            if (typeof ajv7 !== 'undefined') {
                globalThis.ajv7 = ajv7;
                console.log("AjvShim: Made ajv7 available globally from eval context");
            }
        } catch (e) {
            // ajv7 not found in current scope
            console.warn("AjvShim: ajv7 not found in current scope, AjvValidator may not work properly");
        }
    }
}