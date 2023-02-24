"use strict";

/*

    BMJsonResources

*/

(class BMJsonResources extends BMResourceGroup {
    
    static initClass () {
        this.setIsSingleton(true)
		return this
    }
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setTitle("Json")
        this.setNoteIsSubnodeCount(true)
        this.setSubnodeClasses([BMJsonResource])
        return this
    }

    /*
    resourcePaths () { //in BMResourceGroup
        return ResourceManager.shared().resourceFilePathsWithExtensions(this.extensions())
    }
    
    appDidInit () {  //in BMResourceGroup
        this.setupSubnodes()
        return this
    }

    setupSubnodes () {  //in BMResourceGroup
        this.resourcePaths().forEach(path => this.addResourceWithPath(path))
        return this
    }

    addResourceWithPath (aPath) {  //in BMResourceGroup
        const resource = this.justAdd()
        resource.setPath(aPath)
        return this
    }
    */

}.initThisClass());


