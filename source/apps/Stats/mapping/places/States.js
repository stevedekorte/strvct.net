"use strict"

/*
    
    States


*/

window.States = class States extends BMNode {

    initPrototype () {

    }

    init () {
		super.init()
		this.setTitle("states")
        this.setNoteIsSubnodeCount(true)
        return this
	} 

    
}.initThisClass()
