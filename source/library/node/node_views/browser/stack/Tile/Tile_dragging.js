"use strict";

/*
    
    Tile_dragging

*/

(class Tile_dragging extends Tile {
    

    // --- dragging source protocol ---

    hideForDrag () {
        //this.setVisibility("hidden")
        this.hideDisplay()
    }

    unhideForDrag () {
        //this.setVisibility("visible")
        this.unhideDisplay()
    }

    /*
    onDragItemBegin (aDragView) {
    }

    onDragItemCancelled (aDragView) {
    }

    onDragItemDropped (aDragView) {
    }
    */

    onDragRequestRemove () {
        //assert(this.hasParentView()) //
        if (this.hasParentView()) {
            this.removeFromParentView()
        }
        assert(!this.hasParentView()) //

        this.node().removeFromParentNode()
        assert(!this.node().parentNode())

        //this.delete() // we don't want to delete it, we want to move it
        return true
    }

    // --- dropping destination protocol implemented to handle selecting/expanding tile ---

    acceptsDropHover (dragView) {
        return this.canDropSelect() || this.acceptsDropHoverComplete(dragView)
    }

    onDragDestinationEnter (dragView) {
        if (this.canDropSelect()) {
            this.setupDropHoverTimeout()
        }
    }

    onDragDestinationHover (dragView) {
        //console.log(this.typeId() + " onDragDestinationHover")
    }

    onDragDestinationExit (dragView) {
        this.cancelDropHoverTimeout()
        //this.unselect()
        //this.column().unselectAllTilesExcept(anItem)
    }

    // --- dropping on tile - usefull for LinkNode? ---

    acceptsDropHoverComplete (dragView) {
        const node = this.node()
        if (node && node.nodeAcceptsDrop) {
            return node.nodeAcceptsDrop(dragView.item().node())
        }
    }

    onDragDestinationDropped (dragView) {
        console.log(this.typeId() + " onDragDestinationDropped")

        const itemNode = dragView.item().node()

        const node = this.node()
        if (itemNode && node && node.nodeDropped) {
            return node.nodeDropped(itemNode)
        }
    }

    dropCompleteDocumentFrame () {
        return this.frameInDocument()
    }

    // ----

    dropHoverDidTimeoutSeconds () {
        return 0.3
    }

    canDropSelect () {
        // only want to prevent this for non-navigation nodes
        return true
        //return this.node().hasSubnodes() || this.node().nodeCanReorderSubnodes()
    }

    // -----------------

    dropHoverEnterTimeoutName () {
        return "dropHoverEnter"
    }

    setupDropHoverTimeout () {
        const ms = this.dropHoverDidTimeoutSeconds() * 1000
        this.addTimeout(() => this.dropHoverDidTimeout(), ms, this.dropHoverEnterTimeoutName())
    }

    cancelDropHoverTimeout () {
        this.clearTimeoutNamed(this.dropHoverEnterTimeoutName())
        return this
    }

    dropHoverDidTimeout () {
        this.justTap()
    }

    // Browser style drag

    onBrowserDragStart (event) {  
        let dKey = BMKeyboard.shared().keyForName("d")
        if (!dKey.isDown()) {
            return false
        }

        const node = this.node()
        if (node && node.getBMDataUrl) {
            const bdd = node.getBMDataUrl()
            if (bdd) {
                event.dataTransfer.setData(bdd.transferMimeType(), bdd.dataUrlString())
                return true;
            }
        }

        return false;
    }

}.initThisCategory());
