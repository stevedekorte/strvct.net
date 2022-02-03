"use strict";

(class JsScript extends Base {
    initPrototype () {
        this.newSlot("importer", null);
        this.newSlot("fullPath", null);
        this.newSlot("doneCallback", null);
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
        const path = this.fullPath()
        //console.log("runInNode path: ", path)
        //root_require(path)

        try {
            root_require(path)
            this._doneCallback()
        } catch (error) {
            this.importer().setError(error)
            throw new Error(error.essage + " loading url " + path)
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
        //console.log("JsScript loading: '" + this.fullPath() + "'")

        script.src = this.fullPath()

        script.onload = () => {
            //console.log("loaded script src:'" + script.src + "' type:'" + script.type + "' text:[[[" + script.text + "]]]")
            //console.log("loaded script src:'" + script.src)
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
}.initThisClass())
