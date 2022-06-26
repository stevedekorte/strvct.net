"use strict";

/*
    
    StackView

    A view for from which a sort of generalized Miller Column system can be built.
    
    Overview of view structure:

        StackView contains:
            navView, which is a StackNavView and contains:
                scrollView, which is a StackScrollView and contains:
                    itemSetView, which is a StackItemSetView contains array of: 
                        Tiles(or subclass), (each of which contains a contentView, so things like slide-to-delete gestures work)
            otherView, which is a DomFlexView whose content is used to display the selected ite, and can be set with setOtherViewContent()
        
    
        There is also a "direction" attribute. If it's value is:
        - "right": the navView is on the left, and otherView is on the right, causing navigation to head towards the left
        - "down": the navView is on the top, and otherView is on the bottom, causing navigation to head downwards

        Note: StackItemSetViews will ask their parent StackView about their direction setting to determine the orientation layout of their subviews

        The direction for child StackViews can be set individually, so for example, we could use a "down" direction for the 
        topmost StackView or first few levels (so there will be left to right navigation menus at the top level) 
        while children could use the "right" direction so navigation under the top level is left to right.

        In this way, we can compose most common hierarchical navigation systems out of this single view type, 
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
        StackView.updateCompactionChain()
    

*/

(class StackView extends NodeView {

    initPrototype () {
        this.newSlot("navView", null)
        this.newSlot("otherView", null)
        this.newSlot("direction", "down").setDoesHookSetter(true) // valid values: left, right, up, down
        this.newSlot("lastPathString", null)
        this.newSlot("onStackViewPathChangeNote", null)
        this.newSlot("nodeToStackCache", null)
    }

    init () {
        super.init()

        this.setNodeToStackCache(null)
        
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
        this.setOnStackViewPathChangeNote(this.newNoteNamed("onStackViewPathChange"))

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

    // --- retire ---

    prepareToRetire () {
        // Don't retire the view while we are caching it.
        // Caching is only used during drag & drop now, 
        // but might be used elsewhere in the future.
        // TODO: should we pause events and observations while cached?
        if (this.hasCache()) {
            return false;
        }
        return super.prepareToRetire()
    }

    // --- direction ---

    didUpdateSlotDirection () {
        this.syncOrientation()
    }

    syncOrientation () {
        const d = this.direction()
        const nv = this.navView()
        if (d === "right") {
            this.makeOrientationRight()
        } else if (d == "down") {
            this.makeOrientationLeft()
        } else {
            throw new Error("unimplmented direction '" + d + "'")
        }
        this.navView().syncOrientation()
    }

    makeOrientationRight () {
        this.setFlexDirection("row")
        return this
    }

    makeOrientationLeft () {
        this.setFlexDirection("column")
        return this
    }

    /*
    verifyOrientation () {
        const d = this.direction()
        if (d == "right")
    }
    */
    
    /*
    setFlexDirection (v) {
        if (this.flexDirection() === "column" && v == "row") {
            debugger; // why are we switching back to row?
        }
        super.setFlexDirection(v)
        return this
    }
    */

    setNode (aNode) {
        if (aNode !== this.node()) {
            if (aNode && this.node() && this.previousStackView() && this.previousStackView().isCaching()) {
                throw new Error("this might invalidate a cache")
            }
            super.setNode(aNode)
        }
        return this
    }

    didChangeNode () {
        super.didChangeNode()
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

    setOtherViewContent (v) {
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
        return this.nextStackView()
    }

    // notifications
    
    itemSetView () {
        return this.navView().itemSetView()
    }

    selectNodePathArray (pathArray) {
        const node = pathArray.shift()

        if (node !== this.node()) {
            this.setNode(node)
            this.syncFromNavSelection()
            // should we verify if node is a subitem
        } else if (pathArray.length === 0) { 
            //console.log("unselect items after path: ", this.pathString())
            // no selections left so unselect next
            this.itemSetView().unselectAllTiles()
            this.syncFromNavSelection()
            return this
        }

        //debugger;
        this.itemSetView().selectTileWithNode(node)

        const childStack = this.nextStackView()
        if (childStack) {
            childStack.selectNodePathArray(pathArray)
        }
        return this
    }

    selectedNodePathArray () {
        const parts = this.stackViewSubchain().shallowCopy()
        
        if (Type.isNullOrUndefined(parts.last().node())) {
            //debugger;
            parts.removeLast()
        }

        return parts.map(sv => {
            if (!sv.node()) {
                debugger;
            }
            return sv.node()
        })
    }

    /*
    selectedNodePathArray () {
        return this.stackViewSubchain().map(sv => {
            if (!sv.node()) {
                debugger;
            }
            return sv.node()
        })
    }
    */

    topDidChangeNavSelection () {
        //console.log("topDidChangeNavSelection")
        //debugger;
        if (this !== this.rootStackView()) {
            debugger;
            return this
        }

        const currentPathString = this.selectedPathString()
        // TODO: change to node matching as path isn't unique and names can change
        if (this.lastPathString() !== currentPathString) {
            this.setLastPathString(currentPathString)
            this.didChangePath()
        }
        return this
    }

    didChangeNavSelection () {
        this.rootStackView().topDidChangeNavSelection()
        //this.syncFromNavSelection()
        this.scheduleMethod("syncFromNode")
        return true
    }

    selectedPathString () {
        return this.selectedNodePathArray().map(node => {
            return node.title()
        }).join("/")
    }

    pathString () {
        return this.stackViewSuperChain().reverse().map(sv => sv.node().title()).join("/")
    }

    // --- selected path changes ---

    didChangePath () {
        this.onStackViewPathChangeNote().post()
        return this
    }
    
    // ----------------

    syncFromNavSelection () {
        // update otherViewContent view to match selected ite,
        /*
        if (this.node().title() === "A") {
            console.log(" --- A --- ")
        }
        */

        //console.log("StackView " + this.node().title() + " syncFromNavSelection")
        const itemView = this.navView().itemSetView().selectedTile()
        if (itemView && itemView.nodeTileLink()) {
            const oNode = itemView.nodeTileLink()
            const ovc = this.otherViewContent()
            if (!ovc || (ovc.node() !== oNode)) {
                const ov = this.otherViewForNode(oNode)
                this.setOtherViewContent(ov)
            }
        } else {
            this.clearOtherView()
        }

        this.updateCompactionChain()
    }

    // stack view chain

    previousStackView () {
        // this stackView -> otherView -> previousStackView
        const otherView = this.parentView()
        if (otherView) {
            const previousStackView = otherView.parentView()
            if (previousStackView && previousStackView.previousStackView) {
                //if (previousStackView.isSubclassOf(StackView)) {
                return previousStackView
            }
        }
        /*
        if (p && p.previousStackView) {
            return p.parentView()
        }
        */
        return null
    }

    nextStackView () {
        return this.otherView().subviews().first()
    }

    rootStackView () {
        let p = this
        while (p.previousStackView()) {
            p = p.previousStackView()
        }
        return p
    }

    // --- compaction (adjusts number of visible stack areas to fit top stack view)

    updateCompactionChain () {
        this.updateCompaction() 
        this.tellParentViews("updateCompaction") 
    }

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
        // returns list of self and StackViews above
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
        // returns self and all StackViews below 
        const chain = []
        let current = this

        while (current) {
            chain.push(current)
            current = current.nextStackView()
        }
        return chain
    }

    sumOfNavWidths () { // used for compacting
        let w = 0
        const views = this.stackViewSubchain()
        for (let i = 0; i < views.length; i++) { // use loop so we can break
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

    topViewWidth () {
        return this.rootStackView().frameInDocument().width()
    }

    compactNavAsNeeded () {
        //console.log("StackView " + this.node().title() + " compactNavAsNeeded")

        if (this.direction() === "right") {
            const maxWidth = this.topViewWidth()
            const sum = this.sumOfNavWidths()

            if (sum > maxWidth) {
                //console.log(this.node().title() + " sum " + sum + " > win " + maxWidth + " COLLAPSE")
                this.navView().collapse()
            } else {
                //console.log(this.node().title() + " sum " + sum + " < win " + maxWidth + " UNCOLLAPSE")
                this.navView().uncollapse()
            }
        }

        return false
    }

    // --- caching during dragging ---

    // dragging events to start/end caching

    onStackChildDragSourceEnter (dragView) {
        if (!this.isCaching()) {
            console.log(this.debugTypeId() + " onStackChildDragSourceEnter")
            this.watchOnceForNoteFrom("onDragViewClose", dragView)
            this.beginCaching()
        }
    }

    onDragViewClose (aNote) {
        console.log(this.debugTypeId() + " onDragViewClose")
        this.endCaching()
    }

    // begin / end caching

    isCaching () {
        return !Type.isNull(this.nodeToStackCache())
    }

    beginCaching () {
        assert(!this.isCaching())
        this.setNodeToStackCache(ideal.Dictionary.clone())

        const ov = this.otherView()
        if (ov && ov.cacheId) {
            this.cacheView(ov)
            ov.beginCaching()
        }
        return this
    }

    endCaching () {
        assert(this.isCaching())
        this.nodeToStackCache().values().forEach(sv => this.uncacheView(sv))
        this.setNodeToStackCache(null)

        const ov = this.otherView()
        if (ov && ov.cacheId) {
            this.uncacheView(ov)
            ov.endCaching()
        }
        return this
    }

    // --- node to StackView cache ---

    cacheId () {
        return this.node().typeId()
    }

    hasCache () {
        return !Type.isNull(this.nodeToStackCache())
    }

    cacheView (aView) {
        const cache = this.nodeToStackCache()
        const k = aView.cacheId()
        if (!cache.hasKey(k)) {
            cache.atPut(k, aView)
            aView.viewRetain()
        }
        return this
    }

    uncacheView (stackView) {
        const cache = this.nodeToStackCache()
        const k = aView.cacheId()
        if (cache.hasKey(k)) {
            cache.removeKey(k)
            aView.viewRelease() // will schedule prepareToRetireIfReady if retain count is zero
        }
        return this
    }

    cachedViewForNode (aNode) {
        if (this.hasCache() && aNode) {
            const k = aNode.typeId()
            return this.nodeToStackCache().at(k, this)
        }
        return null
    }

    otherViewForNode (aNode) {
        let sv = this.cachedViewForNode(aNode)

        if (!sv) {
            // what if node is null now and set *after* this?
            // things like a path change can alter node?
            sv = StackView.clone().setNode(aNode)
        }

        return sv
    }

        
}.initThisClass());
