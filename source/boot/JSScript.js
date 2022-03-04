"use strict";

(class JsScript extends Base {
    initPrototype () {
        this.newSlot("importer", null); // parent - ResourceLoader
        this.newSlot("fullPath", null);
        this.newSlot("doneCallback", null);
        this.newSlot("scriptElement", null);
    }

    setFullPath (aPath) {
        /*
        const isAbsolute = (aPath.indexOf("/") === 0) || (aPath.indexOf("://") !== -1)
        if (!isAbsolute) {
            throw new Error("not an absolute path: '" + path + "'")
        }
        */
        this._fullPath = aPath
        return this
    }

    run () {
        //console.log("JsScript run " + this.fullPath())
        if (this.isInBrowser()) {
            //this.runUsingImport() // can't use with file:// due to CORS
            this.runInBrowser()
        } else {
            setTimeout(() => { this.runUsingRequire() }, 1) // timeout to maintain async semantics?
            //setTimeout(() => { this.runUsingImport() }, 1)
        }
    }

    runUsingRequire () { //  for node.js
        let path = this.fullPath()
        console.log("ResourceLoader runUsingRequire: '" + path + "'")

        try {
            require(path)
            this._doneCallback()
        } catch (error) {
            this.importer().setError(error)
            //console.log("this file's path __dirname = '" + __dirname + "'")
            //console.log("current working directory: = '" + process.cwd() + "'")
            console.log("ResourceLoader runUsingRequire() error: '" + error.message + "' running file: '" + path + "'")
            throw new Error(error.message + " loading url " + path)
        }

        //console.log("required path: ", path)
    }

    runUsingImport () { // can't use with file:// due to CORS
        const path = this.fullPath()
        
        console.log("ResourceLoader runUsingImport: '" + path + "'")

        import(path).then((module) => {
            this._doneCallback()
        }).catch((error) => {
            this.importer().setError(error)
            throw new Error("missing url " + this.fullPath())
        })
    }

    runInBrowser () {
        const script = document.createElement("script")
        this.setScriptElement(script)
        //console.log("JsScript runInBrowser: '" + this.fullPath() + "'")
        
        script.src = this.fullPath()
        script.async = undefined // needed?
        script.defer = undefined // needed?
        script.type = "module" // charset and defer attributes ignore if type is "module"

        script.onload = () => {
            //console.log("loaded script src:'" + script.src + "' type:'" + script.type + "' text:[[[" + script.text + "]]]")
            //console.log("JsScript runInBrowser: loaded:'" + script.src)
            this.removeScript() // helpful?
            this._doneCallback()
        }

        script.onerror = (error) => {
            this.importer().setError(error)
            throw new Error("missing url " + this.fullPath())
        }

        const parent = document.getElementsByTagName("head")[0] || document.body
        parent.appendChild(script)
    }

    removeScript () {
        const e = this.scriptElement()
        e.parentNode.removeChild(e);
    }

    basePath () {
        const parts = this.fullPath().split("/")
        parts.pop()
        return parts.join("/")
    }

}.initThisClass());
