"use strict"

/* 

    BrowserHeader

    View at top of BrowserView for title, subtitle, and path view

*/

window.BrowserHeader = class BrowserHeader extends DomView {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.turnOffUserSelect()
        this.setTransition("all 0.35s")
        this.setBackgroundColor("#222")
        this.setColor("white")
        this.setMinAndMaxHeight("3em")
        this.setWidth("100%")
        //this.setPadding("1em")
        this.setFontSize("1.6em")
        this.setFontWeight("bold")
        //this.setInnerHTML("Io")
        return this
    }
    
   
}.initThisClass()
