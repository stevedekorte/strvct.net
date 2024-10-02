/**
 * @module library.resources.images
 */

/**
 * @class BMImageResources
 * @extends BMResourceGroup
 * @classdesc Represents a group of image resources.
 */
(class BMImageResources extends BMResourceGroup {
    
    /**
     * @description Initializes the BMImageResources instance.
     * @returns {BMImageResources} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setTitle("Images");
        this.setSubnodeClasses([BMURLImage]);
        return this
    }

    /**
     * @description Sets up the BMImageResources instance.
     * @returns {BMImageResources} The set up instance.
     * @category Initialization
     */
    setup () {
        super.setup();
        this.setResourceClasses([BMURLImage]);
        this.setSubnodeClasses([BMURLImage]);
        return this;
    }

}.initThisClass());