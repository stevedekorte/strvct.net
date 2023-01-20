"use strict";

/*
    
    TilesView_gestures
    
*/

(class TilesView_gestures extends TilesView {
    
    // --- tap ---

    onTapComplete (aGesture) {
        console.log(this.typeId() + " " + this.node().title() + " .onTapComplete()")
        console.log("shouldRequestActivation: ", aGesture.shouldRequestActivation())
        
        if (this.node()) {

            // add a subnode if tapping on empty area
            const p = aGesture.downPosition() // there may not be an up position on windows?
            //this.debugLog(".onTapComplete() ", aGesture.upEvent())
            if (p.event().target === this.element()) {
                const keyModifiers = BMKeyboard.shared().modifierNamesForEvent(aGesture.upEvent());
                const isAltTap = keyModifiers.contains("Alternate");
                if (isAltTap) {
                    // inspect parent node
                    //this.setIsColumnInspecting(true)
                    return this
                } else {
                    this.addIfPossible()
                }
            }
        }
        return true
    }

    // --- reorder ---

    canReorderTiles () {
        return this.node().nodeTileLink().nodeCanReorderSubnodes()
    }

    didReorderTiles () { 
        if (!this.node() || !this.isInBrowser()) {
            return this
        }
        // TODO: make a more scaleable API
        const subnodes = this.tiles().map(tile => tile.node())
        this.node().nodeTileLink().nodeReorderSudnodesTo(subnodes)
        //this.node().nodeReorderSudnodesTo(subnodes)
        return this
    }

    // --- pinch apart to create a tile ---

    tileContainingPoint (aPoint) {
        // potentially faster:
        //const topElement = document.elementFromPoint(aPoint.x(), aPoint.y())
        // now see if topElement has this.element() as an ancestor

        return this.tiles().detect((tile) => {
            return tile.frameInDocument().containsPoint(aPoint)
        })
    }

    onPinchBegin (aGesture) { // pinch apart to insert a new tile
        // TODO: move tile specific code to Tile

        //this.debugLog(".onPinchBegin()")

        // - calc insert index
        const p = aGesture.beginCenterPosition()
        const tile = this.tileContainingPoint(p)
        if (!tile) {
            // don't allow pinch if it's bellow all the tiles
            // use a tap gesture to create a tile there instead?
            return this
        }

        const insertIndex = this.tiles().indexOf(tile)

        //console.log("insertIndex: ", insertIndex)

        if (this.node().hasAction("add")) {
            // create new subnode at index
            const newSubnode = this.node().addAt(insertIndex)

            // reference it with _temporaryPinchSubnode so we
            // can delete it if pinch doesn't complete with enough height
            this._temporaryPinchSubnode = newSubnode

            // sync with node to add tile view for it
            this.syncFromNodeNow()

            // find new tile and prepare it
            const newTile = this.subviewForNode(newSubnode)
            newTile.setMinAndMaxHeight(0)
            newTile.contentView().setMinAndMaxHeight(64)
            newTile.setTransition("all 0.3s")
            newTile.contentView().setTransition("all 0s")
            newTile.setBackgroundColor("black")

            // set new tile view height to zero and 
            const minHeight = Tile.defaultHeight()
            const cv = newTile.contentView()
            cv.setBackgroundColor(this.navView().backgroundColor())
            cv.setMinAndMaxHeight(minHeight)
            //newTile.scheduleSyncFromNode()
            //this._temporaryPinchSubnode.didUpdateNode()
        } else {
            //this.debugLog(".onPinchBegin() cancelling due to no add action")

            aGesture.cancel()
        }        
    }
    
    onPinchMove (aGesture) {
        if (this._temporaryPinchSubnode) {
            let s = Math.floor(aGesture.spreadY())
            if (s < 0) {
                s = 0
            }
            //this.debugLog(".onPinchMove() s = ", s)
            const minHeight = Tile.defaultHeight()
            const newTile = this.subviewForNode(this._temporaryPinchSubnode)
            //newTile.setBackgroundColor("black")
            newTile.setMinAndMaxHeight(s)
            const t = Math.floor(s/2 - minHeight/2);
            newTile.contentView().setTopPx(t)

            const h = Tile.defaultHeight()

            if (s < h) {
                const f = s/h;
                const rot = Math.floor((1 - f) * 90);
                newTile.setPerspective(1000)
                newTile.setTransformOrigin(0)
                //newTile.contentView().setTransformOriginPercentage(0)
                newTile.contentView().setTransform("rotateX(" + rot + "deg)")
                const z = -100 * f;
                //newTile.contentView().setTransform("translateZ(" + z + "dg)")
            } else {
                newTile.setPerspective(null)
                newTile.contentView().setTransform(null)                
            }
        } else {
            console.warn(this.typeId() + ".onPinchMove() missing this._temporaryPinchSubnode")
        }
        // do we need to restack views?
    }

    onPinchComplete (aGesture) {
        //this.debugLog(".onPinchCompleted()")
        // if pinch is tall enough, keep new tile

        if (this._temporaryPinchSubnode) {
            const newTile = this.subviewForNode(this._temporaryPinchSubnode)
            const minHeight = Tile.defaultHeight()
            if (newTile.clientHeight() < minHeight) {
                this.removeTile(newTile)
            } else {
                //newTile.contentView().setTransition("all 0.15s, height 0s")
                //newTile.setTransition("all 0.3s, height 0s")
                this.addTimeout(() => { 
                    newTile.contentView().setTopPx(0)
                    newTile.setMinAndMaxHeight(minHeight) 
                }, 0)
            }

            this._temporaryPinchSubnode = null
        }
    }

    onPinchCancelled (aGesture) {
        //this.debugLog(".onPinchCancelled()")
        if (this._temporaryPinchSubnode) {
            this.node().removeSubnode(this._temporaryPinchSubnode)
            this._temporaryPinchSubnode = null
        }
    }

}.initThisCategory());
