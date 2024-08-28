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
	if (isDef(this) && this.Math === Math) {
        return this;
    }
    
	throw new Error("Unable to locate global `this`");
  };

  getGlobalThis().getGlobalThis = getGlobalThis;

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

    // Evaluate the code
    const result = eval(debugCode);

    // Log the result for debugging purposes
    console.log("Eval result:", result);

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

// --- UrlResource --------------------------------


class UrlResource extends Object {

    static _totalBytesLoaded = 0;
    static _totalUrlsLoaded = 0;

    static with (url) {
        return this.clone().setPath(url);
    }

    static clone () {
        const obj = new this();
        obj.init();
        return obj;
    }
	
    type () {
        return "UrlResource";
    }

    init () {
        this._path = null;
        this._resourceHash = null;
        this._request = null;
        this._data = null;
        return this;
    }

    setPath (aPath) {
        this._path = aPath;
        return this;
    }

    path () {
        return this._path;
    }

    pathExtension () {
        return this.path().split(".").pop();
    }

    setResourceHash (h) {
        this._resourceHash = h;
        return this;
    }

    resourceHash () {
        return this._resourceHash;
    }

    async promiseLoad () {
        // load unzipper if needed
        if (this.isZipFile()) {
            await this.promiseLoadUnzipIfNeeded();
        }
        return await this.asyncLoadFromCache();
    }

    isDebugging () {
        return false;
    }

    debugLog (s) {
        if (this.isDebugging()) {
            console.log(s);
        }
    }

   async asyncLoadFromCache () {
        if (this._data) {
            return this;
        }

        //console.log("UrlResource.asyncLoadFromCache() " + this.path())
        const h = this.resourceHash();
        if (h && getGlobalThis().HashCache) {
            const hc = HashCache.shared();
            //await hc.promiseClear(); // clear cache for now
            const hasKey = await hc.promiseHasKey(h);
            //const data = await hc.promiseAt(h); // this seems to be not returning undefined for some absent keys???

            //if (data !== undefined) {
            if (hasKey) {
                // if hashcache is available and has data, use it
                const data = await hc.promiseAt(h);
                assert(data !== undefined, "hashcache has undefined data for " + h);
                this._data = data;
                //console.log("UrlResource.asyncLoadFromCache() (from cache) " + this.path())
                return this;
            } else {
                // otherwise, load normally and cache result
                this.debugLog(this.type() + " no cache for '" + this.resourceHash() + "' " + this.path());
                console.log("UrlResource.asyncLoadFromCache() (over NETWORK)" + this.path())
                await this.promiseJustLoad();
                await hc.promiseAtPut(h, this.data());
                console.log(this.type() + " stored cache for ", this.resourceHash() + " " + this.path());
                return this;
            }
        } else {
            /*
            if (!h) {
                console.log("  no hash for " + this.path())
                //debugger;
            }
            if (!getGlobalThis().HashCache) {
                console.log("  no HashCache")
            }
            console.log("loading normally " + this.path() + " " + h)
            */
            return this.promiseJustLoad();
        }
    }

    async promiseJustLoad () {
        try {
            const data = await URL.with(this.path()).promiseLoad();
            this._data = data;
            this.constructor._totalBytesLoaded += data.byteLength;
            this.constructor._totalUrlsLoaded += 1;
        } catch (error) {
            debugger
            this._error = error;
            error.cause = error;
            throw error;
        }
        return this;
    }

    async promiseLoadAndEval () {
        //console.log("promiseLoadAndEval " + this.path())
        await this.promiseLoad();
        this.eval();
    }

    eval () {
        if (this.pathExtension() === "js") {
            this.evalDataAsJS();
        } else if (this.pathExtension() === "css") {
            this.evalDataAsCss();
        }
    }

    evalDataAsJS () {
        //console.log("UrlResource eval ", this.path())
        evalStringFromSourceUrl(this.dataAsText(), this.path());
        return this;
    }

    evalDataAsCss () {
        const cssString = this.dataAsText(); // default decoding is to utf8
        const sourceUrl = "\n\n//# sourceURL=" + this.path() + " \n";
        const debugCssString = cssString + sourceUrl;
        //console.log("eval css: " +  entry.path)
        const element = document.createElement('style');
        element.type = 'text/css';
        element.appendChild(document.createTextNode(debugCssString));
        document.head.appendChild(element);
    }

