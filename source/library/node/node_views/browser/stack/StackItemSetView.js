"use strict";

/*
    
    StackItemSetView
    
*/

(class StackItemSetView extends NodeView {
    
        
    initPrototype () {
        this.newSlot("tiles", null)
        this.newSlot("allowsCursorNavigation", true)
        this.newSlot("defaultTileStyles", null)
        this.newSlot("tileStyles", null)
        this.newSlot("tilePlaceHolder", null)
        this.newSlot("hasPausedSync", false)
        //this.newSlot("isColumnInspecting", false)
    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        //this.setFlexBasis("fit-content")
        //this.setFlexGrow(0)
        //this.setFlexShrink(0)
        this.makeOrientationRight()

        this.setOverflow("hidden")
        this.setWebkitOverflowScrolling("regular")
        this.setMsOverflowStyle("none")
        this.setUserSelect("none")

        //this.setIsDebugging(true)
        this.setIsRegisteredForKeyboard(true)
        this.setAcceptsFirstResponder(true)

        this.setUserSelect("none")
        this.addGestureRecognizer(PinchGestureRecognizer.clone()) // for pinch open to add tile
        this.addGestureRecognizer(TapGestureRecognizer.clone()) // for pinch open to add tile

        this.setTileStyles(BMViewStyles.clone().setToWhiteOnBlack())
        //this.tileStyles().selected().setBackgroundColor("red")

        this.setIsRegisteredForBrowserDrop(true)
        
        //this.setBorder("1px dashed red")
        this.setDefaultSubviewProto(TitledTile)

        return this
    }

    /*
    didInit () {
        super.didInit()
        //this.applyStyles()
    }
    */

    // --- helpers ---
    // subview path: StackView -> StackNavView -> ScrollView -> StackItemSetView -> Tiles

    browser () {
        return this.stackView()
    }

    scrollView () {
        return this.parentView()
    }

    stackNavView () {
        return this.scrollView().parentView()
    }

    stackView () {
        return this.stackNavView().parentView()
    }

    // -- orientation --

    syncOrientation () {
        if (this.isVertical()) {
            this.makeOrientationRight()
        } else {
            this.makeOrientationDown() 
        }
        return this
    }

    makeOrientationRight () { // left to right columns, top to bottom items?
        //this.setFlexDirection("column")
        this.setMinAndMaxWidth("100%")
        this.setMinHeight("100%")
        //this.setMaxHeight("fit-content")
        //this.setFlexBasis("300px")
        //this.setMinAndMaxWidth("300px")
        //this.setMinAndMaxHeight(null)
        
        this.debugLog("makeOrientationRight on ", this.node() ? this.node().title() : null)
    }

    makeOrientationDown () { // top to buttom columns, left to right items?
        //this.setFlexDirection("row")
        //this.setMinAndMaxWidth("fit-content")
        this.setMinAndMaxWidth("100%")
        this.setMinAndMaxHeight("100%")
        //this.setMinAndMaxWidth(null)
        //this.setMinAndMaxHeight("50px")   
        //this.setFlexBasis("300px")

        this.debugLog("makeOrientationDown on ", this.node() ? this.node().title() : null)

        this.tiles().forEach(item => {
            //item.setWidth("fit-content")
            item.setHeight(this.desiredHeight())
            //console.log("    prepare for down orientation on subview ", item.node().title())
        })
    }

    syncFromNode () {
        this.syncOrientation()
        super.syncFromNode() 

        /*
        if (this.node().nodeMinTileHeight()) {
            this.setMinAndMaxHeight(this.node().nodeMinTileHeight())
        }
        */

        if (this.selectedTiles().length === 0) {
            //this.didChangeNavSelection() // TODO: is this right?
        }
        return this
    }

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

    onFocus () {
        return super.onFocus()
    }

    setTileBackgroundColor (aColor) {
        this.tileStyles().unselected().setBackgroundColor(aColor)
        return this
    }

    setTileSelectionColor (aColor) {
        this.tileStyles().selected().setBackgroundColor(aColor)
        return this
    }

    applyStyles () {
        //this.debugLog(".applyStyles()")
        super.applyStyles()
        return this
    }
    
    title () {
        return this.node() ? this.node().title() : ""
    }



    // --- tiles ---
    
    tiles () {
        return this.subviews()
    }

    addTile (v) {
        return this.addSubview(v)
    }

    removeTile (v) {
        return this.removeSubview(v)
    }

    // selection
	
    didUpdateSlotIsSelected (oldValue, newValue) {
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

    /*
    darkenUnselectedTiles () {
        const darkenOpacity = 0.5
        this.tiles().forEach(tile => {
            if (tile.isSelected()) {
                tile.setOpacity(1)
            } else {
                tile.setOpacity(darkenOpacity)
            }
        })
        return this
    }

    undarkenAllTiles () {
        this.tiles().forEach((tile) => {
            tile.setOpacity(1)
        })
    }
    */

    tilesWithNodes (nodeArray) {
        return nodeArray.map(node => this.tileWithNode(node))
    }

    tileWithNode (aNode) {
        return this.tiles().detect(tile => tile.node() === aNode)
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
        anItem.select() 
        if (!anItem.hasFocusedDecendantView()) {
            anItem.focus()
            // anItem seems to already be focused somehow
        }
        this.unselectAllTilesExcept(anItem)
        this.unselectTilesInNextColumn()
        //this.didChangeNavSelection() // this may already have been sent
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
                    item.select()
                }
            }
        }

        return this
    }

    didMetaTapItem (anItem) {
        anItem.toggleSelection()
    }

    // ------------------
        
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

    // -----------------------------------------

    indexOfTile (aTile) {
        // we might want this to be based on flex view order instead, 
        // so best to keep it abstract
        return this.indexOfSubview(aTile)
    }

    tileAtIndex (anIndex) {
        return this.subviews().at(anIndex)
    }

    lastSelectedTile () {
        return this.selectedTiles().maxItem(tile => tile.lastSelectionDate().getTime())
    }

    /*
    didSelectTile (aTile) {
        this.didChangeNavSelection()
    }

    didUnselectTile (aTile) {
        this.didChangeNavSelection()

    }
    */

  
    // selection

    hasMultipleSelections () {
        return this.selectedTiles().length > 0
    }

    // selected tiles

    selectedTiles () {
        return this.tiles().filter(tile => tile.isSelected && tile.isSelected())
    }

    selectedTile () {
        const sr = this.selectedTiles()
        if (sr.length === 1) {
            return sr.first()
        }
        return null
    }

    // selected nodes

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

    // selecting tiles
    
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

    tileWithNode (aNode) {
        const tile = this.tiles().detect(tile => tile.node().nodeTileLink() === aNode)
        return tile
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

    // --- sync -----------------------------

    subviewProtoForSubnode (aSubnode) {
        let proto = aSubnode.nodeTileClass() // we need this to get tile versions of view
		
        if (!proto) {
            proto = this.defaultSubviewProto()
        }
				
        return proto      
    }

    didChangeNode () {
        super.didChangeNode()

        if (this.node() && this.node().nodeTilesStartAtBottom()) {
            this.addTimeout(() => { this.scrollToBottom() }, 0)
            //this.tile().last().scrollIntoView()
        }

        return this
    }

    isInBrowser () {
        return !Type.isNull(this.parentView())
    }

    shouldFocusAndExpandSubnode (aNote) { // focus & expand tile
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
	
    scrollToSubnode (aSubnode) {
	    //this.debugLog(".scrollToSubnode")
	    const subview = this.subviewForNode(aSubnode)
	    assert(subview)
	    this.stackNavView().scrollView().setScrollTop(subview.offsetTop())
	    return this 	    
    }
    
    scrollToBottom () {
        const last = this.tiles().last()

        if (last) { 
            last.scrollIntoView()
        }

        return this
    }
	
    // --- keyboard controls, arrow navigation -----------------------------

    canNavigate () {
        return this.allowsCursorNavigation() 
        //return this.allowsCursorNavigation() && this.isActiveElement()
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


    // --- controls --------------

    onMetaKeyDown (event) {
        console.log("new folder")
        event.stopPropagation()
        event.preventDefault();
    }

    onMeta_m_KeyDown (event) {
        console.log("new folder")
        event.stopPropagation()
        event.preventDefault()
    }

    onMeta_d_KeyDown (event) {
        console.log("duplicate selection down")
        this.duplicateSelectedTiles()
        event.stopPropagation()
        event.preventDefault();
    }

    duplicateSelectedTiles () {
        const newNodes = []

        this.selectedTiles().forEach(tile => {
            const i = this.indexOfSubview(tile)
            const dupNode = tile.node().duplicate()
            newNodes.push(dupNode)
            this.node().addSubnodeAt(dupNode, i+1)
        })
        this.unselectAllTiles()
        this.syncFromNodeNow()

        // TODO: unselect current tiles at browser level
        newNodes.forEach(newNode => {
            const newTile = this.tileWithNode(newNode)
            if (newTile) {
                newTile.select()
            }
        })

        return this
    }

    onMeta_d_KeyUp (event) {
        console.log("duplicate selection up")
        this.selectedTiles().forEach()
        event.stopPropagation()
        event.preventDefault();
    }

    onShiftBackspaceKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onShiftBackspaceKeyUp")
        if (this.selectedTile()) { 
            this.selectedTile().delete()
        }
        event.stopPropagation()
    }

    onShiftPlusKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onShiftPlusKeyUp")
        this.addIfPossible()
        event.stopPropagation()
    }

    addIfPossible () {
        const node = this.node()

        if (node.canSelfAddSubnode()) {
            const newNode = node.add()
            if (newNode) {
                this.syncFromNode()
                const newSubview = this.subviewForNode(newNode)
                newSubview.justTap()
            }
        }
    }

    // duplicate

    onAlternate_d_KeyUp (event) {
        //this.debugLog(" onMetaLeft_d_KeyUp")
        this.duplicateSelectedTile()
        return false // stop propogation
    }

    // select all

    onMeta_a_KeyDown (event) {
        this.selectAllTiles()
        event.stopPropagation()
        return false // stop propogation
    }

    // inspecting

    isInspecting () {
        /*
        if (this.isColumnInspecting()) {
            return true
        }
        */
        // see if the tile that selected this column is being inspected
        const prev = this.previousItemSet() 
        if (prev) {
            const tile = prev.selectedTile()
            if (tile) {
                return tile.isInspecting()
            }
        }
        return false
    }

    duplicateSelectedTile () {
        const node = this.node()
        const tile = this.selectedTile()
        const canAdd = node.canSelfAddSubnode() 
        if (tile && canAdd) {
            const canCopy = !Type.isNullOrUndefined(tile.node().copy)
            if (canCopy) { 
                //this.debugLog(" duplicate selected tile " + this.selectedTile().node().title())
                const subnode = tile.node()
                const newSubnode = subnode.copy()
                const index = node.indexOfSubnode(subnode)
                node.addSubnodeAt(newSubnode, index)
                this.scheduleSyncFromNode()
            }
        }
    }

    onControl_c_KeyUp (event) {
        // copy?
    }

    onControl_p_KeyUp (event) {
        // paste?
    }

    // --- arrow keys ---

    onUpArrowKeyDown (event) {
        if (!this.canNavigate()) { 
            return 
        }

        if (this.isVertical()) {
            this.moveDown()
        } else {
            this.moveLeft()
        }
        return false
    }
	
    onDownArrowKeyDown (event) {
        if (!this.canNavigate()) { 
            return 
        }

        if (this.isVertical()) {
            this.moveUp()
        } else {
            this.moveRight()
        }
        return false
    }

	
    onLeftArrowKeyUp (event) {
        if (!this.canNavigate()) { 
            return this
        }	
        if (this.isVertical()) {
            this.moveLeft()
        } else {
            this.moveDown()
        }
    }
	
    onRightArrowKeyUp (event) {
        if (!this.canNavigate()) { 
            return this
        }	

        if (this.isVertical()) {
            this.moveRight()
        } else {
            this.moveUp()
        }
    }

    // --- arrow moves ---

    moveLeft () {
        const pc = this.previousItemSet()	
        if (pc) {
            if (this.selectedTile()) { 
                this.selectedTile().unselect() 
            }
			
            const newSelectedTile = pc.selectedTile()
            newSelectedTile.setShouldShowFlash(true).updateSubviews()
            pc.didTapItem(newSelectedTile)
        	this.selectPreviousColumn()

            //debugger;
            pc.didChangeNavSelection()
        }
        return this
    }

    moveRight () {
        this.selectNextColumn()
        return this
    }

    moveUp () {
        this.selectNextTile()
        this.showSelected()
        return this
    }

    moveDown () {
        this.selectPreviousTile()
        this.showSelected()
        return this
    }

    // -----------------------------------------------

    onEscapeKeyDown (event) {
        //this.setIsColumnInspecting(false)

        if (!this.canNavigate()) { 
            return this
        }	

        this.moveLeft()
        //return true
    }
	
    // --- enter key begins tile editing ---------------------------
	
    onEnterKeyUp (event) {        
        if (!this.canNavigate()) { 
            return this
        }
	
        const tile = this.selectedTile()
        if (tile) { 
		    tile.onEnterKeyUp(event)
        }

        return false
    }

    // --- keyboard controls, add and delete actions -----------------------------

    /*
    deleteTile (aTile) {
        let sNode = aTile.node()
        if (sNode && sNode.canDelete()) { 
			sNode.performAction("delete") 
		}
        return this
    }

    deleteSelectedTiles () {
        this.selectedTiles().forEach(r => this.deleteTile(r))

        if (this.tiles().length === 0) {
            this.selectPreviousColumn()
        }
    }
    */

    onShiftDeleteKeyUp (event) {
        if (!this.canNavigate()) { 
            return 
        }

        //this.deleteSelectedTiles()
        return false
    }
	
    onPlusKeyUp (event) {
        if (!this.canNavigate()) { 
            return 
        }		

        const sNode = this.selectedNode()
        if (sNode && sNode.hasAction("add")) { 
            const newNode = sNode.performAction("add") 
            this.selectNextColumn()
            if (this.nextColumn()) {
                this.nextColumn().selectTileWithNode(newNode)
            }
        }
        return false		
    }
	
    // -----------------------------
    
    /*
    setIsColumnInspecting (aBool) {
        if (this._isColumnInspecting !== aBool) {
            this._isColumnInspecting = aBool
            this.scheduleSyncFromNode()
        }
        return this
    }
    */

    onTapComplete (aGesture) {
        console.log(this.typeId() + ".onTapComplete()")
        if (this.node()) {

            // add a subnode if tapping on empty area
            const p = aGesture.downPosition() // there may not be an up position on windows?
            //this.debugLog(".onTapComplete() ", aGesture.upEvent())
            if (p.event().target === this.element()) {
                const keyModifiers = BMKeyboard.shared().modifierNamesForEvent(aGesture.upEvent());
                const isAltTap = keyModifiers.contains("Alternate");
                if (isAltTap) {
                    // inspect parent node
                    //this.setIsColumnInspecting(true)
                    return this
                } else {
                    this.addIfPossible()
                }
            }
        }
        return this
    }

    // -----------------------------

    columnIndex () {
        return this.parentViewsOfClass(StackView).length
    }

    // nextTile

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

    nextTile () {
        const si = this.selectedTileIndex()
        if (si !== -1 && si < this.tiles().length) {
            const nextTile = this.tiles()[si +1]
            return nextTile
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

    // next column
    
    nextColumn () {
        const nsv = this.stackView().nextStackView()
        if (nsv) {
            return nsv.navView().itemSetView()
        }
        return null
    }

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
        }
        return this
    }
    
    // previous column
	
    previousItemSet () {
        if (this.stackView()) {
            const ps = this.stackView().previousStackView()
            if (ps) {
                return ps.navView().itemSetView()
            }
        }
        return null
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

    // paths

    /*
    logName () {
        return this.browserPathString()
    }
    */

    maxTileWidth () {
        if (this.tiles().length === 0) {
            return 0
        }
        
        const maxWidth = this.tiles().maxValue(tile => tile.desiredWidth())			
        return maxWidth	
    }

    // editing

    onDoubleClick (event) {
        //this.debugLog(".onDoubleClick()")
        return true
    }

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

    // --------------

    isVertical () {
        return this.stackView().direction() === "right"
    }

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

    // --------------

    stackTilesVertically () {
        // we don't need to order tiles for 1st call of stackTiles, 
        // but we do when calling stackTiles while moving a drop view around,
        // so just always do it as top is null, and tiles are already ordered the 1st time

        const orderedTiles = this.tiles().shallowCopy().sortPerform("topPx") 
        const displayedTiles = orderedTiles.filter(r => !r.isDisplayHidden())
        let y = 0
        
        displayedTiles.forEach((tile) => {
            let h = tile.computedHeight() 
            if (tile.position() !== "absolute") {
                tile.makeAbsolutePositionAndSize()
                tile.setLeftPx(0)
                tile.setOrder(null)
            }
            tile.setTopPx(y)
            y += h
        })

        return this
    }

    unstackTilesVertically  () {
        const orderedTiles = this.tiles().shallowCopy().sortPerform("topPx")
        
        orderedTiles.forEach(tile => assert(tile.hasElement()) ) // todo: temp test
        orderedTiles.forEachPerform("makeRelativePositionAndSize")

        this.removeAllSubviews()
        this.addSubviews(orderedTiles)
        return this
    }

    // --------------

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

    // --------------

    canReorderTiles () {
        return this.node().nodeTileLink().nodeCanReorderSubnodes()
    }

    didReorderTiles () { 
        if (!this.node() || !this.isInBrowser()) {
            return this
        }
        // TODO: make a more scaleable API
        const subnodes = this.tiles().map(tile => tile.node())
        this.node().nodeTileLink().nodeReorderSudnodesTo(subnodes)
        //this.node().nodeReorderSudnodesTo(subnodes)
        return this
    }

    // pinch

    tileContainingPoint (aPoint) {
        return this.tiles().detect((tile) => {
            return tile.frameInDocument().containsPoint(aPoint)
        })
    }

    onPinchBegin (aGesture) { // pinch apart to insert a new tile
        // TODO: move tile specific code to Tile

        //this.debugLog(".onPinchBegin()")

        // - calc insert index
        const p = aGesture.beginCenterPosition()
        const tile = this.tileContainingPoint(p)
        if (!tile) {
            // don't allow pinch if it's bellow all the tiles
            // use a tap gesture to create a tile there instead?
            return this
        }

        const insertIndex = this.tiles().indexOf(tile)

        //console.log("insertIndex: ", insertIndex)

        if (this.node().hasAction("add")) {
            // create new subnode at index
            const newSubnode = this.node().addAt(insertIndex)

            // reference it with _temporaryPinchSubnode so we
            // can delete it if pinch doesn't complete with enough height
            this._temporaryPinchSubnode = newSubnode

            // sync with node to add tile view for it
            this.syncFromNodeNow()

            // find new tile and prepare it
            const newTile = this.subviewForNode(newSubnode)
            newTile.setMinAndMaxHeight(0)
            newTile.contentView().setMinAndMaxHeight(64)
            newTile.setTransition("all 0.3s")
            newTile.contentView().setTransition("all 0s")
            newTile.setBackgroundColor("black")

            // set new tile view height to zero and 
            const minHeight = Tile.defaultHeight()
            const cv = newTile.contentView()
            cv.setBackgroundColor(this.stackNavView().backgroundColor())
            cv.setMinAndMaxHeight(minHeight)
            //newTile.scheduleSyncFromNode()
            //this._temporaryPinchSubnode.didUpdateNode()
        } else {
            //this.debugLog(".onPinchBegin() cancelling due to no add action")

            aGesture.cancel()
        }        
    }
    
    onPinchMove (aGesture) {
        if (this._temporaryPinchSubnode) {
            let s = Math.floor(aGesture.spreadY())
            if (s < 0) {
                s = 0
            }
            //this.debugLog(".onPinchMove() s = ", s)
            const minHeight = Tile.defaultHeight()
            const newTile = this.subviewForNode(this._temporaryPinchSubnode)
            //newTile.setBackgroundColor("black")
            newTile.setMinAndMaxHeight(s)
            const t = Math.floor(s/2 - minHeight/2);
            newTile.contentView().setTopPx(t)

            const h = Tile.defaultHeight()

            if (s < h) {
                const f = s/h;
                const rot = Math.floor((1 - f) * 90);
                newTile.setPerspective(1000)
                newTile.setTransformOrigin(0)
                //newTile.contentView().setTransformOriginPercentage(0)
                newTile.contentView().setTransform("rotateX(" + rot + "deg)")
                const z = -100 * f;
                //newTile.contentView().setTransform("translateZ(" + z + "dg)")
            } else {
                newTile.setPerspective(null)
                newTile.contentView().setTransform(null)                
            }
        } else {
            console.warn(this.typeId() + ".onPinchMove() missing this._temporaryPinchSubnode")
        }
        // do we need to restack views?
    }

    onPinchComplete (aGesture) {
        //this.debugLog(".onPinchCompleted()")
        // if pinch is tall enough, keep new tile

        if (this._temporaryPinchSubnode) {
            const newTile = this.subviewForNode(this._temporaryPinchSubnode)
            const minHeight = Tile.defaultHeight()
            if (newTile.clientHeight() < minHeight) {
                this.removeTile(newTile)
            } else {
                //newTile.contentView().setTransition("all 0.15s, height 0s")
                //newTile.setTransition("all 0.3s, height 0s")
                this.addTimeout(() => { 
                    newTile.contentView().setTopPx(0)
                    newTile.setMinAndMaxHeight(minHeight) 
                }, 0)
            }

            this._temporaryPinchSubnode = null
        }
    }

    onPinchCancelled (aGesture) {
        //this.debugLog(".onPinchCancelled()")
        if (this._temporaryPinchSubnode) {
            this.node().removeSubnode(this._temporaryPinchSubnode)
            this._temporaryPinchSubnode = null
        }
    }

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

    // -- messages sent by DragView to the parent/owner of the view it's dragging ---

    onDragSourceBegin (dragView) {
        this.setHasPausedSync(true)
        //console.log(this.typeId() + " onDragSourceBegin")
        // ---


        /*
        dragView.items().forEach(sv => {
            sv.hideForDrag()
        })
        */

        // ---
        const subview = dragView.item()
        const index = this.indexOfSubview(subview)
        assert(index !== -1)

        if (dragView.isMoveOp()) {
            dragView.items().forEach(sv => this.removeSubview(sv))
        } else if (dragView.isCopyOp()) {

        }

        this.tiles().forEach(tile => tile.setTransition("all 0.3s"))

        this.newTilePlaceHolder(dragView)

        /*
        if (dragView.isMoveOp()) {
            subview.hideForDrag()
            this.moveSubviewToIndex(this.tilePlaceHolder(), index)
        }
        */

        this.moveSubviewToIndex(this.tilePlaceHolder(), index)
        this.stackTiles()
        return this
    }

    onDragSourceCancelled (dragView) {
        /*
        dragView.items().forEach(subview => {
            subview.unhideForDrag()
        })
        */
        this.onDragSourceDropped(dragView)
        //this.removeTilePlaceHolder()
    }

    setNode (aNode) {
        if (this.node() && Type.isNull(aNode)) {
            console.log(this.debugTypeId() + " setNode(null)")
            //debugger;
        }
        super.setNode(aNode)
        return this
    }

    onDragSourceEnter (dragView) {
        this.onDragDestinationHover(dragView)
        this.stackView().rootStackView().onStackChildDragSourceEnter(dragView)
    }

    onDragSourceHover (dragView) {
        this.onDragDestinationHover(dragView)
        this.indexOfTilePlaceHolder()
    }

    onDragSourceExit (dragView) {
        this.onDragDestinationHover(dragView)
    }

    indexOfTilePlaceHolder () {
        const sortMethod = this.isVertical() ? "topPx" : "leftPx"
        const orderedTiles = this.tiles().shallowCopy().sortPerform(sortMethod) 
        const insertIndex = orderedTiles.indexOf(this.tilePlaceHolder()) 
        
        //this.showTiles(orderedTiles)
        //console.log("hover insertIndex: ", insertIndex)
        
        return insertIndex
    }

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

    onDragSourceDropped (dragView) {
        //console.log(this.debugTypeId() + " --- onDragSourceDropped ---")
        //debugger;

        const insertIndex = this.indexOfTilePlaceHolder()

        let movedNodes = dragView.items().map(item => item.node())
        if (dragView.isMoveOp()) {
            // todo
        } else if (dragView.isCopyOp()) {
             movedNodes = movedNodes.map(aNode => aNode.duplicate())
        } else {
            throw new Error("unhandled drag operation")
        }
        //console.log(this.debugTypeId() + " --- unstacking ---")

        this.unstackTiles()
        this.removeTilePlaceHolder()
    
        //console.log("---")
        //this.showNodes(movedNodes)
        //this.showTiles(this.subviews())
        const newSubnodesOrder = this.subviews().map(sv => sv.node())
        //this.showNodes(newSubnodesOrder)
        
        this.node().removeSubnodes(movedNodes) // is this needed?
        //assert(!newSubnodesOrder.containsAny(movedNodes))


        newSubnodesOrder.atInsertItems(insertIndex, movedNodes)
        //this.showNodes(newSubnodesOrder)

        this.node().setSubnodes(newSubnodesOrder)

        //console.log("new order: " + this.node().subnodes().map(sn => sn.title()).join("-"))
        this.setHasPausedSync(false)
        this.syncFromNodeNow()
        this.selectAndFocusNodes(movedNodes)
    }

    selectAndFocusNodes (nodes) {
        const selectTiles = this.tilesWithNodes(nodes)
        this.unselectAllTilesExceptTiles(selectTiles)
        if (nodes.length === 1) {
            const focusNode = nodes.first()
            focusNode.parentNode().postShouldFocusAndExpandSubnode(focusNode)
        }
        return this
    }

    onDragDestinationDropped (dragView) {
        const insertIndex = this.indexOfTilePlaceHolder()

        let movedNodes = dragView.items().map(item => item.node())
        if (dragView.isMoveOp()) {
            movedNodes.forEach(aNode => aNode.removeFromParentNode())
        } else if (dragView.isCopyOp()) {
             movedNodes = movedNodes.map(aNode => aNode.duplicate())
        } else {
            throw new Error("unhandled drag operation")
        }

        this.unstackTiles()
        this.removeTilePlaceHolder()

        const newSubnodesOrder = this.subviews().map(sv => sv.node())
        assert(!newSubnodesOrder.containsAny(movedNodes))
        newSubnodesOrder.atInsertItems(insertIndex, movedNodes)
        this.node().setSubnodes(newSubnodesOrder)

        this.setHasPausedSync(false)
        this.syncFromNodeNow()
        this.selectAndFocusNodes(movedNodes)
    }

    onDragSourceEnd (dragView) {
        this.endDropMode()
    }

    // -- messages sent by DragView to the potential drop view, if not the source ---

    acceptsDropHover (dragView) {
        //return true 

        const node = this.node()
        if (node) {
            const dropNode = dragView.item().node()

            if (dropNode === this.node()) {
                return false
            }
            
            const acceptsNode = node.acceptsAddingSubnode(dropNode)
            const canReorder = this.canReorderTiles()
            //console.log(node.title() + " acceptsNode " + dropNode.title() + " " + acceptsNode)
            //console.log("parentNode " + node.parentNode().title())
            const result = acceptsNode && canReorder
            return result
        }
        return false
    }

    newTilePlaceHolder (dragView) {
        this.debugLog("newTilePlaceHolder")
        if (!this.tilePlaceHolder()) {
            const ph = DomView.clone().setDivClassName("TilePlaceHolder")
            ph.setBackgroundColor("black")

            //ph.setTransition("top 0s, left 0.3s, max-height 1s, min-height 1s")
            this.addSubview(ph)
            this.setTilePlaceHolder(ph)
            this.syncTilePlaceHolderSize(dragView)
        }
        return this.tilePlaceHolder()
    }

    syncTilePlaceHolderSize (dragView) {
        const ph = this.tilePlaceHolder()

        if (this.isVertical()) {
            ph.setMinAndMaxWidth(this.computedWidth())
            ph.setMinAndMaxHeight(dragView.minHeight())
            ph.transitions().at("top").updateDuration(0)
            ph.transitions().at("left").updateDuration(0.3)
        } else {
            ph.setMinAndMaxWidth(dragView.minWidth())
            ph.setMinAndMaxHeight(this.computedHeight())
            ph.transitions().at("top").updateDuration(0.3)
            ph.transitions().at("left").updateDuration(0)
        }

        return this
    }

    // --- drag destination ---

    onDragDestinationEnter (dragView) {
        this.setHasPausedSync(true)

        // insert place holder view
        if (!this.tilePlaceHolder()) {
            this.newTilePlaceHolder(dragView)
            this.tilePlaceHolder().setMinAndMaxHeight(dragView.computedHeight())
            this.onDragDestinationHover(dragView)
        }
    }

    onDragDestinationHover (dragView) {
        // move place holder view
        const ph = this.tilePlaceHolder()
        if (ph) {
            this.syncTilePlaceHolderSize(dragView)
            const vp = this.viewPosForWindowPos(dragView.dropPoint())
            if (this.isVertical()) {
                const h = dragView.computedHeight()
                const y = vp.y() - h/2
                ph.setTopPx(y)
            } else {
                const w = dragView.computedWidth()
                const x = vp.x() - w/2
                //console.log("w:" + w + " x:" + vp.x())
                ph.setLeftPx(x)
            }
            //console.log("ph.top() = ", ph.top())
            this.stackTiles() // need to use this so we can animate the tile movements
        }
    }
    
    onDragDestinationExit (dragView) {
        this.endDropMode()
    }

    onDragDestinationEnd (aDragView) {
        this.endDropMode()
    }

    acceptsDropHoverComplete (aDragView) {
        return this.acceptsDropHover(aDragView);
    }

    dropCompleteDocumentFrame () {
        return this.tilePlaceHolder().frameInDocument()
    }


    removeTilePlaceHolder () {
        this.debugLog("removeTilePlaceHolder")

        const ph = this.tilePlaceHolder()
        if (ph) {
            //console.log("removeTilePlaceHolder")
            if (this.hasSubview(ph)) {
                this.removeSubview(ph)
            }
            this.setTilePlaceHolder(null)
        }
    }

    animateRemoveTilePlaceHolderAndThen (callback) {
        this.debugLog("animateRemoveTilePlaceHolder")

        const ph = this.tilePlaceHolder()
        if (ph) {
            ph.setMinAndMaxHeight(0)
            this.addTimeout(() => {
                this.removeTilePlaceHolder()
                if (callback) { callback() }
            }, 1*1000)
        } else {
            if (callback) { callback() }
        }
    }

    endDropMode () {
        this.debugLog("endDropMode")
        //this.unstackTiles()
        this.removeTilePlaceHolder()
        this.unstackTiles()
        this.setHasPausedSync(false)
        this.didReorderTiles()

        /*
        this.animateRemoveTilePlaceHolderAndThen(() => {
         this.debugLog("endDropMode")
            this.unstackTiles()
            this.setHasPausedSync(false)
            this.didReorderTiles()
        })
        */

        return this
    }

    /*
    tileIndexForViewportPoint (aPoint) {
        if (this.tiles().length === 0) {
            return 0
        }

        const tile = this.tiles().detect((tile) => {
            return tile.frameInDocument().containsPoint(aPoint)
        })

        if (tile) {
            return this.tiles().indexOf(tile)
        }

        return this.tiles().length
    }
    */

    // Browser drop from desktop

    acceptsDrop () {
        return true
    }

    onBrowserDropChunk (dataChunk) {
        const node = this.node()

        if (node && node.onBrowserDropChunk) {
            node.onBrowserDropChunk(dataChunk)
        }
        this.scheduleSyncFromNode()
    }

    nodeDescription () {
        const node = this.node()
        if (node) {
            return node.debugTypeId()
        }
        return null
    }

    debugTypeId () {
       return super.debugTypeId() + this.debugTypeIdSpacer() + this.nodeDescription()
    }
    
}.initThisClass());
