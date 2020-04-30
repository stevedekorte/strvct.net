"use strict"

/*
    
    StackItemSetView
    
*/

window.StackItemSetView = class StackItemSetView extends NodeView {
    
        
    initPrototype () {
        this.newSlot("rows", null)
        this.newSlot("allowsCursorNavigation", true)
        this.newSlot("defaultRowStyles", null)
        this.newSlot("rowStyles", null)
        this.newSlot("rowPlaceHolder", null)
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
        //this.styles().selected().setBorderLeft("1px solid rgba(0, 0, 0, 0.15)")
        //this.styles().unselected().setBorderLeft("1px solid rgba(0, 0, 0, 0.15)")
        this.applyStyles()
        //this.setIsRegisteredForClicks(true) // use tap gesture instead
        this.setAcceptsFirstResponder(true)

        this.setUserSelect("none")
        this.addGestureRecognizer(PinchGestureRecognizer.clone()) // for pinch open to add row
        this.addGestureRecognizer(TapGestureRecognizer.clone()) // for pinch open to add row

        this.setRowStyles(BMViewStyles.clone().setToWhiteOnBlack())
        //this.rowStyles().selected().setBackgroundColor("red")

        this.setIsRegisteredForBrowserDrop(true)
        
        //this.setBorder("1px dashed red")

        return this
    }

    stackView () {
        const scrollView = this.parentView()
        const navView = scrollView.parentView()
        const stackView = navView.parentView()
        return stackView
    }

    syncOrientation () {
        if (this.isVertical()) {
            this.makeOrientationRight()
        } else {
            this.makeOrientationDown() 
        }
        return this
    }

    makeOrientationRight () {
        //this.setFlexDirection("column")
        this.setMinAndMaxWidth("100%")
        this.setMinHeight("100%")
        //this.setMaxHeight("fit-content")
        //this.setFlexBasis("300px")
        //this.setMinAndMaxWidth("300px")
        //this.setMinAndMaxHeight(null)
    }

    makeOrientationDown () {
        //this.setFlexDirection("row")
        //this.setMinAndMaxWidth("fit-content")
        this.setMinAndMaxWidth("100%")
        this.setMinAndMaxHeight("100%")
        //this.setMinAndMaxWidth(null)
        //this.setMinAndMaxHeight("50px")   
        //this.setFlexBasis("300px")
    }

    syncFromNode () {
        this.syncOrientation()
        super.syncFromNode() 
        if (this.selectedRows().length === 0) {
            this.didChangeNavSelection() // TODO: is this right?
        }
        return this
    }

    unselectRowsInNextColumn () {
        const c = this.nextColumn()
        if (c) {
            c.unselectAllRows()
        }
        return this
    }

    subviewProtoForSubnode (aSubnode) {
        let proto = aSubnode.nodeRowViewClass()
		
        if (!proto) {
            proto = BrowserTitledRow
        }
				
        return proto      
        
        //return StackItemView      
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

    // from column


    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------
    // -----------------------------------------------------------------------------------------------------------------


    onFocus () {
        return super.onFocus()
    }

    setRowBackgroundColor (aColor) {
        this.rowStyles().unselected().setBackgroundColor(aColor)
        return this
    }

    setRowSelectionColor (aColor) {
        this.rowStyles().selected().setBackgroundColor(aColor)
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

    browser () {
        return this.stackNavView().browser()
    }
    
    columnGroup () {
        return this.parentView().parentView()
    }

    // --- rows ---
    
    rows () {
        return this.subviews()
    }

    addRow (v) {
        return this.addSubview(v)
    }

    removeRow (v) {
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
    darkenUnselectedRows () {
        const darkenOpacity = 0.5
        this.rows().forEach((row) => {
            if (row.isSelected()) {
                row.setOpacity(1)
            } else {
                row.setOpacity(darkenOpacity)
            }
        })
        return this
    }

    undarkenAllRows () {
        this.rows().forEach((row) => {
            row.setOpacity(1)
        })
    }
    */

    rowsWithNodes (nodeArray) {
        return nodeArray.map(node => this.rowWithNode(node))
    }

    rowWithNode (aNode) {
        return this.rows().detect(row => row.node() === aNode)
    }

    // --- row tapping ---

    didTapItem (anItem) {
        anItem.select()
        if (!anItem.hasFocusedDecendantView()) {
            anItem.focus()
        }
        this.unselectAllRowsExcept(anItem)
        this.unselectRowsInNextColumn()
        this.didChangeNavSelection() // this may already have been sent
    }
    
    didShiftTapItem (anItem) {
        let lastItem = this.lastSelectedRow()

        if (!lastItem) {
            lastItem = this.rows().first()
        }

        if (lastItem) {
            const r1 = this.indexOfRow(anItem)
            const r2 = this.indexOfRow(lastItem)
            assert(r1 !== -1 && r2 !== -1)
            const i1 = Math.min(r1, r2)
            const i2 = Math.max(r1, r2)
            for (let i = i1; i <= i2; i++) {
                const item = this.rowAtIndex(i)
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
    
    // --- ---
    
    unselectAllRowsExcept (selectedRow) {
        const rows = this.rows()

        // unselect all other rows
        rows.forEach((row) => {
            if (row !== selectedRow) {
                if (row.unselect) {
                    row.unselect()
                } else {
                    //console.warn("=WARNING= " + this.typeId() + ".unselectAllRowsExcept() row " + row.typeId() + " missing unselect method")
                }
            }
        })
        
        return this
    }

    unselectAllRowsExceptRows (rowsToSelect) {
        const rows = this.rows()

        // unselect all other rows
        rows.forEach((row) => {
            if (rowsToSelect.contains(row)) {
                row.performIfResponding("select") 
            } else {
                row.performIfResponding("unselect") 
            }
        })
        
        return this
    }

    // -----------------------------------------

    indexOfRow (aRow) {
        // we might want this to be based on flex view order instead, 
        // so best to keep it abstract
        return this.indexOfSubview(aRow)
    }

    rowAtIndex (anIndex) {
        return this.subviews().at(anIndex)
    }

    lastSelectedRow () {
        return this.selectedRows().maxItem(row => row.lastSelectionDate().getTime())
    }

    /*
    didSelectRow (aRow) {
        this.didChangeNavSelection()
    }

    didUnselectRow (aRow) {
        this.didChangeNavSelection()

    }
    */

  
    // selection

    hasMultipleSelections () {
        return this.selectedRows().length > 0
    }

    // selected rows

    selectedRows () {
        return this.rows().filter(row => row.isSelected && row.isSelected())
    }

    selectedRow () {
        const sr = this.selectedRows()
        if (sr.length === 1) {
            return sr.first()
        }
        return null
    }

    // selected nodes

    selectedNodes () {
        return this.selectedRows().map(row => row.node())
    }

    selectedNode () {
        const r = this.selectedRow()
        return r ? r.node() : null
    }
    
    selectedRowIndex () { 
        // returns -1 if no rows selected
        return this.rows().indexOf(this.selectedRow())
    }

    // selecting rows
    
    setSelectedRowIndex (index) {
        const oldIndex = this.selectedRowIndex()
        //console.log("this.setSelectedRowIndex(" + index + ") oldIndex=", oldIndex)
        if (index !== oldIndex) {
            const rows = this.rows()
            if (index >= 0 && index < rows.length) {
                const row = rows[index]
                this.didTapItem(row)
            }
        }
        return this
    }
  
    indexOfRowWithNode (aNode) {
        return this.rows().detectIndex(row => row.node() === aNode)
    }

    selectAllRows () {
        this.rows().forEachPerformIfResponds("select")
        return this
    }

    unselectAllRows () {
        this.rows().forEachPerformIfResponds("unselect")
        return this
    }

    rowWithNode (aNode) {
        const row = this.rows().detect(row => row.node().nodeRowLink() === aNode)
        return row
    }
	
    selectRowWithNode (aNode) {
        //console.log(">>> column " + this.node().title() + " select row " + aNode.title())
        const selectedRow = this.rowWithNode(aNode)
		
        if (selectedRow) {
            selectedRow.setIsSelected(true)
			
            this.rows().forEach((aRow) => {
                if (aRow !== selectedRow) {
                    aRow.unselect()
                }
            })
        }

        return selectedRow
    }
    
    selectedRowTitle () {
        const row = this.selectedRow()
        if (row) { 
            return row.title().innerHTML() 
        }
        return null
    }

    // --- sync -----------------------------

    subviewProtoForSubnode (aSubnode) {
        let proto = aSubnode.nodeRowViewClass()
		
        if (!proto) {
            proto = BrowserTitledRow
        }
				
        return proto      
    }

    setNode (aNode) {
        if (this.node() !== aNode) {
            super.setNode(aNode)
            this.unselectAllRows() // move to didChangeNode
            //"shouldFocusSubnode"
        }
        return this
    }

    isInBrowser () {
        return !Type.isNull(this.parentView())
        //return this.browser().columns().contains(this)
    }

    shouldFocusAndExpandSubnode (aNote) { // focus & expand row
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
            this.selectRowWithNode(subnode)
            subview.scrollIntoView()
            subview.justTap()
            //this.didChangeNavSelection()
		    //subview.dynamicScrollIntoView()
        } else {
            console.warn("BrowserColumn for node " + this.node().typeId() + " has no matching subview for shouldSelectSubnode " + subnode.typeId())
	    }

	    return this 
    }

    shouldFocusSubnode (aNote) { //  focus but don't expand row
	    const subnode = aNote.info()

	    let subview = this.subviewForNode(subnode)
	    
        if (!subview) {
            this.syncFromNodeNow()
	        subview = this.subviewForNode(subnode)
        } 

        if (subview) {
            this.selectRowWithNode(subnode)
            subview.scrollIntoView()

            // just focus the row without expanding it
            /*
            if (this.previousItemSet()) {
                this.previousItemSet().didChangeNavSelection()
            }
            */

            this.didChangeNavSelection()
		    //subview.dynamicScrollIntoView()
        } else {
            console.warn("BrowserColumn for node " + this.node().typeId() + " has no matching subview for shouldFocusSubnode " + subnode.typeId())
            //console.log("row nodes = ", this.rows().map(row => row.node().typeId()) )
	    }

	    return this 
    }

    didChangeNavSelection () {
        if (this.stackView()) {
            this.stackView().didChangeNavSelection()
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
        const last = this.rows().last()

        if (last) { 
            last.scrollIntoView()
        }

        return this
    }

    didChangeNode () {
        super.didChangeNode()

        if (this.node() && this.node().nodeRowsStartAtBottom()) {
            setTimeout(() => { this.scrollToBottom() }, 0)
            //this.row().last().scrollIntoView()
        }

        return this
    }
    
    /*
    scheduleSyncFromNode () {
        //assert(this.browser().columns().contains(this))

        //console.log(this.type() + " " + this.node().title() + " .scheduleSyncFromNode()")
        if (this.node() === null || !this.isInBrowser()) {
            console.warn("WARNING: skipping BrowserColumn.scheduleSyncFromNode")
            console.warn("  this.isInBrowser() = " , this.isInBrowser())
            console.warn("  this.node() = " , this.node().debugTypeId())
            return this
        }
        
 	    super.scheduleSyncFromNode()
	    return this
    }
    */
	
    // --- keyboard controls, arrow navigation -----------------------------

    canNavigate () {
        return this.allowsCursorNavigation() 
        //return this.allowsCursorNavigation() && this.isActiveElement()
    }
	
    showSelected () {
        /*
        TODO: add check if visible
        if (this.selectedRow()) {
            this.selectedRow().scrollIntoView()
        }
        */
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
        this.duplicateSelectedRows()
        event.stopPropagation()
        event.preventDefault();
    }

    duplicateSelectedRows () {
        const newNodes = []

        this.selectedRows().forEach(row => {
            const i = this.indexOfSubview(row)
            const dupNode = row.node().duplicate()
            newNodes.push(dupNode)
            this.node().addSubnodeAt(dupNode, i+1)
        })
        this.unselectAllRows()
        this.syncFromNodeNow()

        // TODO: unselect current rows at browser level
        newNodes.forEach(newNode => {
            const newRow = this.rowWithNode(newNode)
            newRow.select()
        })

        return this
    }

    onMeta_d_KeyUp (event) {
        console.log("duplicate selection up")
        this.selectedRows().forEach()
        event.stopPropagation()
        event.preventDefault();
    }

    onShiftBackspaceKeyUp (event) {
        this.debugLog(this.type() + " for " + this.node().title() + " onShiftBackspaceKeyUp")
        if (this.selectedRow()) { 
            this.selectedRow().delete()
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
        this.duplicateSelectedRow()
        return false // stop propogation
    }

    // select all

    onMeta_a_KeyDown (event) {
        this.selectAllRows()
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
        // see if the row that selected this column is being inspected
        const prev = this.previousItemSet() 
        if (prev) {
            const row = prev.selectedRow()
            if (row) {
                return row.isInspecting()
            }
        }
        return false
    }

    duplicateSelectedRow () {
        const node = this.node()
        const row = this.selectedRow()
        const canAdd = node.canSelfAddSubnode() 
        if (row && canAdd) {
            const canCopy = !Type.isNullOrUndefined(row.node().copy)
            if (canCopy) { 
                //this.debugLog(" duplicate selected row " + this.selectedRow().node().title())
                const subnode = row.node()
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

    onUpArrowKeyUp (event) {
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
	
    onDownArrowKeyUp (event) {
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
            if (this.selectedRow()) { 
                this.selectedRow().unselect() 
            }
			
            const newSelectedRow = pc.selectedRow()
            newSelectedRow.setShouldShowFlash(true).updateSubviews()
            pc.didTapItem(newSelectedRow)
        	this.selectPreviousColumn()
        }
        return this
    }

    moveRight () {
        this.selectNextColumn()
        return this
    }

    moveUp () {
        this.selectNextRow()
        this.showSelected()
        return this
    }

    moveDown () {
        this.selectPreviousRow()
        this.showSelected()
        return this
    }

    // -----------------------------------------------

    onEscapeKeyDown (event) {
        this.setIsColumnInspecting(false)

        if (!this.canNavigate()) { 
            return this
        }	

        this.moveLeft()
        //return true
    }
	
    // --- enter key begins row editing ---------------------------
	
    onEnterKeyUp (event) {        
        if (!this.canNavigate()) { 
            return this
        }
	
        const row = this.selectedRow()
        if (row) { 
		    row.onEnterKeyUp(event)
        }

        return false
    }

    // --- keyboard controls, add and delete actions -----------------------------

    /*
    deleteRow (aRow) {
        let sNode = aRow.node()
        if (sNode && sNode.canDelete()) { 
			sNode.performAction("delete") 
		}
        return this
    }

    deleteSelectedRows () {
        this.selectedRows().forEach(r => this.deleteRow(r))

        if (this.rows().length === 0) {
            this.selectPreviousColumn()
        }
    }
    */

    onShiftDeleteKeyUp (event) {
        if (!this.canNavigate()) { 
            return 
        }

        //this.deleteSelectedRows()
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
                this.nextColumn().selectRowWithNode(newNode)
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
        //console.log(this.typeId() + ".onTapComplete()")
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

    // nextRow

    selectFirstRow () {
        this.setSelectedRowIndex(0)
        return this
    }

    firstRow () {
        if (this.rows().length > 0) {
            return this.rows()[0]
        }
        return null
    }

    nextRow () {
        const si = this.selectedRowIndex()
        if (si !== -1 && si < this.rows().length) {
            const nextRow = this.rows()[si +1]
            return nextRow
        }
        return null
    }

    selectNextRow () {
        const si = this.selectedRowIndex()
        if (si === -1) {
            this.setSelectedRowIndex(0)
        } else {
            this.setSelectedRowIndex(si + 1)
        }
        return this
    }
    
    selectPreviousRow () {
        const si = this.selectedRowIndex()
        if (si === -1) {
            this.setSelectedRowIndex(0)
        } else {
            this.setSelectedRowIndex(si - 1)
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
        /*
        const i = this.columnIndex()
        const nextColumn = this.browser().columns()[i+1]
        return nextColumn
        */
    }

    focus () {
        super.focus()
		
	    if (this.selectedRowIndex() === -1) {
            const sr = this.rows().first()
            if (sr) {
                sr.setShouldShowFlash(true)
            }
            this.setSelectedRowIndex(0)
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
            const sr = nextColumn.selectedRow()
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
        if(this.stackView()) {
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
            //this.browser().selectColumn(prevColumn)
        }
        return this
    }

    // paths
    
    /*
    browserPathArray () {
        let subviews = this.browser().columns().subviewsBefore(this)
        subviews.push(this)
        return subviews
    }
    
    browserPathString () {
        return this.browserPathArray().map(function (column) { 
            return column.title()  // + ":" + column.node().type()
        }).join("/")
    }
    */

    logName () {
        return this.browserPathString()
    }

    maxRowWidth () {
        if (this.rows().length === 0) {
            return 0
        }
        
        const maxWidth = this.rows().maxValue(row => row.desiredWidth())			
        return maxWidth	
    }

    // editing

    onDoubleClick (event) {
        //this.debugLog(".onDoubleClick()")
        return true
    }

    // reordering support

    /*
    absolutePositionRows () {
        const ys = []
        this.rows().forEach((row) => {
            const y = row.relativePos().y()
            ys.append(y)
        })

        let i = 0
        this.rows().forEach((row) => {
            const y = ys[i]
            i ++
            row.unhideDisplay()
            row.setPosition("absolute")
            row.setTopPx(y)
            row.setLeftPx(0)
            row.setRightPx(null)
            row.setBottomPx(null)
            row.setWidthPercentage(100)
            //console.log("i" + i + " : y" + y)
        })
        
        return this
    }
    */


    /*
    orderRows () {
        const orderedRows = this.rows().shallowCopy().sortPerform("topPx")

        this.rows().forEach((row) => {
            row.setPosition("absolute")
            row.unhideDisplay()
        })

        this.removeAllSubviews()
        this.addSubviews(orderedRows)
        return this
    }
    */

    // -- stacking rows ---

    /*
    Row methods:

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
        // row is left to right
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

    stackRows () {
        if (this.isVertical()) {
            this.stackRowsVertically()
        } else {
            this.stackRowsHorizontally()
        }
        return this
    }

    unstackRows () {
        if (this.isVertical()) {
            this.unstackRowsVertically()
        } else {
            this.unstackRowsHorizontally()
        }
        return this
    }

    // --------------

    stackRowsVertically () {
        // we don't need to order rows for 1st call of stackRows, 
        // but we do when calling stackRows while moving a drop view around,
        // so just always do it as top is null, and rows are already ordered the 1st time

        const orderedRows = this.rows().shallowCopy().sortPerform("topPx") 
        const displayedRows = orderedRows.filter(r => !r.isDisplayHidden())
        let y = 0
        
        displayedRows.forEach((row) => {
            let h = row.computedHeight() 
            if (row.position() !== "absolute") {
                row.makeAbsolutePositionAndSize()
                row.setLeftPx(0)
                row.setOrder(null)
            }
            row.setTopPx(y)
            y += h
        })

        return this
    }

    unstackRowsVertically  () {
        const orderedRows = this.rows().shallowCopy().sortPerform("topPx")
        orderedRows.forEachPerform("makeRelativePositionAndSize")
        this.removeAllSubviews()
        this.addSubviews(orderedRows)
        return this
    }

    // --------------

    stackRowsHorizontally () {
        const orderedRows = this.rows().shallowCopy().sortPerform("leftPx") 
        const displayedRows = orderedRows.filter(r => !r.isDisplayHidden())
        let x = 0

        /*
        let names = []
        this.rows().forEach((row) => { 
            if (row.node) { 
                names.push(row.node().title() + " " + row.leftPx() + "px")
            }
        })
        console.log("horizontal: ", names.join(", "))
        */
        
        displayedRows.forEach((row) => {
            let w = row.computedWidth() 
            if (row.position() !== "absolute") {
                row.makeAbsolutePositionAndSize()
                row.setTopPx(0)
                row.setOrder(null)
            }
            row.setLeftPx(x)
            x += w
        })

        return this
    }

    unstackRowsHorizontally () {
        const orderedRows = this.rows().shallowCopy().sortPerform("leftPx")
        orderedRows.forEachPerform("makeRelativePositionAndSize")
        this.removeAllSubviews()
        this.addSubviews(orderedRows)
        return this
    }

    // --------------

    canReorderRows () {
        return this.node().nodeRowLink().nodeCanReorderSubnodes()
    }

    didReorderRows () { 
        if (!this.node() || !this.isInBrowser()) {
            return this
        }
        // TODO: make a more scaleable API
        const subnodes = this.rows().map(row => row.node())
        this.node().nodeRowLink().nodeReorderSudnodesTo(subnodes)
        //this.node().nodeReorderSudnodesTo(subnodes)
        return this
    }

    // pinch

    rowContainingPoint (aPoint) {
        return this.rows().detect((row) => {
            return row.frameInDocument().containsPoint(aPoint)
        })
    }


    onPinchBegin (aGesture) { // pinch apart to insert a new row
        // TODO: move row specific code to BrowserRow

        //this.debugLog(".onPinchBegin()")

        // - calc insert index
        const p = aGesture.beginCenterPosition()
        const row = this.rowContainingPoint(p)
        if (!row) {
            // don't allow pinch if it's bellow all the rows
            // use a tap gesture to create a row there instead?
            return this
        }

        const insertIndex = this.rows().indexOf(row)

        //console.log("insertIndex: ", insertIndex)

        if (this.node().hasAction("add")) {
            // create new subnode at index
            const newSubnode = this.node().addAt(insertIndex)

            // reference it with _temporaryPinchSubnode so we
            // can delete it if pinch doesn't complete with enough height
            this._temporaryPinchSubnode = newSubnode

            // sync with node to add row view for it
            this.syncFromNodeNow()

            // find new row and prepare it
            const newRow = this.subviewForNode(newSubnode)
            newRow.setMinAndMaxHeight(0)
            newRow.contentView().setMinAndMaxHeight(64)
            newRow.setTransition("all 0.3s")
            newRow.contentView().setTransition("all 0s")
            newRow.setBackgroundColor("black")

            // set new row view height to zero and 
            const minHeight = BrowserRow.defaultHeight()
            const cv = newRow.contentView()
            cv.setBackgroundColor(this.stackNavView().backgroundColor())
            cv.setMinAndMaxHeight(minHeight)
            //newRow.scheduleSyncFromNode()
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
            const minHeight = BrowserRow.defaultHeight()
            const newRow = this.subviewForNode(this._temporaryPinchSubnode)
            //newRow.setBackgroundColor("black")
            newRow.setMinAndMaxHeight(s)
            const t = Math.floor(s/2 - minHeight/2);
            newRow.contentView().setTopPx(t)

            const h = BrowserRow.defaultHeight()

            if (s < h) {
                const f = s/h;
                const rot = Math.floor((1 - f) * 90);
                newRow.setPerspective(1000)
                newRow.setTransformOrigin(0)
                //newRow.contentView().setTransformOriginPercentage(0)
                newRow.contentView().setTransform("rotateX(" + rot + "deg)")
                const z = -100 * f;
                //newRow.contentView().setTransform("translateZ(" + z + "dg)")
            } else {
                newRow.setPerspective(null)
                newRow.contentView().setTransform(null)                
            }
        } else {
            console.warn(this.typeId() + ".onPinchMove() missing this._temporaryPinchSubnode")
        }
        // do we need to restack views?
    }

    onPinchComplete (aGesture) {
        //this.debugLog(".onPinchCompleted()")
        // if pinch is tall enough, keep new row

        if (this._temporaryPinchSubnode) {
            const newRow = this.subviewForNode(this._temporaryPinchSubnode)
            const minHeight = BrowserRow.defaultHeight()
            if (newRow.clientHeight() < minHeight) {
                this.removeRow(newRow)
            } else {
                //newRow.contentView().setTransition("all 0.15s, height 0s")
                //newRow.setTransition("all 0.3s, height 0s")
                setTimeout(() => { 
                    newRow.contentView().setTopPx(0)
                    newRow.setMinAndMaxHeight(minHeight) 
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
        const nextRow = this.nextRow()
        if (nextRow) {
            this.selectNextRow()
            nextRow.becomeKeyView()
        } else {
            const firstRow = this.firstRow()
            if (firstRow) {
                this.selectFirstRow()
                firstRow.becomeKeyView()
            }
        }
        return this
    }

    // -- messages sent by DragView to the parent/owner of the view it's dragging ---

    onDragSourceBegin (dragView) {
        this.setHasPausedSync(true)
        console.log(this.typeId() + " onDragSourceBegin")
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

        this.rows().forEach(row => row.setTransition("all 0.3s"))

        this.newRowPlaceHolder(dragView)

        /*
        if (dragView.isMoveOp()) {
            subview.hideForDrag()
            this.moveSubviewToIndex(this.rowPlaceHolder(), index)
        }
        */

        this.moveSubviewToIndex(this.rowPlaceHolder(), index)

        this.stackView().cache() // only needed for source column, since we might navigate while dragging


        this.stackRows()
        return this
    }

    onDragSourceCancelled (dragView) {
        /*
        dragView.items().forEach(subview => {
            subview.unhideForDrag()
        })
        */
        this.onDragSourceDropped(dragView)
        //this.removeRowPlaceHolder()
    }

    onDragSourceEnter (dragView) {
        this.onDragDestinationHover(dragView)
    }

    onDragSourceHover (dragView) {
        this.onDragDestinationHover(dragView)
        this.indexOfRowPlaceHolder()
    }

    onDragSourceExit (dragView) {
        this.onDragDestinationHover(dragView)
    }

    indexOfRowPlaceHolder () {
        const sortMethod = this.isVertical() ? "topPx" : "leftPx"
        const orderedRows = this.rows().shallowCopy().sortPerform(sortMethod) 
        const insertIndex = orderedRows.indexOf(this.rowPlaceHolder()) 
        
        //this.showRows(orderedRows)
        console.log("hover insertIndex: ", insertIndex)
        
        return insertIndex
    }

    showRows (rows) {
        console.log("rows: ", rows.map(r => {
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
        const insertIndex = this.indexOfRowPlaceHolder()

        let movedNodes = dragView.items().map(item => item.node())
        if (dragView.isMoveOp()) {

        } else if (dragView.isCopyOp()) {
             movedNodes = movedNodes.map(aNode => aNode.duplicate())
        } else {
            throw new Error("unhandled drag operation")
        }

        this.unstackRows()
        this.removeRowPlaceHolder()
    
        //console.log("---")
        //this.showNodes(movedNodes)
        //this.showRows(this.subviews())
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
        const selectRows = this.rowsWithNodes(nodes)
        this.unselectAllRowsExceptRows(selectRows)
        if (nodes.length === 1) {
            const focusNode = nodes.first()
            focusNode.parentNode().postShouldFocusAndExpandSubnode(focusNode)
        }
        return this
    }

    onDragDestinationDropped (dragView) {
        const insertIndex = this.indexOfRowPlaceHolder()

        let movedNodes = dragView.items().map(item => item.node())
        if (dragView.isMoveOp()) {
            movedNodes.forEach(aNode => aNode.removeFromParentNode())
        } else if (dragView.isCopyOp()) {
             movedNodes = movedNodes.map(aNode => aNode.duplicate())
        } else {
            throw new Error("unhandled drag operation")
        }

        this.unstackRows()
        this.removeRowPlaceHolder()

        const newSubnodesOrder = this.subviews().map(sv => sv.node())
        assert(!newSubnodesOrder.containsAny(movedNodes))
        newSubnodesOrder.atInsertItems(insertIndex, movedNodes)
        this.node().setSubnodes(newSubnodesOrder)

        this.setHasPausedSync(false)
        this.syncFromNodeNow()
        this.selectAndFocusNodes(movedNodes)
    }

    onDragSourceEnd (dragView) {
        this.stackView().scheduleMethod("uncache")
        this.endDropMode()
    }

    // -- messages sent by DragView to the potential drop view, if not the source ---

    acceptsDropHover (dragView) {
        return true 

        const node = this.node()
        if (node) {
            const dropNode = dragView.item().node()

            if (dropNode === this.node()) {
                return false
            }
            
            const acceptsNode = node.acceptsAddingSubnode(dropNode)
            const canReorder = this.canReorderRows()
            //console.log(node.title() + " acceptsNode " + dropNode.title() + " " + acceptsNode)
            //console.log("parentNode " + node.parentNode().title())
            const result = acceptsNode && canReorder
            return result
        }
        return false
    }

    newRowPlaceHolder (dragView) {
        this.debugLog("newRowPlaceHolder")
        if (!this.rowPlaceHolder()) {
            const ph = DomView.clone().setDivClassName("BrowserRowPlaceHolder")
            ph.setBackgroundColor("black")

            //ph.setTransition("top 0s, left 0.3s, max-height 1s, min-height 1s")
            this.addSubview(ph)
            this.setRowPlaceHolder(ph)
            this.syncRowPlaceHolderSize(dragView)
        }
        return this.rowPlaceHolder()
    }

    syncRowPlaceHolderSize (dragView) {
        const ph = this.rowPlaceHolder()

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
        if (!this.rowPlaceHolder()) {
            this.newRowPlaceHolder(dragView)
            this.rowPlaceHolder().setMinAndMaxHeight(dragView.computedHeight())
            this.onDragDestinationHover(dragView)
        }
    }

    onDragDestinationHover (dragView) {
        // move place holder view
        const ph = this.rowPlaceHolder()
        if (ph) {
            this.syncRowPlaceHolderSize(dragView)
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
            this.stackRows() // need to use this so we can animate the row movements
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
        return this.rowPlaceHolder().frameInDocument()
    }


    removeRowPlaceHolder () {
        this.debugLog("removeRowPlaceHolder")

        const ph = this.rowPlaceHolder()
        if (ph) {
            //console.log("removeRowPlaceHolder")
            this.removeSubview(ph)
            this.setRowPlaceHolder(null)
        }
    }

    animateRemoveRowPlaceHolderAndThen (callback) {
        this.debugLog("animateRemoveRowPlaceHolder")

        const ph = this.rowPlaceHolder()
        if (ph) {
            ph.setMinAndMaxHeight(0)
            setTimeout(() => {
                this.removeRowPlaceHolder()
                if (callback) { callback() }
            }, 1*1000)
        } else {
            if (callback) { callback() }
        }
    }

    endDropMode () {
        this.debugLog("endDropMode")
        //this.unstackRows()
        this.removeRowPlaceHolder()
        this.unstackRows()
        this.setHasPausedSync(false)
        this.didReorderRows()

        /*
        this.animateRemoveRowPlaceHolderAndThen(() => {
         this.debugLog("endDropMode")
            this.unstackRows()
            this.setHasPausedSync(false)
            this.didReorderRows()
        })
        */

        return this
    }

    /*
    rowIndexForViewportPoint (aPoint) {
        if (this.rows().length === 0) {
            return 0
        }

        const row = this.rows().detect((row) => {
            return row.frameInDocument().containsPoint(aPoint)
        })

        if (row) {
            return this.rows().indexOf(row)
        }

        return this.rows().length
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
    
    
    
}.initThisClass()
