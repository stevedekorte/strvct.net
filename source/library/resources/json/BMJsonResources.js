"use strict";

/*

    BMJsonResources

*/

(class BMJsonResources extends BaseNode {
    
    static initClass () {
        this.setIsSingleton(true)
		return this
    }
    
    initPrototype () {
        this.newSlot("extensions", ["json"])
    }

    init () {
        super.init()
        this.setTitle("Json")
        this.setNoteIsSubnodeCount(true)
        //this.setSubnodeClasses([BMJsonResource])
        this.watchOnceForNote("appDidInit")
        return this
    }
    
    /*
    prepareForFirstAccess () {
         super.prepareForFirstAccess()
       this.setupSubnodes()
        return this
    }
    */

    resourcePaths () {
        return ResourceManager.shared().resourceFilePathsWithExtensions(this.extensions())
    }
    
    appDidInit () {
        this.setupSubnodes()
        return this
    }

    setupSubnodes () {
        this.resourcePaths().forEach(path => this.addResourceWithPath(path))
        return this
    }

    addResourceWithPath (aPath) {
        const resource = this.justAdd()
        resource.setPath(aPath)
        return this
    }

}.initThisClass());


