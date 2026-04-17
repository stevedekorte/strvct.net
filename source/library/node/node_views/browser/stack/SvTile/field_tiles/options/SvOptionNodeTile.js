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
        this.setAriaSelected(this.ariaIsSelected());

        return this;
    }

    syncToNode () {
        super.syncToNode();
        return this;
    }

    // --- ARIA accessibility getters ---

    /**
     * @description Returns the ARIA role for this option tile.
     * @returns {string} The ARIA role.
     * @category Accessibility
     */
    ariaRole () {
        return "option";
    }

    /**
     * @description Returns the ARIA selected state from the node's picked state.
     * @returns {boolean} The selected state.
     * @category Accessibility
     */
    ariaIsSelected () {
        const node = this.node();
        return (node && node.isPicked) ? node.isPicked() : false;
    }

}.initThisClass());
