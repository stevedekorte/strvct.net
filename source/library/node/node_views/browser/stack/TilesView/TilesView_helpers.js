/**
 * @module library.node.node_views.browser.stack.TilesView
 * @class TilesView_helpers
 * @extends TilesView
 * @classdesc
 * TilesView_helpers class provides helper methods for TilesView.
 * This class includes methods for debugging and displaying tiles and nodes.
 */

"use strict";

(class TilesView_helpers extends TilesView {
    
    // --- reordering support ---

    /*
    absolutePositionTiles () {
        const ys = []
        this.tiles().forEach((tile) => {
            const y = tile.relativePos().y()
            ys.append(y)
        })

        let i = 0
        this.tiles().forEach((tile) => {
            const y = ys[i]
            i ++
            tile.unhideDisplay()
            tile.setPosition("absolute")
            tile.setTopPx(y)
            tile.setLeftPx(0)
            tile.setRightPx(null)
            tile.setBottomPx(null)
            tile.setWidthPercentage(100)
            //console.log("i" + i + " : y" + y)
        })
        
        return this
    }
    */


    /*
    orderTiles () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("topPx")

        this.tiles().forEach((tile) => {
            tile.setPosition("absolute")
            tile.unhideDisplay()
        })

        this.removeAllSubviews()
        this.addSubviews(orderedTiles)
        return this
    }
    */

    // -- stacking tiles ---

    /*
    Tile methods:

    makeAbsolutePositionAndSize () {
        const f = this.frameInParentView()
        this.setFrameInParent(f)
        return this 
    }

    makeRelativePositionAndSize () {
        this.setPosition("relative")

        this.setTopPx(null)
        this.setLeftPx(null)
        this.setRightPx(null)
        this.setBottomPx(null)

        this.setMinAndMaxWidth(null)
        this.setMinAndMaxHeight(null)  
        return this 
    }

    flexDirectionLength () {
        const fd = this.parentView().flexDirection() 
        // tile is left to right
        if (Type.isNull(fd)) {
            fd = "row"
        }
        assert(fd)
        const wfunc = () => { return this.computedWidth() }
        const hfunc = () => { return this.computedHeight() }
        const d = {
            "row" : () => hfunc,
            "row-reverse" : hfunc,
            "column" : () => wfunc,
            "column-reverse" : wfunc,
        }
        return d[fd]()
    }

    flexDirectionBreadth () {
        const fd = this.parentView().flexDirection()
        if (fd)
        assert(fd)
        const wfunc = () => { return this.computedWidth() }
        const hfunc = () => { return this.computedHeight() }
        const d = {
            "row" : wfunc,
            "row-reverse" : wfunc,
            "column" : () => hfunc,
            "column-reverse" : hfunc,
        }
        return d[fd]()
    }
    flexDirectionStartPosition

    */

    // --- debugging ---

    /**
     * @description Displays the tiles in the console.
     * @param {Array} tiles - The array of tiles to be displayed.
     * @returns {TilesView_helpers} Returns this instance for method chaining.
     * @category Debugging
     */
    showTiles(tiles) {
        console.log("tiles: ", tiles.map(r => {
            if (r.node) {
                return r.node().title() + (r.display() !== "block" ? ("-" + r.display()) : "")
            }
            return r.type() 
        }).join(", "))
        return this
    }

    /**
     * @description Displays the nodes in the console.
     * @param {Array} nodes - The array of nodes to be displayed.
     * @returns {TilesView_helpers} Returns this instance for method chaining.
     * @category Debugging
     */
    showNodes(nodes) {
        console.log("nodes: ", nodes.map(node => {
            return node.title()
        }).join(", "))
        return this
    }

    // --- helpers ---
/*
    debugTypeId () {
        const comment = " '" + (this.node() ? this.node().title() : "untitled node") + "'"
        return super.debugTypeId() + comment
    }
*/

    // paths

    /*
    logName () {
        return this.browserPathString()
    }
    */

}.initThisCategory());