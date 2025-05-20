/**
 * @module library.resources.images
 */

/**
 * @class SvImageTile
 * @extends TitledTile
 * @classdesc Represents an image tile component.
 */
"use strict";

(class SvImageTile extends TitledTile {
    
    /**
     * @description Initializes the prototype slots for the SvImageTile class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype slots for the SvImageTile class.
     * @returns {void}
     * @category Initialization
     */
    initPrototype () {
    }
    
    /**
     * @description Updates the subviews of the SvImageTile.
     * @returns {SvImageTile} Returns the instance of SvImageTile.
     * @category View Management
     */
    updateSubviews () {
        super.updateSubviews()
	
        const node = this.node()

        if (node) {
            const name = node.title()
            this.titleView() //.setFontFamily(name)
        }

        return this
    }

    
}.initThisClass());