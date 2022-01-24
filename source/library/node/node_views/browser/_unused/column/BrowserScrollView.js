"use strict";

/*

    BrowserScrollView

*/

(class BrowserScrollView extends NodeView {
    
    initPrototype () {
    }

    init () {
        super.init()

        //this.setDivClassName("BrowserScrollView")
        this.setDisplay("block")
        this.setPosition("relative")
        this.setWidth("100%")
        this.setBackgroundColor("transparent")
        this.setOverflowY("scroll") // has to be scroll, not auto, for touch scroll momentum to work 
        this.setOverflowX("hidden")
        this.setMsOverflowStyle("none") // removes scrollbars on IE 10+ 
        this.setOverflow("-moz-scrollbars-none") // removes scrollbars on Firefox 
        
        this.setHeight("100%")
        this.setTopPx(null)

        return this
    }
    
    
}.initThisClass())


