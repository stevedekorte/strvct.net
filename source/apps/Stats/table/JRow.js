"use strict";

/*

    JRow

*/

window.JRow = class JRow extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
		return this
    }
    
    initPrototype () {
        this.newSlot("cells", null)
    }

    init () {
        super.init()
        this.setTitle("Row")
        this.setNodeMinWidth(100)
        this.setNoteIsSubnodeCount(false)

        return this
    }


    setupSubnodes () {
        return this
    }

}.initThisClass()


