/** * @module library.node.node_views.browser.stack
 */

/** * @class SvTileContainer
 * @extends SvNodeView
 * @classdesc SvTileContainer is a container for SvTile objects. It manages the layout and orientation of tiles based on its parent view.
 
 
 */

/**

 */
"use strict";

(class SvTileContainer extends SvNodeView {

    initPrototypeSlots () {
        /**
         * @member {SvTile} tile - The tile contained in this container
         * @category Data
         */
        {
            const slot = this.newSlot("tile", null);
            slot.setSlotType("SvTile");
        }
    }

    /**
     * @description Initializes the SvTileContainer with default styles and settings
     * @returns {SvTileContainer} The initialized SvTileContainer instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setFlexDirection("column");
        this.setFlexGrow(1);
        this.setOverflow("hidden");
        this.setUserSelect("none");
        this.setTransition("opacity 0.5s ease-in-out, flex-basis 0s");
        this.makeOrientationRight();
        this.setIsDisplayHidden(true);

        return this;
    }

    /**
     * @description Checks if the container's orientation is vertical
     * @returns {boolean|null} True if vertical, false if horizontal, null if no parent view
     * @category Layout
     */
    isVertical () {
        const sv = this.parentView();
        if (!sv) {
            return null;
        }
        return sv.isVertical();
    }

    /**
     * @description Synchronizes the container's orientation with its parent view
     * @returns {SvTileContainer} The current SvTileContainer instance
     * @category Layout
     */
    syncOrientation () {
        if (this.isVertical()) {
            this.makeOrientationRight();
        } else {
            this.makeOrientationDown();
        }
        return this;
    }

    /**
     * @description Sets the orientation to right (for vertical layout)
     * @category Layout
     */
    makeOrientationRight () {
        this.setWidth("-webkit-fill-available");
        this.setHeight("fit-content");
    }

    /**
     * @description Sets the orientation to down (for horizontal layout)
     * @category Layout
     */
    makeOrientationDown () {
        this.setWidth("fit-content");
        this.setHeight("-webkit-fill-available");
    }

    /**
     * @description Removes the current tile from the container
     * @returns {SvTileContainer} The current SvTileContainer instance
     * @category SvTile Management
     */
    removeTile () {
        const oldTile = this.tile();
        if (oldTile) {
            oldTile.setNode(null);
            this.removeSubview(oldTile);
        }
        return this;
    }

    /**
     * @description Sets the node for the container and updates the tile accordingly
     * @param {Object|null} aNode - The node to set
     * @returns {SvTileContainer} The current SvTileContainer instance
     * @category Node Management
     */
    setNode (aNode) {
        super.setNode(aNode);

        if (aNode === null) {
            this.removeTile();
            this.setIsDisplayHidden(true);
        } else {
            this.setIsDisplayHidden(false);
            const tile = this.tile();
            if (tile) {
                const tileClass = this.subviewProtoForSubnode(aNode);
                if (tile.thisClass() !== tileClass) {
                    this.setupTile();
                }
            } else {
                this.setupTile();
            }
        }
        return this;
    }

    /**
     * @description Sets up a new tile for the current node
     * @returns {SvTileContainer} The current SvTileContainer instance
     * @category SvTile Management
     */
    setupTile () {
        this.removeTile();
        const tileClass = this.node().nodeTileClass();
        assert(tileClass);
        const newTile = tileClass.clone();
        newTile.setNode(this.node());
        this.setTile(newTile);
        this.addSubview(newTile);
        return this;
    }

    /**
     * @description Synchronizes the container and its tile with the current node
     * @returns {SvTileContainer} The current SvTileContainer instance
     * @category Synchronization
     */
    syncFromNode () {
        this.syncOrientation();
        if (this.tile()) {
            this.tile().syncFromNode();
        }
        return this;
    }

}.initThisClass());
