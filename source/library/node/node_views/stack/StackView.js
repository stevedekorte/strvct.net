"use strict";

/*
    
    StackView
    
*/

(class StackView extends NodeView {

    static instanceCache () {
        let v = this.getClassVariable("_instanceCache")
        if (!v) {
            v = Dictionary.clone()
            this.setClassVariable("_instanceCache", v)
        }
        return v
    }

    initPrototype () {
        this.newSlot("navView", null)
        this.newSlot("otherView", null)
        this.newSlot("direction", "right").setDoesHookSetter(true) // valid values: left, right, up, down
    }

    init () {
        super.init()
        this.setDisplay("flex")
        this.setPosition("relative")
        this.setWidth("100%")
        this.setHeight("100%")
        this.setMinHeight("100%")

        this.setFlexDirection("row")
        this.setFlexWrap("nowrap")
        this.setOverflow("hidden")

        this.setupNavView()
        this.setupOtherView()

        //this.setBorder("1px dashed white")

        this.setFlexBasis("fit-content")
        this.setFlexBasis("auto")
        this.setFlexGrow(1)
        this.setFlexShrink(0)

        // events
        this.setIsRegisteredForDocumentResize(true)
        //this.addGestureRecognizer(LeftEdgePanGestureRecognizer.clone()) 
        //this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()) 

        this.syncOrientation()
        return this
    }

    setupNavView () {
        const v = StackNavView.clone()
        v.setStackView(this)
        this.setNavView(v)
        this.addSubview(v)
        return this
    }

    setupOtherView () {
        const v = DomFlexView.clone()
        v.setFlexGrow(1)
        v.setFlexShrink(1)
        v.setFlexDirection("column")
        v.setWidth("100%")
        v.setHeight("100%")
        this.setOtherView(v)
        this.addSubview(v)
        this.clearOtherView()
        return this
    }

    // --- direction ---

    // --- cache ---

    cacheId () {
        return this.node().typeId()
    }

    isCached () {
        return this.thisClass().instanceCache().hasKey(this.cacheId())
    }

    cache () {
        this.thisClass().instanceCache().atPut(this.cacheId(), this)
        return this
    }

    uncache () {
        this.thisClass().instanceCache().removeKey(this.cacheId())
        return this
    }

    stackViewForNode (aNode) {
        let sv = this.thisClass().instanceCache().at(aNode.typeId(), this)
        if (!sv) {
            sv = StackView.clone().setNode(aNode)
        }
        return sv
    }

    // ---  ---

    didUpdateSlotDirection () {
        this.syncOrientation()
    }

    syncOrientation () {
        const d = this.direction()
        const nv = this.navView()
        if (d === "right") {
            this.setFlexDirection("row")
            //this.navView().setIsVertical(false)

        } else if (d == "down") {
            this.setFlexDirection("column")
            //this.navView().setIsVertical(true)
        }
        this.navView().syncOrientation()
    }

    setNode (aNode) {
        super.setNode(aNode)
        this.navView().setNode(this.node())
        return this
    }

    syncFromNode () {
        this.setDirection(this.node().nodeOrientation())

        this.syncOrientation()
        //this.navView().syncFromNodeNow()
        this.syncFromNavSelection()

        //this.setupColumnGroupColors()
        //this.fitColumns()
        return this
    }

    onDocumentResize (event) {
        this.updateCompaction()
        return this
    }

    setOtherViewContent(v) {
        const ov = this.otherView()
        ov.setFlexBasis(null)
        ov.setFlexGrow(1)
        ov.setFlexShrink(1)
        ov.removeAllSubviews().addSubview(v)
        return this
    }

    clearOtherView () {
        const ov = this.otherView()
        ov.setFlexBasis("0px")
        ov.setFlexGrow(0)
        ov.setFlexShrink(0)
        ov.removeAllSubviews()
        return this
    }

    otherViewContent () {
        return this.otherView().subviews().first()
    }

    didChangeNavSelection () {
        //this.syncFromNavSelection()
        this.scheduleMethod("syncFromNode")
        return true
    }

    syncFromNavSelection () {
        // update otherViewContent view to match selected ite,
        /*
        if (this.node().title() === "A") {
            console.log(" --- A --- ")
        }
        */

        //console.log("StackView " + this.node().title() + " syncFromNavSelection")
        const itemView = this.navView().itemSetView().selectedRow()
        if (itemView && itemView.nodeRowLink()) {
            const oNode = itemView.nodeRowLink()
            const ovc = this.otherViewContent()
            if (!ovc || (ovc.node() !== oNode)) {
                const ov = this.stackViewForNode(oNode)
                this.setOtherViewContent(ov)
                this.updateCompaction()
                this.tellParentViews("updateCompaction")
            }
        } else {
            this.clearOtherView()
        }
    }

    // stack view chain

    previousStackView () {
        // stackView -> otherView -> stackView
        const p = this.parentView()
        if (p) {
            return p.parentView()
        }
        return null
    }

    nextStackView( ) {
        return this.otherView().subviews().first()
    }

    topStackView () {
        let p = this
        while (p.previousStackView()) {
            p = p.previousStackView()
        }
        return p
    }

    // compaction

    updateCompaction () {
        this.compactNavAsNeeded()
        /*
        let pd = this.firstParentWithDifferentDirection()
        if (pd) {
            pd.compactNavAsNeeded()
        }
        */
        return false
    }

    /*
    firstParentWithDifferentDirection () {
        const d = this.direction()
        let current = this
        while (current) {
            const p = current.previousStackView() 
            if (p && p.direction() !== d) {
                break
            }
            current = p
        }
        return current
    }
    */

    stackViewSuperChain () {
        // returns list of self and StackViews above self
        const chain = []
        let current = this
        while (current) {
            chain.push(current)
            const p = current.previousStackView()
            current = p
        }
        return chain
    }

    stackViewDepth () {
        return this.stackViewSuperChain().length - 1
    }

    stackViewSubchain () {
        // returns all self and StackViews below self
        const chain = []
        let current = this
        while (current) {
            chain.push(current)
            current = current.otherView().subviews().first()
        }
        return chain
    }

    sumOfNavWidths () {
        let w = 0
        const views = this.stackViewSubchain()
        for (let i = 0; i < views.length; i++) {
            const sv = views[i]
            /*
            if (sv.direction() !== this.direction()) {
                break
            }
            */
            if (sv.navView().isVertical()) {
                w += sv.navView().targetWidth()
            }
        }
        return w
    }

    compactNavAsNeeded () {
        if (this.direction() === "right") {
            const maxWidth = this.frameInDocument().width()
            const w = this.sumOfNavWidths()

            if (w > maxWidth) {
                console.log(this.node().title() + " sum" + w + " > win" + maxWidth + " COLLAPSE")
                this.navView().collapse()
            } else {
                console.log(this.node().title() + " sum" + w + " < win" + maxWidth + " UNCOLLAPSE")
                this.navView().uncollapse()
            }
        }

        return false
    }


}.initThisClass());
