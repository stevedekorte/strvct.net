/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/** * @class SvPointerFieldTile
 * @extends SvTitledTile
 * @classdesc Represents a pointer field tile in the browser stack.
 
 
 */

(class SvPointerFieldTile extends SvTitledTile {

    /**
     * @description Initializes the prototype slots for the SvPointerFieldTile class.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Updates the subviews of the SvPointerFieldTile.
     * @returns {SvPointerFieldTile} The instance after updating subviews.
     * @category UI Update
     */
    updateSubviews () {
        super.updateSubviews();

        if (this.shouldShowNavArrow()) {
            this.makeNoteRightArrow();
        } else {
            this.hideNoteRightArrow();
        }

        if (this.isSelected()) {
            this.noteView().setOpacity(1);
        } else {
            this.noteView().setOpacity(0.4);
        }

        this.applyStyles();

        return this;
    }

    shouldShowNavArrow () {
        const node = this.node();
        if (!node || !node.nodeTileLink) {
            return false;
        }
        const linked = node.nodeTileLink();
        if (!linked) {
            return false;
        }
        if (linked.nodeCanNavInto && !linked.nodeCanNavInto()) {
            return false;
        }
        return true;
    }

}.initThisClass());
