/**
 * @module library.node.node_views.browser.stack.Tile
 */

"use strict";

/**
 * @class Tile_gestures
 * @extends Tile
 * @classdesc Extends Tile with gesture handling functionality.
 */
(class Tile_gestures extends Tile {
    
    // --- tap gesture -------- 

    /**
     * @description Determines if the tile accepts tap begin gesture.
     * @param {Object} aGesture - The gesture object.
     * @returns {boolean} Always returns true.
     * @category Gesture
     */
    acceptsTapBegin (aGesture) {
        return true;
    }

    /**
     * @description Handles the completion of a tap gesture.
     * @param {Object} aGesture - The gesture object.
     * @returns {Tile_gestures} The instance of the class.
     * @category Gesture
     */
    onTapComplete (aGesture) {
        this.setLastTapDate(new Date())
        const keyModifiers = SvKeyboard.shared().modifierNamesForEvent(aGesture.upEvent());

        const methodName = "just" + keyModifiers.join("") + "Tap";
        if (this[methodName]) {
            this[methodName].apply(this);
            return this;
        }

        return this;
    }

    // -- just taps ---

    /**
     * @description Handles a simple tap gesture.
     * @category Gesture
     */
    justTap () {
        this.setIsInspecting(false);

        if (this.column()) {
            this.column().didTapItem(this);
        }

        if (this.isSelectable()) {
            const node = this.node();
            if (node) {
                node.onTapOfNode();
                node.onRequestSelectionOfNode(this);
            }
        }
    }

    /**
     * @description Handles a shift-tap gesture.
     * @category Gesture
     */
    justShiftTap () {
        this.setIsInspecting(false);
        this.column().didShiftTapItem(this);
    }

    /**
     * @description Handles an alternate-tap gesture.
     * @category Gesture
     */
    justAlternateTap () {
        this.debugLog(".justInspect()");
        if (this.node().nodeCanInspect()) { 
            this.setIsInspecting(true);
            this.column().didTapItem(this);
        }
    }

    /**
     * @description Handles a meta-tap gesture.
     * @category Gesture
     */
    justMetaTap () {
        this.setIsInspecting(false);
        this.toggleSelection();
    }

    // --- tap hold ---

    /**
     * @description Determines if the tile accepts long press.
     * @returns {boolean} True if the column can reorder tiles, false otherwise.
     * @category Gesture
     */
    acceptsLongPress () {
        if (!this.column()) {
            console.log("missing parent view on: " + this.typeId());
        }

        if (this.column()) {
            return this.column().canReorderTiles(); // what about dragging out of the column or browser?
        }
        return false;
    }
    
    /**
     * @description Handles the beginning of a long press gesture.
     * @param {Object} aGesture - The gesture object.
     * @category Gesture
     */
    onLongPressBegin (aGesture) {
        if (this.isRegisteredForBrowserDrag()) {
            aGesture.cancel();
        }
    }

    /**
     * @description Handles the cancellation of a long press gesture.
     * @param {Object} aGesture - The gesture object.
     * @category Gesture
     */
    onLongPressCancelled (aGesture) {
    }

    /**
     * @description Determines if the gesture is a tap-long press.
     * @returns {boolean} True if it's a tap-tap-hold, false otherwise.
     * @category Gesture
     */
    isTapLongPress () {
        const maxDt = 0.7;
        let isTapTapHold = false;
        const t1 = this.lastTapDate();
        const t2 = new Date();
        if (t1) {
            const dtSeconds = (t2.getTime() - t1.getTime())/1000;
            
            if (dtSeconds < maxDt) {
                isTapTapHold = true;
            }
        }
        return isTapTapHold;
    }

    /**
     * @description Handles the completion of a long press gesture.
     * @param {Object} longPressGesture - The long press gesture object.
     * @category Gesture
     */
    onLongPressComplete (longPressGesture) {
        longPressGesture.deactivate();

        const isTapLongPress = this.isTapLongPress();

        if (!this.isSelected()) {
            this.column().unselectAllTilesExcept(this);
        }

        this.activate()
        const dv = DragView.clone().setItems(this.column().selectedTiles()).setSource(this.column());

        if (isTapLongPress) {
            dv.setDragOperation("copy");
        } else {
            dv.setDragOperation("move");
        }
        
        dv.openWithEvent(longPressGesture.currentEvent());
    }

    // --- handle pan gesture ---

    /**
     * @description Determines if the tile accepts pan gesture.
     * @returns {boolean} The value of _isReordering.
     * @category Gesture
     */
    acceptsPan () {
        return this._isReordering;
    }


    // --- bottom edge pan ---

    /**
     * @description Determines if the tile accepts bottom edge pan.
     * @returns {boolean} True if the node can edit tile height, false otherwise.
     * @category Gesture
     */
    acceptsBottomEdgePan () {
        if (this.node().nodeCanEditTileHeight) {
            if (this.node().nodeCanEditTileHeight()) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description Handles the beginning of a bottom edge pan gesture.
     * @param {Object} aGesture - The gesture object.
     * @category Gesture
     */
    onBottomEdgePanBegin (aGesture) {
        this._beforeEdgePanBorderBottom = this.borderBottom();
        this.setBorderBottom("1px dashed red");
        this.setTransition("min-height 0s, max-height 0s");
    }

    /**
     * @description Handles the movement of a bottom edge pan gesture.
     * @param {Object} aGesture - The gesture object.
     * @returns {Tile_gestures} The instance of the class.
     * @category Gesture
     */
    onBottomEdgePanMove (aGesture) {
        const p = aGesture.currentPosition();
        const f = this.frameInDocument();
        const newHeight = p.y() - f.y();
        const minHeight = this.node() ? this.node().nodeMinTileHeight() : 10;
        if (newHeight < 10) {
            newHeight = 10;
        }
        this.node().setNodeMinTileHeight(newHeight);
        this.updateSubviews();

        return this;
    }

    /**
     * @description Handles the completion of a bottom edge pan gesture.
     * @param {Object} aGesture - The gesture object.
     * @category Gesture
     */
    onBottomEdgePanComplete (aGesture) {
        this.setBorderBottom(this._beforeEdgePanBorderBottom);
    }

}.initThisCategory());