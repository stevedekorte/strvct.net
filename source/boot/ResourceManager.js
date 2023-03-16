"use strict";

/*

    A Javascript sequential file loader. 

    Loads build/_index.json and build/_cam.json.zip, then
    evals JS files in _index in order (adding sourceURL comment for debugger).
	NOTE: sourceURL needs to begin with a / to work with VSCode.

    The loading begins on the window load event.

    Should also post events to load panel.

	Some files in the index will not be in the cam and are left for the app
	to load over the network (lazily) and perhaps cache using indexeddb. 
	As the index contains a hash of the file, we can easily check to see if we
	already have the file cached.

*/

// --- eval source url --------------------------------

function evalStringFromSourceUrl (codeString, path) {
    const sourceUrl = "\n//# sourceURL=/" + path + " \n";
    const debugCode = codeString + sourceUrl;
    eval(debugCode);
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

Object.defineSlot(URL.prototype, "promiseLoad", function () {
    const path = this.href
    console.log("loading ", path)
    return new Promise((resolve, reject) => {
        const rq = new XMLHttpRequest();
        rq.responseType = "arraybuffer";
        rq.open('GET', path, true);

        rq.onload  = (event) => { 
            if (rq.status >= 400 && rq.status <= 599) {
                reject(new Error(request.status + " " + rq.statusText + " error loading " + path + " "))
            }
            this.response = rq.response
            console.log("loaded ", path)
            resolve(rq.response) 
        }

        rq.onerror = (event) => { 
            reject(undefined) 
        }
        rq.send()
    })
})

// --- Array promises --------------

Object.defineSlot(Array.prototype, "promiseForEach", function (aBlock) {
    let promise = null
    this.forEach((v) => {
        if (promise) {
            promise = promise.then(() => { 
                return aBlock(v) 
            })
        } else {
            promise = aBlock(v)
        }
    })
    return promise
})

Object.defineSlot(Array.prototype, "promiseParallelMap", function (aBlock) {
    const promises = this.map((v) => aBlock(v))
    return Promise.all(promises) // passes results to then()
})

// -----------------------------------


class UrlResource {

    static _bytesLoaded = 0;
    static _urlsLoaded = 0;

    static with (url) {
        return this.clone().setPath(url)
    }

    static clone () {
        const instance = new this()
        instance.init()
        return instance
    }
	
    init () {
        this._path = null
        this._resourceHash = null
        this._request = null
        this._data = null
        return this
    }

    setPath (aPath) {
        this._path = aPath
        return this
    }

    path () {
        return this._path
    }

    promiseLoad () {
        return URL.with(this.path()).promiseLoad().then((data) => {
            this._data = data
            this.constructor._bytesLoaded += data.byteLength
            this.constructor._urlsLoaded += 1
            return Promise.resolve(this)
        }).catch((error) => {
            this._error = error
            throw error
        })
    }

    promiseLoadAndEval () {
        return this.promiseLoad().then(() => {
            this.evalDataAsJS()
            return Promise.resolve(this)
        })
    }

    evalDataAsJS () {
        console.log("UrlResource eval ", this.path())
        evalStringFromSourceUrl(this.dataAsText(), this.path())
        return this
    }

    evalDataAsCss () {
        const cssString = this.dataAsText(); // default decoding is to utf8
        const sourceUrl = "\n\n//# sourceURL=" + entry.path + " \n"
        const debugCssString = cssString + sourceUrl
        //console.log("eval css: " +  entry.path)
        const element = document.createElement('style');
        element.type = 'text/css';
        element.appendChild(document.createTextNode(debugCssString))
        document.head.appendChild(element);
    }

    data () {
        return this._data;
    }

    dataAsText () {
        return new TextDecoder().decode(this.data()); // default decoding is to utf8
    }

    pathSuffix () {
        return this.path().split(".").pop()
    }

    isZipFile () {
        return this.pathSuffix() === "zip"
    }

    dataAsJson () {
        let data = this.data()
        if (this.isZipFile()) {
            data = this.unzippedString()
        } else {
            data = new TextDecoder().decode(data); // default decoding is to utf8
        }
        return JSON.parse(data)
    }

    unzippedString () {
        const outData = pako.inflate(this.data());
        return new TextDecoder().decode(outData);
    }
}

// ------------------------------------------------------------------------

class ResourceManager {

    static shared () {
        if (!this._shared) {
            this._shared = (new this).init()
        }
        return this._shared
    }

    isInBrowser () {
        return (typeof(document) !== 'undefined')
    }

    init () {
        this._index = null
        this._cam = null
        this._idb = null
        this._evalCount = 0
		this._doneTime = null
        this._promiseForLoadCam = null
        return this
    }

    hashCache () {
        return HashCache.shared()
    }

    run () {
        this.onProgress("", 0)

        // load the boot resource index and start loading/evaling js files
        this.promiseLoadIndex().then(() => {
            this.eval()
        })

        return this
    }

    // --- loading ---

    promiseLoadIndex () {
        const path = "build/_index.json"
        return UrlResource.with(path).promiseLoad().then((resource) => {
            this._index = resource.dataAsJson()
        })
    }

    promiseLoadCam () {
        // cache the promise so if we call this multiple times we don't load it again
        if (!this._promiseForLoadCam) {
            const path = "build/_cam.json.zip"
            this._promiseForLoadCam = UrlResource.with(path).promiseLoad().then((resource) => {
                this._cam = resource.dataAsJson()
            })
        }
        return this._promiseForLoadCam
    }

    // --- index entries ---

    extForPath (path) {
        const parts = path.split(".")
        return parts.length ? parts[parts.length -1] : undefined
    }

    entryForPath (path) {
        return this._index.detect(entry => entry.path === path)
    }

    jsEntries () {
        return this._index.filter(entry => this.extForPath(entry.path) === "js")
    }

    cssEntries () {
        return this._index.filter(entry => this.extForPath(entry.path) === "css")
    }

    // --- eval ---

    promiseCacheCam () {
        return this.promiseLoadCam().then(() => {
            return Reflect.ownKeys(this._cam).promiseForEach((key) => {
                const value = this._cam[key]
                return this.hashCache().promiseAtPut(key, value)
            })
        })
    }

    promiseLoadCamIfNeeded () {
        // if hashCache is empty, load the compressed cam and add it to the cache first
        // as this will be much faster than loading the files individually

        //return this.hashCache().promiseClear().then(() => {
            return this.hashCache().promiseCount().then((count) => {
                if (!count) {
                    return this.promiseCacheCam()
                }
                this._cam = new Map()
                return Promise.resolve()
            })
        //})
    }

    eval () {
        this.promiseLoadCamIfNeeded().then(() => {
            this.evalEntries()
        })
    }

    evalEntries () {
        this.cssEntries().promiseForEach(entry => this.promiseEvalCssEntry(entry)).then(() => {
            return this.jsEntries().promiseForEach(entry => this.promiseEvalJsEntry(entry))
        }).then(() => this.onDone())
    }

    promiseEvalJsEntry (entry) {
        return this.hashCache().promiseContentForHashOrUrl(entry.hash, entry.path).then((value) => {
            if (typeof(value) !== "string") {
                value = new TextDecoder().decode(value); // default decoding is to utf8
            }
            //.log("eval js " + entry.path)
            assert(value.length !== 0)
            evalStringFromSourceUrl(value, entry.path) 
        })
    }
    
    promiseEvalCssEntry (entry) {
        if (this.isInBrowser()) {
            return this.hashCache().promiseContentForHashOrUrl(entry.hash, entry.path).then((value) => {
                //console.log("eval css", entry.path)
                if (typeof(value) !== "string") {
                    value = new TextDecoder().decode(value); // default decoding is to utf8
                }
                const cssString = value
                const sourceUrl = "\n\n//# sourceURL=" + entry.path + " \n"
                const debugCssString = cssString + sourceUrl
                //console.log("eval css: " +  entry.path)
                const element = document.createElement('style');
                element.type = 'text/css';
                element.appendChild(document.createTextNode(debugCssString))
                document.head.appendChild(element);
            })
        }
        return Promise.resolve()
    }

    // --- cam ---

    /*
    camValueForPath (path) {
        const entry = this.entryForPath(path)
        if (entry) {
            const value = this._cam[entry.hash]
            return value
        }
        return undefined
    }

    camValueForEntry (entry) {
        const value = this._cam[entry.hash]
        if (!value) {
            throw new Error("missing cam value for entry: " + JSON.stringify(entry))
        }
        return value
    }
    */

    /*
    evalWithRequire () {
        this.files().forEach(file => require(file))
        return this
    }
    */

    // --- browser specific ---

    isInBrowser () {
        return (typeof(document) !== 'undefined')
    }

    /*
    postEvent (eventName, detail) {
        if (this.isInBrowser()) {
            const myEvent = new CustomEvent(eventName, {
                detail: detail,
                bubbles: true,
                cancelable: true,
                composed: false,
              });
              window.dispatchEvent(myEvent); // only called in Browser
        }
        return this
    }
    */
    
    onProgress (path) {
        this._evalCount ++
        //const detail = { path: path, progress: this._evalCount / this.jsEntries().length }
        //this.postEvent("resourceLoaderLoadUrl", detail)
        //this.postEvent("resourceLoaderProgress", detail)
    }

    onError (error) {
        //this.postEvent("resourceLoaderError", { error: error }) 
    }

    onDone () {
		const page_load_time = new Date().getTime() - performance.timing.navigationStart;
		window.document.title = "" + Math.round(page_load_time/100)/10 + "s, " + Math.round(UrlResource._bytesLoaded/1000) + "k, " +  UrlResource._urlsLoaded + " files"
		//this.postEvent("resourceLoaderDone", {}) 
    }

    // --- public API ---

	entries () {
		// each entry contains a path, size, and hash (base base64 encoded string of sha256)
		return this._index
	}

    resourceFilePaths () {
        return this._index.map(entry => entry.path)
    }

    resourceEntriesWithExtensions (extensions) {
		//const extSet = extensions.asSet()
        //return this._index.filter(entry => extSet.has(this.extForPath(entry.path)))
        return this._index.filter(entry => extensions.indexOf(this.extForPath(entry.path)) !== -1)
    }

    resourceFilePathsWithExtensions (extensions) {
        return this.resourceEntriesWithExtensions(extensions).map(entry => entry.path)
    }

}

// ---------------------------------------------------------------------------------------------

const urls = [
    "source/boot/getGlobalThis.js",
    "source/boot/Base.js",
    "source/boot/IndexedDBFolder.js",
    "source/boot/IndexedDBTx.js",
    "source/boot/pako.js",
    "source/boot/HashCache.js"
]

/*
urls.promiseForEach((url) => UrlResource.with(url).promiseLoadAndEval()).then(() => {
    ResourceManager.shared().run()
})
*/


urls.promiseParallelMap(url => UrlResource.with(url).promiseLoad()).then((loadedResources) => {
    loadedResources.forEach(resource => resource.evalDataAsJS())
    ResourceManager.shared().run()
})

