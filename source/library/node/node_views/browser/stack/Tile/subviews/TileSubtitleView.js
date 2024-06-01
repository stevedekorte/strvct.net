"use strict";

/*
    
    TileSubtitleView
    
*/

(class TileSubtitleView extends TextField {
    
    initPrototypeSlots () {
    }

    initPrototype () {
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
        this.setOverflow("hidden")
        this.setMinWidth("2em")
        this.setWidth("100%")
        this.setWordWrap("break-word")
        this.setWhiteSpace("pre")
        return this
    }

}.initThisClass());


