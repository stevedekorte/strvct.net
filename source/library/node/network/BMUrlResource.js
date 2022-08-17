"use strict";

/*

    BMUrlResource

*/

(class BMUrlResource extends BMStorableNode {
    
    initPrototypeSlots () {
        this.newSlot("path", "")
        this.newSlot("error", null).setSyncsToView(true)
        this.newSlot("status", null).setSyncsToView(true)
        this.newSlot("dataUrl", null)
        //this.newSlot("rawData", null).setSyncsToView(true)
        this.newSlot("decodedData", null).setSyncsToView(true)
        this.newSlot("timeoutInterval", 24*60*60*1000).setSyncsToView(true)
        //this.newSlot("decodedJson", null).setSyncsToView(true)
        //this.newSlot("completeNote", null).setSyncsToView(true)
        this.newSlot("urlDelegate", null)
    }

    init () {
        super.init()
        this.setDataUrl(BMDataUrl.clone())
        //this.setCompleteNote(this.newNoteNamed("onUrlResourceComplete"))
        return this
    }

    postComplete () {
        //this.completeNote().post()
        this.urlDelegate().performIfResponding("onUrlResourceComplete", this)
        return this
    }

    title () {
        const s = super.title()
        if (s === null) {
            return this.path().fileName()
        }
        return s
    }

    subtitle () {
        if (this.error()) {
            return this.error()
        }

        if (this.status()) {
            return this.status()
        }

        const dataType = this.path().pathExtension()
        if (this.decodedData()) {
            return this.dataUrl().decodedData().byteSizeDescription() + " " + this.dataUrl().mimeTypeDescription()
        }
        return ""
    }

    didUpdateSlotPath () {
    }

    isLoaded () {
        return this.hasData() || this.isCached()
    }

    hasData () {
        return !Type.isNull(this.data())
    }

    // --- setup ---

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setupDataField()
        this.load()
    }

    setupDataField () {
        const field = BMTextAreaField.clone().setKey("dataString")
        field.setValueMethod("dataString").setValueIsEditable(false).setIsMono(true)
        field.setTarget(this) 
        field.getValueFromTarget()
        this.addSubnode(field)
        return this
    }

    // --- actions ---

    refresh () {
        this.clear()
        this.load()
        return this
    }

    clear () {
        this.setData(null)
        return this
    }

    // --- loading ---

    blobName () {
        return "URL:encoded:" + this.path()
    }

    load () {
        if (this.loadIfCached()) {
            return this
        }
        this.justLoad()
        return this
    }

    loadIfCached () {        
        const blobs = BMBlobs.shared()
        const isCached = blobs.hasBlobWithName(this.path())
        if (isCached) {
            const blob = blobs.blobWithName(this.path())
            if (blob.age() < this.timeoutInterval()) {
                this.setStatus("reading from cache...")

                const resolve = () => { 
                    this.justSetDataUrlString(blob.value()) 
                    this.postComplete()
                }

                const reject = () => { 
                    this.justLoad() 
                }
                
                blob.asyncReadValue(resolve, reject)
                return this
            }
            return true
        }
        return false
    }

    justLoad () {
        this.setStatus("sending request...")
        const rq = new XMLHttpRequest();
        rq.open("get", this.path());
        rq.responseType = "blob";
        rq.onabort     = (event) => { this.onRequestAbort(event) }
        rq.onerror     = (event) => { this.onRequestError(event) }
        rq.onload      = (event) => { this.onRequestLoad(event) }
        rq.onloadend   = (event) => { this.onRequestLoadEnd(event) }
        rq.onloadstart = (event) => { this.onRequestLoadStart(event) }
        rq.onprogress  = (event) => { this.onRequestProgress(event) }
        rq.ontimeout   = (event) => { this.onRequestTimeout(event) }
        rq.send()
        return this
    }

    // --- http request events ---

    onRequestAbort (event) {
        this.setError("request aborted") 
    }

    onRequestError (event) {
        this.setError("request error") 
    }

    onRequestLoadEnd (event) {
    }

    onRequestProgress (event) {
        if (event.total) {
            const percentage = Math.round( (event.loaded / event.total) * 100 )
            this.setStatus("requesting: " + percentage + "%")
        } else {
            this.setStatus("receiving header")
        }
    }

    onRequestLoadStart (event) {
        this.setStatus("sending request")
    }

    onRequestTimeout (event) {
        this.setError("request timeout") 
    }

    onRequestLoad (event) {
        const request = event.currentTarget
        const fr = new FileReader();
        fr.onload     = (event) => { this.onReaderLoad(event) }
        fr.onprogress = (event) => { this.onReaderProgress(event) }
        fr.onabort    = (event) => { this.onReaderAbort(event) }
        fr.onerror    = (event) => { this.onReaderError(event) }
        fr.onloadend  = (event) => { this.onReaderLoadEnd() }
        fr.readAsDataURL(request.response)
        return this
    }

    // --- file reader events ---

    onReaderAbort (event) {
        this.setError("aborted")
    }

    onReaderError (event) {
        this.setError("load error")
    }

    onReaderProgress (event) {
        const percentage = (event.loaded / event.total) * 100 
        this.setStatus("loading: " + percentage + "%")
    }

    onReaderLoad (event) {
        const fileReader = event.currentTarget
        const result = fileReader.result
        this.justSetDataUrlString(result)
    }

    onReaderLoadEnd () {
        this.setStatus(null)
    }

    justSetDataUrlString (aString) {
        this.dataUrl().setDataUrlString(aString)
        BMBlobs.shared().createBlobWithNameAndValue(this.path(), aString)
        this.setStatus(null)
        this.setError(null)
        this.scheduleSyncToView()
        this.postComplete()
    }

    // --- decoding ---

    decodedData () {
        return this.dataUrl().decodedData()
    }

    asJson () {
        if (this.dataUrl().isJson() ) {
            return JSON.parse(this.decodedData())
        }
        return undefined
    }

    dataString () {
        const du = this.dataUrl()
        if (du.isXml() ) { 
            return this.escapeHtml(this.decodedData())
        } else if (du.isJson()) {
            //const json = JSON.parse(this.decodedData())
            //return JSON.stringify(json, null, 2)
        }
        return this.decodedData() 
    }

    escapeHtml (unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

}.initThisClass());
