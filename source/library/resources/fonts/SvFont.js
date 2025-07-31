"use strict";

/**
 * @module library.resources.fonts
 */

/**
 * @class SvFont
 * @extends SvResource
 * @classdesc A class for managing font resources. Managed by SvFontResources.
 * Supports the following file extensions: ttf, otf, woff, woff2.
 * 
 * When the font is loaded, it will infer the font family, weight, and style from the font name
 * and use these to compose the name and options arguments for the FontFace constructor.
 * e.g. Thin Italic will be 100 italic, Light Italic will be 300 italic, etc.
 * 
 */

(class SvFont extends SvResource {
    
    /**
     * @static
     * @description Returns an array of supported file extensions for fonts.
     * @returns {string[]} An array of supported file extensions.
     * @category File Operations
     */
    static supportedExtensions () {
        return ["ttf", "otf", "woff", "woff2"];
    }

    /**
     * @static
     * @description Returns a map of font weight names to their corresponding numeric values.
     * @returns {Map<string, number>} A map of font weight names to numeric values.
     * @category Font Properties
     */
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

    /**
     * @description Initializes the prototype slots for the SvFont class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {string} name - The name of the font.
             * @category Font Properties
             */
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
        }
        {
            /**
             * @member {Object} options - The options for the font.
             * @category Font Properties
             */
            const slot = this.newSlot("options", null);
            slot.setSlotType("Object");
        }
        {
            /**
             * @member {FontFace} fontFace - Reference to browser FontFace object.
             * @category Font Properties
             */
            const slot = this.newSlot("fontFace", null);
            slot.setSlotType("FontFace");
        }
        {
            /**
             * @member {Map} weightMap - Map of font weight names to numeric values.
             * @category Font Properties
             */
            const slot = this.newSlot("weightMap", SvFont.fontWeightMap());
            slot.setSlotType("Map");
        }
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
        this.setIsDebugging(false)
    }

    /**
     * @description Initializes the SvFont instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setOptions({})  // example options { style: 'normal', weight: 700 }  
    }

    /**
     * @description Returns the title of the font.
     * @returns {string} The title of the font.
     * @category Font Properties
     */
    title () {
        return this.name()
    }

    /**
     * @description Returns the name of the font.
     * @returns {string} The name of the font.
     * @category Font Properties
     */
    name () {
        if (this._name) {
            return this._name
        }

        return this.path().fileName()
    }

    /**
     * @description Checks if the font face is loaded.
     * @returns {boolean} True if the font face is loaded, false otherwise.
     * @category Font Loading
     */
    fontFaceIsLoaded () {
        const face = this.fontFace();
        return face && face.status === "loaded";
    }

    /**
     * @description Extracts font options from the font name.
     * @returns {Object} An object containing the extracted font options.
     * @category Font Properties
     */
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

    /**
     * @description Called when the resource data is loaded.
     * @async
     * @returns {Promise<void>}
     * @category Font Loading
     */
    async onDidLoad () {
        await super.onDidLoad();
        await this.asyncLoadFontFromData();
    }

    /**
     * @description Asynchronously loads the font from the data.
     * @async
     * @returns {Promise<SvFont>} A promise that resolves to the SvFont instance.
     * @category Font Loading
     */
    async asyncLoadFontFromData () {

        if (this.fontFace()) {
            return this;
        }

        let name = this.name();

        if (Object.keys(this.options()).length === 0) {
            this.setOptions(this.optionsFromName());
            name = name.split(" ").shift();
        }

        const face = new FontFace(name, this.data(), this.options()); 
        this.setFontFace(face);

        if (SvPlatform.isBrowserPlatform()) {
            try {
                const loadedFace = await face.load();
                assert(loadedFace === face);
                document.fonts.add(loadedFace);
                this.setData(null);
            } catch (error) {
                this.onLoadError(error);
                error.rethrow();
            }
        }
        return this;
    }

    /**
     * @description Handles load errors.
     * @param {Error} error - The error object.
     * @returns {SvFont} The SvFont instance.
     * @category Error Handling
     */
    onLoadError (error) {
        if (this.isDebugging()) {
            this.debugLog(".onLoadError() ", error)
        }
        return this
    }

    /**
     * @description Retrieves a font face attribute.
     * @param {string} name - The name of the attribute.
     * @returns {*} The value of the attribute.
     * @category Font Properties
     */
    fontFaceAttribute (name) {
        const face = this.fontFace();
        if (face) {
            return face[name];
        }
        return null;
    }

    /**
     * @description Returns the font family name.
     * @returns {string|null} The font family name.
     * @category Font Properties
     */
    fontFamilyName () {
        return this.fontFaceAttribute("family");
    }

    /**
     * @description Returns the font style.
     * @returns {string|null} The font style.
     * @category Font Properties
     */
    fontStyle () {
        return this.fontFaceAttribute("style");
    }

    /**
     * @description Returns the font weight.
     * @returns {number|null} The font weight.
     * @category Font Properties
     */
    fontWeight () {
        return this.fontFaceAttribute("weight");
    }

    /**
     * @description Returns the font stretch.
     * @returns {string|null} The font stretch.
     * @category Font Properties
     */
    fontStretch () {
        return this.fontFaceAttribute("stretch");
    }

}.initThisClass());