"use strict";

/**
 * @module library.node.node_views.browser.stack.TilesView
 * @class TilesView_selection
 * @extends TilesView
 * @classdesc
 * TilesView_selection extends TilesView to handle selection-related functionality.
 */
(class TilesView_selection extends TilesView {
    
    /**
     * @description Unselects tiles in the next column.
     * @returns {TilesView_selection} The current instance.
     */
    unselectTilesInNextColumn () {
        const c = this.nextColumn()
        if (c) {
            c.unselectAllTiles()
        }
        return this
    }

    /**
     * @description Gets the last selected tile.
     * @returns {Tile} The last selected tile.
     */
    lastSelectedTile () {
        return this.selectedTiles().maxItem(tile => tile.lastSelectionDate().getTime())
    }

    /**
     * @description Handles updates to the isSelected slot.
     * @param {boolean} oldValue - The old value of isSelected.
     * @param {boolean} newValue - The new value of isSelected.
     * @returns {TilesView_selection} The current instance.
     */
    didUpdateSlotIsSelected (oldValue, newValue) {
        debugger;
        super.didUpdateSlotIsSelected(oldValue, newValue)

        if (this.isSelected()) {
            const focusedView = WebBrowserWindow.shared().activeDomView()

            if (!focusedView || (focusedView && !this.hasFocusedDecendantView())) {
                this.focus()    
            }
        } else {
            this.blur()
        }
		
        return this
    }

    /**
     * @description Selects a node.
     * @param {BMNode} aNode - The node to select.
     * @returns {TilesView_selection} The current instance.
     */
    selectNode (aNode) {
        const sv = this.subviewForSubnode(aNode)
        if (sv) {
            this.didTapItem(sv)
        }
        return this
    }

    /**
     * @description Handles tapping on an item.
     * @param {Tile} anItem - The tapped item.
     */
    didTapItem (anItem) {
        anItem.activate() 
        if (!anItem.hasFocusedDecendantView()) {
            anItem.focus()
        }
        this.unselectAllTilesExcept(anItem)
        this.unselectTilesInNextColumn()
        this.didChangeNavSelection()
    }
    
    /**
     * @description Handles shift-tapping on an item.
     * @param {Tile} anItem - The shift-tapped item.
     * @returns {TilesView_selection} The current instance.
     */
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

    /**
     * @description Handles meta-tapping on an item.
     * @param {Tile} anItem - The meta-tapped item.
     */
    didMetaTapItem (anItem) {
        anItem.toggleSelection()
    }

    /**
     * @description Unselects all tiles except the specified one.
     * @param {Tile} selectedTile - The tile to keep selected.
     * @returns {TilesView_selection} The current instance.
     */
    unselectAllTilesExcept (selectedTile) {
        const tiles = this.tiles()

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

    /**
     * @description Unselects all tiles except the specified ones.
     * @param {Array<Tile>} tilesToSelect - The tiles to keep selected.
     * @returns {TilesView_selection} The current instance.
     */
    unselectAllTilesExceptTiles (tilesToSelect) {
        const tiles = this.tiles()

        tiles.forEach(tile => {
            if (tilesToSelect.contains(tile)) {
                tile.performIfResponding("select") 
            } else {
                tile.performIfResponding("unselect") 
            }
        })
        
        return this
    }

    /**
     * @description Checks if there are multiple selections.
     * @returns {boolean} True if there are multiple selections, false otherwise.
     */
    hasMultipleSelections () {
        return this.selectedTiles().length > 0
    }

    /**
     * @description Gets the selected tiles.
     * @returns {Array<Tile>} An array of selected tiles.
     */
    selectedTiles () {
        let tiles = this.tiles().filter(tile => tile.thisClass().isSubclassOf(Tile))
        const selected = tiles.filter(tile => tile.isSelected())
        return selected
    }

    /**
     * @description Gets the selected tile.
     * @returns {Tile|null} The selected tile, or null if none or multiple are selected.
     */
    selectedTile () {
        const sr = this.selectedTiles()
        if (sr.length === 1) {
            return sr.first()
        }
        return null
    }

    /**
     * @description Gets the selected nodes.
     * @returns {Array<BMNode>} An array of selected nodes.
     */
    selectedNodes () {
        return this.selectedTiles().map(tile => tile.node())
    }

    /**
     * @description Gets the selected node.
     * @returns {BMNode|null} The selected node, or null if none is selected.
     */
    selectedNode () {
        const r = this.selectedTile()
        return r ? r.node() : null
    }
    
    /**
     * @description Gets the index of the selected tile.
     * @returns {number} The index of the selected tile, or -1 if none is selected.
     */
    selectedTileIndex () { 
        return this.tiles().indexOf(this.selectedTile())
    }

    /**
     * @description Sets the selected tile by index.
     * @param {number} index - The index of the tile to select.
     * @returns {TilesView_selection} The current instance.
     */
    setSelectedTileIndex (index) {
        const oldIndex = this.selectedTileIndex()
        if (index !== oldIndex) {
            const tiles = this.tiles()
            if (index >= 0 && index < tiles.length) {
                const tile = tiles[index]
                this.didTapItem(tile)
            }
        }
        return this
    }
  
    /**
     * @description Gets the index of the tile with the specified node.
     * @param {BMNode} aNode - The node to find the tile for.
     * @returns {number} The index of the tile, or -1 if not found.
     */
    indexOfTileWithNode (aNode) {
        return this.tiles().detectIndex(tile => tile.node() === aNode)
    }

    /**
     * @description Selects all tiles.
     * @returns {TilesView_selection} The current instance.
     */
    selectAllTiles () {
        this.tiles().forEachPerformIfResponds("select")
        return this
    }

    /**
     * @description Unselects all tiles.
     * @returns {TilesView_selection} The current instance.
     */
    unselectAllTiles () {
        this.tiles().forEachPerformIfResponds("unselect")
        return this
    }

    /**
     * @description Selects the tile with the specified node.
     * @param {BMNode} aNode - The node to select the tile for.
     * @returns {Tile|null} The selected tile, or null if not found.
     */
    selectTileWithNode (aNode) {
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
    
    /**
     * @description Gets the title of the selected tile.
     * @returns {string|null} The title of the selected tile, or null if none is selected.
     */
    selectedTileTitle () {
        const tile = this.selectedTile()
        if (tile) { 
            return tile.title().innerHtml() 
        }
        return null
    }

    /**
     * @description Shows the selected tile.
     * @returns {TilesView_selection} The current instance.
     */
    showSelected () {
        return this	    
    }

    /**
     * @description Gets the next tile.
     * @returns {Tile|null} The next tile, or null if there is no next tile.
     */
    nextTile () {
        const si = this.selectedTileIndex()
        if (si !== -1 && si < this.tiles().length) {
            const nextTile = this.tiles()[si +1]
            return nextTile
        }
        return null
    }
    
    /**
     * @description Selects the first tile.
     * @returns {TilesView_selection} The current instance.
     */
    selectFirstTile () {
        this.setSelectedTileIndex(0)
        return this
    }

    /**
     * @description Gets the first tile.
     * @returns {Tile|null} The first tile, or null if there are no tiles.
     */
    firstTile () {
        if (this.tiles().length > 0) {
            return this.tiles()[0]
        }
        return null
    }

    /**
     * @description Selects the next tile.
     * @returns {TilesView_selection} The current instance.
     */
    selectNextTile () {
        const si = this.selectedTileIndex()
        if (si === -1) {
            this.setSelectedTileIndex(0)
        } else {
            this.setSelectedTileIndex(si + 1)
        }
        return this
    }
    
    /**
     * @description Selects the previous tile.
     * @returns {TilesView_selection} The current instance.
     */
    selectPreviousTile () {
        const si = this.selectedTileIndex()
        if (si === -1) {
            this.setSelectedTileIndex(0)
        } else {
            this.setSelectedTileIndex(si - 1)
        }
        return this
    }

    /**
     * @description Checks if the view is in a browser.
     * @returns {boolean} True if the view is in a browser, false otherwise.
     */
    isInBrowser () {
        return !Type.isNull(this.parentView())
    }

    /**
     * @description Focuses and expands a subnode.
     * @param {BMNotification} aNote - The notification containing the subnode info.
     * @returns {TilesView_selection} The current instance.
     */
    shouldFocusAndExpandSubnode (aNote) {
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
        } else {
            console.warn(this.type() + " for node " + this.node().typeId() + " has no matching subview for shouldSelectSubnode " + subnode.typeId())
	    }

	    return this 
    }

    /**
     * @description Focuses a subnode without expanding it.
     * @param {BMNotification} aNote - The notification containing the subnode info.
     * @returns {TilesView_selection} The current instance.
     */
    shouldFocusSubnode (aNote) {
	    const subnode = aNote.info()

	    let subview = this.subviewForNode(subnode)
	    
        if (!subview) {
            this.syncFromNodeNow()
	        subview = this.subviewForNode(subnode)
        } 

        if (subview) {
            this.selectTileWithNode(subnode)
            subview.scrollIntoView()

            this.didChangeNavSelection()
        } else {
            console.warn(this.type() + " for node " + this.node().typeId() + " has no matching subview for shouldFocusSubnode " + subnode.typeId())
	    }

	    return this 
    }

    /**
     * @description Notifies that the navigation selection has changed.
     * @returns {TilesView_selection} The current instance.
     */
    didChangeNavSelection () {
        const sv = this.stackView()
        if (sv) {
            sv.didChangeNavSelection()
        }
        return this
    }
	
    /**
     * @description Scrolls to a specific subnode.
     * @param {BMNode} aSubnode - The subnode to scroll to.
     * @returns {TilesView_selection} The current instance.
     */
    scrollToSubnode (aSubnode) {
	    const subview = this.subviewForNode(aSubnode)
	    assert(subview)
	    this.navView().scrollView().setScrollTop(subview.offsetTop())
	    return this 	    
    }

    /**
     * @description Scrolls to the bottom of the view.
     * @returns {TilesView_selection} The current instance.
     */
    scrollToBottom () {
        const last = this.tiles().last()

        if (last) { 
            last.scrollIntoView()
        }

        return this
    }

    /**
     * @description Selects the next column.
     * @returns {TilesView_selection} The current instance.
     */
    selectNextColumn () {
        const nextColumn = this.nextColumn()
        if (nextColumn) {
            this.blur()
            nextColumn.focus()
            nextColumn.selectFirstTile()
        }
        return this
    }

    /**
     * @description Selects the previous column.
     * @returns {TilesView_selection} The current instance.
     */
    selectPreviousColumn () {
        const prevColumn = this.previousItemSet()
        if (prevColumn) {
            this.blur()
            prevColumn.focus()
        }
        return this
    }

    /**
     * @description Selects and focuses on specified nodes.
     * @param {Array<BMNode>} nodes - The nodes to select and focus.
     * @returns {TilesView_selection} The current instance.
     */
    selectAndFocusNodes (nodes) {
        const selectTiles = this.tilesWithNodes(nodes)
        this.unselectAllTilesExceptTiles(selectTiles)
        if (nodes.length === 1) {
            const focusNode = nodes.first()
            focusNode.parentNode().postShouldFocusAndExpandSubnode(focusNode)
        }
        return this
    }

    /**
     * @description Selects the next key view.
     * @returns {TilesView_selection} The current instance.
     */
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

    /**
     * @description Selects the first tile.
     * @returns {TilesView_selection} The current instance.
     */
    selectFirstTile () {
        if (this.subviews().length) {
            this.setSelectedTileIndex(0)
        }
        return this
    }

    /**
     * @description Selects the last tile.
     * @returns {TilesView_selection} The current instance.
     */
    selectLastTile () {
        const count = this.subviews().length
        if (count) {
            this.setSelectedTileIndex(count - 1)
        }
    }

}.initThisCategory());
