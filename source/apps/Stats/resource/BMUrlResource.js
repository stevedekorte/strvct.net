"use strict"

/*

    BMUrlResource

*/

window.BMUrlResource = class BMUrlResource extends BMNode {
    
    initPrototype () {
        this.newSlot("path", "")
        this.newSlot("data", null).setSyncsToView(true)
        this.newSlot("error", null).setSyncsToView(true)
        this.newSlot("status", null).setSyncsToView(true)
    }

    init () {
        super.init()
        this.setNodeMinWidth(600)
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
        if (this.data()) {
            return this.dataString().byteSizeDescription() + " " + dataType
        }
        return ""
    }

    didUpdateSlotPath () {
        this.loadFromCache()
    }

    isLoaded () {
        return this.hasData() || this.isCached()
    }

    hasData () {
        return !Type.isNull(this.data())
    }

    isCached () {
        return BMCache.shared().hasKey(this.path())
    }

    // --- setup ---

    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setupDataField()
    }

    setupDataField () {
        const field = BMTextAreaField.clone().setKey("recordString")
        field.setValueMethod("dataString").setValueIsEditable(false).setIsMono(true)
        field.setTarget(this) 
        field.getValueFromTarget()
        this.addSubnode(field)
        return this
    }

    // --- actions ---

    loadIfNeeded () {
        if (!this.data()) {
            this.loadFromCache()
        }
    }

    loadFromCache () {
        const value = BMCache.shared().valueForKey(this.path())
        if  (!Type.isUndefined(value)) {
            this.parseDataUrl(value)
        }
    }

    removeFromCache () {
        BMCache.shared().removeKey(this.path())
    }

    refresh () {
        this.clear()
        this.load()
        return this
    }

    clear () {
        this.removeFromCache()
        this.setData(null)
        return this
    }

    // --- loading ---

    load () {
        {
            this.loadFromCache()
            if  (this.data()) {
                return this
            }
        }

        this.setStatus("loading...")

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
        rq.send();
        return this
    }

    // --- http request events ---

    onRequestAbort (event) {
        this.setError("http request aborted") 
    }

    onRequestError (event) {
        this.setError("http request error") 
    }

    onRequestLoadEnd (event) {

    }

    onRequestProgress (event) {
        this.setError("file read error") 
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
        const dataUrl = fileReader.result
        BMCache.shared().setKeyValueTimeout(this.path(), dataUrl)
        this.parseDataUrl(dataUrl)
    }

    onReaderLoadEnd () {
        this.setStatus(null)
    }

    // --- parse ---

    parseDataUrl (dataUrl) {
        const bd = BrowserDragData.clone().setTransferData(null, dataUrl)
        if (bd.mimeType() !== "application/json") {
            this.setData(null)
            this.setError("missing data")
            this.scheduleSyncToView()
            return this
        }

        const jsonString = bd.decodedData()
        const json = JSON.parse(jsonString)
        this.setData(json)
    }

    dataString () {
        return JSON.stringify(this.data(), null, 2)
    }

    jsonData () {
        this.data()
    }

}.initThisClass()
