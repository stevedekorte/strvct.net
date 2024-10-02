/**
 * @module browser.stack.Tile
 * @class Tile_keyboard
 * @extends Tile
 * @classdesc Handles keyboard interactions for Tile objects.
 */
(class Tile_keyboard extends Tile {
    
    // --- keyboard controls ---

    /**
     * @description Handles the Enter key up event.
     * @returns {boolean} Returns false to stop propagation.
     * @category Keyboard Interaction
     */
    onEnterKeyUp () {
        //this.debugLog(this.type() + " for " + this.node().title() + " onEnterKeyUp")
        this.justTap()
        return false // stop propagation
    }

    /**
     * @description Handles the Shift+Backspace key up event.
     * @param {Event} event - The keyboard event.
     * @returns {boolean} Returns false to stop propagation.
     * @category Keyboard Interaction
     */
    onShiftBackspaceKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onBackspaceKeyUp")
        this.delete()
        return false // stop propagation
    }

    // --- dragging key ---

    /**
     * @description Handles the Meta+A key down event.
     * @param {Event} event - The keyboard event.
     * @returns {boolean} Returns false.
     * @category Keyboard Interaction
     */
    onMeta_a_KeyDown (event) {
        // only select subnodes if this tile can have them,
        // otherwise, like the column handle this event
        const c = this.column().nextColumn()
        if (c) {
            c.selectAllTiles()
        }
        event.stopPropagation()
        return false 
    }

    /**
     * @description Handles the D key down event.
     * @param {Event} event - The keyboard event.
     * @returns {boolean} Returns true.
     * @category Keyboard Interaction
     */
    on_d_KeyDown (event) {
        this.debugLog(" on_d_KeyDown ", event._id)
        this.setIsRegisteredForBrowserDrag(true)
        return true
    }

    /**
     * @description Handles the D key up event.
     * @param {Event} event - The keyboard event.
     * @returns {boolean} Returns true.
     * @category Keyboard Interaction
     */
    on_d_KeyUp (event) {
        this.debugLog(" on_d_KeyUp ", event._id)
        this.setIsRegisteredForBrowserDrag(false)
        return true
    }

    /*
    onEscapeKeyDown (event) {
        console.log(" onEscapeKeyDown ", event._id)
        this.column().onLeftArrowKeyUp()
        return true
    }
    */

}.initThisCategory());