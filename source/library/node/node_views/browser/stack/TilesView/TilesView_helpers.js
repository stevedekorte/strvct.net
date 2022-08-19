"use strict";

/*
    
    TilesView_helpers
    
*/

(class TilesView_helpers extends TilesView {
    


    // reordering support

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

    showTiles (tiles) {
        console.log("tiles: ", tiles.map(r => {
            if (r.node) {
                return r.node().title() + (r.display() !== "block" ? ("-" + r.display()) : "")
            }
            return r.type() 
        }).join(", "))
        return this
    }

    showNodes (nodes) {
        console.log("nodes: ", nodes.map(node => {
            return node.title()
        }).join(", "))
        return this
    }

    nodeDescription () {
        const node = this.node()
        if (node) {
            return node.debugTypeId()
        }
        return null
    }

    debugTypeId () {
        //return this.nodeDescription()
        return super.debugTypeId() + this.debugTypeIdSpacer() + this.nodeDescription()
    }
    

    // paths

    /*
    logName () {
        return this.browserPathString()
    }
    */

}.initThisCategory());
