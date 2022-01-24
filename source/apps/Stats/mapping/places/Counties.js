"use strict";

/*
    
    Counties


*/

w(class Counties extends BMNode {
    

    initPrototype () {
    }

    init () {
        super.init()
        this.setTitle("counties")
        this.setNoteIsSubnodeCount(true)
        //this.setSubnodeSortFunc( (a, b) => a.name().compare(b.name()) )
        return this
    }
    
}.initThisClass())
