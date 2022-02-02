"use strict";


(class ResourceLoaderClass extends ResourceLoaderBase {

    init() {
        super.init()
        this.newSlot("currentScript", null);
        this.newSlot("urls", []);
        this.newSlot("doneCallbacks", []),
        this.newSlot("urlLoadingCallbacks", []);
        this.newSlot("errorCallbacks", []);
        
        this.newSlot("jsFilesLoaded", []) // these may be embedded in index.html
        this.newSlot("cssFilesLoaded", [])  // these may be embedded in index.html

        //this.newSlot("archive", null)

        this.newSlot("resourceFilePaths", [])
        this.newSlot("maxUrlCount", 0)
    }

    resourceFilePathsWithExtensions(extensions) {
        return this.resourceFilePaths().select(path => extensions.contains(path.pathExtension().toLowerCase()))
    }

    currentScriptPath () {
        if (this.currentScript()) {
            return this.currentScript().basePath()
        }
        return ""
    }

    absolutePathForRelativePath (aPath) {
        const parts = this.currentScriptPath().split("/").concat(aPath.split("/"))
        let rPath = parts.join("/")

        if (rPath[0] === "/"[0]) {
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
        this.setUrls(paths.concat(this.urls()))
        this.setMaxUrlCount(this.maxUrlCount() + paths.length)
        return this
    }

    pushDoneCallback (aCallback) {
        this.doneCallbacks().push(aCallback)
        return this
    }

    pushUrlLoadingCallback (aCallback) {
        this.urlLoadingCallbacks().push(aCallback)
        return this
    }

    pushErrorCallback (aCallback) {
        this.errorCallbacks().push(aCallback)
        return this
    }

    removeErrorCallback (aCallback) {
        this.errorCallbacks().remove(aCallback)
        return this
    }

    removeUrlCallback (aCallback) {
        this.urlLoadingCallbacks().remove(aCallback)
        return this
    }

    // --- run ---

    run () {
        this.loadNext()
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

    loadUrl (url) {
        this.urlLoadingCallbacks().forEach(callback => callback(url, this.maxUrlCount()))

        const extension = url.split(".").pop().toLowerCase()
        //const fontExtensions = ["ttf", "woff", "woff2"]
        //const audioExtensions = ["wav", "mp3", "m4a", "mp4", "oga", "ogg"]
        //const imageExtensions = ["png", "jpg", "jpeg", "gif", "tiff", "bmp"]

        if (extension === "js" /*|| extension === "json"*/) {
            this.jsFilesLoaded().push(url)
            const script = JsScript.clone().setImporter(this).setFullPath(url).setDoneCallback(() => { this.loadNext() })
            this.setCurrentScript(script)
            this.currentScript().run()
        } else if (extension === "css") {
            this.cssFilesLoaded().push(url)
            CssLink.clone().setFullPath(url).run() // move to CSSResources?
            this.loadNext()
        } else {
            this.resourceFilePaths().push(url)
            this.loadNext()
        }

        /*
        } else if (fontExtensions.contains(extension)) {
            this.fontFilePaths().push(url)
            this.loadNext()
        } else if (audioExtensions.contains(extension)) {
            this.audioFilePaths().push(url)
            this.loadNext()
        } else if (imageExtensions.contains(extension)) {
            this.imageFilePaths().push(url)
            this.loadNext()
        } else {
            throw new Error("unrecognized extension on url '" + url + "'")
        }
        */

        return this
    }

    done () {
        //console.log("ResourceLoader.done() -----------------------------")
        this.doneCallbacks().forEach(callback => callback())
        return this
    }

    setError (error) {
        this.errorCallbacks().forEach(callback => callback(error))
        return this
    }
}.initThisClass())

// --- ResourceLoaderClass -----------------------------------------------

getGlobalThis().ResourceLoader = ResourceLoaderClass.shared()

if (getGlobalThis().ResourceLoaderIsEmbedded !== true) {
    ResourceLoader.pushRelativePaths(["_imports.js"]).run()
    //ResourceLoader.pushRelativePaths(["../../_imports.js"]).run()
}