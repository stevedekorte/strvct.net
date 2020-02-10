"use strict"

/*

    BrowserHeader

*/

window.BrowserHeader = class BrowserHeader extends NodeView {
    
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
		
        this.setRightActionsView(DomView.clone().setDivClassName("BrowserFooterRightActionsView"))
        rv.addSubview(this.rightActionsView())
		
        this.setZIndex(2)
        return this
    }

    newTitleView () {
        const titleView = DomView.clone().setDivClassName("BrowserHeaderTitleView NodeView DomView").setInnerHTML("").setUserSelect("none")
        return titleView
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
        return this.columnGroup().browser()
    }
    
    setShouldShowTitle (aBool) {
        if (this._shouldShowTitle !== aBool) {
            this._shouldShowTitle = aBool
            this.scheduleSyncFromNode()
            //console.log(" ----- " + (this.node() ? this.node().title() : null) + " setShouldShowTitle ", aBool)
        }
        return this
    }
	
    shouldShowTitle () {
        return this.browser().isSingleColumn() && this.browser().lastActiveColumnGroup() === this.columnGroup()
    }
	
    showsAction (actionName) {
        return actionName !== "delete" // uses row delete action instead of column header action now
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
        
        return this
    }

    syncActionButtons () {
        //const oldButtons = this.actionButtons()

        node.actions().forEach((action) => {
            if (this.showsAction(action)) {
                const button = BrowserHeaderAction.clone()
                button.setTarget(node).setAction(action)
                button.setCanClick(this.nodeHasAction(action))
                this.addSubview(button).syncFromNodeNow()
            }
        })

        return this
    }
    
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
    
}.initThisClass()


