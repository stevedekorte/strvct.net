"use strict"

/*
    BrowserRowTitle

    A title element in a BrowserRow. 

    Reasons not to just use setDivClassName() on a TextField instead:
    - to automatically get the full class hierarchy in the div name
    - a place to (potentially) override interaction behaviors

*/

window.BrowserRowTitle = class BrowserRowTitle extends TextField {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setMarginTop("0px")
        this.setMarginLeft("0px")
        this.setMinWidth("20px")
        this.setPaddingTop("2px")
        this.setPaddingBottom("2px")
        this.setTextAlign("left")
        this.setWhiteSpace("nowrap")
        this.setOverflow("hidden")
        this.setWordWrap("normal")
        return this
    }

    /*
    row () {
        return this.parentView().parentView()
    }
    */

    selectNextKeyView () {
        /*
        this.debugLog(".selectNextKeyView()")
        const row = this.parentView().parentView();
        const nextRow = this.row().column().selectNextRow()
        */
        return true
    }
    
}.initThisClass()
