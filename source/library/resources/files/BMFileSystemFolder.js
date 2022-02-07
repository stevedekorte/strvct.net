"use strict";

/*

    BMFileSystemFolder

*/

(class BMFileSystemFolder extends BMNode {
    
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

        this.setTitle("BMFileSystemFolder")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        //this.watchOnceForNote("appDidInit")
        return this
    }


    
    setupSubnodes () {
        //this.resourcePaths().forEach(path => this.addFontWithPath(path))
        return this
    }


}.initThisClass());
