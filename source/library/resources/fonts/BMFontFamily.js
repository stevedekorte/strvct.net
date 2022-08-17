"use strict";

/*

    BMFontFamily


*/

(class BMFontFamily extends BaseNode {
    
    initPrototype () {
        this.newSlot("name", null)
        this.newSlot("fonts", null)
    }

    /*
    init () {
        super.init()
    }
    */

    title () {
        return this.name()
    }

    /*
    subtitle () {
        return "font family"
    }
    */

    addFontWithPath (aPath) {
        const font = BMFont.clone().setPath(aPath)
        font.load()
        this.addSubnode(font)
        return this
    }

}.initThisClass());
