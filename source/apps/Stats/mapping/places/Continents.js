"use strict"

/*
    
    Continents


*/

window.Continents = class Continents extends BMNode {
    

    initPrototype () {

    }

    init () {
        super.init()
        this.setTitle("Continents")
        this.setNoteIsSubnodeCount(true)
        this.setupSubnodes()
        return this
    }

	
    
}.initThisClass()
