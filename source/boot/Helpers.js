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
    // Sanitize the path to ensure it's safe for use in the sourceURL comment
    //const sanitizedPath = path.replace(/[^a-zA-Z0-9\/\-_.]/g, ''); // Remove any characters that might break the comment
    const sanitizedPath = path.replace(/[^a-zA-Z0-9/\-_.]/g, ''); // Remove any characters that might break the comment

    // Ensure the path doesn't start with a slash if it doesn't have a protocol
    const normalizedPath = !/^https?:\/\//i.test(sanitizedPath) 
        ? sanitizedPath.replace(/^\/+/, '') // Remove leading slashes
        : sanitizedPath;

    // Construct the sourceURL comment
    const sourceURL = encodeURI(normalizedPath);
    const sourceUrlComment = `\n//# sourceURL=${sourceURL}`;

    // Combine the code string with the sourceURL comment
    const debugCode = codeString + sourceUrlComment;
    //console.log("eval path: ", path);
    //console.log("sourceURL: ", sourceURL, "\n");
    
    // Evaluate the code
    const result = eval(debugCode);

    // Return the result of the evaluation
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
