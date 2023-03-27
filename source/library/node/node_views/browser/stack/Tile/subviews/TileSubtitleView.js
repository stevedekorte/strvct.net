"use strict";

/*
    
    TileSubtitleView
    
*/

(class TileSubtitleView extends TextField {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setMarginTop("3px")
        this.setMarginLeft("0px")
        this.setMarginBottom("3px")
        this.setFontSize("80%")
        this.setFontWeight("normal")
        this.setTextAlign("left")
        this.setOverflow("visible")
        this.setWordWrap("break-word")
        this.setWhiteSpace("pre")
        return this
    }

}.initThisClass());


