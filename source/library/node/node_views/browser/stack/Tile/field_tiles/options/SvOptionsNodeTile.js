/** * @module library.node.node_views.browser.stack.SvTile.field_tiles.options
 */

/** * @class SvOptionsNodeTile
 * @extends SvTitledTile
 * @classdesc View for SvOptionsNode
 *
 * SvOptionsNode -> SvOptionsNodeTile
 *     SvOption -> SvSingleOptionTile
 *     SvMultiOption -> SvMultiOptionTile
 
 
 */

/**

 */

"use strict";

(class SvOptionsNodeTile extends SvTitledTile {

    /*
    initPrototypeSlots () {
    }

    initPrototype () {
    }

    init () {
        super.init()
        return this
    }
    */

    /**
     * @description Synchronizes the tile with its associated node
     * @returns {SvOptionsNodeTile} Returns this instance for method chaining
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode();

        /*
            We need a way of enabling/dissabling the options
            depending on whether the node value is editable.
            We still want the subnodes to be visible,
            we just don't want to allow the selection to chage.
        */

        /*
        if (this.node().valueIsEditable()) {
        } else {
        }
        */
        return this;
    }

}.initThisClass());
