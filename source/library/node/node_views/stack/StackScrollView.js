"use strict";

/*

    StackScrollView

*/

(class StackScrollView extends DomView {
    
    initPrototype () {
    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setTopPx(null)
        this.makeVertical()
        this.setMsOverflowStyle("none") // removes scrollbars on IE 10+ 
        this.setOverflow("-moz-scrollbars-none") // removes scrollbars on Firefox 
        this.setBackgroundColor("transparent")
        //this.setBorder("1px solid purple")
        return this
    }

    setIsVertical (aBool) {
        if (aBool) {
            this.makeVertical()
        } else {
            this.makeHorizontal()
        }
        return this
    }

    makeVertical () {
        //this.setWidth("fit-content")
        this.setWidth("100%")
        this.setHeight("100%")
        this.setOverflowY("scroll") // has to be scroll, not auto, for touch scroll momentum to work 
        this.setOverflowX("hidden")
        return this
    }

    makeHorizontal () {
        this.setWidth("100%")
        this.setHeight("100%")
        //this.setHeight("fit-content")
        this.setOverflowY("hidden") 
        this.setOverflowX("scroll") // has to be scroll, not auto, for touch scroll momentum to work 
        return this
    }
    
}.initThisClass())


