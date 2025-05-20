/**
 * @module library.resources.images
 */

/**
 * @class SvImageResources
 * @extends SvResourceGroup
 * @classdesc Represents a group of image resources.
 */
(class SvImageResources extends SvResourceGroup {
    
    /**
     * @description Initializes the SvImageResources instance.
     * @returns {SvImageResources} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setTitle("Images");
        this.setSubnodeClasses([SvURLImage]);
        return this
    }

    /**
     * @description Sets up the SvImageResources instance.
     * @returns {SvImageResources} The set up instance.
     * @category Initialization
     */
    setup () {
        super.setup();
        this.setResourceClasses([SvURLImage]);
        this.setSubnodeClasses([SvURLImage]);
        return this;
    }

}.initThisClass());