"use strict";

/*

    JCell

*/

window.JCell = class JCell extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
		return this
    }
    
    initPrototype () {
        this.newSlot("json", null)
    }

    init () {
        super.init()
        this.setTitle("Cell")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(false)

        return this
    }



}.initThisClass()


