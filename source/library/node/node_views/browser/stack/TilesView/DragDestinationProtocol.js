"use strict";

/**
 * @module library.node.node_views.browser.stack.TilesView
 * @class DragDestinationProtocol
 * @extends Protocol
 * @classdesc A drag and drop destination protocol for views.
 * @implements {DragViewProtocol}
 */

(class DragDestinationProtocol extends Protocol {

    // --- drag destination ---

    /**
     * @description Handles when the drag destination is entered
     * @param {Object} dragView - The view being dragged
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
                //console.log("w:" + w + " x:" + vp.x())
                ph.setLeftPx(x);
            }
            //console.log("ph.top() = ", ph.top())
            this.stackTiles(); // need to use this so we can animate the tile movements
        }
    }

    /**
     * @description Handles when the drag destination is exited
     * @param {Object} dragView - The view being dragged
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
        return this.tilePlaceHolder().frameInDocument();
    }


    // Browser drop from desktop

    /**
     * @description Checks if the view accepts drops
     * @returns {boolean} Whether drops are accepted
     */
    acceptsDrop () {
        return true;
    }

}).initThisProtocol();
