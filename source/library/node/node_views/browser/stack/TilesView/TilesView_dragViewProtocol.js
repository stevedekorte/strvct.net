"use strict";

/** * @module library.node.node_views.browser.stack.TilesView
 */

/** * @class TilesView_dragViewProtocol
 * @extends TilesView
 * @classdesc Handles the drag and drop protocol for TilesView.
 *
 * When a drag is performed, a DragView is created to render the drag operation,
 *  manage the drag events, and store the drag related info such as the list of items being dragged.
 * The DragView instance is used as an argument for many of the drag view protocol methods.
 *
 * To support drop on a tiles view, the tiles must implement the methods:
 * - acceptsDrop
 * - onDragDestinationDropped
 * And can optionally implement the methods:
 * - acceptsDropHover
 * - onDragDestinationEnter
 * - onDragDestinationExit
 * - onDragDestinationEnd
 *
 * Note that we do the drop on the TilesView, not on the tile so we can manage
 * the insertion point and animate the tiles moving into place.
 *
 * To support draggings a tile, the tile must implement the methods:
 * - onDragSourceBegin
 * - onDragSourceCancelled
 * - onDragSourceEnter
 * - onDragSourceHover
 * - onDragSourceExit
 * - onDragSourceEnd
 *
 * @implements {DragViewProtocol}
 
 
 */

/**

 */

