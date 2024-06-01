"use strict";

/*

    BMJsonResources

*/

(class BMJsonResources extends BMResourceGroup {
    
    static initClass () {
        this.setIsSingleton(true);
		return this;
    }
    
    initPrototypeSlots () {
    }

    initPrototype () {
        this.setTitle("Json");
        this.setNoteIsSubnodeCount(true);
        return this;
    }

    setup () {
        super.setup();
        this.setResourceClasses([BMJsonResource]);
        this.setSubnodeClasses([BMJsonResource]);
        return this;
    }

    /*
    resourceClassesForFileExtension (extension) {
        debugger;
        return super.resourceClassesForFileExtension(extension);
    }
    */

}.initThisClass());


