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

}.initThisClass());


