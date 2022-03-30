"use strict";

/*

    sends these events to window:

        resourceLoaderLoadUrl, with detail { url: , maxUrlCount: }
        resourceLoaderError, with detail { error: }
        resourceLoaderDone

*/

(class ResourceLoader extends Base {

    initThisClass () {
        super.initThisClass()
    }

    initPrototype () {
        this.newSlot("currentScript", null);
        this.newSlot("urls", []);
        this.newSlot("doneCallbacks", []),
        //this.newSlot("errorCallbacks", []);
        
        this.newSlot("jsFilesLoaded", [])  // track these so index builder can embed in index.html
        this.newSlot("cssFilesLoaded", []) // track these so index builder can embed in index.html
        this.newSlot("resourceFilePaths", []) // track these so index builder can embed in index.html

        //this.newSlot("archive", null)

        this.newSlot("maxUrlCount", 0)

        this.newSlot("isEmbeded", false)
        this.newSlot("finalCallback", null)

        this.newSlot("currentImportPath", "")
    }

    isInIndexMode () {
        return getGlobalThis().isBuildingIndex
    }

    resourceFilePathsWithExtensions (extensions) {
        return this.resourceFilePaths().select(path => extensions.contains(path.pathExtension().toLowerCase()))
    }

    baseForPath (path) {
        const parts = path.split("/")
        parts.pop()
        return parts.join("/")
    }

    currentScriptPath () {
        
        if (this.currentScript()) {
            return this.currentScript().basePath()
        }
             
        if (!this.isInBrowser()) {
            return process.cwd() // will need this for first script, as there's no currentScript yet
        }

        //if (this.currentImportPath()) {
            //console.log("this.currentImportPath() = '" + this.currentImportPath() + "'")
            return this.currentImportPath()
        //}

        return ""
    }

    absolutePathForRelativePath (aPath) {
        const ext = aPath.split(".").pop() 

        const parts = this.currentScriptPath().split("/").concat(aPath.split("/"))
        let rPath = parts.join("/")

        if (rPath[0] === "/"[0] && this.isInBrowser()) {
            rPath = "." + rPath
        }

        if (ext === "ttf") {
            console.log("font path: '" + rPath + "'")
        }

        return rPath
    }

    absolutePathsForRelativePaths (paths) {
        return paths.map((aPath) => { return this.absolutePathForRelativePath(aPath) })
    }

    pushRelativePaths (paths) {
        this.pushFilePaths(this.absolutePathsForRelativePaths(paths))
        return this
    }

    pushFilePaths (paths) {
        //paths.slice().reverse().forEach(path => this.unshiftFilePath(path))
        
        // we want these to be in front of previous ones
        
        this.setUrls(paths.concat(this.urls()))
        this.setMaxUrlCount(this.maxUrlCount() + paths.length)
        

        return this
    }

    /*
    unshiftFilePath (path) {
        //console.log("ResourceLoader unshiftFilePath: '" + path + "'")
        this.urls().unshift(path)
        this.setMaxUrlCount(this.maxUrlCount() + 1)
        return this
    }

    pushFilePath (path) {
        //console.log("ResourceLoader pushFilePath: '" + path + "'")
        this.urls().push(path)
        this.setMaxUrlCount(this.maxUrlCount() + 1)
        return this
    }
    */

    pushDoneCallback (aCallback) {
        this.doneCallbacks().push(aCallback)
        return this
    }

    // --- run ---

    run () {
        this.loadNext()
        return this
    }

    isDone () {
        return this.urls().length === 0
    }

    loadNext () {
        if (!this.isDone()) {
            const url = this.urls().shift()
            this.loadUrl(url)
        } else {
            this.done()
        }
        return this
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

    fullPathForUrl (url) {
        if (!this.isInBrowser()) {
            if (url.indexOf("://") === -1 && url.indexOf("/") !== 0) {
                //console.log("url: '" + url + "'")
                const rootPath = process.cwd()
                const nodePath = require("path")
                const fullPath = nodePath.join(rootPath, url)
                console.log("url: '" + url + "' -> '" + fullPath + "'")
                return fullPath
            }
        }
        return url
    }

    loadUrl (url) {
        const fullPath = this.fullPathForUrl(url)
         //console.log("ResourceLoader loadUrl: '" + fullPath + "'")

        if (this.isInBrowser()) { // post event
            const detail = { url: fullPath, maxUrlCount: this.maxUrlCount() }
            this.postEvent("resourceLoaderLoadUrl", detail)
        }

        const ext = url.split(".").pop().toLowerCase()

        if (ext === "js" /*|| ext === "json"*/) {
            this.loadJsUrl(fullPath)
        } else if (ext === "css") {
            this.loadCssUrl(fullPath)
        } else {
            if (!this.isEmbeded()) {
                this.resourceFilePaths().push(fullPath) 
            }
            // leave it to other resource handlers which call ResourceLoader.shared().resourceFilePathsWithExtensions()
            this.loadNext()
        }

        return this
    }

    loadJsUrl (url) {
        this.jsFilesLoaded().push(url)
        const isImportsFile = url.split("/").pop() === "_imports.js"

        if (this.isInBrowser() && isImportsFile) {
            this.setCurrentImportPath(this.baseForPath(url))
        }

        if (this.isEmbeded()) { // skip script and goto next because these are all merged into one big script tag already
            this.loadNext()
            return
        }

        if (this.isInIndexMode() && !isImportsFile) { // skip script and goto next because we're building index and only need to load imports
            this.loadNext()
            return
        }

        const script = JsScript.clone().setImporter(this).setFullPath(url).setDoneCallback(() => { this.loadNext() })
        this.setCurrentScript(script)
        this.currentScript().run()
        return this
    }

    loadCssUrl (url) {
        this.cssFilesLoaded().push(url)

        if (!this.isEmbeded()) {
            CssLink.clone().setFullPath(url).run() // move to CSSResources?
        }

        this.loadNext()
        return this
    }

    done () {
        console.log("ResourceLoader.done() -----------------------------")
        if (!this.isInIndexMode()) {
            this.doneCallbacks().forEach(callback => callback())
        }
        this.postEvent("resourceLoaderDone", { }) 
        if (this.finalCallback()) {
            this.finalCallback()()
        }
        return this
    }

    setError (error) {
        this.postEvent("resourceLoaderError", { error: error }) 
        return this
    }
}.initThisClass());

// --- ResourceLoader -----------------------------------------------


getGlobalThis().resourceLoader = ResourceLoader.shared();
resourceLoader.pushRelativePaths(["_imports.js"]);

if (getGlobalThis().ResourceLoaderIsEmbedded) {
    console.log("ResourceLoader is embeded, will run on page load")
    resourceLoader.setIsEmbeded(getGlobalThis().ResourceLoaderIsEmbedded)
    window.addEventListener("load", () => { resourceLoader.run(); });
} else {
    console.log("ResourceLoader is not embeded, will not auto run")
    //console.log("ResourceLoader is not embeded, will run with timeout")
    //setTimeout(() => resourceLoader.run(), 1)
}
