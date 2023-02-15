"use strict";

/*

    BMStringFieldTile

*/

(class BMStringFieldTile extends BMFieldTile {
    
    /*
    initPrototypeSlots () {
    }

    init () {
        super.init()
        return this
    }
    */

    createValueView () {
        const v = TextField.clone()
        v.setDisplay("block")
        v.setPosition("relative")
        v.setWordWrap("normal")
        v.setHeight("auto")
        v.setWidth("-webkit-fill-available")
        v.setTextAlign("left")
        v.setMargin("0em")
        v.setOverflowX("hidden")
        v.setBorderRadius("0.2em")
        return v
    }
    
}.initThisClass());
