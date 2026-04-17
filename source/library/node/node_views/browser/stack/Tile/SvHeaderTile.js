"use strict";

/** * @module browser.stack.SvTile
 */

/** * @class SvHeaderTile
 * @extends SvTitledTile
 * @classdesc SvHeaderTile is a specialized SvTitledTile that is selectable and has a specific theme class.
 
 
 */

/**

 */

(class SvHeaderTile extends SvTitledTile {

    /**
     * @description Initializes prototype slots for the SvHeaderTile class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SvHeaderTile instance.
     * @returns {SvHeaderTile} The initialized SvHeaderTile instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsSelectable(true);
        this.setThemeClassName("SvHeaderTile");
        return this;
    }

    /**
     * @description Configures the tile for a downward orientation.
     * @returns {SvHeaderTile} The SvHeaderTile instance with downward orientation.
     * @category Configuration
     */
    makeOrientationDown () {
        super.makeOrientationDown();
        this.setMinAndMaxWidth(null);
        this.setWidth("100%");
        return this;
    }

    /**
     * @description Applies styles to the SvHeaderTile.
     * @returns {SvHeaderTile} The SvHeaderTile instance with applied styles.
     * @category Styling
     */
    applyStyles () {
        super.applyStyles();
        return this;
    }

}.initThisClass());
