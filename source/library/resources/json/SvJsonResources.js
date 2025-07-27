/**
 * @module library.resources.json
 */

/**
 * @class SvJsonResources
 * @extends SvResourceGroup
 * @classdesc SvJsonResources class for managing JSON resources.
 */
(class SvJsonResources extends SvResourceGroup {
    
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
     * @returns {SvJsonResources} The instance of SvJsonResources.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Json");
        this.setNoteIsSubnodeCount(true);
        return this;
    }

    finalInit () {
        super.finalInit();
        this.setTitle("Json");
        return this;
    }

    /**
     * @description Sets up the resource classes and subnode classes.
     * @returns {SvJsonResources} The instance of SvJsonResources.
     * @category Setup
     */
    setup () {
        super.setup();
        this.setResourceClasses([SvJsonResource]);
        this.setSubnodeClasses([SvJsonResource]);
        return this;
    }

    /*
    resourceClassesForFileExtension (extension) {
        debugger;
        return super.resourceClassesForFileExtension(extension);
    }
    */

    async prechacheWhereAppropriate () {
        console.warn( this.type() + " doesn't implement prechacheWhereAppropriate");
        await super.prechacheWhereAppropriate();
    }

}.initThisClass());