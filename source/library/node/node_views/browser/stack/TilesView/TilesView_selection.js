"use strict";

/*
    
    TilesView_selection
    
*/

(class TilesView_selection extends TilesView {
    
    // --- column ---

    unselectTilesInNextColumn () {
        const c = this.nextColumn()
        if (c) {
            c.unselectAllTiles()
        }
        return this
    }

    /*
    didSelectItem (itemView) {
        console.log(this.typeId() + " didSelectItem")
        this.subviews().forEach(sv => {
            if (sv === itemView) {
                //sv.select()
            } else {
                sv.unselect()
            }
        })
    
        return false
    }
    */

    lastSelectedTile () {
        return this.selectedTiles().maxItem(tile => tile.lastSelectionDate().getTime())
    }

    // -- update isSelected ---
	
    didUpdateSlotIsSelected (oldValue, newValue) {
        debugger;
        super.didUpdateSlotIsSelected(oldValue, newValue)

        if (this.isSelected()) {
            const focusedView = WebBrowserWindow.shared().activeDomView()

            // TODO: need a better solution to this problem
            if (!focusedView || (focusedView && !this.hasFocusedDecendantView())) {
                this.focus()    
            }
        } else {
            this.blur()
        }
		
        return this
    }

    // --- tile tapping ---

    selectNode (aNode) {
        const sv = this.subviewForSubnode(aNode)
        if (sv) {
            this.didTapItem(sv)
        }
        return this
    }

    didTapItem (anItem) {
        //debugger;
        // if the item is already selected, this won't trigger a resync, so unselect first?
        //anItem.unselect()
        //debugger; 
        anItem.activate() 
        if (!anItem.hasFocusedDecendantView()) {
            anItem.focus()
            // anItem seems to already be focused somehow
        }
        this.unselectAllTilesExcept(anItem)
        this.unselectTilesInNextColumn()
        //this.tilesView().didChangeNavSelection()

        this.didChangeNavSelection() // this may already have been sent - but only if selection bool changed
    }
    
    didShiftTapItem (anItem) {
        let lastItem = this.lastSelectedTile()

        if (!lastItem) {
            lastItem = this.tiles().first()
        }

        if (lastItem) {
            const r1 = this.indexOfTile(anItem)
            const r2 = this.indexOfTile(lastItem)
            assert(r1 !== -1 && r2 !== -1)
            const i1 = Math.min(r1, r2)
            const i2 = Math.max(r1, r2)
            for (let i = i1; i <= i2; i++) {
                const item = this.tileAtIndex(i)
                if (!item.isSelected()) {
                    item.activate()
                }
            }
        }

        return this
    }

    didMetaTapItem (anItem) {
        anItem.toggleSelection()
    }

    // --- unselecting tiles ---
        
    unselectAllTilesExcept (selectedTile) {
        const tiles = this.tiles()

        // unselect all other tiles
        tiles.forEach(tile => {
            if (tile !== selectedTile) {
                if (tile.unselect) {
                    tile.unselect()
                } else {
                    //console.warn("=WARNING= " + this.typeId() + ".unselectAllTilesExcept() tile " + tile.typeId() + " missing unselect method")
                }
            }
        })
        
        return this
    }

    unselectAllTilesExceptTiles (tilesToSelect) {
        const tiles = this.tiles()

        // unselect all other tiles
        tiles.forEach(tile => {
            if (tilesToSelect.contains(tile)) {
                tile.performIfResponding("select") 
            } else {
                tile.performIfResponding("unselect") 
            }
        })
        
        return this
    }

    // --- selection ---

    /*
    didSelectTile (aTile) {
        this.didChangeNavSelection()
    }

    didUnselectTile (aTile) {
        this.didChangeNavSelection()

    }
    */

    hasMultipleSelections () {
        return this.selectedTiles().length > 0
    }

    // --- selected tiles ---

    selectedTiles () {
        let tiles = this.tiles().filter(tile => tile.thisClass().isSubclassOf(Tile))
        const selected = tiles.filter(tile => tile.isSelected())
        return selected
    }

    selectedTile () {
        const sr = this.selectedTiles()
        if (sr.length === 1) {
            return sr.first()
        }
        return null
    }

    // --- selected nodes ---

    selectedNodes () {
        return this.selectedTiles().map(tile => tile.node())
    }

    selectedNode () {
        const r = this.selectedTile()
        return r ? r.node() : null
    }
    
    selectedTileIndex () { 
        // returns -1 if no tiles selected
        return this.tiles().indexOf(this.selectedTile())
    }

    // --- selecting tiles ---
    
    setSelectedTileIndex (index) {
        const oldIndex = this.selectedTileIndex()
        //console.log("this.setSelectedTileIndex(" + index + ") oldIndex=", oldIndex)
        if (index !== oldIndex) {
            const tiles = this.tiles()
            if (index >= 0 && index < tiles.length) {
                const tile = tiles[index]
                this.didTapItem(tile)
            }
        }
        return this
    }
  
    indexOfTileWithNode (aNode) {
        return this.tiles().detectIndex(tile => tile.node() === aNode)
    }

    selectAllTiles () {
        this.tiles().forEachPerformIfResponds("select")
        return this
    }

    unselectAllTiles () {
        this.tiles().forEachPerformIfResponds("unselect")
        return this
    }

    selectTileWithNode (aNode) {
        //console.log(">>> column " + this.node().title() + " select tile " + aNode.title())
        const selectedTile = this.tileWithNode(aNode)
		
        if (selectedTile) {
            selectedTile.setIsSelected(true)
			
            this.tiles().forEach((aTile) => {
                if (aTile !== selectedTile) {
                    aTile.unselect()
                }
            })
        }

        return selectedTile
    }
    
    selectedTileTitle () {
        const tile = this.selectedTile()
        if (tile) { 
            return tile.title().innerHtml() 
        }
        return null
    }

    showSelected () {
        /*
        TODO: add check if visible
        if (this.selectedTile()) {
            this.selectedTile().scrollIntoView()
        }
        */
        //this.didChangeNavSelection()
        return this	    
    }

     // nextTile

     nextTile () {
        const si = this.selectedTileIndex()
        if (si !== -1 && si < this.tiles().length) {
            const nextTile = this.tiles()[si +1]
            return nextTile
        }
        return null
    }
    
    selectFirstTile () {
        this.setSelectedTileIndex(0)
        return this
    }

    firstTile () {
        if (this.tiles().length > 0) {
            return this.tiles()[0]
        }
        return null
    }

    selectNextTile () {
        const si = this.selectedTileIndex()
        if (si === -1) {
            this.setSelectedTileIndex(0)
        } else {
            this.setSelectedTileIndex(si + 1)
        }
        return this
    }
    
    selectPreviousTile () {
        const si = this.selectedTileIndex()
        if (si === -1) {
            this.setSelectedTileIndex(0)
        } else {
            this.setSelectedTileIndex(si - 1)
        }
        return this
    }

    // --- focus / selection ---
    
    isInBrowser () {
        return !Type.isNull(this.parentView())
    }

    shouldFocusAndExpandSubnode (aNote) { // focus & expand tile - can be activated by note from node
        if (!this.isInBrowser()) {
            return this
        }

	    const subnode = aNote.info()
	    let subview = this.subviewForNode(subnode)
	    
        if (!subview) {
            this.syncFromNodeNow()
	        subview = this.subviewForNode(subnode)
        } 

        if (subview) {
            this.selectTileWithNode(subnode)
            subview.scrollIntoView()
            subview.justTap()
            //this.didChangeNavSelection()
		    //subview.dynamicScrollIntoView()
        } else {
            console.warn(this.type() + " for node " + this.node().typeId() + " has no matching subview for shouldSelectSubnode " + subnode.typeId())
	    }

	    return this 
    }

    shouldFocusSubnode (aNote) { //  focus but don't expand tile
	    const subnode = aNote.info()

	    let subview = this.subviewForNode(subnode)
	    
        if (!subview) {
            this.syncFromNodeNow()
	        subview = this.subviewForNode(subnode)
        } 

        if (subview) {
            this.selectTileWithNode(subnode)
            subview.scrollIntoView()

            // just focus the tile without expanding it
            /*
            if (this.previousItemSet()) {
                this.previousItemSet().didChangeNavSelection()
            }
            */

            this.didChangeNavSelection()
		    //subview.dynamicScrollIntoView()
        } else {
            console.warn(this.type() + " for node " + this.node().typeId() + " has no matching subview for shouldFocusSubnode " + subnode.typeId())
            //console.log("tile nodes = ", this.tiles().map(tile => tile.node().typeId()) )
	    }

	    return this 
    }

    didChangeNavSelection () {
        const sv = this.stackView()
        if (sv) {
            sv.didChangeNavSelection()
        }
        return this
    }
	
    // --- scrolling ---

    scrollToSubnode (aSubnode) {
	    //this.debugLog(".scrollToSubnode")
	    const subview = this.subviewForNode(aSubnode)
	    assert(subview)
	    this.navView().scrollView().setScrollTop(subview.offsetTop())
	    return this 	    
    }

    scrollToBottom () {
        const last = this.tiles().last()

        if (last) { 
            last.scrollIntoView()
        }

        return this
    }

    // --------------

    /*
    focus () {
        super.focus()
		
	    if (this.selectedTileIndex() === -1) {
            const sr = this.tiles().first()
            if (sr) {
                sr.setShouldShowFlash(true)
            }
            this.setSelectedTileIndex(0)
        }

        //this.debugLog(" focus")
        return this
    }
    */
    
    selectNextColumn () {
        const nextColumn = this.nextColumn()
        if (nextColumn) {
            this.blur()
            //console.log("nextColumn.focus()")
            /*
            const sr = nextColumn.selectedTile()
            if (sr) {
                sr.setShouldShowFlash(true)
            }
            */
            nextColumn.focus()
            nextColumn.selectFirstTile()
        }
        return this
    }

    selectPreviousColumn () {
        //this.log("selectPreviousColumn this.columnIndex() = " + this.columnIndex())
        const prevColumn = this.previousItemSet()
        if (prevColumn) {
            this.blur()
            prevColumn.focus()
            //this.didChangeNavSelection()
        }
        return this
    }

    // --- select nodes ---

    selectAndFocusNodes (nodes) {
        const selectTiles = this.tilesWithNodes(nodes)
        this.unselectAllTilesExceptTiles(selectTiles)
        if (nodes.length === 1) {
            const focusNode = nodes.first()
            focusNode.parentNode().postShouldFocusAndExpandSubnode(focusNode)
        }
        return this
    }

    // --- key views ---
    
    selectNextKeyView () {
        const nextTile = this.nextTile()
        if (nextTile) {
            this.selectNextTile()
            nextTile.becomeKeyView()
        } else {
            const firstTile = this.firstTile()
            if (firstTile) {
                this.selectFirstTile()
                firstTile.becomeKeyView()
            }
        }
        return this
    }

    // --- helpers ---

    selectFirstTile () {
        if (this.subviews().length) {
            this.setSelectedTileIndex(0)
        }
        return this
    }

    selectLastTile () {
        const count = this.subviews().length
        if (count) {
            this.setSelectedTileIndex(count - 1)
        }
    }

}.initThisCategory());
