/** * @module library.node.node_views.browser.stack.SvTilesView
 */

/** * @class SvTilesView_orientation
 * @extends SvTilesView
 * @classdesc SvTilesView_orientation extends SvTilesView to handle orientation-related functionality.


 */


"use strict";

(class SvTilesView_orientation extends SvTilesView {

    initPrototypeSlots_orientation () {
        {
            const slot = this.newSlot("appliedIsVertical", null); // the direction last stamped on the rows; null before it was known
            slot.setSlotType("Boolean");
            slot.setAllowsNullValue(true);
        }
    }

    // --- orientation ---

    /**
     * @description Synchronizes the orientation of the SvTilesView.
     * @returns {SvTilesView_orientation} The instance of SvTilesView_orientation.
     * @category Orientation
     */
    syncOrientation () {
        const isVertical = this.isVertical();
        if (isVertical === null) {
            // not in a stack yet: the direction isn't known, so stamp none —
            // "down" stamped here stuck when the column arrived by a path
            // selection (About's list ran sideways); the column re-syncs us
            // (SvNavView.syncOrientation)
            return this;
        }
        if (isVertical) {
            this.makeOrientationRight();
        } else {
            this.makeOrientationDown();
        }
        if (this.appliedIsVertical() !== isVertical) {
            // the direction became known, or changed: rows that synced
            // before (or under the other direction) follow. Not every sync:
            // a list syncs per node update, per streamed token in a chat.
            this.setAppliedIsVertical(isVertical);
            this.tiles().forEach(tile => tile.syncOrientation());
        }
        return this;
    }

    /**
     * @description Sets the orientation to right (vertical).
     * @category Orientation
     */
    makeOrientationRight () {
        // stack left to right columns, so top to bottom items
        this.setFlexDirection("column"); //  need to use flex to avoid gaps in rows despite 0 marins


        this.setMinWidth("100%");
        this.setWidth(null); // clear down's fit-content: a list once stamped down grew past its column
        this.setHeight("fit-content");
        this.setMinHeight("100%");
        this.setMaxHeight(null);

        this.logDebug("makeOrientationRight on ", this.node() ? this.node().title() : null);

        if (this.node()) {
            const align = this.node().nodeChildrenAlignment();
            if (this.validAlignItemsPropertyValues().has(align)) {
                this.setJustifyContent(align);
            } else {
                // is this an error?
            }
        }
    }

    /**
     * @description Sets the orientation to down (horizontal).
     * @category Orientation
     */
    makeOrientationDown () {
        // stackview is down, so items are left to right
        this.setFlexDirection("row");

        this.setMinWidth("100%");
        this.setWidth("fit-content");
        this.setHeight(null); // clear right's fit-content
        this.setMinAndMaxHeight("100%");

        this.logDebug("makeOrientationDown on ", this.node() ? this.node().title() : null);

        if (this.node()) {
            const align = this.node().nodeChildrenAlignment();
            if (this.validJustifyContentPropertyValues().has(align)) {
                this.setJustifyContent(align);
            }
            this.setAlignItems(null);
        }
    }

    // --- get orientation ---

    /**
     * @description Checks if the orientation is vertical.
     * @returns {boolean|null} True if vertical, false if horizontal, null if no stackView.
     * @category Orientation
     */
    isVertical () {
        if (this.isInlineNested()) {
            return true; // a section's rows run top to bottom
        }
        const sv = this.stackView();
        if (!sv) {
            return null;
        }
        return sv.direction() === "right";
    }

    // --- stacking general ---

    /**
     * @description Stacks the tiles based on the current orientation.
     * @returns {SvTilesView_orientation} The instance of SvTilesView_orientation.
     * @category Stacking
     */
    stackTiles () {
        if (this.isVertical()) {
            this.stackTilesVertically();
        } else {
            this.stackTilesHorizontally();
        }
        return this;
    }

    /**
     * @description Unstacks the tiles based on the current orientation.
     * @returns {SvTilesView_orientation} The instance of SvTilesView_orientation.
     * @category Stacking
     */
    unstackTiles () {
        if (this.isVertical()) {
            this.unstackTilesVertically();
        } else {
            this.unstackTilesHorizontally();
        }
        return this;
    }

    // --- stacking vertical ---

    /**
     * @description Stacks the tiles vertically.
     * @returns {SvTilesView_orientation} The instance of SvTilesView_orientation.
     * @category Stacking
     */
    stackTilesVertically () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("topPx");
        const displayedTiles = orderedTiles.filter(r => !r.isDisplayHidden());
        let y = 0;

        //const offsets = displayedTiles.map(tile => tile.offsetTop());

        displayedTiles.forEachKV((i, tile) => {
            let h = tile.computedHeight();

            if (tile.position() !== "absolute") {
                tile.makeAbsolutePositionAndSize();
                tile.setLeftPx(0);
                tile.setOrder(null);
            }

            tile.setTopPx(y);
            y += h + 2;
        });

        return this;
    }

    /**
     * @description Unstacks the tiles vertically.
     * @returns {SvTilesView_orientation} The instance of SvTilesView_orientation.
     * @category Stacking
     */
    unstackTilesVertically  () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("topPx");

        orderedTiles.forEach(tile => assert(tile.hasElement())); // todo: temp test
        orderedTiles.forEach(tile => tile.makeRelativePositionAndSize());

        this.removeAllSubviews();
        this.addSubviews(orderedTiles);
        return this;
    }

    // --- stacking horizontal ---

    /**
     * @description Stacks the tiles horizontally.
     * @returns {SvTilesView_orientation} The instance of SvTilesView_orientation.
     * @category Stacking
     */
    stackTilesHorizontally () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("leftPx");
        const displayedTiles = orderedTiles.filter(r => !r.isDisplayHidden());
        let x = 0;

        displayedTiles.forEach((tile) => {
            let w = tile.computedWidth();
            if (tile.position() !== "absolute") {
                tile.makeAbsolutePositionAndSize();
                tile.setTopPx(0);
                tile.setOrder(null);
            }
            tile.setLeftPx(x);
            x += w;
        });

        return this;
    }

    /**
     * @description Unstacks the tiles horizontally.
     * @returns {SvTilesView_orientation} The instance of SvTilesView_orientation.
     * @category Stacking
     */
    unstackTilesHorizontally () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("leftPx");
        orderedTiles.forEachPerform("makeRelativePositionAndSize");
        this.removeAllSubviews();
        this.addSubviews(orderedTiles);
        return this;
    }


}.initThisCategory());
