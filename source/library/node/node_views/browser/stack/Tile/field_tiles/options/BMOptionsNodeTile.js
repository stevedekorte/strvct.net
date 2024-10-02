/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles.options
 * @class BMOptionsNodeTile
 * @extends TitledTile
 * @classdesc View for BMOptionsNode
 * 
 * BMOptionsNode -> BMOptionsNodeTile
 *     BMOption -> BMSingleOptionTile
 *     BMMultiOption -> BMMultiOptionTile
 */

"use strict";

(class BMOptionsNodeTile extends TitledTile {
    
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
     * @returns {BMOptionsNodeTile} Returns this instance for method chaining
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode()

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
        return this
    }
	
}.initThisClass());