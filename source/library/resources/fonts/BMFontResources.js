"use strict";

/*

    BMFontResources

    BMResources.shared().fonts().newFontOptions()

*/

(class BMFontResources extends BMResourceGroup {
    
    static initClass () {
        this.setIsSingleton(true)
		return this
    }
    
    initPrototypeSlots () {
        //this.newSlot("extensions", ["ttf", "woff", "woff2"])
    }

    init () {
        super.init()
        this.setTitle("Fonts")
        //this.setExtensions(["ttf", "woff", "woff2"])
        return this
    }

    setup () {
        super.setup();
        this.setResourceClasses([BMFont]);
        this.setSubnodeClasses([BMFontFamily]);
    }

    addResource (aResource) {
        //debugger
        const aPath = aResource.path()
        const components = aPath.split("/")

        const fontFileName = components.pop()
        //const fontsFolderName = components.pop()
        const familyName = components.pop()
        //assert(fontsFolderName === "fonts")

        /*
        // verify path is in expected format 
        if (components.first() === ".") {
            components.removeFirst()
        }

        const resources = components.removeFirst()
        assert(resources === "resources")

        const fonts = components.removeFirst()
        assert(fonts === "fonts")

        const familyName = components.removeFirst()
        */

        const family = this.fontFamilyNamed(familyName) 
        family.addFont(aResource)

        return this
    }

    // --- families ---

    addFamily (aFontFamily) {
        this.addSubnode(aFontFamily)
        return this
    }

    families () {
        return this.subnodes()
    }

    fontFamilyNamed (aName) {
        const family = this.families().detect(family => family.name() === aName);
        if (family) {
            return family;
        }

        const newFamily = BMFontFamily.clone().setName(aName)
        this.addFamily(newFamily)
        return newFamily
    }

    allFonts () {
        const fonts = []
        this.subnodes().forEach(fontFamily => {
            fontFamily.subnodes().forEach(font => fonts.push(font))
        })
        return fonts
    }

    allFontNames () {
        return this.allFonts().map(font => font.title())
    }

    newFontOptions () {
        const options = BMOptionsNode.clone()
        this.allFonts().forEach(font => {
            const name = font.title()
            const option = BMOptionNode.clone().setLabel(name).setValue(name)
            options.addSubnode(option)
        })
        return options
    }

    // --- font loading status ---

    hasLoadedAllFonts () {
        return this.unloadedFonts().length === 0;
    }

    loadedFonts () {
        return this.allFonts().select(font => font.fontFaceIsLoaded());
    }

    unloadedFonts () {
        return this.allFonts().select(font => !font.fontFaceIsLoaded());
    }

    hasLoadedFontWithName (name) {
        return this.loadedFonts().canDetect(font => font.name() === name);
    }

    hasLoadedAllFontsWithNames (names) {
        // not efficient to call alot - cache in a set if that becomes a use case
        return names.canDetect(name => !this.hasLoadedFontWithName(name)) === false; 
    }

}.initThisClass());
