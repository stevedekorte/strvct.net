"use strict";

/**
 * @module boot
 */

/**
 * @class URL_promises
 * @extends URL
 * @classdesc Extends the built-in URL class with additional promise-based methods.
 */
(class URL_promises extends URL {

    /**
     * Creates a new URL object with the given path relative to the current window location.
     * @param {string} path - The path to append to the current window location.
     * @returns {URL_promises} A new URL_promises instance.
     */
    static with(path) {
        return new URL(path, new URL(window.location.href));
    }

    /**
     * Loads the content of the URL using XMLHttpRequest.
     * @returns {Promise<ArrayBuffer>} A promise that resolves with the response as an ArrayBuffer.
     */
    promiseLoad() {
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
    }
    
}).initThisCategory();
