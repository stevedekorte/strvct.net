"use strict";

/*

    BMFont

    Managed by BMFontResources.

*/

(class BMFont extends BMResource {
    
    static supportedExtensions () {
        return ["ttf", "woff", "woff2"]
    }

    static fontWeightMap () {
        const wm = new Map()
        wm.set("Thin", 100);
        wm.set("Extra Light", 200); wm.set("ExtraLight", 200);
        wm.set("Ultra Light", 200); wm.set("UltraLight", 200);
        wm.set("Light", 300);
        wm.set("Normal", 400);
        wm.set("Medium", 500);
        wm.set("Semi Bold", 600); wm.set("SemiBold", 600);
        wm.set("Demi Bold", 600); wm.set("DemiBold", 600);
        wm.set("Bold", 700);
        wm.set("Extra Bold", 800); wm.set("ExtraBold", 800);
        wm.set("Ultra Bold", 800); wm.set("UltraBold", 800);
        wm.set("Black", 900)
        wm.set("Heavy", 900);
        return wm;
    }

    initPrototypeSlots () {
        this.newSlot("name", null)
        this.newSlot("options", null)
        this.newSlot("fontFace", null) // reference to browser FontFace object
        this.newSlot("weightMap", BMFont.fontWeightMap()) 
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

    fontFaceIsLoaded () {
        const face = this.fontFace();
        return face && face.status === "loaded";
    }

    optionsFromName () {
        const name = this.name();
        const options = {};
        this.weightMap().forEach((v, k) => {
            if (name.indexOf(k) !== -1) {
                options.weight = v;
            }
        });

        if (name.indexOf("Italic") !== -1) {
            options.style = "italic";
        }

        return options;
    }

    // loading 

    async didLoad () { // called when resource data loaded
        super.didLoad()
        await this.promiseLoadFontFromData()
        if (this.isDebugging()) {
            //this.debugLog(".didLoad('" + this.name() + "') '" + this.path() + "'")
            //debugger;
            //this.debugLog(".didLoad('" + this.name() + "')")
        }
        return this
    }

    async promiseLoadFontFromData () {
        let name = this.name();

        if (Object.keys(this.options()).length === 0) {
            this.setOptions(this.optionsFromName());
            name = name.split(" ").shift();
        }

        //console.log("BMFont load " + this.name() + " -> '" + name + "' options: ", this.options());

        const aFontFace = new FontFace(name, this.data(), this.options()); 
        this.setFontFace(aFontFace)

        try {
            const loadedFace = await aFontFace.load();
            // can probably do this in the background, 
            // but it's nice to know when it's complete
            // this.didLoad();
            assert(loadedFace === aFontFace);
            document.fonts.add(loadedFace);
            //console.log("added font to document: ", this.name());
        } catch (error) {
            this.onLoadError(error);
            throw error;
        }
    }

    onLoadError (error) {
        if (this.isDebugging()) {
            this.debugLog(".onLoadError() ", error)
        }
        return this
    }

}.initThisClass());
