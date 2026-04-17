/** * @module library.node.node_views.browser.stack.SvTilesView
 */

/** * @class SvTilesView_styling
 * @extends SvTilesView
 * @classdesc SvTilesView_styling class for handling styling of tiles view.
 
 
 */

/**

 */

"use strict";

(class SvTilesView_styling extends SvTilesView {

    /**
     * Applies styles to the tiles view.
     * @description This method applies styles to the tiles view and its components.
     * @returns {SvTilesView_styling} Returns the instance of SvTilesView_styling.
     * @category Styling
     */
    applyStyles () {
        //this.logDebug(".applyStyles()")
        super.applyStyles();
        return this;
    }

    /*
    darkenUnselectedTiles () {
        const darkenOpacity = 0.5
        this.tiles().forEach(tile => {
            if (tile.isSelected()) {
                tile.setOpacity(1)
            } else {
                tile.setOpacity(darkenOpacity)
            }
        })
        return this
    }

    undarkenAllTiles () {
        this.tiles().forEach((tile) => {
            tile.setOpacity(1)
        })
    }
    */

}.initThisCategory());
