/**
 * @module library.node.node_views.browser.stack.Tile.field_tiles.options
 * @class BMOptionNodeTile
 * @extends TitledTile
 * @classdesc BMOptionNodeTile represents an option node tile in the browser stack.
 */
"use strict";

(class BMOptionNodeTile extends TitledTile {
    
    /**
     * @description Toggles the option state if editable
     * @returns {BMOptionNodeTile} Returns this instance
     * @category User Interaction
     */
    toggle () {
        const canToggle = this.node().optionsNode().valueIsEditable();
        if (canToggle) {
            this.node().toggle()
        }
        return this
    }

    /**
     * @description Handles the enter key up event
     * @param {Event} event - The key up event
     * @returns {BMOptionNodeTile} Returns this instance
     * @category Event Handling
     */
    onEnterKeyUp (event) {
        super.onEnterKeyUp(event)
        this.toggle()
        event.stopPropagation()
        return this
    }
    
    /**
     * @description Handles the tap complete gesture
     * @param {Object} aGesture - The tap gesture object
     * @returns {BMOptionNodeTile} Returns this instance
     * @category Event Handling
     */
    onTapComplete (aGesture) {
        super.onTapComplete(aGesture)
        this.toggle()
        return this
    }

    /**
     * @description Synchronizes the tile with its node
     * @returns {BMOptionNodeTile} Returns this instance
     * @category Data Synchronization
     */
    syncToNode () {
        super.syncToNode()
        
        return this
    }

}.initThisClass());