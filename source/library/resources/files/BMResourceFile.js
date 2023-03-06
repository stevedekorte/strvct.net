"use strict";

/*

    BMFileResources

*/

(class BMResourceFile extends BaseNode {

    initPrototypeSlots () {
        this.newSlot("path", ".") // path from _index.json entry
        this.newSlot("resourceHash", null) // hash from _index.json entry
        this.newSlot("resourceSize", null) // size from _index.json entry

        this.newSlot("data", null)
        this.newSlot("encoding", "utf8")
        this.newSlot("request", null) // this set back to null after request is successfully completed
        this.newSlot("error", null) 
        this.newSlot("promiseForLoad", null) // holds promise used for reading from URL request or indexedDB

        // notifications
        this.newSlot("isLoading", false)
        this.newSlot("isLoaded", false)
        this.newSlot("loadState", null) 
        this.newSlot("loadNote", null) 
        this.newSlot("loadErrorNote", null) 
        this.newSlot("usesBlobCache", true)
    }

    init () {
        super.init()
        this.setTitle("File")
        this.setNoteIsSubnodeCount(true)

        // notifications
        this.setLoadNote(this.newNoteNamed("fileResouceLoaded"))
        this.setLoadErrorNote(this.newNoteNamed("resourceFileLoadError"))
        return this
    }

    name () {
        return this.path().lastPathComponent()
    }

    title () {
        return this.name()
    }

    setupSubnodes () {
        //this.resourcePaths().forEach(path => this.addFontWithPath(path))
        return this
    }

    /*
    asObject () {
        const sound = BMSoundResources.shared().resources().detect(r => r.path() == this.path())
        return sound
    }
    */

    // move this loading code to parent BMResource?

    hasData () {
        return this.data() !== null
    }

    promiseLoad () { 
        if (!this.promiseForLoad()) {
            this.setPromiseForLoad(new Promise((resolve, reject) => {
                if (!this.isLoading() && !this.hasData()) {
                    this.setIsLoading(true)
                    return this.promiseLoadNow().then(() => { 
                        this.setIsLoading(false) 
                    }).catch((error) => {
                        this.setIsLoading(false)
                        throw error
                    })
                }
            }))
        }

        return this.promiseForLoad()
    }

    promiseLoadNow () {
        return new Promise((resolve, reject) => {
            if (this.hasData()) {
                this.postLoad()
                resolve()
                return this
            }

            if (this.camData()) {
                this.loadFromCamData()
                resolve()
            } else if (this.usesBlobCache() && this.hasCachedBlob()) {
                return this.promiseLoadCachedBlob()
            } else {
                return this.promiseLoadFromUrl()
            }
        })
    }

    // --- load data from cam ---

    camPath () {
        return this.path().sansPrefix("./")
    }

    camData () {
        return ResourceManager.shared().camValueForPath(this.camPath())
    }

    loadFromCamData () {
        this.setData(this.camData())
        //console.log("loaded via cam for path: ", this.camPath())
        this.postLoad()
    }

    // --- load data from cached blob ---

    hasCachedBlob () {
        const h = this.resourceHash()
        //debugger;
        const b = h && BMBlobs.shared().hasBlobWithValueHash(h)
        //console.log("has cache for " + this.path() + ":" + b)
        //debugger;
        return b
    }

    promiseLoadCachedBlob () {        
        assert(this.hasCachedBlob())
        const h = this.resourceHash()
        const blob = BMBlobs.shared().blobWithValueHash(h)   
        console.log("reading from blob cache... " + h + " " + this.path())
        return blob.promiseReadValue().then(() => this.onReadCachedBlob(blob), () => this.onErrorReadingCachedBlob(blob))
    }

    onReadCachedBlob (blob) {
        console.log("success reading blob " + blob.name() + " for " + this.path())
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

    // --- load data from url ---

    loadRequestType () {
        return "arraybuffer"
        //return 'application/json'; // need to change for binary files?
    }

    promiseLoadFromUrl () {
        //console.log("loading via url fetch for path: ", this.path())

        return new Promise((resolve, reject) => {
            const path = this.path()
            const rq = new XMLHttpRequest();
            rq.open('GET', path, true);
            if (this.loadRequestType()) {
                rq.responseType = this.loadRequestType();
            }

            rq.onload  = (event) => { 
                this.onUrlLoad(event); 
                resolve() 
            }

            rq.onerror = (event) => { 
                this.onRequestError(event); 
                reject() 
            }

            /*        
            rq.onload      = (event) => { this.onRequestLoad(event) }
            rq.onabort     = (event) => { this.onRequestAbort(event) }
            rq.onloadend   = (event) => { this.onRequestLoadEnd(event) }
            rq.onloadstart = (event) => { this.onRequestLoadStart(event) }
            */

            rq.onprogress  = (event) => { 
                this.onRequestProgress(event) 
            }

            rq.ontimeout   = (event) => { 
                this.onRequestTimeout(event);
                reject() 
            }

            this.setRequest(rq)
            rq.send();
        })
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

            /*
            const buffer = this.data()
            const str = new TextDecoder().decode(buffer);
            console.log("path: '" + this.path() + "'")
            console.log("size: '" + buffer.byteLength + "'")
            console.log("hash: '" + h + "'")
            console.log("type: '" + typeof(buffer) + "'")
            console.log("slice: '" + str.slice(0, 6) + "'")
            debugger;
            */

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

    /*
    onRequestAbort (event) {
        this.setLoadState("aborted")
    }

    onRequestLoadEnd (event) {
    }

    onRequestLoadStart (event) {
        this.setLoadState("started")
    }
    */

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

    /*
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

}.initThisClass());
