/**
 * @module library.resources.fonts
 */

/**
 * @class SvFontTile
 * @extends SvTitledTile
 * @classdesc Represents a SvFontTile, which is a specialized SvTitledTile for displaying font information.
 */
(class SvFontTile extends SvTitledTile {

    /**
     * @description Initializes the prototype slots for the SvFontTile.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype of the SvFontTile.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Updates the subviews of the SvFontTile with font information from the associated node.
     * @returns {SvFontTile} Returns this SvFontTile instance.
     * @category UI Update
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
