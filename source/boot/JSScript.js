"use strict";

(class JsScript extends Base {
    initPrototype () {
        this.newSlot("importer", null);
        this.newSlot("fullPath", null);
        this.newSlot("doneCallback", null);
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
            setTimeout(() => { this.runInNode() }, 1)
            //setTimeout(() => { this.runUsingImport() }, 1)
            //this.runInNode()
        }
    }

    runInNode () {
        //const path = __dirname + "/" + this.fullPath()
        //console.log("__dirname = ", __dirname)
        //const path = "../../" + this.fullPath()
        let path = this.fullPath()
        console.log("runInNode path: ", path)
        //root_require(path)


        try {
            //const root_require = require('root-require');
            //path = __dirname + "/" + path
            const nodePath = require('path');

            /*
            if (path[0] !== "/") {
                throw new Error("not an absolute path: '" + path + "'")
            }
            */
            //path = nodePath.resolve("../../", path)
            console.log("require '" + path + "'")

            require(path)
            this._doneCallback()
        } catch (error) {
            this.importer().setError(error)
            console.log("current working directory __dirname = '" + __dirname + "'")
            console.log("can't find = '" + path + "'")
            throw new Error(error.message + " loading url " + path)
        }

        //console.log("required path: ", path)
    }

    runUsingImport () {
        const path = this.fullPath()
        
        console.log("ResourceLoader runInImport " + path)

        import(path).then((module) => {
            this._doneCallback()
        }).catch((error) => {
            this.importer().setError(error)
            throw new Error("missing url " + this.fullPath())
        })
    }

    runInBrowser () {
        const script = document.createElement("script")
        console.log("JsScript loading: '" + this.fullPath() + "'")
        
        script.src = this.fullPath()

        script.onload = () => {
            //console.log("loaded script src:'" + script.src + "' type:'" + script.type + "' text:[[[" + script.text + "]]]")
            console.log("loaded script src:'" + script.src)
            //debugger
            this._doneCallback()
        }

        script.onerror = (error) => {
            this.importer().setError(error)
            throw new Error("missing url " + this.fullPath())
        }

        const parent = document.getElementsByTagName("head")[0] || document.body
        parent.appendChild(script)
    }

    basePath () {
        const parts = this.fullPath().split("/")
        parts.pop()
        return parts.join("/")
    }
}.initThisClass());
