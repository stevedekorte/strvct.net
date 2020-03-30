"use strict"

/*
    
    StackNavView
    
*/

window.StackNavView = class StackNavView extends NodeView {

    initPrototype () {
        this.newSlot("stackView", null)
        this.newSlot("scrollView", null) // contains column is middleView
        this.newSlot("itemSetView", null) // is inside scrollView
        this.newSlot("isCollapsed", false)
        this.newSlot("animatesCollapse", true)
        //this.newSlot("targetWidth", 200)
        this.newSlot("targetHeight", 64)
    }

    targetWidth () {
        if (this.node()) {
            return this.node().nodeMinWidth()
        }
        return 300
    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setFlexDirection("column")
        this.setFlexGrow(1)
        //this.setOpacity(0)
        this.setOverflow("hidden")
        this.setUserSelect("none")
        this.setTransition("opacity 0.5s ease-in-out")
        this.setTransition("flex-basis 0.1s")

        //this.setBorder("1px solid rgba(255, 255, 255, 0.3")

        /*
        this.setHeaderClass(ColumnGroupHeader)
        this.setMiddleClass(BrowserScrollView)
        this.setFooterClass(ColumnGroupFooter)
        this.setupHeaderMiddleFooterViews()
        this.footerView().hideDisplay()
        */

        this.setScrollView(StackScrollView.clone())
        this.addSubview(this.scrollView())
        
        this.setItemSetView(StackItemSetView.clone())
        this.scrollView().addSubview(this.itemSetView())
        
        //this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()) 
        return this
    }

    isVertical () {
        return this.stackView().direction() === "right"
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
        this.setFlexDirection("column")
        this.setFlexBasis(this.targetWidth() + "px")
        this.setFlexGrow(0)
        this.setFlexShrink(0)
        this.setBorderRight("1px solid rgba(255, 255, 255, 0.3)")
        this.scrollView().setIsVertical(true)
    }

    makeOrientationDown () {
        this.setFlexDirection("row")
        this.setFlexBasis(this.targetHeight() + "px")
        this.setFlexGrow(0)
        this.setFlexShrink(0)   
        this.setBorderBottom("1px solid rgba(255, 255, 255, 0.3)")
        this.scrollView().setIsVertical(false)
    }

    setNode (aNode) {
        super.setNode(aNode)
        this.itemSetView().setNode(aNode)
        return this
    }

    syncFromNode () {
        this.syncOrientation()
        //this.itemSetView().syncFromNode()
        return this
    }

    isCollapsed () {
        return this.maxWidthPx() === 0 || this.flexBasis() === "0px"
    }

    collapse () {
        if (!this.isCollapsed()) {
            //this.setMinAndMaxWidth(0)
            this.setFlexBasis("0px")
            this.setFlexGrow(0)
            this.setFlexShrink(0)
        }
    }

    uncollapse () {
        if (this.isCollapsed()) {
            //this.setMinAndMaxWidth(this.targetWidth() + "px")
            this.syncOrientation()
        }
    }

}.initThisClass()
