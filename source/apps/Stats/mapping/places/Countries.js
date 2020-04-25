"use strict"

/*
    
    Countries


*/

window.Countries = class Countries extends BMNode {
    

    initPrototype () {
    }

    init () {
        super.init()
        this.setTitle("Countries")
        this.setNoteIsSubnodeCount(true)
        //this.setupSubnodes()
        return this
    } 

    
}.initThisClass()
