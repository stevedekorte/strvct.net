"use strict";

/*

    BMFont

    Managed by BMFontResources.

*/

(class BMFont extends BMResource {
    
    static supportedExtensions () {
        return ["ttf", "woff", "woff2"];
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

    async onDidLoad () { // called when resource data loaded
        await super.onDidLoad();
        await this.asyncLoadFontFromData();
        //this.debugLog(".didLoad('" + this.name() + "') '" + this.path() + "'");
    }

    async asyncLoadFontFromData () {
        if (this.fontFace()) {
            return this;
        }

        //console.log("BMFont.asyncLoadFontFromData() " + this.name())
        let name = this.name();

        if (Object.keys(this.options()).length === 0) {
            this.setOptions(this.optionsFromName());
            name = name.split(" ").shift();
        }

        //console.log("BMFont load " + this.name() + " -> '" + name + "' options: ", this.options());

        const face = new FontFace(name, this.data(), this.options()); 
        this.setFontFace(face);

        try {
            const loadedFace = await face.load();
            assert(loadedFace === face);
            document.fonts.add(loadedFace);
            // it's safe to remove the data now
            this.setData(null);
            //console.log("added font to document: ", this.name());
        } catch (error) {
            this.onLoadError(error);
            error.rethrow();
        }
        return this;
    }

    onLoadError (error) {
        if (this.isDebugging()) {
            this.debugLog(".onLoadError() ", error)
        }
        return this
    }

    /*
    cssVariableDict () {
        const face = this.fontFace();
        return {
            "font-family": face.family,
            "font-style": face.style, 
            "font-weight": face.weight, 
            "font-stretch": face.stretch, 
        }
    }
    */

    // fontFace attributes accessors

    fontFaceAttribute (name) {
        const face = this.fontFace();
        if (face) {
            return face[name];
        }
        return null;
    }

    fontFamilyName () {
        return this.fontFaceAttribute("family");
    }

    fontStyle () {
        return this.fontFaceAttribute("style");
    }

    fontWeight () {
        return this.fontFaceAttribute("weight");
    }

    fontStretch () {
        return this.fontFaceAttribute("stretch");
    }

}.initThisClass());
