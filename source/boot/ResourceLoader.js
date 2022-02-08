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

        //this.newSlot("archive", null)

        this.newSlot("resourceFilePaths", [])
        this.newSlot("maxUrlCount", 0)

        this.newSlot("isEmbeded", false)
        this.newSlot("finalCallback", null)
    }

    isInIndexMode () {
        return getGlobalThis().isBuildingIndex
    }

    resourceFilePathsWithExtensions(extensions) {
        return this.resourceFilePaths().select(path => extensions.contains(path.pathExtension().toLowerCase()))
    }

    currentScriptPath () {
        if (this.currentScript()) {
            return this.currentScript().basePath()
        }

        if (!this.isInBrowser()) {
            return process.cwd() // will need this for first script, as there's no currentScript yet
        }

        return ""
    }

    absolutePathForRelativePath (aPath) {
        const parts = this.currentScriptPath().split("/").concat(aPath.split("/"))
        let rPath = parts.join("/")

        if (rPath[0] === "/"[0] && this.isInBrowser()) {
            rPath = "." + rPath
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
        paths.forEach(path => this.pushFilePath(path))
        /*
        this.setUrls(paths.concat(this.urls()))
        this.setMaxUrlCount(this.maxUrlCount() + paths.length)
        */
        return this
    }

    pushFilePath (path) {
        console.log("ResourceLoader pushFilePath: '" + path + "'")
        this.urls().push(path)
        this.setMaxUrlCount(this.maxUrlCount() + 1)
        return this
    }

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
        console.log("ResourceLoader loadUrl: '" + fullPath + "'")

        if (this.isInBrowser()) {
            const detail = { url: fullPath, maxUrlCount: this.maxUrlCount() }
            this.postEvent("resourceLoaderLoadUrl", detail)
        }

        const extension = url.split(".").pop().toLowerCase()

        if (extension === "js" /*|| extension === "json"*/) {
            this.loadJsUrl(fullPath)
        } else if (extension === "css") {
            this.loadCssUrl(fullPath)
        } else {
            // leave it to other resource handlers which call ResourceLoader.shared().resourceFilePathsWithExtensions()
            this.resourceFilePaths().push(fullPath) 
            this.loadNext()
        }

        return this
    }

    loadJsUrl (url) {
        this.jsFilesLoaded().push(url)

        if (this.isEmbeded()) {
            this.loadNext()
            return
        }

        const isImportsFile = url.split("/").pop() === "_imports.js"
        if (this.isInIndexMode() && !isImportsFile) {
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
