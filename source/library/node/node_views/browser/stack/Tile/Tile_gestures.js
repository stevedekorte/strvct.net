"use strict";

/*
    
    Tile_gestures

*/

(class Tile_gestures extends Tile {
    
    // --- tap gesture -------- 

    acceptsTapBegin (aGesture) {
        return true
    }

    onTapComplete (aGesture) {
        //console.log(this.debugTypeId() + " onTapComplete")
        this.setLastTapDate(new Date())
        const keyModifiers = BMKeyboard.shared().modifierNamesForEvent(aGesture.upEvent());
        ///const hasThreeFingersDown = aGesture.numberOfFingersDown() === 3;
        //const isAltTap = keyModifiers.contains("Alternate");

        //if (keyModifiers.length) {
            // TODO: abstract this to DomView or GestureRecognizer?
            const methodName = "just" + keyModifiers.join("") + "Tap"
            //this.debugLog(" tap method " + methodName)
            if (this[methodName]) {
                this[methodName].apply(this)
                return this
            }
        //} 
        
        /*
        if (hasThreeFingersDown || isAltTap) {
            this.justInspect()
        } else {
            this.setIsInspecting(false)
            this.justTap()
        }
        */

        return this
    }

    // -- just taps ---

    justTap () {
        this.setIsInspecting(false)
        this.column().didTapItem(this)

        //console.log(this.debugTypeId() + " justTap")
        if (this.isSelectable()) {
            const node = this.node()
            if (node) {
                node.onTapOfNode()
                node.onRequestSelectionOfNode(this)
            }

            /*
            if (this.isFocused() && node.nodeUrlLink) {
                // TODO: move to specialized view (something like UrlLinkTile?) 
                if (!BMKeyboard.shared().hasKeysDown()) {
                    const url = node.nodeUrlLink()
                    window.open(url, "_blank")
                }
            }
            */
        }
    }

    justShiftTap () {
        this.setIsInspecting(false)
        this.column().didShiftTapItem(this)
    }

    justAlternateTap () {
        this.debugLog(".justInspect()")
        if (this.node().nodeCanInspect()) { 
            this.setIsInspecting(true) // will call didUpdateSlotIsInspecting and update nav
            this.column().didTapItem(this)
        }
    }

    justMetaTap () {
        this.setIsInspecting(false)
        this.toggleSelection()
    }

    // --- tap hold ---
    // TODO: move to GestureRecognizer or DomView?

    acceptsLongPress () {
        if (!this.column()) {
            console.log("missing parent view on: " + this.typeId())
        }

        if (this.column()) {
            return this.column().canReorderTiles()
        }
        return false
    }
    
    onLongPressBegin (aGesture) {
        if (this.isRegisteredForBrowserDrag()) {
            aGesture.cancel() // don't allow in-browser drag when we're doing a drag outside
        }
    }

    onLongPressCancelled (aGesture) {
    }

    isTapLongPress () {
        // ok, now we need to figure out if this is a tap-hold or tap-tap-hold
        const maxDt = 0.7 // between tap time + long tap hold time before complete is triggered
        let isTapTapHold = false
        const t1 = this.lastTapDate()
        const t2 = new Date()
        if (t1) {
            const dtSeconds = (t2.getTime() - t1.getTime())/1000
            //console.log("dtSeconds = " + dtSeconds)
            
            if (dtSeconds < maxDt) {
                isTapTapHold = true
            }
        }
        return isTapTapHold
    }

    onLongPressComplete (longPressGesture) {
        longPressGesture.deactivate() // needed?

        const isTapLongPress = this.isTapLongPress() // is tap-hold

        if (!this.isSelected()) {
            this.column().unselectAllTilesExcept(this)
        }

        this.activate()
        const dv = DragView.clone().setItems(this.column().selectedTiles()).setSource(this.column())

        if (isTapLongPress) {
            dv.setDragOperation("copy")
        } else { // otherwise, it's just a normal long press
            dv.setDragOperation("move")
        }
        
        dv.openWithEvent(longPressGesture.currentEvent())
    }

    // --- handle pan gesture ---

    acceptsPan () {
        return this._isReordering
    }


    // --- bottom edge pan ---

    acceptsBottomEdgePan () {
        if (this.node().nodeCanEditTileHeight) {
            if (this.node().nodeCanEditTileHeight()) {
                return true
            }
        }
        return false
    }

    onBottomEdgePanBegin (aGesture) {
        this._beforeEdgePanBorderBottom = this.borderBottom()
        this.setBorderBottom("1px dashed red")
        this.setTransition("min-height 0s, max-height 0s")
    }

    onBottomEdgePanMove (aGesture) {
        const p = aGesture.currentPosition() // position in document coords
        const f = this.frameInDocument()
        const newHeight = p.y() - f.y()
        const minHeight = this.node() ? this.node().nodeMinTileHeight() : 10;
        if (newHeight < 10) {
            newHeight = 10;
        }
        this.node().setNodeMinTileHeight(newHeight)
        this.updateSubviews()

        /*
            this.node().setNodeMinTileHeight(h)
            this.updateSubviews()
            //this.setMinAndMaxHeight(newHeight) // what about contentView?
            //this.contentView().autoFitParentHeight()
        */

        return this
    }

    onBottomEdgePanComplete (aGesture) {
        this.setBorderBottom(this._beforeEdgePanBorderBottom)
    }

}.initThisCategory());
