/**
 * @module library.node.node_views.browser.stack.TilesView
 * @class TilesView_styling
 * @extends TilesView
 * @classdesc TilesView_styling class for handling styling of tiles view.
 */

"use strict";

(class TilesView_styling extends TilesView {
    
    /**
     * Applies styles to the tiles view.
     * @description This method applies styles to the tiles view and its components.
     * @returns {TilesView_styling} Returns the instance of TilesView_styling.
     */
    applyStyles () {
        //this.debugLog(".applyStyles()")
        super.applyStyles()
        return this
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