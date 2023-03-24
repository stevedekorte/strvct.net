"use strict";

/*
    
    TilesView_orientation
    
*/

(class TilesView_orientation extends TilesView {
    
    // --- orientation ---

    syncOrientation () {
        if (this.isVertical()) {
            this.makeOrientationRight()
        } else {
            this.makeOrientationDown() 
        }
        return this
    }

    makeOrientationRight () { // left to right columns, top to bottom items?
        this.setFlexDirection("column") //  need to use flex to avoid gaps in rows despite 0 marins
        this.setMinAndMaxWidth("100%")
        this.setMinHeight("100%")
        //this.setMaxHeight("fit-content")
        //this.setFlexBasis("300px")
        //this.setMinAndMaxWidth("300px")
        //this.setMinAndMaxHeight(null)
        
        this.debugLog("makeOrientationRight on ", this.node() ? this.node().title() : null)
    }

    makeOrientationDown () { // top to bottom columns, left to right items?
        this.setFlexDirection("row")
        //this.setMinAndMaxWidth("fit-content")
        this.setMinAndMaxWidth("100%")
        this.setMinAndMaxHeight("100%")
        //this.setMinAndMaxWidth(null)
        //this.setMinAndMaxHeight("50px")   
        //this.setFlexBasis("300px")

        this.debugLog("makeOrientationDown on ", this.node() ? this.node().title() : null)

        this.tiles().forEach(item => {
            //item.setWidth("fit-content")
            item.setHeight("fit-content")
            //item.setHeight(this.desiredHeight()) // this could cause reflow, so let's avoid if we can
            //console.log("    prepare for down orientation on subview ", item.node().title())
        })
    }

    // --- get orientation ---

    isVertical () {
        return this.stackView().direction() === "right"
    }

    // --- stacking general ---

    stackTiles () {
        //this.assertTilesHaveParent()

        if (this.isVertical()) {
            this.stackTilesVertically()
        } else {
            this.stackTilesHorizontally()
        }
        return this
    }

    unstackTiles () {
        //this.assertTilesHaveParent()

        if (this.isVertical()) {
            this.unstackTilesVertically()
        } else {
            this.unstackTilesHorizontally()
        }
        return this
    }

    // --- stacking vertical ---

    stackTilesVertically () {
        // we don't need to order tiles for 1st call of stackTiles, 
        // but we do when calling stackTiles while moving a drop view around,
        // so just always do it as top is null, and tiles are already ordered the 1st time

        const orderedTiles = this.tiles().shallowCopy().sortPerform("topPx")
        const displayedTiles = orderedTiles.filter(r => !r.isDisplayHidden())
        let y = 0
        

        const offsets = displayedTiles.map(tile => tile.offsetTop())
        //console.log("---")

        // NOTE: having issues getting absolute positions to match relative ones
        // Why is getBoundingClientRect on tile always returning same top value as offsetParent.getBoundingClientRect ???

        displayedTiles.forEachKV((i, tile) => {
            //const oy = offsets[i]
            /*
            const dy = i === 0 ? 0 : offsets[i] - offsets[i-1]
            const parentRect = tile.element().offsetParent.getBoundingClientRect()
            const rect = tile.boundingClientRect()
            let h = parentRect.top - rect.top
            */

            let h = tile.computedHeight() 
            //let h = tile.offsetHeight()

            //console.log("h: " + h + " dy:" + dy)
            //console.log("y: " + y + " oy:" + offsets[i])

            if (tile.position() !== "absolute") { 
                // they are all not absolute when first dragging in
                // and stay absolute until unstack gets called at end of drag
                tile.makeAbsolutePositionAndSize()
                tile.setLeftPx(0)
                tile.setOrder(null)
            } 

            /*
            console.log("i:" + i)
            console.log("   computedHeight:" + tile.computedHeight())
            console.log("     offsetHeight:" + tile.offsetHeight())
            console.log("           offset:" + oy)
            console.log("                y:" + y)
            */

            tile.setTopPx(y)
            y += h + 2
        })
        //console.log("---")

        return this
    }

    unstackTilesVertically  () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("topPx")
        
        orderedTiles.forEach(tile => assert(tile.hasElement()) ) // todo: temp test
        orderedTiles.forEach(tile => tile.makeRelativePositionAndSize())

        this.removeAllSubviews()
        this.addSubviews(orderedTiles)
        return this
    }

    // --- stacking horizontal ---

    stackTilesHorizontally () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("leftPx") 
        const displayedTiles = orderedTiles.filter(r => !r.isDisplayHidden())
        let x = 0

        /*
        let names = []
        this.tiles().forEach((tile) => { 
            if (tile.node) { 
                names.push(tile.node().title() + " " + tile.leftPx() + "px")
            }
        })
        console.log("horizontal: ", names.join(", "))
        */
        
        displayedTiles.forEach((tile) => {
            let w = tile.computedWidth() 
            if (tile.position() !== "absolute") {
                tile.makeAbsolutePositionAndSize()
                tile.setTopPx(0)
                tile.setOrder(null)
            }
            tile.setLeftPx(x)
            x += w
        })

        return this
    }

    unstackTilesHorizontally () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("leftPx")
        orderedTiles.forEachPerform("makeRelativePositionAndSize")
        this.removeAllSubviews()
        this.addSubviews(orderedTiles)
        return this
    }


}.initThisCategory());
