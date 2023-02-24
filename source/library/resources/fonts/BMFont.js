"use strict";

/*

    BMFont

    Managed by BMFontResources.

*/

(class BMFont extends BaseNode {
    
    static supportedExtensions () {
        return ["ttf", "woff", "woff2"]
    }

    initPrototypeSlots () {
        this.newSlot("path", null)
        this.newSlot("name", null)
        this.newSlot("options", null)
        this.newSlot("data", null)
    }

    initPrototype () {
        this.setIsDebugging(false)
    }

    init () {
        super.init()
        this.setOptions({})  // example options { style: 'normal', weight: 700 }  
        this.setIsDebugging(true)
    }

    title () {
        return this.name()
    }

    name () {
        if (this._name) {
            return this._name
        }

        return this.path().fileName()
    }

    // loading 

    loadData () {
        const req = new XMLHttpRequest();
        req.open("GET", this.path(), true);
        req.responseType = "arraybuffer";
        
        req.onload = (event) => {
          const arrayBuffer = req.response; // Note: not req.responseText
          if (arrayBuffer) {
            this.onLoadData(arrayBuffer)
          }
        };
        
        req.send(null);
    }

    onLoadData (arrayBuffer) {
        const aFontFace = new FontFace(this.name(), arrayBuffer, this.options()); 
        aFontFace.load().then((loadedFace) => {
            this.didLoad()
            assert(loadedFace === aFontFace)
            document.fonts.add(loadedFace)
        }).catch((error) => {
            this.onLoadError(error)
        });
    }

    load () {
        this.loadData()
        return this
    }

    OLD_load () {
        if (!getGlobalThis()["FontFace"]) {
            console.warn("this browser is missing FontFace class")
            return this
        }

        const urlString = "url('" + this.path() + "')"
        const aFontFace = new FontFace(this.name(), urlString, this.options()); 
        
        aFontFace.load().then((loadedFace) => {
            this.didLoad()
            assert(loadedFace === aFontFace)
            document.fonts.add(loadedFace)
        }).catch((error) => {
            this.onLoadError(error)
        });

        return this
    }

    didLoad () {
        if (this.isDebugging()) {
            this.debugLog(".didLoad('" + this.name() + "') '" + this.path() + "'")
            //this.debugLog(".didLoad('" + this.name() + "')")
        }
        return this
    }

    onLoadError (error) {
        if (this.isDebugging()) {
            this.debugLog(".onLoadError() ", error)
        }
        return this
    }

}.initThisClass());
