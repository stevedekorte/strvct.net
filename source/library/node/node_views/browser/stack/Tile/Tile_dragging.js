"use strict";

/**
 * @module browser.stack.Tile
 * @class Tile_dragging
 * @extends Tile
 * @classdesc
 * Tile_dragging class extends Tile to provide dragging functionality.
 * This class implements protocols for both drag source and drop destination.
 */
(class Tile_dragging extends Tile {
    
    /**
     * @description Hides the tile for dragging.
     * @category Dragging
     */
    hideForDrag () {
        this.hideDisplay()
    }

    /**
     * @description Unhides the tile after dragging.
     * @category Dragging
     */
    unhideForDrag () {
        this.unhideDisplay()
    }

    /**
     * @description Handles the request to remove the tile during drag.
     * @returns {boolean} True if the tile was successfully removed.
     * @category Dragging
     */
    onDragRequestRemove () {
        if (this.hasParentView()) {
            this.removeFromParentView()
        }
        assert(!this.hasParentView())

        this.node().removeFromParentNode()
        assert(!this.node().parentNode())

        return true
    }

    /**
     * @description Checks if the tile accepts a drop hover.
     * @param {Object} dragView - The view being dragged.
     * @returns {boolean} True if the tile accepts the drop hover.
     * @category Dropping
     */
    acceptsDropHover (dragView) {
        return this.canDropSelect() || this.acceptsDropHoverComplete(dragView)
    }

    /**
     * @description Handles the drag destination enter event.
     * @param {Object} dragView - The view being dragged.
     * @category Dropping
     */
    onDragDestinationEnter (dragView) {
        if (this.canDropSelect()) {
            this.setupDropHoverTimeout()
        }
    }

    /**
     * @description Handles the drag destination hover event.
     * @param {Object} dragView - The view being dragged.
     * @category Dropping
     */
    onDragDestinationHover (dragView) {
    }

    /**
     * @description Handles the drag destination exit event.
     * @param {Object} dragView - The view being dragged.
     * @category Dropping
     */
    onDragDestinationExit (dragView) {
        this.cancelDropHoverTimeout()
    }

    /**
     * @description Checks if the tile accepts a complete drop hover.
     * @param {Object} dragView - The view being dragged.
     * @returns {boolean} True if the tile accepts the complete drop hover.
     * @category Dropping
     */
    acceptsDropHoverComplete (dragView) {
        const node = this.node()
        if (node && node.nodeAcceptsDrop) {
            return node.nodeAcceptsDrop(dragView.item().node())
        }
    }

    /**
     * @description Handles the drag destination dropped event.
     * @param {Object} dragView - The view being dragged.
     * @returns {*} The result of the node's drop operation.
     * @category Dropping
     */
    onDragDestinationDropped (dragView) {
        console.log(this.typeId() + " onDragDestinationDropped")

        const itemNode = dragView.item().node()

        const node = this.node()
        if (itemNode && node && node.nodeDropped) {
            return node.nodeDropped(itemNode)
        }
    }

    /**
     * @description Gets the drop complete document frame.
     * @returns {Object} The frame in the document.
     * @category Dropping
     */
    dropCompleteDocumentFrame () {
        return this.frameInDocument()
    }

    /**
     * @description Gets the timeout duration for drop hover.
     * @returns {number} The timeout duration in seconds.
     * @category Dropping
     */
    dropHoverDidTimeoutSeconds () {
        return 0.3
    }

    /**
     * @description Checks if the tile can be drop selected.
     * @returns {boolean} True if the tile can be drop selected.
     * @category Dropping
     */
    canDropSelect () {
        return true
    }

    /**
     * @description Gets the name of the drop hover enter timeout.
     * @returns {string} The name of the timeout.
     * @category Dropping
     */
    dropHoverEnterTimeoutName () {
        return "dropHoverEnter"
    }

    /**
     * @description Sets up the drop hover timeout.
     * @category Dropping
     */
    setupDropHoverTimeout () {
        const ms = this.dropHoverDidTimeoutSeconds() * 1000
        this.addTimeout(() => this.dropHoverDidTimeout(), ms, this.dropHoverEnterTimeoutName())
    }

    /**
     * @description Cancels the drop hover timeout.
     * @returns {Tile_dragging} The current instance.
     * @category Dropping
     */
    cancelDropHoverTimeout () {
        this.clearTimeoutNamed(this.dropHoverEnterTimeoutName())
        return this
    }

    /**
     * @description Handles the drop hover timeout.
     * @category Dropping
     */
    dropHoverDidTimeout () {
        this.justTap()
    }

    /**
     * @description Handles the browser drag start event.
     * @param {Event} event - The drag start event.
     * @returns {boolean} True if the drag start was handled, false otherwise.
     * @category Dragging
     */
    onBrowserDragStart (event) {  
        let dKey = SvKeyboard.shared().keyForName("d")
        if (!dKey.isDown()) {
            return false
        }

        const node = this.node()
        if (node && node.getSvDataUrl) {
            const bdd = node.getSvDataUrl()
            if (bdd) {
                event.dataTransfer.setData(bdd.transferMimeType(), bdd.dataUrlString())
                return true;
            }
        }

        return false;
    }

}.initThisCategory());