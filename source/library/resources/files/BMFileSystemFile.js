"use strict";

/*

    BMFileResources

*/

(class BMFile extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("path", ".")
    }

    init () {
        super.init()

        this.setTitle("File")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        return this
    }

    appDidInit () {
        //this.debugLog(".appDidInit()")
        //this.setupSubnodes()
        return this
    }
    
    setupSubnodes () {
        //this.resourcePaths().forEach(path => this.addFontWithPath(path))
        return this
    }


}.initThisClass());
