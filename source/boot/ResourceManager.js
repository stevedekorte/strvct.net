"use strict";

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

/*
window.addEventListener('load', function() {
    // This event is fired when the entire page, including all dependent resources such as stylesheets and images, is fully loaded.
    //console.log('window.load event: other resources finished loading, starting ResourcesManager now.');
    ResourceManager.shared().setupAndRun()
});
*/