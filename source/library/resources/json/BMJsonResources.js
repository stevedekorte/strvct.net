/**
 * @module library.resources.json
 */

/**
 * @class BMJsonResources
 * @extends BMResourceGroup
 * @classdesc BMJsonResources class for managing JSON resources.
 */
(class BMJsonResources extends BMResourceGroup {
    
    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes the prototype slots.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default values.
     * @returns {BMJsonResources} The instance of BMJsonResources.
     */
    initPrototype () {
        this.setTitle("Json");
        this.setNoteIsSubnodeCount(true);
        return this;
    }

    /**
     * @description Sets up the resource classes and subnode classes.
     * @returns {BMJsonResources} The instance of BMJsonResources.
     */
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