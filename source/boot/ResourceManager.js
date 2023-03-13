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

// -----------------------------------


function evalStringFromSourceUrl (codeString, path) {
    const sourceUrl = "\n//# sourceURL=/" + path + " \n";
    const debugCode = codeString + sourceUrl;
    //console.log("eval " + path);
    if(path.indexOf("PersistentAtomicMap") !== -1) {
        console.log("eval " + path);
    }
    eval(debugCode);
    if(path.indexOf("PersistentAtomicMap") !== -1) {
        console.log("done eval " + path);
        assert(getGlobalThis().PersistentAtomicMap)
    }
}

function promiseLoadUrl (path) {
    return new Promise((resolve, reject) => {
        //debugger
        const rq = new XMLHttpRequest();
        rq.responseType = "arraybuffer";
        rq.open('GET', path, true);

        rq.onload  = (event) => { 
            if (rq.status >= 400 && rq.status <= 599) {
                reject(new Error(request.status + " " + rq.statusText + " error loading " + this.fullPath() + " "))
            }
            resolve(rq.response) 
        }

        rq.onerror = (event) => { 
            reject(undefined) 
        }
        rq.send()
    })
}

function promiseLoadAndEvalUrl (path) {
    return promiseLoadUrl(path).then((arrrayBuffer) => {
        const jsCode = new TextDecoder().decode(arrrayBuffer); // default decoding is to utf8
        evalStringFromSourceUrl(jsCode, path)
    })
}

function promiseLoadAndEvalUrls (urlStrings) {
    let promise = null
    urlStrings.forEach((url) => {
        if (promise) {
            promise = promise.then(() => { 
                return promiseLoadAndEvalUrl(url) 
            })
        } else {
            promise = promiseLoadAndEvalUrl(url)
        }
    })
    return promise
}

// -----------------------------------

class BootResource {
	
    init () {
        this._path = null
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

    /*
    promiseLoadData () {
        return new Promise((resolve, reject) => {
            this.promiseLoad().then((resource) =>resolve(resource.data()), reject)
        })
    }
    */

    promiseLoad () {
        return new Promise((resolve, reject) => {
            return promiseLoadUrl(this.path()).then(
                (data) => {
                    this._data = data
                    resolve(this)
                },
                (error) => { 
                    this._error = error
                    reject(error) 
                }
            )
        })
    }

    onLoadError (event) {
        const request = this._request; // is event or error passed?
        console.log(this.type() + " onLoadError ", error, " " + this.fullPath())
        this.setError(error)
        throw new Error("error loading " + this.fullPath())
    }

    data () {
        return this._data;
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
        getGlobalThis().promiseLoadUrl = promiseLoadUrl
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
        return new BootResource().init().setPath(path).promiseLoad().then((resource) => {
            this._index = resource.dataAsJson()
        })
    }

    promiseLoadCam () {
        // cache the promise so if we call this multiple times we don't load it again
        if (!this._promiseForLoadCam) {
            const path = "build/_cam.json.zip"
            this._promiseForLoadCam = new BootResource().init().setPath(path).promiseLoad().then((resource) => {
                //debugger
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
        const cache = this.hashCache()
        //debugger;
        return this.promiseLoadCam().then(() => {
            let promise = null
            //debugger;
            Reflect.ownKeys(this._cam).forEach((key) => {
                const value = this._cam[key]
                //this.hashCache().promiseAtPut(key, value)
                
                if (promise) {
                    //assert(cache.idb().lastTx().isFinished())
                    promise = promise.then(()=> {
                        return cache.promiseAtPut(key, value).then(() => {
                            //console.log("ResourceManager committed did put ", key)
                            return Promise.resolve()
                        })
                    })
                } else {
                    //console.log("ResourceManager hashCache promiseAtPut ", key)
                    promise = cache.promiseAtPut(key, value).then(() => {
                        //console.log("ResourceManager FIRST committed did put ", key)
                        return Promise.resolve()
                    })
                }
            
            })
            return promise
        })
    }

    promiseLoadCamIfNeeded () {
        //return this.hashCache().promiseClear().then(() => {
            return this.hashCache().promiseCount().then((count) => {
                if (!count) {
                    // if hashCache is empty, load the compressed cam and add it to the cache first
                    // as this will be much faster than loading the files individually
                    return this.promiseCacheCam()
                }
                this._cam = new Map()
                return Promise.resolve()
            })
        //})
    }

    eval () {
        // see if the cache has anything in it
        this.promiseLoadCamIfNeeded().then(() => {
            this.evalEntries()
        })
    }

    evalEntries () {
        //this.cssEntries().forEach(entry => this.evalCssEntry(entry))
        //this.jsEntries().forEach(entry => this.evalJsEntry(entry))
        this._evalEntryStack = this.jsEntries()
        this.evalNextEntry()
    }

    evalNextEntry () {
        const entry = this._evalEntryStack.shift()
        //console.log("evalNextEntry ", entry)
        const hashCache = this.hashCache()
        if (entry) {
            hashCache.promiseContentForHashOrUrl(entry.hash, entry.path).then((value) => {
                if (typeof(value) !== "string") {
                    value = new TextDecoder().decode(value); // default decoding is to utf8
                }
                //console.log("evalNextEntry " + entry.path + " size:" + value.length)
                assert(value.length !== 0)
                evalStringFromSourceUrl(value, entry.path) 
                this.evalNextEntry()
            })
        } else {
            this.onDone()
        }
    }
    
    evalCssEntry (entry) {
        if (this.isInBrowser()) {
            const cssString = this.camValueForEntry(entry) 
            const sourceUrl = "\n\n//# sourceURL=" + entry.path + " \n"
            const debugCssString = cssString + sourceUrl
            //console.log("eval css: " +  entry.path)
            const element = document.createElement('style');
            element.type = 'text/css';
            element.appendChild(document.createTextNode(debugCssString))
            document.head.appendChild(element);
        }
        return this
    }

    // --- cam ---

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
		window.document.title = "" + (page_load_time/1000) + "s load time"
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

promiseLoadAndEvalUrls(urls).then(() => {
    ResourceManager.shared().run()
})
