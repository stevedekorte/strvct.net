"use strict";

/*

    BMFontFamily


*/

(class BMFontFamily extends BaseNode {
    
    initPrototypeSlots () {
        this.newSlot("name", null);
        this.newSlot("fonts", null);
    }

    initPrototype () {
    }

    title () {
        return this.name()
    }

    /*
    subtitle () {
        return "font family"
    }
    */

    addFont (aFont) {
        //debugger
        this.addSubnode(aFont)
        return this
    }

    /*
    addFontWithResource (aResource) {
        const font = BMFont.clone().setResource(aResource)
        font.load()
        this.addSubnode(font)
        return this
    }
    */

}.initThisClass());
