/**
 * @module library.resources.fonts
 */

/**
 * @class BMFontTile
 * @extends TitledTile
 * @classdesc Represents a BMFontTile, which is a specialized TitledTile for displaying font information.
 */
(class BMFontTile extends TitledTile {
    
    /**
     * @description Initializes prototype slots for the BMFontTile.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the BMFontTile.
     */
    initPrototype () {
    }
    
    /**
     * @description Updates the subviews of the BMFontTile with font information from the associated node.
     * @returns {BMFontTile} Returns this BMFontTile instance.
     */
    updateSubviews () {
        super.updateSubviews();
	
        const node = this.node();

        if (node) {
            this.titleView().setFontFamily(node.fontFamilyName());
            this.titleView().setFontStyle(node.fontStyle());
            this.titleView().setFontWeight(node.fontWeight());
            this.titleView().setFontStretch(node.fontStretch());
        }

        return this;
    }
    
}.initThisClass());