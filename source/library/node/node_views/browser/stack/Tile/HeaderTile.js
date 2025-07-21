"use strict";

/**
 * @module browser.stack.Tile
 * @class HeaderTile
 * @extends TitledTile
 * @classdesc HeaderTile is a specialized TitledTile that is selectable and has a specific theme class.
 */
(class HeaderTile extends TitledTile {
    
    /**
     * @description Initializes prototype slots for the HeaderTile class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the HeaderTile instance.
     * @returns {HeaderTile} The initialized HeaderTile instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsSelectable(true);
        this.setThemeClassName("HeaderTile");
        return this;
    }

    /**
     * @description Configures the tile for a downward orientation.
     * @returns {HeaderTile} The HeaderTile instance with downward orientation.
     * @category Configuration
     */
    makeOrientationDown () {
        super.makeOrientationDown();
        this.setMinAndMaxWidth(null);
        this.setWidth("100%");
        return this;
    }

    /**
     * @description Applies styles to the HeaderTile.
     * @returns {HeaderTile} The HeaderTile instance with applied styles.
     * @category Styling
     */
    applyStyles () {
        super.applyStyles()
        return this
    }

}.initThisClass());