    data () {
        return this._data;
    }

    dataAsText () {
        let data = this.data()
        if (typeof(data) === "string") {
            return data;
        }

        if (this.isZipFile()) {
            data = this.unzippedData();
        } 

        return new TextDecoder().decode(data); // default decoding is to utf8
    }

    dataAsJson () {
        return JSON.parse(this.dataAsText());
    }

    // --- zip ---

    isZipFile () {
        return this.pathExtension() === "zip";
    }

    unzippedData () {
        return pako.inflate(this.data());
    }

    async promiseLoadUnzipIfNeeded () {
        if (!getGlobalThis().pako) {
            await UrlResource.clone().setPath(ResourceManager.bootPath() + "/pako.js").promiseLoadAndEval();
        }
    }
}

// ------------------------------------------------------------------------

class BootLoadingView {

  isAvailable() {
    return this.element() !== null;
  }

  element () {
    return document.getElementById("loadingView");
  }
  
  titleElement () {
    return document.getElementById("loadingViewTitle");
  }

  barElement () {
    return document.getElementById("innerLoadingView");
  }

  /*
  unhide () {
    this.element().style.display = "block";
  }

  hide () {
    this.element().style.display = "none";
  }
  */

  setTitle (s) {
    if (!this.isAvailable()) {
        return;
    }
    this.titleElement().innerText = s;
    return this;
  }

  title () {
    return this.titleElement().innerText;
  }

  setErrorMessage (s) {
    this.setTitle(s);
    this.titleElement().style.color = "red";
  }

  setBarRatio (r) {
    if (r < 0 || r > 1) {
        throw new Error("invalid ratio");
    }

    const v = Math.round(100 * r)/100; // limit to 2 decimals
    this.barElement().style.width = 10 * v + "em";
    return this;
  }

  setBarToNofM (n, count) {
    if (!this.isAvailable()) {
        return
    }

    this.setBarRatio(n / count);
    return this
  }

  close () {
    if (!this.isAvailable()) {
        return
    }
    const e = this.element();
    e.parentNode.removeChild(e);
  }
}

getGlobalThis().bootLoadingView = new BootLoadingView();

// ------------------------------------------------------------------------

class ResourceManager {

    static bootPath () {
        return "strvct/source/boot/"
    }

    type () {
        return "ResourceManager";
    }

