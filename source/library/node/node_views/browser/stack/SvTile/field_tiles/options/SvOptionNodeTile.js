/** * @module library.node.node_views.browser.stack.SvTile.field_tiles.options
 */

/** * @class SvOptionNodeTile
 * @extends SvTitledTile
 * @classdesc SvOptionNodeTile represents an option node tile in the browser stack.
 
 
 */

/**

 */
"use strict";

(class SvOptionNodeTile extends SvTitledTile {

    /**
     * @description Toggles the option state if editable
     * @returns {SvOptionNodeTile} Returns this instance
     * @category User Interaction
     */
    toggle () {
        const canToggle = this.node().optionsNode().valueIsEditable();
        if (canToggle) {
            this.node().toggle();
        }
        return this;
    }

    /**
     * @description Handles the enter key up event
     * @param {Event} event - The key up event
     * @returns {SvOptionNodeTile} Returns this instance
     * @category Event Handling
     */
    onEnterKeyUp (event) {
        super.onEnterKeyUp(event);
        this.toggle();
        event.stopPropagation();
        return this;
    }

    /**
     * @description Handles the tap complete gesture
     * @param {Object} aGesture - The tap gesture object
     * @returns {SvOptionNodeTile} Returns this instance
     * @category Event Handling
     */
    onTapComplete (aGesture) {
        super.onTapComplete(aGesture);
        this.toggle();
        return this;
    }

    /**
     * @description Synchronizes the tile with its node
     * @returns {SvOptionNodeTile} Returns this instance
     * @category Data Synchronization
     */
    syncFromNode () {
        super.syncFromNode();

        // Accessibility: individual option with picked/selected state
        this.setAttribute("role", "option");
        const isPicked = this.node().isPicked ? this.node().isPicked() : false;
        this.setAttribute("aria-selected", isPicked ? "true" : "false");

        return this;
    }

    syncToNode () {
        super.syncToNode();
        return this;
    }

}.initThisClass());
