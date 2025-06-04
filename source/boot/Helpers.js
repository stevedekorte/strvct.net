"use strict";

/**
 * @module boot
 */

// --- eval source url --------------------------------

/*
function evalStringFromSourceUrl (codeString, path) {
    const sourceUrl = `\n//# sourceURL=` + path + ``; // NOTE: this didn't work in Chrome if the path was inside single or double quotes
    const debugCode = codeString + sourceUrl;
    //console.log("eval: ", path);
    eval(debugCode);
};
*/

function evalStringFromSourceUrl (codeString, path) {
    // Based on git history, adding a leading slash fixed VSCode breakpoints in May 2022
    // However, as of 2025, VSCode requires relative paths (no leading slash) for proper file mapping
    // Chrome doesn't like quotes around the path (fixed Dec 2023)  
    // Rich Collins added encodeURI in Aug 2024 to handle spaces and special characters
    const sourceURL = path; // Relative path for VSCode compatibility
    const encodedURL = encodeURI(sourceURL);
    const sourceUrlComment = `\n//# sourceURL=${encodedURL}`;
    const debugCode = codeString + sourceUrlComment;
    
    // Evaluate the code
    const result = eval(debugCode);
    return result;
}

getGlobalThis().evalStringFromSourceUrl = evalStringFromSourceUrl;

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
