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
        //this.setTransition("opacity 0.5s ease-in-out")
        //this.setTransition("flex-basis 0.1s")
        this.setTransition("opacity 0.5s ease-in-out, flex-basis 0s")

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
        
        this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()) // for adjusting width
        this.addGestureRecognizer(BottomEdgePanGestureRecognizer.clone()) // for adjusting height

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

    borderColor () {
        return "rgba(255, 255, 255, 0.3)"
    }

    makeOrientationRight () {
        this.setFlexDirection("column")
        this.setFlexBasis(this.targetWidth() + "px")
        this.setFlexGrow(0)
        this.setFlexShrink(0)
        this.setBorderRight("1px solid " + this.borderColor())
        this.scrollView().setIsVertical(true)
    }

    makeOrientationDown () {
        this.setFlexDirection("row")
        this.setFlexBasis(this.targetHeight() + "px")
        this.setFlexGrow(0)
        this.setFlexShrink(0)   
        this.setBorderBottom("1px solid " + this.borderColor())
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
        this.applyStyles()
        return this
    }

    applyStyles () {
        super.applyStyles()
        const themeClass = this.currentThemeClass()
        if (themeClass) {
            const columns = themeClass.firstSubnodeWithTitle("columns")
            if (columns) {
                const colorFields = columns.subnodes().select(sn => sn.thisClass().isSubclassOf("BMStringField") || sn.type() === "BMField")
                const count = colorFields.length
                if (count) {
                    let i = this.stackView().stackViewDepth() 
                    let ci = i % count
                    const color = colorFields.at(ci).value()
                    console.log("column " + i + " color index " + ci + " color " + color)
                    this.setBackgroundColor(color)
                }
            }
        }
        return this
    }

    isCollapsed () {
        return this.maxWidthPx() === 0 || this.flexBasis() === "0px"
    }

    collapse () {
        if (!this.isCollapsed()) {
            //this.hideDisplay()
            //this.setMinAndMaxWidth(0)
            
            this.setFlexBasis("0px")
            this.setFlexGrow(0)
            this.setFlexShrink(0)
            
        }
    }

    uncollapse () {
        if (this.isCollapsed()) {
            //this.unhideDisplay()
            //this.setMinAndMaxWidth(this.targetWidth() + "px")
            this.syncOrientation()
        }
    }

        // --- right edge gesture ---
    
        onRightEdgePanBegin (aGesture) {
            this._beforeEdgePanBorderRight = this.borderRight()
            this.setBorderRight("1px dashed red")
        }

        onRightEdgePanMove (aGesture) {
            const p = aGesture.currentPosition() // position in document coords
            const f = this.frameInDocument()
            const nw = p.x() - f.x()
            console.log("nw = ", nw)
    
            this.setMinAndMaxWidth(nw)
            //this.node().setNodeMinRowWidth(nw)
            this.scheduleSyncToNode()
    
            return this
        }
    
        onRightEdgePanComplete (aGesture) {
            this.setBorderRight(this._beforeEdgePanBorderRight)
            this._beforeEdgePanBorderBottom = null
        }
    
        // --- bottom edge gesture ---
    
    
        onBottomEdgePanBegin (aGesture) {
            this._beforeEdgePanBorderBottom = this.borderBottom()
            this.setBorderBottom("1px dashed red")
            this.setTransition("min-height 0s, max-height 0s")
        }
    
        onBottomEdgePanMove (aGesture) {
            const p = aGesture.currentPosition() // position in document coords
            const f = this.frameInDocument()
            const newHeight = p.y() - f.y()
            console.log("newHeight = ", newHeight)
    
            this.setMinAndMaxHeight(newHeight)
            this.node().setNodeMinRowHeight(newHeight)
            this.scheduleSyncToNode()
    
            return this
        }
    
        onBottomEdgePanComplete (aGesture) {
            this.setBorderBottom(this._beforeEdgePanBorderBottom)
            this._beforeEdgePanBorderBottom = null
        }

}.initThisClass()
