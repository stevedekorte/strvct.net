"use strict";

/*

    BMFontFamily


*/

(class BMFontFamily extends BaseNode {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("fonts", null);
            slot.setSlotType("Array");
        }
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
