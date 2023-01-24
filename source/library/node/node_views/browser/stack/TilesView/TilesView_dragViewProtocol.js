"use strict";

/*
    
    TilesView_dragViewProtocol
    
*/

(class TilesView_dragViewProtocol extends TilesView {
    
    // -- messages sent by DragView to the parent/owner of the view it's dragging ---

    onDragSourceBegin (dragView) {
        this.setHasPausedSync(true)
        //ElementDomView.pauseRetires()

        //console.log(this.typeId() + " onDragSourceBegin")
        // ---


        /*
        dragView.items().forEach(sv => {
            sv.hideForDrag()
        })
        */

        // ---
        const subview = dragView.item()
        const index = this.indexOfSubview(subview)
        assert(index !== -1)

        if (dragView.isMoveOp()) {
            dragView.items().forEach(sv => this.removeSubview(sv))
        } else if (dragView.isCopyOp()) {

        }

        this.tiles().forEach(tile => tile.setTransition("all 0.3s"))

        this.newTilePlaceHolder(dragView)

        /*
        if (dragView.isMoveOp()) {
            subview.hideForDrag()
            this.moveSubviewToIndex(this.tilePlaceHolder(), index)
        }
        */

        this.moveSubviewToIndex(this.tilePlaceHolder(), index)
        this.stackTiles()
        return this
    }

    onDragSourceCancelled (dragView) {
        /*
        dragView.items().forEach(subview => {
            subview.unhideForDrag()
        })
        */
        this.onDragSourceDropped(dragView)
        //this.removeTilePlaceHolder()
    }


    onDragSourceEnter (dragView) {
        this.onDragDestinationHover(dragView)
        this.stackView().rootStackView().onStackChildDragSourceEnter(dragView)
    }

    onDragSourceHover (dragView) {
        this.onDragDestinationHover(dragView)
        this.indexOfTilePlaceHolder()
    }

    onDragSourceExit (dragView) {
        this.onDragDestinationHover(dragView)
    }


    // -- DragView dropping ---

    onDragSourceDropped (dragView) {
        //console.log(this.debugTypeId() + " --- onDragSourceDropped ---")
        //debugger;

        const insertIndex = this.indexOfTilePlaceHolder()

        let movedNodes = dragView.items().map(item => item.node())
        if (dragView.isMoveOp()) {
            // todo
        } else if (dragView.isCopyOp()) {
             movedNodes = movedNodes.map(aNode => aNode.duplicate())
        } else {
            throw new Error("unhandled drag operation")
        }
        //console.log(this.debugTypeId() + " --- unstacking ---")

        this.unstackTiles()
        this.removeTilePlaceHolder()
    
        //console.log("---")
        //this.showNodes(movedNodes)
        //this.showTiles(this.subviews())
        const newSubnodesOrder = this.subviews().map(sv => sv.node())
        //debugger;
        //this.showNodes(newSubnodesOrder)
        
        this.node().removeSubnodes(movedNodes) // is this needed?
        //assert(!newSubnodesOrder.containsAny(movedNodes))


        newSubnodesOrder.atInsertItems(insertIndex, movedNodes)
        //this.showNodes(newSubnodesOrder)

        this.node().setSubnodes(newSubnodesOrder)

        //console.log("new order: " + this.node().subnodes().map(sn => sn.title()).join("-"))
        this.setHasPausedSync(false)
        this.syncFromNodeNow()
        this.selectAndFocusNodes(movedNodes)
    }

    onDragDestinationDropped (dragView) {
        //debugger;
        
        const insertIndex = this.indexOfTilePlaceHolder()

        let movedNodes = dragView.items().map(item => item.node())
        if (dragView.isMoveOp()) {
            movedNodes.forEach(aNode => aNode.removeFromParentNode())
        } else if (dragView.isCopyOp()) {
             movedNodes = movedNodes.map(aNode => aNode.duplicate())
        } else {
            throw new Error("unhandled drag operation")
        }

        this.unstackTiles()
        this.removeTilePlaceHolder()

        const newSubnodesOrder = this.subviews().map(sv => sv.node())
        assert(!newSubnodesOrder.containsAny(movedNodes))
        newSubnodesOrder.atInsertItems(insertIndex, movedNodes)
        this.node().setSubnodes(newSubnodesOrder)

        this.setHasPausedSync(false)
        this.syncFromNodeNow()
        this.selectAndFocusNodes(movedNodes)
    }

    onDragSourceEnd (dragView) {
        this.endDropMode()
        //ElementDomView.unpauseRetires()
    }

    // -- messages sent by DragView to the potential drop view, if not the source ---

    acceptsDropHover (dragView) {
        //return true 

        const node = this.node()
        if (node) {
            const dropNode = dragView.item().node()

            if (dropNode === this.node()) {
                return false
            }
            
            const acceptsNode = node.acceptsAddingSubnode(dropNode)
            const canReorder = this.canReorderTiles()
            //console.log(node.title() + " acceptsNode " + dropNode.title() + " " + acceptsNode)
            //console.log("parentNode " + node.parentNode().title())
            const result = acceptsNode && canReorder
            return result
        }
        return false
    }

    /// --- tile place holder ---

    newTilePlaceHolder (dragView) {
        this.debugLog("newTilePlaceHolder")
        if (!this.tilePlaceHolder()) {
            const ph = DomView.clone().setElementClassName("TilePlaceHolder")
            ph.setBackgroundColor("black")

            //ph.setTransition("top 0s, left 0.3s, max-height 1s, min-height 1s")
            this.addSubview(ph)
            this.setTilePlaceHolder(ph)
            this.syncTilePlaceHolderSize(dragView)
        }
        return this.tilePlaceHolder()
    }

    syncTilePlaceHolderSize (dragView) {
        const ph = this.tilePlaceHolder()

        if (this.isVertical()) {
            ph.setMinAndMaxWidth(this.computedWidth())
            ph.setMinAndMaxHeight(dragView.minHeight())
            ph.transitions().at("top").updateDuration(0)
            ph.transitions().at("left").updateDuration(0.3)
        } else {
            ph.setMinAndMaxWidth(dragView.minWidth())
            ph.setMinAndMaxHeight(this.computedHeight())
            ph.transitions().at("top").updateDuration(0.3)
            ph.transitions().at("left").updateDuration(0)
        }

        return this
    }

    indexOfTilePlaceHolder () {
        const sortMethod = this.isVertical() ? "topPx" : "leftPx"
        const orderedTiles = this.tiles().shallowCopy().sortPerform(sortMethod) 
        const insertIndex = orderedTiles.indexOf(this.tilePlaceHolder()) 
        
        //this.showTiles(orderedTiles)
        //console.log("hover insertIndex: ", insertIndex)
        
        return insertIndex
    }

    // --- drag destination ---

    onDragDestinationEnter (dragView) {
        this.setHasPausedSync(true)

        // insert place holder view
        if (!this.tilePlaceHolder()) {
            this.newTilePlaceHolder(dragView)
            this.tilePlaceHolder().setMinAndMaxHeight(dragView.computedHeight())
            this.onDragDestinationHover(dragView)
        }
    }

    onDragDestinationHover (dragView) {
        // move place holder view
        const ph = this.tilePlaceHolder()
        if (ph) {
            this.syncTilePlaceHolderSize(dragView)
            const vp = this.viewPosForWindowPos(dragView.dropPoint())
            if (this.isVertical()) {
                const h = dragView.computedHeight()
                const y = vp.y() - h/2
                ph.setTopPx(y)
            } else {
                const w = dragView.computedWidth()
                const x = vp.x() - w/2
                //console.log("w:" + w + " x:" + vp.x())
                ph.setLeftPx(x)
            }
            //console.log("ph.top() = ", ph.top())
            this.stackTiles() // need to use this so we can animate the tile movements
        }
    }
    
    onDragDestinationExit (dragView) {
        this.endDropMode()
    }

    onDragDestinationEnd (aDragView) {
        this.endDropMode()
    }

    acceptsDropHoverComplete (aDragView) {
        return this.acceptsDropHover(aDragView);
    }

    dropCompleteDocumentFrame () {
        return this.tilePlaceHolder().frameInDocument()
    }


    removeTilePlaceHolder () {
        this.debugLog("removeTilePlaceHolder")

        const ph = this.tilePlaceHolder()
        if (ph) {
            //console.log("removeTilePlaceHolder")
            if (this.hasSubview(ph)) {
                this.removeSubview(ph)
            }
            this.setTilePlaceHolder(null)
        }
    }

    animateRemoveTilePlaceHolderAndThen (callback) {
        this.debugLog("animateRemoveTilePlaceHolder")

        const ph = this.tilePlaceHolder()
        if (ph) {
            ph.setMinAndMaxHeight(0)
            this.addTimeout(() => {
                this.removeTilePlaceHolder()
                if (callback) { callback() }
            }, 1*1000)
        } else {
            if (callback) { callback() }
        }
    }

    endDropMode () {
        this.debugLog("endDropMode")
        //this.unstackTiles()
        this.removeTilePlaceHolder()
        this.unstackTiles()
        this.setHasPausedSync(false)
        this.didReorderTiles()

        /*
        this.animateRemoveTilePlaceHolderAndThen(() => {
         this.debugLog("endDropMode")
            this.unstackTiles()
            this.setHasPausedSync(false)
            this.didReorderTiles()
        })
        */

        return this
    }

    /*
    tileIndexForViewportPoint (aPoint) {
        if (this.tiles().length === 0) {
            return 0
        }

        const tile = this.tiles().detect((tile) => {
            return tile.frameInDocument().containsPoint(aPoint)
        })

        if (tile) {
            return this.tiles().indexOf(tile)
        }

        return this.tiles().length
    }
    */

    // Browser drop from desktop

    acceptsDrop () {
        return true
    }


}.initThisCategory());