    bootPath () {
        return ResourceManager.bootPath();
    }

    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            const obj = new this();
            this._shared = obj;
            obj.init();
        }
        return this._shared;
    }

    /*
    static shared () {
        if (!this._shared) {
            this._shared = (new this).init();
        }
        return this._shared;
    }
    */

    isInBrowser () {
        return (typeof(document) !== 'undefined');
    }

    init () {
        this._index = null;
        this._indexResources = null;
        this._idb = null;
        this._evalCount = 0;
		this._doneTime = null;
        this._promiseForLoadCam = null;
        return this;
    }

    async run () {
        this.onProgress("", 0);
        // load the boot resource index and start loading/evaling js files
        await this.promiseLoadIndex();
        await this.promiseLoadCamIfNeeded();
        await this.evalIndexResources();
        return this;
    }

    // --- load index ---

    async promiseLoadIndex () {
        const path = "build/_index.json"
        const resource = await UrlResource.with(path).promiseLoad();
        this._index = resource.dataAsJson()
        this._indexResources = this._index.map((entry) => {
            const resource = UrlResource.clone().setPath(entry.path).setResourceHash(entry.hash)
            assert(resource.path() === entry.path);
            assert(resource.resourceHash() === entry.hash);
            return resource;
        });
    }

    indexResources () {
        return this._indexResources
    }

    // --- load cam ---

    async promiseLoadCamIfNeeded () {
        // if hashCache is empty, load the compressed cam and add it to the cache first
        // as this will be much faster than loading the files individually
        //debugger
        //await this.hashCache().promiseClear();
        const count = await HashCache.shared().promiseCount();

        //console.log(this.type() + " hashcache count: ", count)
        if (!count) {
            await this.promiseLoadCam();
        }
    }

    async promiseLoadCam () {
        // cache the promise so if we call this multiple times we don't load it again
        if (!this._promiseForLoadCam) {
            this._promiseForLoadCam = Promise.clone();
            try {
                const path = "build/_cam.json.zip"
                const resource = await UrlResource.clone().setPath(path).promiseLoad();
                const cam = resource.dataAsJson();
                // this._cam = cam
                await Reflect.ownKeys(cam).promiseSerialForEach((k) => { // use parallel? the UI progress works with this serial version
                //await Reflect.ownKeys(cam).promiseSerialTimeoutsForEach((k) => { 
                    const v = cam[k];
                    return HashCache.shared().promiseAtPut(k, v);
                });
                this._promiseForLoadCam.callResolveFunc();
            } catch (error) {
                this._promiseForLoadCam.callRejectFunc();
            }
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

    //example use: ResourceManager.shared().asyncDataForResourceAtPath(path);
    async asyncDataForResourceAtPath (path) {
        const resourceUrl = UrlResource.clone().setPath(ResourceManager.bootPath() + "/" + path);
        await resourceUrl.promiseLoad();
        return resourceUrl.data();
    }

    jsResources () {
        return this.resourcesWithExtension("js")
    }

    cssResources () {
        return this.resourcesWithExtension("css")
    }

    // --- eval ---

    async evalIndexResources () {
        //debugger
        // promiseSerialForEach promiseSerialTimeoutsForEach
        let count = 0

        //await this.cssResources().promiseSerialTimeoutsForEach(r => {
        await this.cssResources().promiseSerialForEach(async (r) => {
                // NOTE: can't do in parallel as the order in which CSS files are loaded matters
            return await r.promiseLoadAndEval();
        });

        await this.jsResources().promiseSerialForEach(async (r) => {
        //await this.jsResources().promiseSerialTimeoutsForEach(r => {
                count ++;
            bootLoadingView.setBarToNofM(count, this.jsResources().length);
            //debugger;
            //console.log("count: " + count + " / " + this.jsResources().length)
            return await r.promiseLoadAndEval()
        });

        this.onDone();
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
        //bootLoadingView.setBarToNofM(this._evalCount, 100);
        //const detail = { path: path, progress: this._evalCount / this.jsEntries().length }
        //this.postEvent("resourceLoaderLoadUrl", detail)
        //this.postEvent("resourceLoaderProgress", detail)
    }

    onError (error) {
        //this.postEvent("resourceLoaderError", { error: error }) 
    }

    onDone () {
        // not really done yet
        getGlobalThis().bootLoadingView = bootLoadingView;
        //bootLoadingView.close();
        this.markPageLoadTime();
		//window.document.title = this.loadTimeDescription();
		//this.postEvent("resourceLoaderDone", {});
        //debugger;
    }

    markPageLoadTime() {
        this._pageLoadTime = new Date().getTime() - performance.timing.navigationStart;
    }

    loadTimeDescription () {
        return "" + 
            Math.round(this._pageLoadTime/100)/10 + "s, " + 
            Math.round(UrlResource._totalBytesLoaded/1000) + "k, " + 
            UrlResource._totalUrlsLoaded + " files";
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

    async setupAndRun () {
        //console.log("ResourcesManager.setupAndRun()");
        const bp = this.bootPath();
        const urls = [
            //"source/boot/getGlobalThis.js",
            bp + "Base.js",
            bp + "Promise_ideal.js",
            bp + "IndexedDBFolder.js",
            bp + "IndexedDBTx.js",
            bp + "HashCache.js" // important that this be after IndexedDBFolder/Tx so it can be used
            //bp + "pako.js" // loaded lazily first time UrlResource is asked to load a .zip file
        ];
        
        // we can load the JS resource in parallel
        const loadedResources = await urls.promiseParallelMap(url => UrlResource.with(url).promiseLoad());
        // but we have to eval the JS serially as order matters
        loadedResources.forEach(resource => resource.evalDataAsJS());
        await this.run();
        //debugger;
        return this
    }
}

// ---------------------------------------------------------------------------------------------

window.addEventListener('load', function() {
    // This event is fired when the entire page, including all dependent resources such as stylesheets and images, is fully loaded.
    //console.log('window.load event: other resources finished loading, starting ResourcesManager now.');
    ResourceManager.shared().setupAndRun()
});