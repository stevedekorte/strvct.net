/**
 * @module browser.stack.Tile
 * @class Tile_styling
 * @extends Tile
 * @classdesc Tile_styling class for handling styling of Tile objects.
 */
"use strict";

(class Tile_styling extends Tile {

    /**
     * Updates the parent view and applies styles.
     * @param {*} oldValue - The old parent view value.
     * @param {*} newValue - The new parent view value.
     * @returns {Tile_styling} The current instance.
     * @category View Management
     */
    didUpdateSlotParentView (oldValue, newValue) {
        super.didUpdateSlotParentView(oldValue, newValue);
        //this.scheduleMethod("applyStyles")
        this.applyStyles();
        return this;
    }

    // --- css pass-through to contentView ---

    /**
     * Sets the background color of the content view.
     * @param {string} s - The background color value.
     * @returns {Tile_styling} The current instance.
     * @category Styling
     */
    setBackgroundColor (s) {
        this.contentView().setBackgroundColor(s);
        return this;
    }

    /**
     * Sets the color of the content view.
     * @param {string} s - The color value.
     * @returns {Tile_styling} The current instance.
     * @category Styling
     */
    setColor (s) {
        this.contentView().setColor(s);
        return this;
    }

    /**
     * Sets the opacity of the content view.
     * @param {number} v - The opacity value.
     * @returns {Tile_styling} The current instance.
     * @category Styling
     */
    setOpacity (v) {
        this.contentView().setOpacity(v);
        return this;
    }

    // --- styles ---

}.initThisCategory());
