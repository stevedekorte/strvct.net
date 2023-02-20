"use strict";

/*

    BMFontResources

    BMResources.shared().fonts().newFontOptions()

*/

(class BMFontResources extends BaseNode {
    
    static initClass () {
        this.setIsSingleton(true)
		return this
    }
    
    initPrototypeSlots () {
        this.newSlot("extensions", ["ttf", "woff", "woff2"])
    }

    init () {
        super.init()
        this.setTitle("Fonts")
        this.setNoteIsSubnodeCount(true)
        this.registerForAppDidInit()
        return this
    }

    appDidInit () {
        //this.debugLog(".appDidInit()")
        this.setupSubnodes()
        return this
    }

    resourcePaths () {
        return ResourceManager.shared().resourceFilePathsWithExtensions(this.extensions())
    }

    setupSubnodes () {
        this.resourcePaths().forEach(path => this.addFontWithPath(path))
        return this
    }

    addFontWithPath (aPath) {
        const components = aPath.split("/")

        // verify path is in expected format 
        if (components.first() === ".") {
            components.removeFirst()
        }

        const resources = components.removeFirst()
        assert(resources === "resources")

        const fonts = components.removeFirst()
        assert(fonts === "fonts")

        const familyName = components.removeFirst()
        const family = this.fontFamilyNamed(familyName) 
        family.addFontWithPath(aPath)

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
        let family = this.families().detect(family => family.name() === aName);

        if (!family) {
            family = BMFontFamily.clone().setName(aName)
            this.addFamily(family)
        }

        return family
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


}.initThisClass());
