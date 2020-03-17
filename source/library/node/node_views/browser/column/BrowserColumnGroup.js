"use strict"

/* 

    BrowserColumnGroup

*/

window.BrowserColumnGroup = class BrowserColumnGroup extends HeaderFooterView {
    
    initPrototype () {
        //this.newSlot("scrollView", null) // contains column
        this.newSlot("column", null) // is inside scrollView
        this.newSlot("isCollapsed", false)
        this.newSlot("animatesCollapse", true)
        this.newSlot("browser", null)
    }


    init () {
        super.init()
        this.setDisplay("flex")
        this.setFlexGrow(1)
        this.setFlexDirection("column")
        this.setPosition("relative")
        this.setOpacity(0)
        this.setOverflow("hidden")
        this.setUserSelect("none")
        this.setTransition("opacity 0.5s ease-in-out")

        this.setHeaderClass(ColumnGroupHeader)
        this.setMiddleClass(BrowserScrollView)
        this.setFooterClass(ColumnGroupFooter)
        this.setupHeaderMiddleFooterViews()

        this.footerView().hideDisplay()
        
        this.setColumn(BrowserColumn.clone())
        this.scrollView().addSubview(this.column())
        
        this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()) 
        return this
    }

    scrollView () {
        return this.middleView()
    }

    setParentView (v) {
        super.setParentView(v)
        if (v) {
            setTimeout(() => { this.setOpacity(1) }, 10)
        } else {
            this.setOpacity(0)
        }
        return this
    }
    
    copySizeFrom (bcg) {
        this.setMinAndMaxWidth(bcg.minWidthPx())
        this.setFlexGrow(bcg.flexGrow())
        return this
    }

    copySetupFrom (bcg) {
        this.setIsSelected(bcg.isSelected())
        this.setIsCollapsed(bcg.isCollapsed())
        this.copySizeFrom(bcg)
        this.setDisplay(bcg.display())
        this.setPosition(bcg.position())
        return this
    }

    colapse () {
        this.setMinAndMaxWidth(0)
        this.setFlexGrow(0)
        return this
    }

    // caching - used to hold onto view state during drag between columns


    isInBrowser () {
        return this.browser().columnGroups().contains(this)
    }

    cache () {
        this._browser.cacheColumnGroup(this)
        //this.browser().cacheColumnGroup(this)
        //this.debugLog(".cache()")
        return this
    }

    isCached () {
        return this.browser().hasCachedColumnGroup(this)
    }
    
    uncache () {
        this._browser.uncacheColumnGroup(this)
        //this.browser().uncacheColumnGroup(this)
        //this.debugLog(".uncache()")
        return this
    }

    // edge pan

    acceptsBottomEdgePan () {
        if (this.node().nodeCanEditColumnWidth()) {
            return true
        }
        return false
    }

    acceptsRightEdgePan () {
        return true


        if (this.node().nodeCanEditColumnWidth()) {
            return true
        }
        return false

    }

    onRightEdgePanBegin (aGesture) {
        this._beforeEdgePanBorderRight = this.borderRight()
        this.setBorderRight("1px dashed red")
        this.setTransition("min-width 0s, max-width 0s")
        this.setTransition("0s")
        //this.makeCursorColResize()
    }

    onRightEdgePanMove (aGesture) {
        const p = aGesture.currentPosition() // position in document coords
        const f = this.frameInDocument()
        const h = p.x() - f.x()
        const minWidth = this.node() ? this.node().nodeMinWidth() : 10;
        if (h >= minWidth) {
            this.setMinAndMaxWidth(h) // need to do same for contentView?
        } else {
            this.setMinAndMaxWidth(minWidth) 
        }
        return this
    }

    onRightEdgePanComplete (aGesture) {
        this.setBorderRight(this._beforeEdgePanBorderRight)
        //this.makeCursorDefault()
    }

    // -------------------------------------
    
    hasFooter () {
        return !this.footerView().isDisplayHidden()
    }
    
    setHasFooter (aBool) {
        if (this.hasFooter() !== aBool) {
            this.footerView().setDisplayIsHidden(!aBool)
        }
        return this
    }

    isFirstColumnGroup () {
        return this.browser().columnGroups().first() === this
    }

    didChangeIsSelected () {
        super.didChangeIsSelected()
		
        if (this.column()) {
            this.column().setIsSelected(this.isSelected())
        }	
        return this
    }
	
    previousColumnGroup () {
        const prevCol = this.column().previousColumn()

        if (prevCol) { 
            return prevCol.columnGroup() 
        }

        return null
    }
	
    isFirstUncollapsed () {
        const pcg = this.previousColumnGroup()
        return (!this.isCollapsed()) && (!pcg || pcg.isCollapsed())
    }
	
    shouldShowBackArrow () {
        return !this.isFirstColumnGroup() && this.isFirstUncollapsed()
    }
	
    updateBackArrow () {
        this.headerView().setDoesShowBackArrow(this.shouldShowBackArrow())
        return this
    }
	
    // collapsing
	
    setIsCollapsed (aBool) {
        //if (this._isCollapsed !== aBool) {		
            if (aBool) {
                this.collapse()
            } else {
                this.uncollapse()
            }
        //}
        return this
    }
	
    name () {
        return this.node() ? this.index() + "-" + this.node().title() : null
    }
	
    index () {
        return this.browser().columnGroups().indexOf(this)
    }
	
    collapse () {
        //console.log(this.name() + " collapse ")
        this._isCollapsed = true
        this.setMinAndMaxWidth(0)
        this.setFlexGrow(0)
        this.setFlexShrink(0)
        this.setFlexBasis(0)
        return this
    }
	
    uncollapse () {
        //console.log(this.name() + " uncollapse")
        this._isCollapsed = false
        this.matchNodeMinWidth()
        this.setFlexGrow(1)
        this.setFlexShrink(1)
        //this.setFlexBasis(this.targetWidth())
        return this
    }
    
    setColumnClass (columnClass) { // no longer used, but might use someday
        if (this.column().type() !== columnClass.type()) {
            const view = columnClass.clone().setNode(this.node())
            this.scrollView().removeSubview(this.column())
            this.setColumn(view)
            this.scrollView().addSubview(this.column())
            this.browser().clipToColumnGroup(this)
        }
        return this
    }

    targetWidth () {
        let w = 0
        const node = this.node()
        
        if (node) {
	        w = node.nodeMinWidth()
            if (w === null) {
                return 0
            }

            /*
            let rw = this.column().maxRowWidth()
            //console.log("column " + this.node().title() + " maxRowWidth:" + rw)
            this.column().maxRowWidth()
            if (rw > w) {
                w = rw
            }
            */
            

            if (this.browser()) {
                if (this.browser().isSingleColumn()) {
                    w = this.browser().browserWidth()
                    assert (!Type.isNull(w)) 
                } 
            }
        }
			
        return w		
    }

    fitToTargetWidth () {
        if (this.node() && this.node().nodeFillsRemainingWidth()) {
            this.setMaxWidth("none")
            //this.setFlexGrow(1)
        } else {
            this.setMinAndMaxWidth(this.targetWidth())
        }
        return this
    }

    matchNodeMinWidth () {
        const w = this.targetWidth()
        if (w) {
            this.setMinAndMaxWidth(w)
        }
        return this
    }
    
    setNode (aNode) {
        if (Type.isNull(aNode) && this.browser() && this.isCached()) {
            this.debugLog(" setNode(null)")
        }

        if (aNode === this._node) {
            return this
        }
         
        super.setNode(aNode)

        this.setColumnClass(BrowserColumn)
        
        if (aNode) {
            // obey node's width preferences
            // use custom class for column if node wants it
            /*
            const customViewClass = aNode.viewClass()
            if (customViewClass) {
                this.setColumnClass(customViewClass)
            }
            */
            
            this.setHasFooter(aNode.nodeHasFooter())
        }
        
        this.headerView().setNode(aNode)
        this.column().setNode(aNode)
        this.footerView().setNode(aNode)
        return this
    }

    // just using this to make debugging easier

    syncFromNode () {        
        //console.log("BrowserColumnGroup syncFromNode "  + this.node().type())
        this.headerView().syncFromNodeNow()
        this.column().syncFromNodeNow()
        return this
    }

    debugTypeId () {
        return super.debugTypeId() + this.debugTypeIdSpacer() + this.column().debugTypeId()
    }

}.initThisClass()
