"use strict";


(class URL_promises extends URL {

    static with (path) {
        return new URL(path, new URL(window.location.href));
    }

    promiseLoad () {
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