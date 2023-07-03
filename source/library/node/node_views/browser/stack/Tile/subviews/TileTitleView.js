"use strict";

/*
    TileTitleView

    A title element in a Tile. 

    Reasons not to just use setElementClassName() on a TextField instead:
    - to automatically get the full class hierarchy in the div name
    - a place to (potentially) override interaction behaviors

*/

(class TileTitleView extends TextField {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setMarginTop("0em")
        this.setMarginLeft("0em")
        this.setMinWidth("20px")
        this.setWidth("100%")
        this.setPaddingTop("2px")
        this.setPaddingBottom("2px")
        this.setTextAlign("left")
        this.setWhiteSpace("nowrap")
        this.setOverflow("hidden")
        this.setWordWrap("normal")
        return this
    }

    /*
    tile () {
        return this.parentView().parentView()
    }
    */

    selectNextKeyView () {
        /*
        this.debugLog(".selectNextKeyView()")
        const tile = this.parentView().parentView();
        const nextTile = this.row().column().selectNextTile()
        */
        return true
    }
    
}.initThisClass());
