"use strict";

/*
    
    StackView

    A view from which of generalized (mixed vertical and horizontal) Miller Column system can be built.
    
    Overview of view structure:

        StackView contains:
            |- navView, which is a NavView and contains:
                |- scrollView, which is a StackScrollView and contains:
                    |- tilesView, which is a TilesView contains array of: 
                        |->> Tiles(or subclass), (each of which contains a contentView, so things like slide-to-delete gestures work)
            |- otherView, which is a FlexDomView whose content is used to display the selected ite, and can be set with setOtherViewContent()
        
    
        There is also a "direction" attribute. If it's value is:
        - "right": the navView is on the left, and otherView is on the right, causing navigation to head towards the left
        - "down": the navView is on the top, and otherView is on the bottom, causing navigation to head downwards

        Note: TilesViews will ask their parent StackView about their direction setting to determine the orientation layout of their subviews

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
    
    Drag & Drop:

        When dragging & dropping, hierarchy views for nodes are cached (in nodeToStackCache) in order to make the drag & drop implementation
        more manageable. For example, the source tilesView needs to remember where the dragged item was when returning to it.

*/

(class StackView extends NodeView {

    initPrototypeSlots () {
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
        this.setIsRegisteredForWindowResize(true)
        //this.addGestureRecognizer(LeftEdgePanGestureRecognizer.clone()) 
        //this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()) 
        this.setOnStackViewPathChangeNote(this.newNoteNamed("onStackViewPathChange"))

        this.syncOrientation()
        return this
    }

    setupNavView () {
        const v = NavView.clone()
        v.setStackView(this)
        this.setNavView(v)
        this.addSubview(v)
        return this
    }

    setupOtherView () {
        const v = FlexDomView.clone()
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
            if (aNode) {
                this._nodePathString = aNode.nodePathString()
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

    onWindowResize (event) {
        /*
        if (this.isRootStackView()) {
            this.safeUpdateCompactionChain()
        }
        */
        // TODO: change so only top stack view registers for resize
        this.updateCompaction()
        return this
    }

    setOtherViewContent (v) {
        const ov = this.otherView()
        ov.setFlexBasis(null)
        ov.setFlexGrow(1)
        ov.setFlexShrink(1)
        
        /*
        if (ov.subviews().length) {
            const names = ov.subviews().map(ov => ov.typeId())
            //console.log("removing subviews: ", names)
            debugger;
        }
        */
        
        ov.removeAllSubviews().addSubview(v)
        return this
    }

    clearOtherView () {
        const ov = this.otherView()
        ov.setFlexBasis("0px")
        ov.setFlexGrow(0)
        ov.setFlexShrink(0)

        /*
        if (ov.subviews().length) {
            const names = ov.subviews().map(ov => ov.typeId())
            //console.log("removing subviews: ", names)
            //debugger;
        }
        */
        
        ov.removeAllSubviews()
        return this
    }

    otherViewContent () {
        return this.nextStackView()
    }

    // notifications
    
    tilesView () {
        return this.navView().tilesView()
    }

    selectNodePathArray (nodePathArray) {  
        if (nodePathArray.length === 0) { 
            //console.log("- only one node in pathArray and it is ours, so unselecting all subtiles and we're done!")
            // no selections left so unselect next
            this.tilesView().unselectAllTiles()
            this.syncFromNavSelection()
            return true
        }

        nodePathArray = nodePathArray.shallowCopy()
        // the path should start with the node *after* this one
        
        //const p = nodePathArray.map(n => n.title()).join("/")
        //console.log("--- selectNodePathArray ---")
        //console.log(this.type() + " " + this.node().nodePathString() + " selectNodePathArray(" + nodePathArray.map(node => "'" + node.title() + "'").join(", ") + ")")
        const node = nodePathArray.shift() // pop the first node off (it should be us) and select the next one from our tiles, then pass remaining paths to the tile's stackview
        //console.warn("- popped '" + node.title() + "'")

        //this.syncFromNodeNow()
        assert(node !== this.node())

        /*
        console.log("1 this.tilesView().node().subnodes(): ", this.tilesView().node().subnodes())
        this.tilesView().syncFromNodeNow() //test
        console.log("2 this.tilesView().subviews(): ", this.tilesView().subviews())
        */

        let selectedTile = this.tilesView().selectTileWithNode(node)

        if (!selectedTile) {
            // if we didn't find the tile but the node is a subnode, sync the tilesView and look again
            if (this.tilesView().node().subnodes().contains(node)) {
                //console.warn("- the tilesView node's subnodes contain the path node, but there's no matching view!")
               // console.log("- so syncFromNodeNow and see if we can find it")
                this.tilesView().syncFromNodeNow()
                selectedTile = this.tilesView().selectTileWithNode(node)
                assert(selectedTile)
            }
        }

        if (!selectedTile) { // INVALID PATH ERROR
            console.log("- invalid path - can't find tile for node: " + node.title())

            console.log("debug info:")
            console.log("  looking for node: ", node.debugTypeId())
            const subnodeIds = this.tilesView().node().subnodes().map(node => node.debugTypeId())
            console.log("  subnodes:" + JSON.stringify(subnodeIds) )

            debugger;
            return false
        }

        //this.syncFromNavSelection()
        //console.log("- selectedTile '" + selectedTile.node().title() + "'")

        const childStack = this.nextStackView()
        if (childStack) {
            childStack.selectNodePathArray(nodePathArray)
        }
        return true
    }

    selectedNodePathArray () {
        // grab the whole chain of stack view
        const parts = this.stackViewSubchain().shallowCopy() 
        
        // last one might not have a node
        while (parts.last() && Type.isNullOrUndefined(parts.last().node())) {
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

    isRootStackView () {
        return this === this.rootStackView()
    }

    topDidChangeNavSelection () {
        // broadcast path change to listeners, like bread crumb view
        //console.log("topDidChangeNavSelection")
        //debugger;
        if (!this.rootStackView()) {
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
        this.syncFromNavSelection()
        //this.scheduleSyncFromNode()
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

    scheduleSyncFromNode () {
     //   debugger;
        super.scheduleSyncFromNode()
    }

    syncFromNavSelection () {
        // update otherViewContent view to match selected tile

        const tile = this.navView().tilesView().selectedTile() // this may get called before tilesView has synced to current subnodes,
        //console.log("StackView syncFromNavSelection " + this.node().title() + " -> " + (tile ? tile.nodeTitle() : null))
        //debugger;
        // in which case, the tile may be about to be removed
        if (tile && tile.nodeTileLink()) {
            const oNode = tile.nodeTileLink()
            const ovc = this.otherViewContent()
            if (!ovc || (ovc.node() !== oNode)) {
                const ov = this.otherViewContentForNode(oNode)
                this.setOtherViewContent(ov)
            }
        } else {
            this.clearOtherView()
        }

        this.safeUpdateCompactionChain()
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

    safeUpdateCompactionChain () {
        //this.bottomStackView().updateCompactionChain()
        this.updateCompactionChain()
    }

    updateCompactionChain () {
        this.updateCompaction() 
        this.tellParentViews("updateCompaction") 
    }

    updateCompaction () {
        this.compactNavAsNeeded()
        return this
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

    bottomStackView () {
        let current = this

        while (current) {
            const next = current.nextStackView()
            if (next) {
                current = next
            }
        }
        return current
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

    navViewSubchain () {
        return this.stackViewSubchain().map(sv => sv.navView())
    }

    sumOfNavWidths () { 
        // Returns sum of self and all preceeding vertical nav view widths.
        // This is used for compacting
        
        // NOTES:
        // - We assume no direct compaction of horizontal nav views (e.g. horizontal menus)
        //  ** so we need to skip summing widths of horizontal nav views 
        //     as well as compacting them 
        // - Even if vertical and horizontal navs are interleaved, 
        //   we treat all vertical nav view compactions 
        //   as if they are part of the same Miller Column.

        const verticalNavViews = this.navViewSubchain().filter(nv => nv.isVertical())
        const w = verticalNavViews.sum(nv => nv.targetWidth())
        return w

        /*
        let w = 0
        const views = this.stackViewSubchain()
        for (let i = 0; i < views.length; i++) { // use loop so we can break
            const sv = views[i]

            //if (sv.direction() !== this.direction()) {
            //    break 
            //}

            if (sv.navView().isVertical()) {
                w += sv.navView().targetWidth()
            }
        }
        return w
        */
    }

    topViewWidth () {
        const view = this.rootStackView()
        if (view.parentView() === DocumentBody.shared()) {
            return window.innerWidth // assume it fills the window? what about margins, padding?
        }
        return view.size().width() // clientWidth works here, but maybe all cases
        //return this.rootStackView().calcSize().width()
    }

    compactNavAsNeeded () {
        if (this.direction() === "right") {
            //console.log("StackView " + this.node().title() + " compactNavAsNeeded")

            const maxWidth = this.topViewWidth()
            const sum = this.sumOfNavWidths()

            if (sum > maxWidth) {
                //console.log("  " + this.node().title() + " sum " + sum + " > win " + maxWidth + " COLLAPSE")
                //debugger;
                //this.topViewWidth()

                this.navView().collapse()
            } else {
                //console.log("  " + this.node().title() + " sum " + sum + " < win " + maxWidth + " UNCOLLAPSE")
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
            //this.beginCaching()
            this.rootStackView().beginCaching()
        }
    }

    onDragViewClose (aNote) {
        console.log(this.debugTypeId() + " onDragViewClose")
        //this.endCaching()
        this.rootStackView().endCaching()
    }

    // begin / end caching

    isCaching () {
        return !Type.isNull(this.nodeToStackCache())
    }

    beginCaching () {
        // begins caching on all chained substacks
        if(!this.isCaching()) {
            //console.log(this.debugTypeId() + " beginCaching -----------------")
            //debugger;
            this.setNodeToStackCache(new Map())

            const ov = this.otherViewContent()
            if (ov && ov.cacheId) {
                this.cacheView(ov)
                ov.beginCaching()
            }
        }
        return this
    }

    endCaching () {
        // ends caching on all chained substacks
        if(this.isCaching()) {
            //console.log(this.debugTypeId() + " endCaching -----------------")
            //this.nodeToStackCache().valuesArray().forEach(sv => this.uncacheView(sv))
            this.setNodeToStackCache(null)

            const ov = this.otherViewContent()
            if (ov && ov.cacheId) {
                //this.uncacheView(ov)
                ov.endCaching()
            }
        }
        return this
    }

    // --- node to StackView cache ---

    cacheId () { // used atm in StackView cache
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
        }
        return this
    }

    /*
    uncacheView (stackView) {
        const cache = this.nodeToStackCache()
        const k = aView.cacheId()
        if (cache.hasKey(k)) {
            cache.removeKey(k)
        }
        return this
    }
    */

    cachedViewForNode (aNode) {
        if (this.hasCache() && aNode) {
            const k = aNode.typeId()
            return this.nodeToStackCache().at(k, this)
        }
        return null
    }

    otherViewContentForNode (aNode) {
        let sv = this.cachedViewForNode(aNode)

        if (!sv) {
            // what if node is null now and set *after* this?
            // things like a path change can alter node?
            sv = StackView.clone().setNode(aNode)
            if (this.isCaching()) {
                sv.beginCaching()
            }
        }

        return sv
    }
        
}.initThisClass());
