"use strict";

/*

    BMFileResources

*/

(class BMResourceFile extends BaseNode {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("path", "."); // path from _index.json entry
        }

        {
            const slot = this.newSlot("resourceHash", null); // hash from _index.json entry
        }

        {
            const slot = this.newSlot("resourceSize", null); // size from _index.json entry
        }

        {
            const slot = this.newSlot("data", null);
        }

        {
            const slot = this.newSlot("value", null); // the value decoded from the data. e.g. value = JSON.parse(data)
        }

        //this.newSlot("encoding", "utf8")
        //this.newSlot("request", null) // this set back to null after request is successfully completed

        {
            const slot = this.newSlot("error", null);
        }

        {
            const slot = this.newSlot("promiseForLoad", null); // holds promise used for reading from URL request or indexedDB
        }

        // notifications
        this.newSlot("isLoading", false)
        this.newSlot("isLoaded", false)
        this.newSlot("loadState", null) 
        //this.newSlot("loadNote", null) 
        //this.newSlot("loadErrorNote", null) 
        //this.newSlot("usesBlobCache", false)
    }

    initPrototype () {
        this.setTitle("File");
        this.setNoteIsSubnodeCount(true);
        this.setIsDebugging(true);
    }

    init () {
        super.init();
        // notifications
        //this.setLoadNote(this.newNoteNamed("fileResouceLoaded"));
        //this.setLoadErrorNote(this.newNoteNamed("resourceFileLoadError"));
        return this;
    }

    name () {
        return this.path().lastPathComponent();
    }

    title () {
        return this.name();
    }

    pathExtension () {
        return this.path().pathExtension();
    }

    setupSubnodes () {
        //this.resourcePaths().forEach(path => this.addFontWithPath(path));
        return this;
    }

    /*
    asObject () {
        const sound = BMSoundResources.shared().resources().detect(r => r.path() == this.path())
        return sound
    }
    */

    // move this loading code to parent BMResource?

    hasData () {
        return this.data() !== null;
    }

    urlResource () {
        //const path = ResourceManager.bootPath() + this.path();
        return UrlResource.with(this.path());
    }

    async promiseLoad () {
        const url = this.urlResource();
        url.setResourceHash(this.resourceHash());
        const r = await url.promiseLoad(); // will use cam cache if available
        this._data = r.data();
        this.setValue(this.valueFromData());
        return this;
    }

    async dataPromise () {
        /*
        if (!this._dataPromise) {
            this._dataPromise = Promise.clone();
        }
        */
        if (!this.hasData()) {
            await this.promiseLoad();
        }
        return this.data();
    }

    // --- load data from cached blob ---

    /*
    hasCachedBlob () {
        const h = this.resourceHash();
        const b = h && BMBlobs.shared().hasBlobWithValueHash(h);
        //console.log("has cache for " + this.path() + ":" + b)
        return b;
    }

    async promiseLoadCachedBlob () {        
        assert(this.hasCachedBlob())
        const h = this.resourceHash()
        const blob = BMBlobs.shared().blobWithValueHash(h)   
        this.debugLog(() => "reading from blob cache... " + h + " " + this.path())
        try {
            await blob.promiseReadValue();
            this.onReadCachedBlob(blob);
        } catch (error) {
            this.onErrorReadingCachedBlob(blob);
            error.rethrow();
        }
    }

    onReadCachedBlob (blob) {
        this.debugLog(() => "success reading blob " + blob.name() + " for " + this.path())
        //debugger;
        if (Type.isUndefined(blob.value())) {
            console.log("found undefined reading blob " + blob.name() + " for " + this.path())
            this.promiseLoadFromUrl()
        } else {
            this.setData(blob.value())
            this.postLoad()
        }
    }

    onErrorReadingCachedBlob (blob) {
        console.log("error reading blob " + blob.name() + " for " + this.path())
    }
    */

    // --- load data from url ---

    /*
    loadRequestType () {
        return "arraybuffer"
        //return 'application/json'; // need to change for binary files?
    }

    promiseLoadFromUrl () {
        //console.log("loading via url fetch for path: ", this.path())
        const promise = Promise.clone();

        const path = this.path()
        const rq = new XMLHttpRequest();
        rq.open('GET', path, true);
        if (this.loadRequestType()) {
            rq.responseType = this.loadRequestType();
        }

        rq.onload = (event) => { 
            this.onUrlLoad(event); 
            promise.callResolveFunc();
        }

        rq.onerror = (event) => { 
            this.onRequestError(event); 
            promise.callRejectFunc();
        }

        //rq.onload      = (event) => { this.onRequestLoad(event) }
        //rq.onabort     = (event) => { this.onRequestAbort(event) }
        //rq.onloadend   = (event) => { this.onRequestLoadEnd(event) }
        //rq.onloadstart = (event) => { this.onRequestLoadStart(event) }

        rq.onprogress = (event) => { 
            this.onRequestProgress(event) 
        }

        rq.ontimeout = (event) => { 
            this.onRequestTimeout(event);
            promise.callRejectFunc();
        }

        this.setRequest(rq)
        rq.send();

        return promise;
    }

    onUrlLoad () {
        //console.log("onUrlLoad " + this.path())
        const data = this.request().response
        this.setData(data)
        this.postLoad()
        this.setIsLoading(false)
        
        const h = this.resourceHash()
        if (h && this.usesBlobCache()) {
            console.log("writing to blob cache... " + h + " " + this.path())

            if (false) {
                const buffer = this.data()
                const str = new TextDecoder().decode(buffer);
                console.log("path: '" + this.path() + "'")
                console.log("size: '" + buffer.byteLength + "'")
                console.log("hash: '" + h + "'")
                console.log("type: '" + typeof(buffer) + "'")
                console.log("slice: '" + str.slice(0, 6) + "'")
                debugger;
            }

            const blob = BMBlobs.shared().createBlobWithNameAndValue(h, this.data())
            blob.setName(this.path())
            blob.setValueHash(this.resourceHash())
            blob.setValueSize(this.resourceSize())
        }
        return this
    }

    onRequestError (event) {
        console.log("onRequestError " + this.path())
        this.setError(event.error)
        this.postLoadError()
        this.setIsLoading(false)
        return this
    }

    postLoad () {
        this.loadNote().post()
        return this
    }

    postLoadError () {
        this.loadErrorNote().post()
        return this
    }

    onRequestAbort (event) {
        this.setLoadState("aborted")
    }

    onRequestLoadEnd (event) {
    }

    onRequestLoadStart (event) {
        this.setLoadState("started")
    }

    onRequestProgress (event) {
        if (event.lengthComputable) {
            const p = Math.floor(100 * (event.loaded / event.total))/100
            this.setLoadState(p + "% of " + event.total.byteSizeDescription())
        } else {
            this.setLoadState("loading (" +  event.loaded.byteSizeDescription() + " so far)")
        }
    }

    onRequestTimeout (event) {
        this.setLoadState("timeout")
    }

    onRequestLoad (event) {
        const request = event.currentTarget;
        const downloadedBuffer = request.response;  // may be array buffer, blob, or string, depending on request type
        this.setData(downloadedBuffer)
        //this.didLoad()
    }

    didLoad () {
        this.setIsLoaded(true)
        this.postNoteNamed("didLoad")
    }
    */

    precacheExtensions () {
        //return ["js", "css", "json", "txt"];
        //return ["json", "txt"]; // just cache the data files for now
        return ["json", "txt", "ttf", "woff", "woff2"];
    }

    async prechacheWhereAppropriate () {
        //console.log(this.type() + ".prechacheWhereAppropriate() " + this.path());
        if (this.precacheExtensions().includes(this.pathExtension())) {
            //console.log("precaching " + this.path())
            await this.promiseLoad();
            console.log("precached " + this.path())
        }
        return this;
    }

    valueFromData () {
        const ext = this.pathExtension();
        if (ext === "json") {
            return JSON.parse(this.data().asString());
        } else if (["js", "css", "txt"].includes(ext)) {
            return this.data().asString();
        }
        return this.data();
    }

}.initThisClass());