(class TilesView_dragViewProtocol extends TilesView {

    // -- messages sent by DragView to the parent/owner of the view it's dragging ---

    /**
     * @description Handles the beginning of a drag operation
     * @param {Object} dragView - The view being dragged
     * @returns {TilesView_dragViewProtocol} The current instance
     */
    onDragSourceBegin (dragView) {
        this.setHasPausedSync(true);
        //ElementDomView.pauseRetires();

        //console.log(this.svTypeId() + " onDragSourceBegin");
        // ---


        /*
        dragView.items().forEach(sv => {
            sv.hideForDrag();
        });
        */

        // ---
        const subview = dragView.item();
        const index = this.indexOfSubview(subview);
        assert(index !== -1);

        if (dragView.isMoveOp()) {
            dragView.items().forEach(sv => this.removeSubview(sv));
        } else if (dragView.isCopyOp()) {
            // copy
        }

        //this.tiles().forEach(tile => tile.setTransition("all 0.3s"));
        this.tiles().forEach(tile => tile.setTransition("top 0.3s, left 0.3s"));

        this.newTilePlaceHolder(dragView);

        /*
        if (dragView.isMoveOp()) {
            subview.hideForDrag();
            this.moveSubviewToIndex(this.tilePlaceHolder(), index);
        }
        */

        this.moveSubviewToIndex(this.tilePlaceHolder(), index);
        this.stackTiles();
        return this;
    }

    /**
     * @description Handles the cancellation of a drag operation
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceCancelled (dragView) {
        /*
        dragView.items().forEach(subview => {
            subview.unhideForDrag();
        })
        */
        this.onDragSourceDropped(dragView);
        //this.removeTilePlaceHolder();
    }

    /**
     * @description Handles when the drag source enters the view
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceEnter (dragView) {
        this.onDragDestinationHover(dragView);
        this.stackView().rootStackView().onStackChildDragSourceEnter(dragView);
    }

    /**
     * @description Handles when the drag source hovers over the view
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceHover (dragView) {
        this.onDragDestinationHover(dragView);
        this.indexOfTilePlaceHolder();
    }

    /**
     * @description Handles when the drag source exits the view
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceExit (dragView) {
        this.onDragDestinationHover(dragView);
    }


    // -- DragView dropping ---

    /**
     * @description Handles when the drag source is dropped
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceDropped (dragView) {
        //console.log(this.svDebugId() + " --- onDragSourceDropped ---")


        const insertIndex = this.indexOfTilePlaceHolder();

        let movedNodes = dragView.items().map(item => item.node());
        if (dragView.isMoveOp()) {
            // todo
        } else if (dragView.isCopyOp()) {
            movedNodes = movedNodes.map(aNode => aNode.duplicate());
        } else {
            throw new Error("unhandled drag operation");
        }
        //console.log(this.svDebugId() + " --- unstacking ---")

        this.unstackTiles();
        this.removeTilePlaceHolder();

        //console.log("---")
        //this.showNodes(movedNodes)
        //this.showTiles(this.subviews())
        const newSubnodesOrder = this.subviews().map(sv => sv.node());

        //this.showNodes(newSubnodesOrder);

        this.node().removeSubnodes(movedNodes); // is this needed?
        //assert(!newSubnodesOrder.containsAny(movedNodes));


        newSubnodesOrder.atInsertItems(insertIndex, movedNodes);
        //this.showNodes(newSubnodesOrder);

        this.node().setSubnodes(newSubnodesOrder);

        //console.log("new order: " + this.node().subnodes().map(sn => sn.title()).join("-"));
        this.setHasPausedSync(false);
        this.syncFromNodeNow();
        this.selectAndFocusNodes(movedNodes);
    }

    /**
     * @description Handles when an item is dropped on the destination
     * @param {Object} dragView - The view being dragged
     */
    onDragDestinationDropped (dragView) {
        const insertIndex = this.indexOfTilePlaceHolder();

        let movedNodes = dragView.items().map(item => item.node());
        if (dragView.isMoveOp()) {
            movedNodes.forEach(aNode => aNode.removeFromParentNode());
        } else if (dragView.isCopyOp()) {
            movedNodes = movedNodes.map(aNode => aNode.duplicate());
        } else {
            throw new Error("unhandled drag operation");
        }

        this.unstackTiles();
        this.removeTilePlaceHolder();

        const newSubnodesOrder = this.subviews().map(sv => sv.node());
        assert(!newSubnodesOrder.containsAny(movedNodes));
        newSubnodesOrder.atInsertItems(insertIndex, movedNodes);
        this.node().setSubnodes(newSubnodesOrder);

        this.setHasPausedSync(false);
        this.syncFromNodeNow();
        this.selectAndFocusNodes(movedNodes);
    }

    /**
     * @description Handles the end of a drag operation
     * @param {Object} dragView - The view being dragged
     */
    onDragSourceEnd (dragView) {
        this.endDropMode();
        //ElementDomView.unpauseRetires();
    }

    // -- messages sent by DragView to the potential drop view, if not the source ---

    /**
     * @description Checks if the view accepts a drop hover
     * @param {Object} dragView - The view being dragged
     * @returns {boolean} Whether the drop hover is accepted
     */
    acceptsDropHover (dragView) {
        //return true ;

        const node = this.node();
        if (node) {
            const dropNode = dragView.item().node();

            if (dropNode === this.node()) {
                return false;
            }

            const acceptsNode = node.acceptsAddingSubnode(dropNode);
            const canReorder = this.canReorderTiles();;
            //console.log(node.title() + " acceptsNode " + dropNode.title() + " " + acceptsNode);
            //console.log("parentNode " + node.parentNode().title());
            const result = acceptsNode && canReorder;
            return result;
        }
        return false;
    }

    /// --- tile place holder ---

    /**
     * @description Creates a new tile placeholder
     * @param {Object} dragView - The view being dragged
     * @returns {Object} The tile placeholder
     */
    newTilePlaceHolder (dragView) {
        //this.logDebug("newTilePlaceHolder")
        if (!this.tilePlaceHolder()) {
            const ph = DomView.clone().setElementClassName("TilePlaceHolder"); // classname not for css rule, just a note for debugging
            ph.setBackgroundColor("black");

            //ph.setTransition("top 0s, left 0s, max-height 1s, min-height 1s");
            ph.setTransition("top 0s, left 0s");
            this.addSubview(ph);
            this.setTilePlaceHolder(ph);
            this.syncTilePlaceHolderSize(dragView);
        }
        return this.tilePlaceHolder();
    }

    /**
     * @description Syncs the size of the tile placeholder
     * @param {Object} dragView - The view being dragged
     * @returns {TilesView_dragViewProtocol} The current instance
     */
    syncTilePlaceHolderSize (dragView) {
        const ph = this.tilePlaceHolder();
        //const period = 0.1
        if (ph) {
            if (this.isVertical()) {
                ph.setMinAndMaxWidth(this.computedWidth());
                ph.setMinAndMaxHeight(dragView.minHeight());
                //ph.setMinAndMaxHeight(dragView.maxHeightPx() + 1); // all tiles seem to shrink while dragging, not just place holder
                //ph.transitions().at("top").updateDuration(0);
                //ph.transitions().at("left").updateDuration(period);
            } else {
                ph.setMinAndMaxWidth(dragView.minWidth());
                ph.setMinAndMaxHeight(this.computedHeight());
                //ph.transitions().at("top").updateDuration(period);
                //ph.transitions().at("left").updateDuration(0);
            }
        } else {
            console.log("tilePlaceHolder missing (null) for TileView: ", this.svDebugId());
        }

        return this;
    }

    /**
     * @description Gets the index of the tile placeholder
     * @returns {number} The index of the tile placeholder
     */
    indexOfTilePlaceHolder () {
        const sortMethod = this.isVertical() ? "topPx" : "leftPx";
        const orderedTiles = this.tiles().shallowCopy().sortPerform(sortMethod);
        const insertIndex = orderedTiles.indexOf(this.tilePlaceHolder());

        //this.showTiles(orderedTiles);
        //console.log("hover insertIndex: ", insertIndex);

        return insertIndex;
    }

    // --- drag destination ---

    /**
     * @description Handles when the drag destination is entered
     * @param {Object} dragView - The view being dragged
     * @returns undefined
     */
    onDragDestinationEnter (dragView) {
        this.setHasPausedSync(true);

        // insert place holder view
        if (!this.tilePlaceHolder()) {
            this.newTilePlaceHolder(dragView);
            this.tilePlaceHolder().setMinAndMaxHeight(dragView.computedHeight());
            this.onDragDestinationHover(dragView);
        }
    }

    /**
     * @description Handles when the drag destination is hovered over
     * @param {Object} dragView - The view being dragged
     */
    onDragDestinationHover (dragView) {
        // move place holder view
        const ph = this.tilePlaceHolder();
        if (ph) {
            this.syncTilePlaceHolderSize(dragView);
            const vp = this.viewPosForWindowPos(dragView.dropPoint());
            if (this.isVertical()) {
                const h = dragView.computedHeight();
                const y = vp.y() - h / 2;
                ph.setTopPx(y);
            } else {
                const w = dragView.computedWidth();
                const x = vp.x() - w / 2;
                //console.log("w:" + w + " x:" + vp.x());
                ph.setLeftPx(x);
            }
            //console.log("ph.top() = ", ph.top())
            this.stackTiles(); // need to use this so we can animate the tile movements
        }
    }

    /**
     * @description Handles when the drag destination is exited
     * @param {Object} dragView - The view being dragged
     * @returns undefined
     */
    onDragDestinationExit (dragView) {
        this.endDropMode();
    }

    /**
     * @description Handles the end of the drag destination
     * @param {Object} aDragView - The view being dragged
     */
    onDragDestinationEnd (aDragView) {
        this.endDropMode();
    }

    /**
     * @description Checks if the view accepts a complete drop hover
     * @param {Object} aDragView - The view being dragged
     * @returns {boolean} Whether the complete drop hover is accepted
     */
    acceptsDropHoverComplete (aDragView) {
        return this.acceptsDropHover(aDragView);
    }

    /**
     * @description Gets the document frame for the drop complete action
     * @returns {Object} The document frame
     */
    dropCompleteDocumentFrame () {
        assert(this.tilePlaceHolder());
        return this.tilePlaceHolder().frameInDocument();
    }

    /**
     * @description Removes the tile placeholder
     * @returns undefined
     */
    removeTilePlaceHolder () {
        this.logDebug("removeTilePlaceHolder");

        const ph = this.tilePlaceHolder();
        if (ph) {
            //console.log("removeTilePlaceHolder");
            if (this.hasSubview(ph)) {
                this.removeSubview(ph);
            }
            this.setTilePlaceHolder(null);
        }
    }

    /**
     * @description Animates the removal of the tile placeholder
     * @param {Function} resolve - The resolve function to call after animation
     * @returns undefined
     */
    animateRemoveTilePlaceHolderAndThen (resolve) {
        this.logDebug("animateRemoveTilePlaceHolder");

        const ph = this.tilePlaceHolder();
        if (ph) {
            ph.setMinAndMaxHeight(0);
            this.addTimeout(() => {
                this.removeTilePlaceHolder();
                if (resolve) {
                    resolve();
                }
            }, 1 * 1000);
        } else {
            if (resolve) {
                resolve();
            }
        }
    }

    /**
     * @description Ends the drop mode
     * @returns {TilesView_dragViewProtocol} The current instance
     */
    endDropMode () {
        this.logDebug("endDropMode");;
        //this.unstackTiles();
        this.removeTilePlaceHolder();
        this.unstackTiles();
        this.setHasPausedSync(false);
        this.didReorderTiles();

        /*
        this.animateRemoveTilePlaceHolderAndThen(() => {
         this.logDebug("endDropMode");
            this.unstackTiles();
            this.setHasPausedSync(false);
            this.didReorderTiles();
        });
        */

        return this;
    }

    /*
    tileIndexForViewportPoint (aPoint) {
        if (this.tiles().length === 0) {
            return 0;
        }

        const tile = this.tiles().detect((tile) => {
            return tile.frameInDocument().containsPoint(aPoint);
        })

        if (tile) {
            return this.tiles().indexOf(tile);
        }

        return this.tiles().length;
    }
    */

    // Browser drop from desktop

    /**
     * @description Checks if the view accepts drops
     * @returns {boolean} Whether drops are accepted
     */
    acceptsDrop () {
        return true;
    }


}.initThisCategory());
