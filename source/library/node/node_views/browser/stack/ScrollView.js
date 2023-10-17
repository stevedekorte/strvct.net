"use strict";

/*

    ScrollView

*/

(class ScrollView extends DomView {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setTopPx(null)
        //this.makeVertical()
        this.setMsOverflowStyle("none") // removes scrollbars on IE 10+ 
        this.setOverflow("-moz-scrollbars-none") // removes scrollbars on Firefox 
        this.setBackgroundColor("transparent")
        //this.setBorder("1px solid purple")
        return this
    }

    scrollContentView () {
        return this.subviews().first()
    }

}.initThisClass());


