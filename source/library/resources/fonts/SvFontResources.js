"use strict";

/**
 * @module library.resources.fonts
 */

/**
 * BMFontResources
 * 
 * @class
 * @extends BMResourceGroup
 * @classdesc Manages font resources. Can be accessed via BMResources.shared().fonts().newFontOptions()
 */
(class BMFontResources extends BMResourceGroup {
    
    /**
     * @static
     * @description Initializes the class
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        //this.newSlot("extensions", ["ttf", "woff", "woff2"]);
    }

    /**
     * @description Initializes the prototype
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Fonts");
    }

    /**
     * @description Initializes the instance
     * @returns {BMFontResources} The instance
     * @category Initialization
     */
    init () {
        super.init();
        //this.setExtensions(["ttf", "woff", "woff2"]);
        return this;
    }

    /**
     * @description Sets up the resource
     * @category Initialization
     */
    setup () {
        super.setup();
        this.setResourceClasses([BMFont]);
        this.setSubnodeClasses([BMFontFamily]);
    }

    /**
     * @description Adds a resource
     * @param {Object} aResource - The resource to add
     * @returns {BMFontResources} The instance
     * @category Resource Management
     */
    addResource (aResource) {
        const aPath = aResource.path();
        const components = aPath.split("/");

        const fontFileName = components.pop();
        const familyName = components.pop();

        const family = this.fontFamilyNamed(familyName);
        family.addFont(aResource);

        return this;
    }

    /**
     * @description Adds a font family
     * @param {BMFontFamily} aFontFamily - The font family to add
     * @returns {BMFontResources} The instance
     * @category Resource Management
     */
    addFamily (aFontFamily) {
        this.addSubnode(aFontFamily);
        return this;
    }

    /**
     * @description Gets all font families
     * @returns {Array} An array of font families
     * @category Resource Retrieval
     */
    families () {
        return this.subnodes();
    }

    /**
     * @description Gets a font family by name
     * @param {string} aName - The name of the font family
     * @returns {BMFontFamily} The font family
     * @category Resource Retrieval
     */
    fontFamilyNamed (aName) {
        const family = this.families().detect(family => family.name() === aName);
        if (family) {
            return family;
        }

        const newFamily = BMFontFamily.clone().setName(aName)
        this.addFamily(newFamily)
        return newFamily
    }

    /**
     * @description Gets all fonts
     * @returns {Array} An array of all fonts
     * @category Resource Retrieval
     */
    allFonts () {
        const fonts = [];
        this.subnodes().forEach(fontFamily => {
            fontFamily.subnodes().forEach(font => fonts.push(font));
        })
        return fonts;
    }

    /**
     * @description Gets all font names
     * @returns {Array} An array of all font names
     * @category Resource Retrieval
     */
    allFontNames () {
        return this.allFonts().map(font => font.title());
    }

    /**
     * @description Creates new font options
     * @returns {BMOptionsNode} The font options
     * @category Resource Management
     */
    newFontOptions () {
        const options = BMOptionsNode.clone();
        this.allFonts().forEach(font => {
            const name = font.title();
            const option = BMOptionNode.clone().setLabel(name).setValue(name);
            options.addSubnode(option);
        })
        return options;
    }

    /**
     * @description Checks if all fonts have been loaded
     * @returns {boolean} True if all fonts are loaded, false otherwise
     * @category Resource Status
     */
    hasLoadedAllFonts () {
        return this.unloadedFonts().length === 0;
    }

    /**
     * @description Gets all loaded fonts
     * @returns {Array} An array of loaded fonts
     * @category Resource Status
     */
    loadedFonts () {
        return this.allFonts().select(font => font.fontFaceIsLoaded());
    }

    /**
     * @description Gets all unloaded fonts
     * @returns {Array} An array of unloaded fonts
     * @category Resource Status
     */
    unloadedFonts () {
        return this.allFonts().select(font => !font.fontFaceIsLoaded());
    }

    /**
     * @description Checks if a font with a specific name has been loaded
     * @param {string} name - The name of the font
     * @returns {boolean} True if the font is loaded, false otherwise
     * @category Resource Status
     */
    hasLoadedFontWithName (name) {
        return this.loadedFonts().canDetect(font => font.name() === name);
    }

    /**
     * @description Checks if all fonts with specific names have been loaded
     * @param {Array} names - An array of font names
     * @returns {boolean} True if all specified fonts are loaded, false otherwise
     * @category Resource Status
     */
    hasLoadedAllFontsWithNames (names) {
        return names.canDetect(name => !this.hasLoadedFontWithName(name)) === false; 
    }

}.initThisClass());