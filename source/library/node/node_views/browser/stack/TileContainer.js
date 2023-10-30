"use strict";

/*
    
    TileContainer
    
*/

(class TileContainer extends NodeView {

    initPrototypeSlots () {
        this.newSlot("tile", null)
    }

    init () {
        super.init()
        //this.setDisplay("block")
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setFlexDirection("column")
        this.setFlexGrow(1)
        //this.setOpacity(0)
        this.setOverflow("hidden")
        this.setUserSelect("none")
        //this.setTransition("opacity 0.5s ease-in-out")
        //this.setTransition("flex-basis 0.1s")
        this.setTransition("opacity 0.5s ease-in-out, flex-basis 0s")
        //this.setMinAndMaxHeight("fit-content")
        this.makeOrientationRight()
        this.setIsDisplayHidden(true)

        return this
    }

    // --- orientation ---

    isVertical () {
        const sv = this.parentView()
        if (!sv) {
            return null
        }
        return sv.isVertical()
    }

    syncOrientation () {
        if (this.isVertical()) {
            this.makeOrientationRight()
        } else {
            this.makeOrientationDown()
        }
        return this
    }

    // ---

    makeOrientationRight () {
        /*
        // stack view is left to right, so nav items are top to bottom
        this.setFlexDirection("column")
        //this.setFlexBasis(this.targetWidth() + "px")
        this.setFlexGrow(0)
        this.setFlexShrink(0)

        // this are handled in sync to node
        this.setMinAndMaxWidth("17em") // syncFromNode can override if node requests a sizes
        this.setMinAndMaxHeight("100%")
        */
        this.setWidth("-webkit-fill-available")
        this.setHeight("fit-content")
    }

    makeOrientationDown () {
        /*
        // stack view is top to bottom, so nav items are left to right

        this.setFlexDirection("row")
        //this.setFlexBasis(this.targetHeight() + "px")
        this.setFlexGrow(0)
        this.setFlexShrink(0)

        this.setMinAndMaxWidth("100%")
        this.setMinAndMaxHeight("5em")
        */
        this.setWidth("fit-content")
        this.setHeight("-webkit-fill-available")
    }

    removeTile () {
        const oldTile = this.tile()
        if (oldTile) {
            oldTile.setNode(null)
            this.removeSubview(oldTile)
        }
        return this
    }

    setNode (aNode) {
        super.setNode(aNode)

        if (aNode === null) {
            this.removeTile()
            this.setIsDisplayHidden(true)
        } else {
            this.setIsDisplayHidden(false)
            const tile = this.tile()
            if (tile) {
                const tileClass = this.subviewProtoForSubnode(aNode);
                if (tile.thisClass() !== aClass) {
                    this.setupTile()
                }   
            } else {
                this.setupTile()
            }
        }
        return this
    }

    setupTile () {
        this.removeTile()
        const tileClass = this.node().nodeTileClass() // we need this to get tile versions of view
        assert(tileClass)
        const newTile = tileClass.clone()
        newTile.setNode(this.node())
        this.setTile(newTile)
        this.addSubview(newTile)
        return this
    }

    syncFromNode () {
        this.syncOrientation()
        if (this.tile()) {
            this.tile().syncFromNode()
        }
        //this.applyStyles()
        return this
    }

}.initThisClass());
