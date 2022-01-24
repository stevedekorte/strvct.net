"use strict";

/*

    BMImageResources

*/

(class BMImageResources extends BMNode {
    
    static initThisClass () {
        super.initThisClass()
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("extensions", ["png", "jpg", "jpeg", "gif", "tiff", "bmp"])
    }

    init () {
        super.init()
        this.setTitle("Images")
        this.setNodeMinWidth(270)
        this.setNoteIsSubnodeCount(true)
        //this.setSubnodeClasses([BMURLImage])
        return this
    }

    resourcePaths () {
        return ResourceLoader.resourceFilePathsWithExtensions(this.extensions())
    }
    
    appDidInit () {
        this.setupSubnodes()
        return this
    }

    setupSubnodes () {
        this.resourcePaths().forEach(path => this.addImageWithPath(path))
        return this
    }

    addImageWithPath (aPath) {
        const image = this.justAdd()
        image.setPath(aPath)
        return this
    }

}.initThisClass())
