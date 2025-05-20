/**
 * @module library.resources.json
 */

/**
 * @class SvJsonResources
 * @extends SvResourceGroup
 * @classdesc BMJsonResources class for managing JSON resources.
 */
(class SvJsonResources extends BMResourceGroup {
    
    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype with default values.
     * @returns {SvJsonResources} The instance of BMJsonResources.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Json");
        this.setNoteIsSubnodeCount(true);
        return this;
    }

    /**
     * @description Sets up the resource classes and subnode classes.
     * @returns {SvJsonResources} The instance of BMJsonResources.
     * @category Setup
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