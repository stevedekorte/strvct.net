/**
 * @module library.resources.images
 */

/**
 * @class BMImageTile
 * @extends TitledTile
 * @classdesc Represents an image tile component.
 */
"use strict";

(class BMImageTile extends TitledTile {
    
    /**
     * @description Initializes the prototype slots for the BMImageTile class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype for the BMImageTile class.
     * @returns {void}
     * @category Initialization
     */
    initPrototype () {
    }
    
    /**
     * @description Updates the subviews of the BMImageTile.
     * @returns {BMImageTile} Returns the instance of BMImageTile.
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