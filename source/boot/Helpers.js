"use strict";

/**
 * @module boot
 */

// --- eval source url --------------------------------

function evalStringFromSourceUrl (codeString, path) {
    // Based on git history, adding a leading slash fixed VSCode breakpoints in May 2022
    // However, as of 2025, VSCode requires relative paths (no leading slash) for proper file mapping
    // Chrome doesn't like quotes around the path (fixed Dec 2023)  
    // Rich Collins added encodeURI in Aug 2024 to handle spaces and special characters
    //console.log("🟡 HELPER: evalStringFromSourceUrl", path);
    const sourceURL = path; // Relative path for VSCode compatibility
    const encodedURL = encodeURI(sourceURL);
    const sourceUrlComment = `\n//# sourceURL=${encodedURL}`;
    const debugCode = codeString + sourceUrlComment;
    
    // Evaluate the code with error handling
    try {
        let result;
        
        // In Node.js, we need to ensure eval runs in global context for UMD modules to work
        if (SvPlatform.isNodePlatform()) {
            // Node.js: Use indirect eval to run in global scope
            // This ensures 'this' points to the global object like it does in browser
            const globalObj = SvGlobals.globals();
            
            // Provide polyfills for external libraries that expect browser/Node.js APIs
            if (!globalObj.require) {
                globalObj.require = require;
            }
            
            const globalEval = eval;
            result = globalEval.call(globalObj, debugCode);
        } else {
            // Browser: Direct eval (runs in global scope already)
            //result = eval(debugCode);
            result = new Function(debugCode)();
        }
        
        //console.log("✅ Successfully evaluated:", path);
        return result;
    } catch (evalError) {
        // Add context to error and re-throw (error will be handled by ResourceManager)
        evalError.evalPath = path;
        throw evalError;
    }
}

SvGlobals.globals().evalStringFromSourceUrl = evalStringFromSourceUrl;

// --- Object defineSlot ---

Object.defineSlot = function (obj, slotName, slotValue) {
    const descriptor = {
        configurable: true,
        enumerable: false,
        value: slotValue,
        writable: true,
    }

    if (typeof(slotValue) === "function") {
        slotValue.displayName = slotName
    }
    
    Object.defineProperty(obj, slotName, descriptor)
};
