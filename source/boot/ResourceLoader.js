"use strict";

/*

    A minimal Javascript sequential file loader. 

    Loads _index.json and _cam.json, then
    evals JS files in _index in order (adding sourceURL comment for debugger).

    The loading begins on the window load event.

    Should also post events to load panel.

*/

class BootResource {
    init () {
        this._path = null
        this._request = null
        this._onLoad = null
        return this
    }

    setPath (aPath) {
        this._path = aPath
        return this
    }

    setOnLoad (aFunc) {
        this._onLoad = aFunc
        return this
    }

    load () {
        const path = this._path
        const request = new XMLHttpRequest();
        request.open('GET', path, true);
        console.log("runInBrowser: ", path)
        //request.responseType = 'application/json'; // optional
        request.onload  = (event) => { this.onLoad(event) }
        request.onerror = (event) => { this.onLoadError(event) }
        request.send();
        this._request = request
        return this
    }

    onLoad (event) {
        const request = this._request;
        if (request.status >= 400 && request.status <= 599) {
            const error = request.status + " " + request.statusText + " error loading " + this.fullPath() + " "
            this.setError(error)
            throw new Error(error)
            return
        }
        this._onLoad(this)
    }

    onLoadError (event) {
        const request = this._request; // is event or error passed?
        console.log(this.type() + " onLoadError ", error, " " + this.fullPath())
        this.setError(error)
        throw new Error("error loading " + this.fullPath())
    }

    data () {
        return this._request.response;
    }

    dataAsJson () {
        return JSON.parse(this.data())
    }
}

// ------------------------------------------------------------------------

class ResourceLoader {

    static shared () {
        if (!this._shared) {
            this._shared = new ResourceLoader().init()
        }
        return this._shared
    }

    isInBrowser () {
        return (typeof (document) !== 'undefined')
    }

    init () {
        this._index = null
        this._cam = null
        this._evalCount = 0
        return this
    }

    run () {
        this.loadIndex()
        this.loadCam()
        return this
    }

    // --- load index ---

    loadIndex () {
        const path = "_index.json"
        this._indexResource = new BootResource().init().setPath(path).setOnLoad((resource) => (this.onLoadIndex(resource))).load()
        return this
    }

    onLoadIndex (resource) {
        this._index = resource.dataAsJson()
        this.evalIfReady()
    }

    // --- load cam ---

    loadCam () {
        const path = "_cam.json"
        this._indexResource = new BootResource().init().setPath(path).setOnLoad(resource => this.onLoadCam(resource)).load()
        return this
    }

    onLoadCam (resource) {
        this._cam = resource.dataAsJson()
        this.evalIfReady()
    }

    // --- eval ---

    evalIfReady () {
        if (this._index && this._cam) {
            this.eval()
            this.onDone()
        }
    }

    extForPath (path) {
        const parts = path.split(".")
        return parts.length ? parts[parts.length -1] : undefined
    }

    camValueForEntry (entry) {
        const value = this._cam[entry.hash]
        if (!value) {
            throw new Error("missing cam value for entry: " + JSON.stringify(entry))
        }
        return value
    }

    jsEntries () {
        return this._index.filter(entry => this.extForPath(entry.path) === "js")
    }

    cssEntries () {
        return this._index.filter(entry => this.extForPath(entry.path) === "css")
    }

    eval () {
        this.cssEntries().forEach(entry => this.evalCssEntry(entry))
        this._jsEntriesCount = this.jsEntries().length
        this.jsEntries().forEach(entry => this.evalJsEntry(entry))
    }

    evalJsEntry (entry) {
        const value = this.camValueForEntry(entry)
        console.log("eval: " +  entry.path)
        const sourceUrl = "\n//# sourceURL=" + entry.path + " \n"
        //const sourceUrl = "\n//# sourceURL=./" + entry.path + " \n"
        const debugCode = value + sourceUrl
        eval(debugCode)
        return this
    }
    
    evalCssEntry (entry) {
        if (this.isInBrowser()) {
            const cssString = this.camValueForEntry(entry) 
            const debugCssString = cssString + "\n\n/* " + entry.path + "*/"
            console.log("eval css: " +  entry.path)
            const element = document.createElement('style');
            element.type = 'text/css';
            element.appendChild(document.createTextNode(debugCssString))
            document.head.appendChild(element);
        }
        return this
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

    postEvent (eventName, detail) {
        if (this.isInBrowser()) {
            const myEvent = new CustomEvent(eventName, {
                detail: detail,
                bubbles: true,
                cancelable: true,
                composed: false,
              });
              window.dispatchEvent(myEvent);
        }
        return this
    }
    
    onProgress (path, max) {
        this._evalCount ++
        const detail = { url: path, progress: this._evalCount / this._jsEntriesCount }
        //this.postEvent("resourceLoaderLoadUrl", detail)
        this.postEvent("resourceLoaderProgress", detail)
    }

    onError (error) {
        this.postEvent("resourceLoaderError", { error: error }) 
    }

    onDone () {
        this.postEvent("resourceLoaderDone", {}) 
    }

    // --- public API ---

    resourceFilePaths () {
        return this._index.map(entry => entry.path)
    }

    resourceEntriesWithExtensions (extensions) {
        return this._index.filter(entry => extensions.indexOf(entry.path) !== -1)
    }

    resourceFilePathsWithExtensions (extensions) {
        return this.resourceEntriesWithExtensions(extensions).map(entry => entry.path)
    }
}

ResourceLoader.shared().run()


