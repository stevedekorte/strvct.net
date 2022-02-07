"use strict";

/*

    A minimal Javascript sequential file loader. 
    This is needed because script tags will reliably load in sequence. 
    We use this to sequentially load a few JS files that
    get a more full featured loader running 
    that can deal with more reasource types including js, css, fonts, etc.
    and can connect with a ResourceLoaderPanel (if running in a browser) 
    to display loading status and errors.

    If you want to load more resources at this stage, you can call:

        BootLoader.shared().addFiles(filePaths)

    The loading begins on the window load event.

*/


const BootLoader = (class BootLoader {
    static initThisClass () {
        if (typeof(window) !== "undefined") {
            window.BootLoader = this // only used in web browser?
        } else {
            global.BootLoader = this
        }

        return this
    }

    static shared () {
        if (!this._shared) {
            this._shared = new this().init()
        }
        return this._shared
    }

    isInBrowser () {
        return (typeof (document) !== 'undefined')
    }

    sourceFolderPath () {
        if (this.isInBrowser()) {
            const script = document.currentScript;
            const fullUrl = script.src;
            const parts = fullUrl.split("/")
            parts.pop()
            const folder = parts.join("/")
            return folder
        } else { // we're in node
            return __dirname
        }
    }

    absolutePathFiles () {
        return this.files().map((file) => {
            return this.sourceFolderPath() + "/" + file
        })
    }

    init () {
        this._files = []
        this._isRunning = false
        return this
    }

    registerForWindowLoad () {
        if (typeof(window) !== "undefined") {
            window.addEventListener("load", () => { this.load() });
        }
    }

    files () {
        return this._files
    }

    addFiles (paths) {
        paths.forEach(path => this.files().push(path))
        return this
    }

    loadNextFile () {
        const nextFile = this.files().shift()

        if (nextFile) {
            const path = "./" + nextFile
            console.log("BootLoader importing '" + path + "'")
            //debugger

            import(path).then((module) => {
                console.log("BootLoader imported '" + path + "'")
                this.loadNextFile()
            }).catch(function (error) {
                console.log(error.message)
                debugger
            })
        } else {
            this.done()
        }
        return this
    }

    done () {
        //resourceLoader.shared().run()
    }

    load () {
        if (this._isRunning) {
            throw new Error("already running")
        }
        this._isRunning  = true
        this.loadNextFile() 
    }

    loadWithRequire () {
        this.files().forEach(file => require(file))
    }

}.initThisClass());


BootLoader.shared().addFiles([
    "./getGlobalThis.js",
    "./Base.js",
    "./CssLink.js",
    "./JsScript.js",
    "./ResourceLoaderPanel.js",
    "./ResourceLoader.js",
]).registerForWindowLoad()