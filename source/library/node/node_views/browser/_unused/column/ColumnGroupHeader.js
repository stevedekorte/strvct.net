"use strict";

/*

    ColumnGroupHeader

*/

(class ColumnGroupHeader extends NodeView {
    
    initPrototype () {
        this.newSlot("backArrowView", null)
        this.newSlot("titleView", null)
        this.newSlot("doesShowBackArrow", false)
        this.newSlot("shouldShowTitle", false)
        this.newSlot("rightActionsView", null)
        this.newSlot("actionButtons", null)
    }


    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setMinAndMaxHeight("40px")
        this.setWidth("100%")
        this.setZIndex(3)
        this.setBackgroundColor("transparent")
        this.setBorderBottom("solid 1px rgba(55, 55, 55, 1)")
        //this.setBackgroundColor("#dbdbdb")
        this.setTextAlign("right")
        //this.collapse()
        //this.setTransition("all 0.3s ease-in-out")

        this.setActionButtons([])

        this.flexSplitIntoColumns(3)

        const lv = this.subviews().at(0).flexCenterContent().setFlexGrow(1)
        const mv = this.subviews().at(1).flexCenterContent().setFlexGrow(10)
        const rv = this.subviews().at(2).flexCenterContent().setFlexGrow(1)

        const backArrowView = this.newBackArrow()
        this.setBackArrowView(backArrowView)
        lv.addSubview(backArrowView)
        lv.setFlexDirection("row")
        lv.setJustifyContent("flex-start")
        lv.setAlignItems("center")
		
        const titleView = this.newTitleView()
        this.setTitleView(titleView)
        mv.addSubview(titleView)
		
        this.setRightActionsView(DomView.clone().setDivClassName("ColumnGroupFooterRightActionsView"))
        rv.addSubview(this.rightActionsView())
		
        this.setZIndex(2)
        return this
    }

    newTitleView () {
        const v = DomView.clone().setDivClassName("ColumnGroupHeaderTitleView")
        v.setDisplay("block")
        v.setColor("rgba(0,0,0,0.5)")
        v.setTextAlign("center")
        this.setWhiteSpace("nowrap")
        this.setTextOverflow("ellipsis")
        this.setPadding("1px")
        this.setOverflow("hidden")
        v.setInnerHTML("")
        v.setUserSelect("none")
        return v
    }

    newBackArrow () {
        const backArrowView = ButtonView.clone() //.setDivClassName("BackArrow")
        backArrowView.setTarget(this).setAction("didHitBackArrow")
        backArrowView.setTitleIsVisible(false)
        backArrowView.setIconName("left")
        backArrowView.iconView().setStrokeColor("rgba(0, 0, 0, 0.5)") 
        backArrowView.iconView().setFillColor("rgba(0, 0, 0, 0.5)") 
        backArrowView.setBackgroundSizeWH(10, 10)
        backArrowView.setOpacity(0.6)
        backArrowView.setWidth("fit-content")
        backArrowView.setPaddingTop("0em")
        backArrowView.setPaddingBottom("0em")
        backArrowView.setBoxShadow(null)
        return backArrowView
    }

    columnGroup () {
        return this.parentView()
    }
	
    browser () {
        if (!this.columnGroup()) {
            return null
        }
        return this.columnGroup().browser()
    }
    
    setShouldShowTitle (aBool) {
        if (this._shouldShowTitle !== aBool) {
            this._shouldShowTitle = aBool
            this.scheduleSyncFromNode()
            //console.log(" ----- " + (this.node() ? this.node().title() : null) + " setShouldShowTitle ", aBool)
        }
        this.syncWithBrowser()
        return this
    }
	
    shouldShowTitle () {
        return this.browser().isSingleColumn() && this.browser().lastActiveColumnGroup() === this.columnGroup()
    }
	
    showsAction (actionName) {
        return actionName !== "delete" // uses row delete action instead of column header action now
    }

    syncWithBrowser () {
        if (this.browser() && this.browser().shouldShowColumnHeaders()) {
            this.uncollapse()
        } else {
            this.collapse()
        }
        return this
    }

    syncFromNode () {
        const node = this.node()
        
        if (node && this.browser()) {
            if (this.shouldShowTitle()) {
    		    this.titleView().setInnerHTML(node.nodeHeaderTitle())
	        } 
            this.titleView().setDisplayIsHidden(!this.shouldShowTitle())
            this.backArrowView().setDisplayIsHidden(!this.doesShowBackArrow())

            //this.syncActionButtons()
        }
        
        //this.syncWithBrowser()
        return this
    }

    /*
    syncActionButtons () {
        //const oldButtons = this.actionButtons()

        node.actions().forEach((action) => {
            if (this.showsAction(action)) {
                const button = ColumnGroupHeaderAction.clone()
                button.setTarget(node).setAction(action)
                button.setCanClick(this.nodeHasAction(action))
                this.addSubview(button).syncFromNodeNow()
            }
        })

        return this
    }
    */
    
    nodeHasAction (anAction) {
        return this.node().respondsTo(anAction)
    }

    didHitBackArrow () {
        //this.debugLog(" back")
        this.browser().previous()
    }
	
    setDoesShowBackArrow (aBool) {
        if (this._doesShowBackArrow !== aBool) {
            //console.log(this.node().title() + " setDoesShowBackArrow " + aBool)
            this._doesShowBackArrow = aBool
            this.scheduleSyncFromNode()
        }
        return this
    }

    isUsed () {
        //return true
        
        // returns false if all views are empty (no title, no action buttons or arrows)
        if (this.doesShowBackArrow()) {
            return true
        }

        if (this.shouldShowTitle()) {
            return true
        }

        return false
    }

    collapse () {
        this.hideHeight()
        //this.hideDisplay()
    }

    uncollapse () {
        this.unhideHeight()
        //this.unhideDisplay()
    }
    
}.initThisClass())


