"use strict";

// --- eval source url --------------------------------

/*
function evalStringFromSourceUrl (codeString, path) {
    const sourceUrl = `\n//# sourceURL=` + path + ``; // NOTE: this didn't work in Chrome if the path was inside single or double quotes
    const debugCode = codeString + sourceUrl;
    //console.log("eval: ", path);
    eval(debugCode);
}
*/

function evalStringFromSourceUrl(codeString, path) {
    // Sanitize the path to ensure it's safe for use in the sourceURL comment
    const sanitizedPath = path.replace(/[^a-zA-Z0-9\/\-_.]/g, ''); // Remove any characters that might break the comment

    // Ensure the path starts with a protocol or slash for proper debugging context
    const normalizedPath = !/^https?:\/\//i.test(sanitizedPath) && !/^\//.test(sanitizedPath) 
        ? '/' + sanitizedPath 
        : sanitizedPath;

    // Construct the sourceURL comment
    const sourceUrlComment = `\n//# sourceURL=${encodeURI(normalizedPath)}`;

    // Combine the code string with the sourceURL comment
    const debugCode = codeString + sourceUrlComment;
    console.log("eval path: ", path);
    // Evaluate the code
    const result = eval(debugCode);

    // Log the result for debugging purposes
    //console.log("Eval result:", result);

    // Return the result of the evaluation
    return result;
}

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
}

// --- URL promises -------------

URL.with = function (path) {
    return new URL(path, new URL(window.location.href))
}

(class URL_helpers extends URL {

    with (path) {
        return new URL(path, new URL(window.location.href))
    }
    
}).initThisCategory();

Object.defineSlot(URL.prototype, "promiseLoad", function () {
    const path = this.href
    console.log("URL.promiseLoad() (over NETWORK) ", path)
    return new Promise((resolve, reject) => {
        const rq = new XMLHttpRequest();
        rq.responseType = "arraybuffer";
        rq.open('GET', path, true);

        rq.onload  = (event) => { 
            if (rq.status >= 400 && rq.status <= 599) {
                reject(new Error(rq.status + " " + rq.statusText + " error loading " + path + " "))
            }
            this.response = rq.response
            //console.log("URL loaded ", path)
            //debugger
            resolve(rq.response) 
        }

        rq.onerror = (event) => { 
            console.log("URL error loading ", path)
            reject(undefined) 
        }
        rq.send()
    })
})

// --- Array promises --------------

Object.defineSlot(Array.prototype, "promiseSerialTimeoutsForEach", async function (aPromiseBlock) {
        const nextFunc = async function (array, index) {
            if (array.length === index) {
                return; // finished
            }

            const v = array[index];
            await aPromiseBlock(v);
            setTimeout(() => nextFunc(array, index+1), 0);
        }

        await nextFunc(this, 0);
});

Object.defineSlot(Array.prototype, "promiseSerialForEach", async function (aBlock) {
    for (let i = 0; i < this.length; i++) {
        await aBlock(this[i]);
    }
});


Object.defineSlot(Array.prototype, "promiseParallelMap", async function (aBlock) {
    const promises = this.map(v => aBlock(v));
    const values = await Promise.all(promises);
    return values;
});
