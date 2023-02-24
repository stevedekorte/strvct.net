"use strict";

/*

    BMResource

*/

(class BMResource extends BaseNode {
    
    // --- mime types ---

    /*
    static supportedMimeTypes () {
        return new Set(["audio/ogg", "audio/wave", "audio/mp3"])
    }

    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType)
    }

    static openMimeChunk (dataChunk) {
        const aNode = this.clone()
        //setValue(dataChunk)
        console.log(dataChunk.mimeType() + " data.length: " + dataChunk.decodedData().length)
        return aNode
    }

    static supportedExtensions () {
        return this.supportedMimeTypes().map(mimeType => MimeExtensions.shared().pathExtensionsForMimeType(mimeType)).flat()
    }
    */

    static supportedExtensions () {
        return []
    }

    static canHandleExtension (extension) {
        return this.supportedExtensions().contains(extension)
    }

    // ---

    initPrototypeSlots () {
        this.newSlot("path", "")
        this.newSlot("data", null)
        this.newSlot("error", null)
        this.newSlot("loadState", "unloaded") // "unloaded", "loading", "decoding", "loaded"
        this.newSlot("loadProgress", null) // null or a number 0 to 100
        this.newSlot("isLoaded", false)
    }

    /*
    init () {
        super.init()
    }
    */

    title () {
        return this.name()
    }

    subtitle () {
        return this.path().pathExtension()
    }

    subtitle () {
        return this.path().pathExtension() + ", " + this.loadState()
    }

    name () {
        return this.path().lastPathComponent().sansExtension()
    }

    // --- load ---

    loadIfNeeded () {
        if (this.loadState() === "unloaded") {
            this.load()
        }
        return this
    }

    load () {
        this.setLoadState("loading")
        const rq = new XMLHttpRequest();
        rq.open('GET', this.path(), true);
        rq.responseType = 'arraybuffer';
        rq.onload      = (event) => { this.onRequestLoad(event) }
        rq.onerror     = (event) => { this.onRequestError(event) }
        rq.onabort     = (event) => { this.onRequestAbort(event) }
        rq.onloadend   = (event) => { this.onRequestLoadEnd(event) }
        rq.onloadstart = (event) => { this.onRequestLoadStart(event) }
        rq.onprogress  = (event) => { this.onRequestProgress(event) }
        rq.ontimeout   = (event) => { this.onRequestTimeout(event) }
        rq.send();
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

    onRequestError (event) {
        console.log(this.type() + " onLoadError ", error, " " + this.path())
        this.setError(error)
    }
    
    didLoad () {
        this.setIsLoaded(true)
        this.postNoteNamed("didLoad")
    }

}.initThisClass());
