"use strict";

/**
 * @module boot
 */

// --- eval source url --------------------------------

function evalStringFromSourceUrl (codeString, path) {
    // Based on git history, adding a leading slash fixed VSCode breakpoints in May 2022
    // Chrome doesn't like quotes around the path (fixed Dec 2023)  
    // Rich Collins added encodeURI in Aug 2024 to handle spaces and special characters
    // Must NOT include leading slash for VSCode compatibility (makes sources editable)
    const sourceURL = path;
    const encodedURL = encodeURI(sourceURL);
    
    // sourceURL comment format for Chrome DevTools and VSCode debugging
    // Must be at end of code (Chrome spec), no leading slash (VSCode compat)
    const sourceUrlComment = `\n//# sourceURL=${encodedURL}`;
    const debugCode = codeString + sourceUrlComment;
    
    // Evaluate the code with error handling
    try {
        let result;
        
        if (SvPlatform.isNodePlatform()) {
            // In Node.js, we need to ensure eval runs in global context for UMD modules to work
            // Node.js: Use indirect eval to run in global scope
            // This ensures 'this' points to the global object like it does in browser
            const globalObj = SvGlobals.globals();
            
            // Provide polyfills for external libraries that expect browser/Node.js APIs
            if (!globalObj.require) {
                globalObj.require = require;
            }
            
            result = eval.call(globalObj, debugCode);
        } else {
            result = eval(debugCode);
           // result = new Function(debugCode)(); // new Function() is faster than eval() but causes 2-line offset in debugger
        }
        
        //console.log("✅ Successfully evaluated:", path);
        return result;
    } catch (evalError) {
        // Add context to error and re-throw (error will be handled by SvResourceManager)
        console.error("❌ Error evaluating: '" + path + "'");
        debugger;
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
