"use strict";

/*

    A minimal Javascript sequential file loader. 
    We use this to sequentially load a few JS files that
    get a more full featured loader running 
    that can deal with more reasource types including js, css, fonts, etc.
    and can connect with a ResourceLoaderPanel (if running in a browser) 
    to display loading status and errors.

    If you want to load more resources at this stage, you can call:

        BootLoader.shared().addFiles(filePaths)

    The loading begins on the window load event.

*/


(class BootLoader {
    static initThisClass () {
        window.BootLoader = this
    }

    static shared () {
        if (!this._shared) {
            this._shared = new this().init()
        }
        return this._shared
    }

    init () {
        this._files = []
        this.registerForWindowLoad()
        return this
    }

    registerForWindowLoad () {
        window.addEventListener("load", () => { this.load() });
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
            //console.log("importing '" + path + "'")
            import(path).then((module) => {
                this.loadNextFile()
            })
        }
        return this
    }

    load () {
        this.loadNextFile() 
    }

}.initThisClass())


BootLoader.shared().addFiles([
    "./getGlobalThis.js",
    "./Base.js",
    "./CssLink.js",
    "./JsScript.js",
    "./ResourceLoaderPanel.js",
    "./ResourceLoader.js",
]).registerForWindowLoad()