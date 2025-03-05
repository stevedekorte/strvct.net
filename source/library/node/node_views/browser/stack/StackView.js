"use strict";

/**
 * @module library.node.node_views.browser.stack
 * @class StackView
 * @extends NodeView
 * @description 

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

        /**
         * @member {NavView} navView
         * @description The navigation view for this stack.
         */
        {
            const slot = this.newSlot("navView", null);
            slot.setSlotType("NavView");
        }

        /**
         * @member {FlexDomView} otherView
         * @description The view that is displayed when this stack is not selected.
         */
        {
            const slot = this.newSlot("otherView", null);
            slot.setSlotType("FlexDomView");
        }

        /**
         * @member {String} direction
         * @description The direction of the stack.
         */
        {
            const slot = this.newSlot("direction", "down");
            slot.setDoesHookSetter(true); // valid values: left, right, up, down
            slot.setSlotType("String");
        }

        /**
         * @member {String} lastPathString
         * @description The last path string for this stack.
         */
        {
            const slot = this.newSlot("lastPathString", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {BMNotification} onStackViewPathChangeNote
         * @description The notification that is posted when the stack view path changes.
         */
        {
            const slot = this.newSlot("onStackViewPathChangeNote", null);
            slot.setSlotType("BMNotification");
        }

        /**
         * @member {Map} nodeToStackCache
         * @description A cache of nodes to stack views.
         */
        {
            const slot = this.newSlot("nodeToStackCache", null);
            slot.setSlotType("Map");
        }
    }

    init () {
        super.init()

        this.setNodeToStackCache(null);
        
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setWidth("100%");
        this.setHeight("100%");
        this.setMinHeight("100%");

        this.setFlexDirection("row");
        this.setFlexWrap("nowrap");
        this.setOverflow("hidden");

        this.setupNavView();
        this.setupOtherView();

        //this.setBorder("1px dashed white");

        this.setFlexBasis("fit-content");
        this.setFlexBasis("auto");
        this.setFlexGrow(1);
        this.setFlexShrink(0);

        // events
        this.setIsRegisteredForWindowResize(true);
        //this.addGestureRecognizer(LeftEdgePanGestureRecognizer.clone());
        //this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone());
        this.setOnStackViewPathChangeNote(this.newNoteNamed("onStackViewPathChange"));

        this.syncOrientation();
        return this;
    }

    /*
    didUpdateSlotParentView (oldValue, newValue) { 
        super.didUpdateSlotParentView(oldValue, newValue);
        console.log(this.typeId() + ".didUpdateSlotParentView(", oldValue.typeId(), ",", newValue.typeId(), ")");
        return this;
    }
    */

    /**
     * @description Sets up the navigation view for this stack.
     * @returns {StackView} The stack view.
     */
    setupNavView () {
        const v = NavView.clone();
        v.setStackView(this);
        this.setNavView(v);
        this.addSubview(v);
        return this;
    }

    /**
     * @description Sets up the other view for this stack.
     * @returns {StackView} The stack view.
     */
    setupOtherView () {
        const v = FlexDomView.clone();
        v.setFlexGrow(1);
        v.setFlexShrink(1);
        v.setFlexDirection("column");
        v.setWidth("100%");
        v.setHeight("100%");
        this.setOtherView(v);
        this.addSubview(v);
        this.clearOtherView();
        return this;
    }

    // --- direction ---

    /**
     * @description Updates the orientation of the stack view when the direction changes.
     * @returns {StackView} The stack view.
     */
    didUpdateSlotDirection () {
        this.syncOrientation();
    }

    /**
     * @description Updates the orientation of the stack view.
     * @returns {StackView} The stack view.
     */
    syncOrientation () {
        const d = this.direction();
        const nv = this.navView();
        if (d === "right") {
            this.makeOrientationRight();
        } else if (d == "down") {
            this.makeOrientationLeft();
        } else {
            throw new Error("unimplmented direction '" + d + "'");
        }
        this.navView().syncOrientation();
    }

    /**
     * @description Makes the orientation of the stack view right.
     * @returns {StackView} The stack view.
     */
    makeOrientationRight () {
        this.setFlexDirection("row");
        return this;
    }

    /**
     * @description Makes the orientation of the stack view left.
     * @returns {StackView} The stack view.
     */
    makeOrientationLeft () {
        this.setFlexDirection("column");
        return this;
    }

    /*
    verifyOrientation () {
        const d = this.direction();
        if (d == "right");
    }
    */
    
    /*
    setFlexDirection (v) {
        if (this.flexDirection() === "column" && v == "row") {
            debugger; // why are we switching back to row?
        }
        super.setFlexDirection(v);
        return this;
    }
    */

    /**
     * @description Sets the node for this stack view.
     * @param {Node} aNode The node to set.
     * @returns {StackView} The stack view.
     */
    setNode (aNode) {
        if (aNode !== this.node()) {
            if (aNode && this.node() && this.previousStackView() && this.previousStackView().isCaching()) {
                throw new Error("this might invalidate a cache");
            }
            if (aNode) {
                this._nodePathString = aNode.nodePathString();
            }
            super.setNode(aNode);
        }
        return this;
    }

    /**
     * @description Updates the navigation view when the node changes.
     * @returns {StackView} The stack view.
     */
    didChangeNode () {
        super.didChangeNode();
        this.navView().setNode(this.node());
        return this;
    }

    /**
     * @description Syncs the stack view from the node.
     * @returns {StackView} The stack view.
     */
    syncFromNode () {
        this.setDirection(this.node().nodeOrientation());

        this.syncOrientation();
        //this.navView().syncFromNodeNow();
        this.syncFromNavSelection();

        //this.setupColumnGroupColors();
        //this.fitColumns();
        return this;
    }

    /**
     * @description Handles the window resize event.
     * @param {Event} event The window resize event.
     * @returns {StackView} The stack view.
     */
    onWindowResize (event) {
        /*
        if (this.isRootStackView()) {
            this.safeUpdateCompactionChain();
        }
        */
        // TODO: change so only top stack view registers for resize
        this.updateCompaction();
        return this;
    }

    /**
     * @description Sets the content of the other view.
     * @param {DomView} v The view to set.
     * @returns {StackView} The stack view.
     */
    setOtherViewContent (v) {
        const ov = this.otherView();
        ov.setFlexBasis(null);
        ov.setFlexGrow(1);
        ov.setFlexShrink(1);
        
        /*
        if (ov.subviews().length) {
            const names = ov.subviews().map(ov => ov.typeId());
            //console.log("removing subviews: ", names);
            debugger;
        }
        */
        
        ov.removeAllSubviews().addSubview(v);
        return this;
    }

    /**
     * @description Clears the other view.
     * @returns {StackView} The stack view.
     */
    clearOtherView () {
        const ov = this.otherView();
        ov.setFlexBasis("0px");
        ov.setFlexGrow(0);
        ov.setFlexShrink(0);

        /*
        if (ov.subviews().length) {
            const names = ov.subviews().map(ov => ov.typeId());
            //console.log("removing subviews: ", names);
            //debugger;
        }
        */
        
        ov.removeAllSubviews();
        return this;
    }

    /**
     * @description Gets the content of the other view.
     * @returns {DomView} The view.
     */
    otherViewContent () {
        return this.nextStackView();
    }

    // notifications
    
    /**
     * @description Gets the tiles view.
     * @returns {TilesView} The tiles view.
     */
    tilesView () {
        return this.navView().tilesView();
    }

    /**
     * @description Selects a node path array.
     * @param {Array} nodePathArray The node path array to select.
     * @returns {Boolean} True if the selection was successful, false otherwise.
     */
    selectNodePathArray (nodePathArray) {  
        if (nodePathArray.length === 0) { 
            //console.log("- only one node in pathArray and it is ours, so unselecting all subtiles and we're done!")
            // no selections left so unselect next
            this.tilesView().unselectAllTiles();
            this.syncFromNavSelection();
            return true;
        }

        nodePathArray = nodePathArray.shallowCopy();
        // the path should start with the node *after* this one
        
        //const p = nodePathArray.map(n => n.title()).join("/");
        //console.log("--- selectNodePathArray ---");
        //console.log(this.type() + " " + this.node().nodePathString() + " selectNodePathArray(" + nodePathArray.map(node => "'" + node.title() + "'").join(", ") + ")");
        const node = nodePathArray.shift(); // pop the first node off (it should be us) and select the next one from our tiles, then pass remaining paths to the tile's stackview
        //console.warn("- popped '" + node.title() + "'");

        //this.syncFromNodeNow();
        assert(node !== this.node());

        /*
        console.log("1 this.tilesView().node().subnodes(): ", this.tilesView().node().subnodes());
        this.tilesView().syncFromNodeNow(); //test
        console.log("2 this.tilesView().subviews(): ", this.tilesView().subviews());
        */

        let selectedTile = this.tilesView().selectTileWithNode(node);

        if (!selectedTile) {
            // if we didn't find the tile but the node is a subnode, sync the tilesView and look again
            if (this.tilesView().node().subnodes().contains(node)) {
                //console.warn("- the tilesView node's subnodes contain the path node, but there's no matching view!");
               // console.log("- so syncFromNodeNow and see if we can find it");
                this.tilesView().syncFromNodeNow();
                selectedTile = this.tilesView().selectTileWithNode(node);
                assert(selectedTile);
            }
        }

        if (!selectedTile) { // INVALID PATH ERROR
            console.log("- invalid path - can't find tile for node: " + node.title());

            console.log("debug info:");
            console.log("  looking for node: ", node.debugTypeId());
            const subnodeIds = this.tilesView().node().subnodes().map(node => node.debugTypeId());
            console.log("  subnodes:" + JSON.stableStringifyWithStdOptions(subnodeIds) );

            debugger;
            return false;
        }

        //this.syncFromNavSelection();
        //console.log("- selectedTile '" + selectedTile.node().title() + "'");

        const childStack = this.nextStackView();
        if (childStack) {
            childStack.selectNodePathArray(nodePathArray);
        }
        return true;
    }

    /**
     * @description Gets the selected node path array.
     * @returns {Array} The node path array.
     */
    selectedNodePathArray () {
        // grab the whole chain of stack view
        const parts = this.stackViewSubchain().shallowCopy();
        
        // last one might not have a node
        while (parts.last() && Type.isNullOrUndefined(parts.last().node())) {
            //debugger;
            parts.removeLast();
        }

        return parts.map(sv => {
            if (!sv.node()) {
                debugger;
            }
            return sv.node();
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

    /**
     * @description Checks if the stack view is the root stack view.
     * @returns {Boolean} True if the stack view is the root stack view, false otherwise.
     */
    isRootStackView () {
        return this === this.rootStackView();
    }

    /**
     * @description Handles the change of navigation selection at the top level.
     * @returns {StackView} The stack view.
     */
    topDidChangeNavSelection () {
        // broadcast path change to listeners, like bread crumb view
        //console.log("topDidChangeNavSelection");
        //debugger;
        if (!this.rootStackView()) {
            debugger;
            return this;
        }

        const currentPathString = this.selectedPathTitlesString();
        // TODO: change to node matching as path isn't unique and names can change
        if (this.lastPathString() !== currentPathString) {
            this.setLastPathString(currentPathString);
            this.didChangePath();
        }
        return this;
    }

    /**
     * @description Handles the change of navigation selection.
     * @returns {StackView} The stack view.
     */
    didChangeNavSelection () {
        this.rootStackView().topDidChangeNavSelection();
        //this.syncFromNavSelection();
        this.syncFromNavSelection();
        //this.scheduleSyncFromNode();
        return true;
    }

    // --- set path titles ----

    /**
     * @description Sets the selected path titles array.
     * @param {Array} titles The titles array to set.
     * @returns {StackView} The stack view.
     */
    setSelectedPathTitlesArray (titles) {
        let title = titles.shift();
        const pathArray = [];
        let node = this.node();
        while (title) {
            node = node.firstSubnodeWithTitle(title);
            pathArray.push(node);
            title = titles.shift();
        }
        this.selectNodePathArray(pathArray);
        return this;
    }

    /**
     * @description Sets the selected path titles string.
     * @param {String} s The string to set.
     * @returns {StackView} The stack view.
     */
    setSelectedPathTitlesString (s) {
        console.log("setSelectedPathTitlesString:'" + s + "'");
        const titles = s.split("/");
        this.setSelectedPathTitlesArray(titles);
        return this;
    }

    // --- get path titles ----

    /**
     * @description Gets the selected path titles array.
     * @returns {Array} The titles array.
     */
    selectedPathTitlesArray () {
        const titles = this.selectedNodePathArray().map(node => {
            return node.title();
        })
        titles.shift();
        return titles;
    }

    /**
     * @description Gets the selected path titles string.
     * @returns {String} The titles string.
     */
    selectedPathTitlesString () {
        return this.selectedPathTitlesArray().join("/");
    }

    // --- this view's path string ---

    /**
     * @description Gets the path string for this view's super chain.
     * @returns {String} The path string.
     */
    pathString () {
        return this.stackViewSuperChain().reverse().map(sv => sv.node().title()).join("/");
    }

    // --- selected path changes ---

    /**
     * @description Handles the change of path.
     * @returns {StackView} The stack view.
     */
    didChangePath () {
        this.onStackViewPathChangeNote().post();
        return this;
    }
    
    // ----------------

    /**
     * @description Schedules a sync from the node.
     * @returns {StackView} The stack view.
     */
    scheduleSyncFromNode () {
        //debugger;
        super.scheduleSyncFromNode();
    }

    /**
     * @description Syncs from the navigation selection.
     * @returns {StackView} The stack view.
     */
    syncFromNavSelection () {
        // update otherViewContent view to match selected tile

        const tile = this.navView().tilesView().selectedTile(); // this may get called before tilesView has synced to current subnodes,
        //console.log("StackView syncFromNavSelection " + this.node().title() + " -> " + (tile ? tile.nodeTitle() : null));
        //debugger;
        // in which case, the tile may be about to be removed
        if (tile && tile.nodeTileLink()) {
            const oNode = tile.nodeTileLink();
            const ovc = this.otherViewContent();
            if (!ovc || (ovc.node() !== oNode)) {
                const ov = this.otherViewContentForNode(oNode);
                this.setOtherViewContent(ov);
            }
        } else {
            this.clearOtherView();
        }

        this.safeUpdateCompactionChain();
    }

    // stack view chain

    /**
     * @description Gets the previous stack view.
     * @returns {StackView} The previous stack view.
     */
    previousStackView () {
        // this stackView -> otherView -> previousStackView
        const otherView = this.parentView();
        if (otherView) {
            const previousStackView = otherView.parentView();
            if (previousStackView && previousStackView.previousStackView) {
                //if (previousStackView.isSubclassOf(StackView)) {
                return previousStackView;
            }
        }
        /*
        if (p && p.previousStackView) {
            return p.parentView();
        }
        */
        return null;
    }

    /**
     * @description Gets the next stack view.
     * @returns {StackView} The next stack view.
     */
    nextStackView () {
        return this.otherView().subviews().first();
    }

    /**
     * @description Gets the root stack view.
     * @returns {StackView} The root stack view.
     */
    rootStackView () {
        let p = this;
        while (p.previousStackView()) {
            p = p.previousStackView();
        }
        return p;
    }

    // --- compaction (adjusts number of visible stack areas to fit top stack view)

    /**
     * @description Safely updates the compaction chain.
     * @returns {StackView} The stack view.
     */
    safeUpdateCompactionChain () {
        //this.bottomStackView().updateCompactionChain();
        this.updateCompactionChain();
    }

    /**
     * @description Updates the compaction chain.
     * @returns {StackView} The stack view.
     */
    updateCompactionChain () {
        this.updateCompaction();
        this.tellParentViews("updateCompaction");
    }

    /**
     * @description Updates the compaction.
     * @returns {StackView} The stack view.
     */
    updateCompaction () {
        this.compactNavAsNeeded();
        return this;
    }

    /*
    firstParentWithDifferentDirection () {
        const d = this.direction();
        let current = this
        while (current) {
            const p = current.previousStackView();
            if (p && p.direction() !== d) {
                break;
            }
            current = p;
        }
        return current;
    }
    */

    /**
     * @description Gets the stack view super chain.
     * @returns {Array} The stack view super chain.
     */
    stackViewSuperChain () {
        // returns list of self and StackViews above
        const chain = [];
        let current = this;
        while (current) {
            chain.push(current);
            const p = current.previousStackView();
            current = p;
        }
        return chain;
    }

    /**
     * @description Gets the stack view depth.
     * @returns {Number} The depth.
     */
    stackViewDepth () {
        return this.stackViewSuperChain().length - 1;
    }

    /**
     * @description Gets the bottom stack view.
     * @returns {StackView} The bottom stack view.
     */
    bottomStackView () {
        let current = this;

        while (current) {
            const next = current.nextStackView();
            if (next) {
                current = next;
            }
        }
        return current;
    }

    /**
     * @description Gets the stack view subchain.
     * @returns {Array} The stack view subchain.
     */
    stackViewSubchain () {
        // returns self and all StackViews below 
        const chain = [];
        let current = this;

        while (current) {
            chain.push(current);
            current = current.nextStackView();
        }
        return chain;
    }

    /**
     * @description Gets the nav view subchain.
     * @returns {Array} The nav view subchain.
     */
    navViewSubchain () {
        return this.stackViewSubchain().map(sv => sv.navView());
    }

    /**
     * @description Gets the sum of nav widths.
     * @returns {Number} The sum of nav widths.
     */
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

        const verticalNavViews = this.navViewSubchain().filter(nv => nv.isVertical());
        const w = verticalNavViews.sum(nv => nv.targetWidth());
        return w;

        /*
        let w = 0;
        const views = this.stackViewSubchain();
        for (let i = 0; i < views.length; i++) { // use loop so we can break
            const sv = views[i];

            //if (sv.direction() !== this.direction()) {
            //    break;
            //}

            if (sv.navView().isVertical()) {
                w += sv.navView().targetWidth();
            }
        }
        return w;
        */
    }

    /**
     * @description Gets the top view width.
     * @returns {Number} The top view width.
     */
    topViewWidth () {
        const view = this.rootStackView();
        if (view.parentView() === DocumentBody.shared()) {
            return window.innerWidth; // assume it fills the window? what about margins, padding?
        }
        return view.size().width(); // clientWidth works here, but maybe all cases
        //return this.rootStackView().calcSize().width();
    }

    /**
     * @description Compacts the nav as needed.
     * @returns {StackView} The stack view.
     */
    compactNavAsNeeded () {
        // this method is called on each stack view in the chain, from left to right (earliest to last view), 
        // in order to compact them as needed to fit the available width.
        // So each will see the current compaction state (via sumOfNavWidths()) of all previous views in the chain when it makes its decision.

        if (this.direction() === "right") {
            //console.log("StackView " + this.node().title() + " compactNavAsNeeded");

            const maxWidth = this.topViewWidth(); // our subviews need to fit into this width
            
            // Calculate the sum WITHOUT this nav view
            const verticalNavViews = this.navViewSubchain().filter(nv => nv.isVertical());
            let sum = this.sumOfNavWidths();
            
            /*
            // if this is the last view, we don't need to check if it can fit
            if (this.nextStackView() === null) {
                sum -= this.navView().targetWidth();
            }
            */
                        
            if (sum > maxWidth) {
                //console.log("  " + this.node().title() + " sum " + sum + " > win " + maxWidth + " COLLAPSE");
                //debugger;
                //this.topViewWidth();
                this.navView().collapse();
            } else {
                //console.log("  " + this.node().title() + " sum " + sum + " < win " + maxWidth + " UNCOLLAPSE");
                this.navView().uncollapse();
            }
        }

        return false;
    }

    // --- caching during dragging ---

    // dragging events to start/end caching

    /**
     * @description Handles the drag source enter event.
     * @param {View} dragView The drag view.
     * @returns {StackView} The stack view.
     */
    onStackChildDragSourceEnter (dragView) {
        if (!this.isCaching()) {
            console.log(this.debugTypeId() + " onStackChildDragSourceEnter");
            this.watchOnceForNoteFrom("onDragViewClose", dragView);
            //this.beginCaching();
            this.rootStackView().beginCaching();
        }
    }

    /**
     * @description Handles the drag view close event.
     * @param {Note} aNote The note.
     * @returns {StackView} The stack view.
     */
    onDragViewClose (aNote) {
        console.log(this.debugTypeId() + " onDragViewClose");
        //this.endCaching();
        this.rootStackView().endCaching();
    }

    // begin / end caching

    /**
     * @description Checks if the stack view is caching.
     * @returns {Boolean} True if caching, false otherwise.
     */
    isCaching () {
        return !Type.isNull(this.nodeToStackCache());
    }

    /**
     * @description Begins caching on all chained substacks.
     * @returns {StackView} The stack view.
     */
    beginCaching () {
        // begins caching on all chained substacks
        if(!this.isCaching()) {
            //console.log(this.debugTypeId() + " beginCaching -----------------");
            //debugger;
            this.setNodeToStackCache(new Map());

            const ov = this.otherViewContent();
            if (ov && ov.cacheId) {
                this.cacheView(ov);
                ov.beginCaching();
            }
        }
        return this;
    }

    /**
     * @description Ends caching on all chained substacks.
     * @returns {StackView} The stack view.
     */
    endCaching () {
        // ends caching on all chained substacks
        if(this.isCaching()) {
            //console.log(this.debugTypeId() + " endCaching -----------------");
            //this.nodeToStackCache().valuesArray().forEach(sv => this.uncacheView(sv));
            this.setNodeToStackCache(null);

            const ov = this.otherViewContent();
            if (ov && ov.cacheId) {
                //this.uncacheView(ov);
                ov.endCaching();
            }
        }
        return this;
    }

    // --- node to StackView cache ---

    /**
     * @description Gets the cache id.
     * @returns {String} The cache id.
     */
    cacheId () { // used atm in StackView cache
        return this.node().typeId();
    }

    /**
     * @description Checks if the stack view has a cache.
     * @returns {Boolean} True if has cache, false otherwise.
     */
    hasCache () {
        return !Type.isNull(this.nodeToStackCache());
    }

    /**
     * @description Caches a view.
     * @param {View} aView The view to cache.
     * @returns {StackView} The stack view.
     */
    cacheView (aView) {
        const cache = this.nodeToStackCache();
        const k = aView.cacheId();
        if (!cache.hasKey(k)) {
            cache.atPut(k, aView);
        }
        return this
    }

    /*
    uncacheView (stackView) {
        const cache = this.nodeToStackCache();
        const k = aView.cacheId();
        if (cache.hasKey(k)) {
            cache.removeKey(k);
        }
        return this;
    }
    */

    /**
     * @description Gets the cached view for a node.
     * @param {Node} aNode The node.
     * @returns {View} The cached view.
     */
    cachedViewForNode (aNode) {
        if (this.hasCache() && aNode) {
            const k = aNode.typeId();
            return this.nodeToStackCache().at(k, this);
        }
        return null;
    }

    /**
     * @description Gets the other view content for a node.
     * @param {Node} aNode The node.
     * @returns {View} The other view content.
     */
    otherViewContentForNode (aNode) {
        let sv = this.cachedViewForNode(aNode);

        if (!sv) {
            // what if node is null now and set *after* this?
            // things like a path change can alter node?
            sv = StackView.clone().setNode(aNode);
            if (this.isCaching()) {
                sv.beginCaching();
            }
        }

        return sv;
    }
        
}.initThisClass());
