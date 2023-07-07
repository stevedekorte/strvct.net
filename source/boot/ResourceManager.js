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

// A single function to access globals that works
// in the browser (which uses 'window') and on node.js (which uses 'global')

function getGlobalThis () {
	const isDef = function (v) {
		return typeof(v) !== "undefined"
	}

	if (isDef(globalThis)) {
        return globalThis;
    }

	if (isDef(self)) {
        return self;
    }

	if (isDef(window)) {
		window.global = window;
		return window;
	}

	if (isDef(global)) {
		global.window = global;
		return global;
	}

	// Note: this might still return the wrong result!
	if (isDef(this)) {
        return this;
    }
    
	throw new Error("Unable to locate global `this`");
  };

  getGlobalThis().getGlobalThis = getGlobalThis;

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
    //console.log("loading ", path)
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
            //debugger
            resolve(rq.response) 
        }

        rq.onerror = (event) => { 
            console.log("error loading ", path)
            reject(undefined) 
        }
        rq.send()
    })
})

// --- Array promises --------------

Object.defineSlot(Array.prototype, "promiseSerialForEach", function (aBlock) {
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
        const obj = new this()
        obj.init()
        return obj
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

    pathExtension () {
        return this.path().split(".").pop()
    }

    setResourceHash (h) {
        this._resourceHash = h
        return this
    }

    resourceHash () {
        return this._resourceHash
    }

    promiseLoad () {
        // load unzipper if needed
        if (this.isZipFile()) {
            return this.promiseLoadUnzipIfNeeded().then(() => { 
                return this.promiseLoad_2()
            })
        }
        return this.promiseLoad_2()
    }

    promiseLoad_2 () {
        const h = this.resourceHash() 
        if (h && getGlobalThis().HashCache) {
            const hc = HashCache.shared()
            return hc.promiseHasKey(h).then((hasKey) => {
                if (hasKey) {
                    // if hashcache is available and hash data, use it
                    return hc.promiseAt(h).then((data) => {
                        this._data = data
                        return Promise.resolve(this)
                    })
                } else {
                    // otherwise, load normally and cache result
                    console.log("no cache for ", this.resourceHash() + " " + this.path())
                    return this.promiseJustLoad().then(() => {
                        hc.promiseAtPut(h, this.data()).then(() => {
                            console.log("stored cache for ", this.resourceHash() + " " + this.path())
                            return Promise.resolve(this)
                        })
                    })
                }
            })
        } else {
            return this.promiseJustLoad()
        }
    }

    promiseJustLoad () {
        //debugger
        return URL.with(this.path()).promiseLoad().then((data) => {
            //debugger
            this._data = data;
            this.constructor._bytesLoaded += data.byteLength;
            this.constructor._urlsLoaded += 1;
            return Promise.resolve(this)
        }).catch((error) => {
            debugger
            this._error = error
            throw error
        })
    }

    promiseLoadAndEval () {
        //console.log("promiseLoadAndEval " + this.path())
        //debugger
        return this.promiseLoad().then(() => {
            this.eval()
            return Promise.resolve(this)
        })
    }

    eval () {
        if (this.pathExtension() === "js") {
            this.evalDataAsJS()
        } else if (this.pathExtension() === "css") {
            this.evalDataAsCss()
        }
    }

    evalDataAsJS () {
        //console.log("UrlResource eval ", this.path())
        evalStringFromSourceUrl(this.dataAsText(), this.path())
        return this
    }

    evalDataAsCss () {
        const cssString = this.dataAsText(); // default decoding is to utf8
        const sourceUrl = "\n\n//# sourceURL=" + this.path() + " \n"
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
        let data = this.data()
        if (typeof(data) === "string") {
            return data
        }

        if (this.isZipFile()) {
            data = this.unzippedData()
        } 

        return new TextDecoder().decode(data); // default decoding is to utf8
    }

    dataAsJson () {
        return JSON.parse(this.dataAsText())
    }

    // --- zip ---

    isZipFile () {
        return this.pathExtension() === "zip"
    }

    unzippedData () {
        return pako.inflate(this.data());
    }

    promiseLoadUnzipIfNeeded () {
        if (!getGlobalThis().pako) {
            return UrlResource.clone().setPath("source/boot/pako.js").promiseLoadAndEval()
        }
        return Promise.resolve()
    }
}

// ------------------------------------------------------------------------

class ResourceManager {

    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            const obj = new this();
            this._shared = obj;
            obj.init();
        }
        return this._shared
    }

    /*
    static shared () {
        if (!this._shared) {
            this._shared = (new this).init()
        }
        return this._shared
    }
    */

    isInBrowser () {
        return (typeof(document) !== 'undefined')
    }

    init () {
        this._index = null
        this._indexResources = null
        this._idb = null
        this._evalCount = 0
		this._doneTime = null
        this._promiseForLoadCam = null
        return this
    }

    run () {
        this.onProgress("", 0)

        // load the boot resource index and start loading/evaling js files
        this.promiseLoadIndex().then(() => {
            return this.promiseLoadCamIfNeeded().then(() => {
                this.evalIndexResources()
            })
        })

        return this
    }

    // --- load index ---

    promiseLoadIndex () {
        const path = "build/_index.json"
        return UrlResource.with(path).promiseLoad().then((resource) => {
            //debugger
            this._index = resource.dataAsJson()
            this._indexResources = this._index.map((entry) => {
                return UrlResource.clone().setPath(entry.path).setResourceHash(entry.hash)
            })
            return Promise.resolve(this)
        })
    }

    indexResources () {
        return this._indexResources
    }

    // --- load cam ---

    promiseLoadCamIfNeeded () {
        // if hashCache is empty, load the compressed cam and add it to the cache first
        // as this will be much faster than loading the files individually
        //debugger
        //return this.hashCache().promiseClear().then(() => {
            return HashCache.shared().promiseCount().then((count) => {
                console.log("hashcache count: ", count)
                if (!count) {
                    return this.promiseLoadCam()
                }
                return Promise.resolve()
            })
        //})
    }

    promiseLoadCam () {
        // cache the promise so if we call this multiple times we don't load it again
        if (!this._promiseForLoadCam) {
            const path = "build/_cam.json.zip"
            this._promiseForLoadCam = UrlResource.clone().setPath(path).promiseLoad().then((resource) => {
                const cam = resource.dataAsJson()
                // this._cam = cam
                return Reflect.ownKeys(cam).promiseSerialForEach((k) => { // use parallel?
                    const v = cam[k]
                    return HashCache.shared().promiseAtPut(k, v)
                })
            })
        }
        return this._promiseForLoadCam
    }

    // --- index resources ---

    resourceForPath (path) {
        return this.indexResources().find(r => r.path() === path)
    }

    resourcesWithExtension (ext) {
        return this.indexResources().filter(r => r.pathExtension() === ext)
    }

    jsResources () {
        return this.resourcesWithExtension("js")
    }

    cssResources () {
        return this.resourcesWithExtension("css")
    }

    // --- eval ---

    evalIndexResources () {
        //debugger
        this.cssResources().promiseSerialForEach(r => r.promiseLoadAndEval()).then(() => {
            return this.jsResources().promiseSerialForEach(r => r.promiseLoadAndEval()) 
        }).then(() => this.onDone())
    }

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
        this.markPageLoadTime();
		//window.document.title = this.loadTimeDescription();
		//this.postEvent("resourceLoaderDone", {}) 
    }

    markPageLoadTime() {
        this._pageLoadTime = new Date().getTime() - performance.timing.navigationStart;
    }

    loadTimeDescription () {
        return "" + 
            Math.round(this._pageLoadTime/100)/10 + "s, " + 
            Math.round(UrlResource._bytesLoaded/1000) + "k, " + 
            UrlResource._urlsLoaded + " files";
    }

    // --- public API ---

	entries () {
		// each entry contains a path, size, and hash (base base64 encoded string of sha256)
		return this._index
	}

    resourceFilePaths () {
        return this._index.map(entry => entry.path)
    }

    // --- index entries ---

    /*
    extForPath (path) {
        const parts = path.split(".")
        return parts.length ? parts[parts.length -1] : undefined
    }
    */

    urlResourcesWithExtensions (extensions) {
		const extSet = extensions.asSet()
        return this.indexResources().filter(r => extSet.has(r.pathExtension()))
    }
        
    /*
    resourceEntriesWithExtensions (extensions) {
		const extSet = extensions.asSet()
        return this._index.filter(entry => extSet.has(this.extForPath(entry.path)))
    }
    */

    resourceFilePathsWithExtensions (extensions) {
        return this.urlResourcesWithExtensions(extensions).map(r => r.path())
        //return this.resourceEntriesWithExtensions(extensions).map(entry => entry.path)
    }

}

// ---------------------------------------------------------------------------------------------

const urls = [
    //"source/boot/getGlobalThis.js",
    "source/boot/Base.js",
    "source/boot/IndexedDBFolder.js",
    "source/boot/IndexedDBTx.js",
    "source/boot/HashCache.js" // important that this be after IndexedDBFolder/Tx so it can be used
    //"source/boot/pako.js" // loaded lazily first time UrlResource is asked to load a .zip file
]

/*
urls.promiseSerialForEach((url) => UrlResource.with(url).promiseLoadAndEval()).then(() => {
    ResourceManager.shared().run()
})
*/


urls.promiseParallelMap(url => UrlResource.with(url).promiseLoad()).then((loadedResources) => {
    loadedResources.forEach(resource => resource.evalDataAsJS())
    ResourceManager.shared().run()
})

