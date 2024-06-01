"use strict";

/*
    
    TileNoteView
    
*/

(class TileNoteView extends TextField {

    initPrototypeSlots () {
    }

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
    
    setBackgroundColor (s) {
        super.setBackgroundColor("tranparent")
        return this
    }

    setTransition (s) {
        //debugger;
        return super.setTransition(s)
    }

}.initThisClass());
