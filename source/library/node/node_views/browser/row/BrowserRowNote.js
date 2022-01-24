"use strict";

/*
    
    BrowserRowNote
    
*/

(class BrowserRowNote extends TextField {

    initPrototype () {
    }

    init () {
        super.init()
        this.setFontSize("80%")
        this.setFontWeight("normal")
        this.setWhiteSpace("nowrap")
        this.setTextAlign("right")
        this.setTextOverflow("ellipsis")
        return this
    } 
    
}.initThisClass())
