"use strict";

/*

    BMFont

    Managed by BMFontResources.

*/

(class BMFont extends BMResource {
    
    static supportedExtensions () {
        return ["ttf", "woff", "woff2"]
    }

    initPrototypeSlots () {
        this.newSlot("name", null)
        this.newSlot("options", null)
        this.newSlot("fontFace", null) // reference to browser FontFace object
    }

    initPrototype () {
        this.setIsDebugging(false)
    }

    init () {
        super.init()
        this.setOptions({})  // example options { style: 'normal', weight: 700 }  
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

    didLoad () {
        super.didLoad()
        this.loadFontFromData()
        if (this.isDebugging()) {
            //this.debugLog(".didLoad('" + this.name() + "') '" + this.path() + "'")
            //debugger;
            //this.debugLog(".didLoad('" + this.name() + "')")
        }
        return this
    }

    loadFontFromData () {
        const aFontFace = new FontFace(this.name(), this.data(), this.options()); 
        this.setFontFace(aFontFace)

        aFontFace.load().then((loadedFace) => {
            // can probably do this in the background, 
            // but it's nice to know when it's complete
           // this.didLoad()
            assert(loadedFace === aFontFace)
            document.fonts.add(loadedFace)
            //console.log("added font to document: ", this.name())
        }).catch((error) => {
            this.onLoadError(error)
        });
    }

    onLoadError (error) {
        if (this.isDebugging()) {
            this.debugLog(".onLoadError() ", error)
        }
        return this
    }

}.initThisClass());
