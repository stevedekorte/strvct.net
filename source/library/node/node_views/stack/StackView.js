"use strict";

/*
    
    StackView

    A view for from which a sort of generalized Miller Column system can be built.
    
    Overview of view structure:

        StackView contains:
            navView, which is a StackNavView and contains:
                scrollView, which is a StackScrollView and contains:
                    itemSetView, which is a StackItemSetView contains array of: 
                        BrowserRows(or subclass), (each of which contains a contentView, so things like slide-to-delete gestures work)
            otherView, which is a DomFlexView whose content is used to display the selected ite, and can be set with setOtherViewContent()
        
    
        There is also a "direction" attribute. If it's value is:
        - "right": the navView is on the left, and otherView is on the right, causing navigation to head towards the left
        - "down": the navView is on the top, and otherView is on the bottom, causing navigation to head downwards

        Note: StackItemSetViews will ask their parent StackView about their direction setting to determine the orientation layout of their subviews

        The direction for child StackViews can be set individually, so for example, we could use a "down" direction for the 
        topmost StackView or first few levels (so there will be left to right navigation menus at the top level) 
        while children could use the "right" direction so navigation under the top level is left to right.

        In this way, we can compose most common hierarchical navigation systems out of this single view, 
        maximizing code reuse and flexibility. For example:
        - developer can change layout without code changes
        - layout could flexibly change with display size 
        - each user could potentially chose a preferred layout

        This also means all the logic around expanding, collapsing, selecting, navigating the views
        can be reused among all the possible navigation layouts.

    Overview of expand/collapse behavior:

        The StackView will try to collapse and expand levels of navigation to make the best use of the available display area.
        For example, as one navigates deeper into the hierarchy such that the columns would consume the width of the display,
        the top most views will start collpasing to allow the deepest views to be displayed. 

        The relevant method is:
        StackView.updateCompaction () which calls StackView.compactNavAsNeeded()
    

*/

(class StackView extends NodeView {

    static instanceCache () {
        // need to cache these so we can return to the state (e.g. selection, scroll point, etc) 
        // we left off in when we changed the selected node
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
            //const maxWidth = this.frameInDocument().width()
            const maxWidth = this.topStackView().frameInDocument().width()

            const sum = this.sumOfNavWidths()

            if (sum > maxWidth) {
                console.log(this.node().title() + " sum " + sum + " > win " + maxWidth + " COLLAPSE")
                this.navView().collapse()
            } else {
                console.log(this.node().title() + " sum " + sum + " < win " + maxWidth + " UNCOLLAPSE")
                this.navView().uncollapse()
            }
        }

        return false
    }


}.initThisClass());
