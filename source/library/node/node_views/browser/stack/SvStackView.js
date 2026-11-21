"use strict";

/** * @module library.node.node_views.browser.stack
 */

/** * @class SvStackView
 * @extends SvNodeView
 * @description

    A view from which of generalized (mixed vertical and horizontal) Miller Column system can be built.

    Overview of view structure:

        SvStackView contains:
            |- navView, which is a SvNavView and contains:
                |- scrollView, which is a SvStackScrollView and contains:
                    |- tilesView, which is a SvTilesView contains array of:
                        |->> Tiles(or subclass), (each of which contains a contentView, so things like slide-to-delete gestures work)
            |- otherView, which is a SvFlexDomView whose content is used to display the selected ite, and can be set with setOtherViewContent()


        There is also a "direction" attribute. If it's value is:
        - "right": the navView is on the left, and otherView is on the right, causing navigation to head towards the left
        - "down": the navView is on the top, and otherView is on the bottom, causing navigation to head downwards

        Note: TilesViews will ask their parent SvStackView about their direction setting to determine the orientation layout of their subviews

        The direction for child StackViews can be set individually, so for example, we could use a "down" direction for the
        topmost SvStackView or first few levels (so there will be left to right navigation menus at the top level)
        while children could use the "right" direction so navigation under the top level is left to right.

        In this way, we can compose most common hierarchical navigation systems out of this single view type,
        maximizing code reuse and flexibility. For example:
        - developer can change layout without code changes
        - layout could flexibly change with display size
        - each user could potentially chose a preferred layout

        This also means all the logic around expanding, collapsing, selecting, navigating the views
        can be reused among all the possible navigation layouts.

    Overview of expand/collapse behavior:

        The SvStackView will try to collapse and expand levels of navigation to make the best use of the available display area.
        For example, as one navigates deeper into the hierarchy such that the columns would consume the width of the display,
        the top most views will start collpasing to allow the deepest views to be displayed.

        The relevant method is:
        SvStackView.recompactBrowserChain()

    Drag & Drop:

        When dragging & dropping, hierarchy views for nodes are cached (in nodeToStackCache) in order to make the drag & drop implementation
        more manageable. For example, the source tilesView needs to remember where the dragged item was when returning to it.


 */

(class SvStackView extends SvNodeView {

    initPrototypeSlots () {
        {
            // The root stack's measured width, kept between resizes (see
            // cachedRootWidth); null = measure on next ask.
            const slot = this.newSlot("rootWidthCache", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvNavView} navView
         * @description The navigation view for this stack.
         */
        {
            const slot = this.newSlot("navView", null);
            slot.setSlotType("SvNavView");
        }

        /**
         * @member {SvDetailView} detailView
         * @description The always-present container owning everything past the
         * nav column: the child stack / inspector for the current selection
         * (its childStackView — the old otherView) and, when the stack's node
         * answers nodeCompanionNode(), a companion panel.
         */
        {
            const slot = this.newSlot("detailView", null);
            slot.setSlotType("SvDetailView");
        }

        /**
         * @member {String} direction
         * @description The direction of the stack. That is, the direction of the other view relative to the navigation view.
         * So if the direction is "right", the other view is on the right of the navigation view.
         * And if the direction is "down", the other view is on the bottom of the navigation view.
         * Remember that the navigation view displays the subnodes of the current node, and the other view displays the selected node.
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
         * @member {SvNotification} onStackViewPathChangeNote
         * @description The notification that is posted when the stack view path changes.
         */
        {
            const slot = this.newSlot("onStackViewPathChangeNote", null);
            slot.setSlotType("SvNotification");
        }

        /**
         * @member {Map} nodeToStackCache
         * @description A cache of nodes to stack views.
         */
        {
            const slot = this.newSlot("nodeToStackCache", null);
            slot.setSlotType("Map");
        }

        /**
         * @member {String|null} appliedSurfaceName - the
         * nodeContainerSurfaceName last painted, so a repeated sync does not
         * rewrite an unchanged value. View-side bookkeeping, never stored.
         * @category Theme
         */
        {
            const slot = this.newSlot("appliedSurfaceName", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();

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
        this.setupDetailView();

        //this.setBorder("1px dashed white");

        this.setFlexBasis("fit-content");
        this.setFlexBasis("auto");
        this.setFlexGrow(1);
        this.setFlexShrink(0);

        // events
        // Window resize: only a browser's ROOT stack listens. SvBrowserView
        // registers it where it makes its root stack (a stack can't tell
        // here whether it is the root: it has no parent yet).
        //this.addGestureRecognizer(SvLeftEdgePanGestureRecognizer.clone());
        //this.addGestureRecognizer(SvRightEdgePanGestureRecognizer.clone());
        this.setOnStackViewPathChangeNote(this.newNoteNamed("onStackViewPathChange"));

        this.syncOrientation();

        // Accessibility: landmark role for the main navigation container
        this.setAriaRole("navigation");

        return this;
    }

    /*
    didUpdateSlotParentView (oldValue, newValue) {
        super.didUpdateSlotParentView(oldValue, newValue);
        console.log(this.svTypeId() + ".didUpdateSlotParentView(", oldValue.svTypeId(), ",", newValue.svTypeId(), ")");
        return this;
    }
    */

    /**
     * @description Sets up the navigation view for this stack.
     * @returns {SvStackView} The stack view.
     */
    setupNavView () {
        const v = SvNavView.clone();
        v.setStackView(this);
        this.setNavView(v);
        this.addSubview(v);
        return this;
    }

    /**
     * @description Sets up the other view for this stack.
     * @returns {SvStackView} The stack view.
     */
    setupDetailView () {
        const v = SvDetailView.clone();
        v.setStackView(this);
        this.setDetailView(v);
        this.addSubview(v);
        this.clearOtherView();
        return this;
    }

    /**
     * @description The container hosting the child stack / inspector for the
     * current selection — the detail view's childStackView (the old otherView).
     * @returns {SvFlexDomView} The container view.
     */
    otherView () {
        return this.detailView().childStackView();
    }

    // --- direction ---

    /**
     * @description Updates the orientation of the stack view when the direction changes.
     * @returns {SvStackView} The stack view.
     */
    didUpdateSlotDirection () {
        this.syncOrientation();
    }

    /**
     * @description Updates the orientation of the stack view.
     * @returns {SvStackView} The stack view.
     */
    syncOrientation () {
        const d = this.direction();
        //const nv = this.navView();
        if (d === "right") {
            this.makeOrientationRight();
        } else if (d == "down") {
            this.makeOrientationDown();
        } else {
            throw new Error("unimplmented direction '" + d + "'");
        }
        this.navView().syncOrientation();
        this.detailView().syncOrientation(d);
    }

    /**
     * @description Makes the orientation of the stack view right.
     * @returns {SvStackView} The stack view.
     */
    makeOrientationRight () {
        this.setFlexDirection("row");
        return this;
    }

    /**
     * @description Lays the stack out downward: the nav view above, the
     * detail view below it (the "down" direction). It was named
     * makeOrientationLeft; that name is kept free for a real "left".
     * @returns {SvStackView} The stack view.
     */
    makeOrientationDown () {
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
            // why are we switching back to row?
        }
        super.setFlexDirection(v);
        return this;
    }
    */

    /**
     * @description Sets the node for this stack view.
     * @param {Node} aNode The node to set.
     * @returns {SvStackView} The stack view.
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
     * @returns {SvStackView} The stack view.
     */
    didChangeNode () {
        super.didChangeNode();
        this.navView().setNode(this.node());
        return this;
    }

    /**
     * @description Syncs the stack view from the node.
     * @returns {SvStackView} The stack view.
     */
    syncFromNode () {
        // anchored tabs: the tab row runs across the top, the panes beneath
        this.setDirection(this.isAnchoredTabs() ? "down" : this.node().nodeOrientation());

        this.syncOrientation();
        this.syncSurfaceFromNode();
        //this.navView().syncFromNodeNow();
        this.syncFromNavSelection();
        this.detailView().syncCompanionFromNode(this.node());

        //this.setupColumnGroupColors();
        //this.fitColumns();
        return this;
    }

    /**
     * @description Paints this stack view from its node's
     * nodeContainerSurfaceName. A stack view IS a node's detail region — its
     * own column of children plus, through the detail view, every deeper
     * column — so one paint here is inherited by all of them, because tiles,
     * columns and the breadcrumb bar are transparent by default. A deeper
     * node that names its own surface paints its own stack view and overrides
     * from there down. Null paints nothing, so the enclosing surface shows.
     * @returns {SvStackView}
     * @category Theme
     */
    syncSurfaceFromNode () {
        const node = this.node();
        const name = (node && node.nodeContainerSurfaceName) ? node.nodeContainerSurfaceName() : null;
        if (name === this.appliedSurfaceName()) {
            return this;
        }
        this.setAppliedSurfaceName(name);
        this.setBackgroundColor(this.backgroundValueForSurfaceName(name));
        return this;
    }

    /**
     * @description Handles the window resize event.
     * @param {Event} event The window resize event.
     * @returns {SvStackView} The stack view.
     */
    onWindowResize (/*event*/) {
        // Only a browser's root stack is registered for this (see
        // SvBrowserView), so one resize is one chain pass per browser.
        this.rootStackView().invalidateRootWidth();
        this.recompactBrowserChain();
        return this;
    }

    /**
     * @description Sets the content of the other view.
     * @param {SvDomView} v The view to set.
     * @returns {SvStackView} The stack view.
     */
    setOtherViewContent (v) {
        this.detailView().setHasStackContent(true);

        const ov = this.otherView();
        ov.setFlexBasis(null);
        ov.setFlexGrow(1);
        ov.setFlexShrink(1);

        // On mobile, make sure the otherView is visible when it has content
        if (SvWebBrowserWindow.shared().isOnMobile()) {
            ov.unhideDisplay();
        }

        /*
        if (ov.subviews().length) {
            const names = ov.subviews().map(ov => ov.svTypeId());
            //console.log("removing subviews: ", names);
        }
        */

        ov.removeAllSubviews().addSubview(v);
        return this;
    }

    /**
     * @description Clears the other view.
     * @returns {SvStackView} The stack view.
     */
    clearOtherView () {
        this.detailView().setHasStackContent(false);

        const ov = this.otherView();
        ov.setFlexBasis("0px");
        ov.setFlexGrow(0);
        ov.setFlexShrink(0);

        // On mobile, also hide the otherView completely
        if (SvWebBrowserWindow.shared().isOnMobile()) {
            ov.hideDisplay();
        }

        /*
        if (ov.subviews().length) {
            const names = ov.subviews().map(ov => ov.svTypeId());
            //console.log("removing subviews: ", names);

        }
        */

        ov.removeAllSubviews();
        return this;
    }

    /**
     * @description Gets the content of the other view.
     * @returns {SvDomView} The view.
     */
    otherViewContent () {
        return this.nextStackView();
    }

    // notifications

    /**
     * @description Gets the tiles view.
     * @returns {SvTilesView} The tiles view.
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
        if (this.isAnchoredTabs()) {
            return this.anchoredSelectNodePathArray(nodePathArray); // opens the tab, the rest goes into its pane
        }
        if (nodePathArray.length === 0) {
            //console.log("- only one node in pathArray and it is ours, so unselecting all subtiles and we're done!")
            // no selections left so unselect next
            this.tilesView().unselectAllTiles();
            this.syncFromNavSelection();
            return true;
        }

        const nextNodePathArray = nodePathArray.shallowCopy();
        // the path should start with the node *after* this one

        //const p = nodePathArray.map(n => n.title()).join("/");
        //console.log("--- selectNodePathArray ---");
        //console.log(this.svType() + " " + this.node().nodePathString() + " selectNodePathArray(" + nodePathArray.map(node => "'" + node.title() + "'").join(", ") + ")");
        const node = nextNodePathArray.shift(); // pop the first node off (it should be us) and select the next one from our tiles, then pass remaining paths to the tile's stackview
        //console.warn("- popped '" + node.title() + "'");

        //this.syncFromNodeNow();
        //assert(node !== this.node());

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
                if (selectedTile === null) {
                    console.error(this.logPrefix(), "failed to find tile for node: " + node.title());
                }
            }
        }

        if (!selectedTile) { // INVALID PATH ERROR
            console.log("- invalid path - can't find tile for node: " + node.title());

            console.log("debug info:");
            console.log("  looking for node: ", node.svDebugId());
            const subnodeIds = this.tilesView().node().subnodes().map(node => node.svDebugId());
            console.log("  subnodes:" + JSON.stableStringifyWithStdOptions(subnodeIds));
            // The view half of the comparison. tileWithNode() matches on node
            // IDENTITY, so a miss has two very different causes and the
            // subnodes list alone can't tell them apart: no tiles were built
            // yet (a sync/timing problem), or tiles exist but hold different
            // nodes than the path does (e.g. a tile keyed to a link's target
            // rather than the SvLinkNode itself).
            const tileNodeIds = this.tilesView().tiles().map(aTile => {
                const tileNode = aTile.node();
                return tileNode ? tileNode.svDebugId() : "(tile with no node)";
            });
            console.log("  tiles (" + tileNodeIds.length + "):" + JSON.stableStringifyWithStdOptions(tileNodeIds));

            return false;
        }

        //this.syncFromNavSelection();
        //console.log("- selectedTile '" + selectedTile.node().title() + "'");

        const childStack = this.nextStackView();
        if (childStack) {
            // Propagate the child's result: a deep component that can't
            // resolve yet (its column materializes lazily, a cycle after the
            // parent tile is selected) must report failure so the caller's
            // bounded retry (SvBrowserView.performPendingNavigation) fires.
            // Returning true unconditionally silently truncated programmatic
            // navs at the first unmaterialized level.
            return childStack.selectNodePathArray(nextNodePathArray);
        }
        // Remaining path but no child stack yet: same lazy-materialization
        // case — fail so the retry can pick it up next cycle.
        return nextNodePathArray.length === 0;
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

            parts.removeLast();
        }

        const nodes = parts.map(sv => {
            if (!sv.node()) {
                throw new Error("this stack view has a null node");
            }
            return sv.node();
        });
        // an anchored-tabs stack ends this chain; the path continues into its
        // current pane (Plans/Anchor Tabs § The current path)
        const last = parts.last();
        return (last && last.isAnchoredTabs()) ? nodes.concat(last.anchoredCurrentPanePath()) : nodes;
    }

    selectedNodePathString () {
        // WARNING: subnode titles may not be unique, so this *might* not be a unique path
        return this.selectedNodePathArray().map(node => node.title()).join("/");
    }


    /**
     * @description Checks if the stack view is the root stack view.
     * @returns {Boolean} True if the stack view is the root stack view, false otherwise.
     */
    isRootStackView () {
        return this === this.rootStackView();
    }

    /**
     * @description Handles the change of navigation selection at the top level.
     * @returns {SvStackView} The stack view.
     */
    topDidChangeNavSelection () {
        // broadcast path change to listeners, like bread crumb view
        //console.log("topDidChangeNavSelection");

        if (!this.rootStackView()) {
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
     * @returns {SvStackView} The stack view.
     */
    didChangeNavSelection () {
        this.rootStackView().topDidChangeNavSelection();
        //this.syncFromNavSelection();
        this.syncFromNavSelection();
        //this.scheduleSyncFromNode();
        return true;
    }

    /**
     * @description Handler for the model's `nodeBecameOrphan` note — posted by SvNode
     * when a node's parentNode goes null and is still null at end of the event loop
     * (i.e. it was removed/replaced, not re-homed). This routes here automatically:
     * every SvNodeView's nodeObservation watches *all* notes from its node (sender,
     * no name filter), and the notification center dispatches to a method named after
     * the note. Only SvStackView defines this method, so only the nav columns react;
     * every other SvNodeView receives the note and harmlessly finds no handler.
     *
     * This stack view is the column bound to the now-orphaned node, so we treat it as
     * if that node's selection in the parent column went away: ask the previous column
     * to re-derive from its (now orphan-free) selection, which folds this column and
     * everything to the right of it up. This is the precise replacement for the
     * disabled empty-selection collapse in SvTilesView.syncFromNode (see the note
     * there) — keying off a real parent->null transition instead of an ambiguous
     * empty selection.
     * @param {SvNotification} aNote - The nodeBecameOrphan notification.
     * @returns {SvStackView} The stack view.
     * @category Navigation
     */
    /**
     * @description Handler for the model's `nodeBecameInvisible` note — the
     * visibility sibling of nodeBecameOrphan below, routed here by the same
     * name-based dispatch.
     *
     * Hiding a node does not remove it from its parent's subnodes; only its
     * tile is display:none. So without this, a selected node that hides itself
     * keeps its content in the columns to the right of a tab that is no longer
     * visible — e.g. a companion's Party tab that hides when the party drops to
     * one member. Fold this column and everything right of it back into the
     * previous column's (now visible-only) selection.
     * @param {SvNotification} aNote - The nodeBecameInvisible notification.
     * @returns {SvStackView} The stack view.
     * @category Navigation
     */
    nodeBecameInvisible (aNote) {
        const prev = this.previousStackView();
        if (prev) {
            prev.didChangeNavSelection();
        }
        // A root column whose node hides itself has nothing to collapse back
        // to; unlike orphaning that is not alarming (a root can be legitimately
        // hidden by its owner), so it passes quietly.
        return this;
    }

    nodeBecameOrphan (aNote) {
        const prev = this.previousStackView();
        if (prev) {
            prev.didChangeNavSelection();
        } else {
            // Root column's node orphaned: there is nothing to collapse back to, and
            // removing the root view would blank the whole UI. Surface it and leave the
            // view in place rather than guess a destructive recovery.
            console.warn(this.svDebugId() + " root stack view's node became an orphan; leaving view in place.");
        }
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
        });
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
     * @returns {SvStackView} The stack view.
     */
    didChangePath () {
        this.onStackViewPathChangeNote().post(); // legacy global note, kept for app-level consumers

        // structural scoping: bubble up the view parent chain; the first
        // SvBrowserView ancestor handles this (breadcrumbs, browser-scoped
        // note) and returns true to stop propagation, so navigation inside
        // an embedded browser never reaches an outer one
        this.tellParentViews("childUpdatedNavPath", this);
        return this;
    }

    // ----------------

    /**
     * @description Schedules a sync from the node.
     * @returns {SvStackView} The stack view.
     */
    scheduleSyncFromNode () {

        super.scheduleSyncFromNode();
    }

    /**
     * @description Syncs from the navigation selection.
     * @returns {SvStackView} The stack view.
     */
    syncFromNavSelection () {
        if (this.isAnchoredTabs()) {
            this.syncAnchoredPanes(); // several selected tiles, one pane each (SvStackView_anchoredTabs)
            this.recompactBrowserChain(); // the panes' claim may have changed (anchoredClaimWidth)
            return;
        }
        this.detailView().removeAnchoredPanes(); // a reused stack that showed anchored tabs before
        // update otherViewContent view to match selected tile

        const tile = this.navView().tilesView().selectedTile(); // this may get called before tilesView has synced to current subnodes,
        //console.log("SvStackView syncFromNavSelection " + this.node().title() + " -> " + (tile ? tile.nodeTitle() : null));

        // in which case, the tile may be about to be removed
        if (tile && tile.nodeTileLink()) {
            const oNode = tile.nodeTileLink();

            // Check if we should show the otherView
            // Hide it if the node has no subnodes and can't add subnodes,
            // or opts out via nodeCanNavInto (unless the user is inspecting).
            if (!this.shouldShowOtherViewForNode(oNode, tile)) {
                // Hide the otherView since it serves no purpose
                this.clearOtherView();
            } else {
                // Show the otherView normally
                const ovc = this.otherViewContent();
                if (!ovc || (ovc.node() !== oNode)) {
                    const ov = this.otherViewContentForNode(oNode);
                    this.setOtherViewContent(ov);

                    // When we create a new view, ensure its SvNavView syncs orientation
                    if (ov && ov.navView) {
                        // Schedule orientation sync after the view is added to DOM
                        this.addWeakTimeout(() => {
                            if (ov.navView()) {
                                ov.navView().syncOrientation();
                            }
                        }, 0);
                    }
                }
            }
        } else {
            this.clearOtherView();
        }

        this.recompactBrowserChain();
    }

    // stack view chain

    /**
     * @description Gets the previous stack view.
     * @returns {SvStackView} The previous stack view.
     */
    previousStackView () {
        // walk up the view parent chain to the nearest ancestor stack view
        // (this stack -> childStackView container -> SvDetailView -> previous stack),
        // stopping at stack-boundary views (e.g. an SvBrowserView root) so stack
        // chains never cross browser boundaries — an embedded browser's stacks
        // must not see an outer browser's stacks as ancestors
        let v = this.parentView();
        while (v) {
            if (v.isStackBoundaryView && v.isStackBoundaryView()) {
                return null;
            }
            if (v.previousStackView) { // duck-type: another SvStackView
                return v;
            }
            v = v.parentView();
        }
        return null;
    }

    /**
     * @description Gets the next stack view.
     * @returns {SvStackView} The next stack view.
     */
    nextStackView () {
        return this.otherView().subviews().first();
    }

    /**
     * @description Gets the root stack view.
     * @returns {SvStackView} The root stack view.
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
     * @description Runs one compaction pass over THIS browser's chain
     * (Plans/Compaction Coordinator, part C). The chain is bounded
     * (rootStackView().stackViewSubchain() stops at the browser boundary),
     * so a pass cannot touch an outer browser's columns. In order:
     *   1. each side companion sizes itself (docked, tab or hidden, and its
     *      length) from the root width and its own column's target; it reads
     *      no column's hidden state, so this needs no second pass;
     *   2. each level states its claim;
     *   3. SvLayerAllocation answers, for every level, hidden or shown and
     *      which width rule;
     *   4. each level on the page applies its own answer.
     * This is the one name for a chain pass.
     * @returns {SvStackView} The stack view.
     */
    recompactBrowserChain () {
        const root = this.rootStackView();
        const chain = root.stackViewSubchain();
        chain.forEach((sv) => sv.syncCompanionForPass());
        const answers = root.newLayerAllocation().setClaims(chain.map((sv) => sv.layerClaim())).answers();
        chain.forEach((sv, i) => sv.applyLayerAnswer(answers[i]));
        return this;
    }

    /**
     * @description An allocation holding this browser's two widths, taken
     * once for the pass: the root's width as reported (0 while it has none)
     * and the width columns are fitted in (the window's while the root has
     * none, so columns err toward showing).
     * @returns {SvLayerAllocation}
     * @category Compaction
     */
    newLayerAllocation () {
        const nav = this.navView();
        const allocation = SvLayerAllocation.clone();
        allocation.setRootWidth(this.topViewWidth() || 0);
        allocation.setFitWidth(nav.availableNavWidth());
        allocation.setDefaultTargetWidth(nav.defaultTargetWidth());
        return allocation;
    }

    /**
     * @description Whether this stack is on the page. A cached stack (an
     * earlier selection) still states its claim, but is given no answer and
     * its companion is not sized: it is compacted when it is attached again.
     * @returns {Boolean}
     * @category Compaction
     */
    takesPartInPass () {
        return this.isInDocument();
    }

    /**
     * @description Step 1 of a pass: this level's companion sizes itself.
     * @returns {SvStackView}
     * @category Compaction
     */
    syncCompanionForPass () {
        if (this.takesPartInPass()) {
            this.detailView().updateCompanionLayout();
        }
        return this;
    }

    /**
     * @description This level's claim: what it needs, as plain values, for
     * SvLayerAllocation. It holds nothing that depends on a width.
     * @returns {Object}
     * @category Compaction
     */
    layerClaim () {
        const nav = this.navView();
        return {
            axis: this.direction() === "right" ? "horizontal" : "vertical",
            targetWidth: nav.uncappedTargetWidth(),
            fills: !!nav.shouldCurrentlyFillAvailble(),
            companionReservation: this.detailView().companionReservedWidth(),
            anchoredReservation: this.anchoredReservedWidth ? this.anchoredReservedWidth() : 0,
            anchoredWantsRootWidth: this.anchoredWantsRootWidth ? this.anchoredWantsRootWidth() : false
        };
    }

    /**
     * @description Step 4 of a pass: applies this level's answer to its own
     * column. A level laid out downward has no column to hide.
     * @param {Object} answer - { isHidden, widthRule, targetWidth }
     * @returns {SvStackView}
     * @category Compaction
     */
    applyLayerAnswer (answer) {
        if (!this.takesPartInPass() || answer.widthRule === "none") {
            return this;
        }
        const nav = this.navView();
        nav.setLayerAnswer(answer); // before the reveal, which re-syncs the column's orientation and writes from it
        if (answer.isHidden) {
            nav.collapse();
        } else {
            nav.uncollapse();
        }
        nav.applyLayerAnswer();
        return this;
    }

    /**
     * @description The answer this level's chain would give it now, with
     * nothing applied: for a column no pass has reached yet.
     * @returns {Object}
     * @category Compaction
     */
    layerAnswerNow () {
        const root = this.rootStackView();
        const chain = root.stackViewSubchain();
        return root.newLayerAllocation().setClaims(chain.map((sv) => sv.layerClaim())).answerAt(chain.indexOf(this));
    }

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
     * @returns {SvStackView} The bottom stack view.
     */
    bottomStackView () {
        let current = this;

        while (current) {
            const next = current.nextStackView();
            if (next) {
                current = next;
            } else {
                break; // no next — current is the bottom (loop never exited before)
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
     * @description Gets the top view width.
     * @returns {Number} The top view width.
     */
    topViewWidth () {
        const view = this.rootStackView();
        if (view.parentView() === SvDocumentBody.shared()) {
            return window.innerWidth; // assume it fills the window? what about margins, padding?
        }
        return view.cachedRootWidth();
    }

    /**
     * @description The root stack's own measured width, measured once and kept
     * until a window or container resize invalidates it (see
     * invalidateRootWidth). Every nav's targetWidth / availableNavWidth and
     * every compaction pass asks for this width right after writing widths,
     * so an uncached clientWidth here was a forced layout per ask — hundreds
     * per second while a narration streamed (2026-09-22). A zero measurement
     * (not laid out yet) is not cached, so the first real width is picked up.
     * @returns {Number}
     * @category Layout
     */
    cachedRootWidth () {
        if (this.rootWidthCache() === null) {
            if (!this.isInDocument()) {
                // a cached stack off the page (an earlier selection) still syncs
                // with its node; it has no width to measure, and measuring it
                // after each width write was a "forced layout" per node update
                // (2026-10-02: hundreds per second while a campaign assistant
                // ran). 0 means "not laid out": callers fall back to the window.
                return 0;
            }
            const w = this.size().width(); // one clientWidth read
            if (w > 0) {
                this.setRootWidthCache(w);
            }
            return w;
        }
        return this.rootWidthCache();
    }

    invalidateRootWidth () {
        this.setRootWidthCache(null);
        return this;
    }

    /**
     * @description Whether this stack's element is attached to the document.
     * Cached stacks (earlier selections) are kept off the page and still sync
     * with their nodes; they have no layout to compute. isConnected is not a
     * layout read.
     * @returns {Boolean}
     * @category Layout
     */
    isInDocument () {
        return this.element().isConnected;
    }

    // --- caching during dragging ---

    // dragging events to start/end caching

    /**
     * @description Handles the drag source enter event.
     * @param {View} dragView The drag view.
     * @returns {SvStackView} The stack view.
     */
    onStackChildDragSourceEnter (dragView) {
        if (!this.isCaching()) {
            console.log(this.svDebugId() + " onStackChildDragSourceEnter");
            this.watchOnceForNoteFrom("onDragViewClose", dragView);
            //this.beginCaching();
            this.rootStackView().beginCaching();
        }
    }

    /**
     * @description Handles the drag view close event.
     * @param {Note} aNote The note.
     * @returns {SvStackView} The stack view.
     */
    onDragViewClose (/*aNote*/) {
        console.log(this.svDebugId() + " onDragViewClose");
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
     * @returns {SvStackView} The stack view.
     */
    beginCaching () {
        // begins caching on all chained substacks
        if (!this.isCaching()) {
            //console.log(this.svDebugId() + " beginCaching -----------------");

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
     * @returns {SvStackView} The stack view.
     */
    endCaching () {
        // ends caching on all chained substacks
        if (this.isCaching()) {
            //console.log(this.svDebugId() + " endCaching -----------------");
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

    // --- node to SvStackView cache ---

    /**
     * @description Gets the cache id.
     * @returns {String} The cache id.
     */
    cacheId () { // used atm in SvStackView cache
        return this.node().svTypeId();
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
     * @returns {SvStackView} The stack view.
     */
    cacheView (aView) {
        const cache = this.nodeToStackCache();
        const k = aView.cacheId();
        if (!cache.hasKey(k)) {
            cache.atPut(k, aView);
        }
        return this;
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
            const k = aNode.svTypeId();
            return this.nodeToStackCache().at(k, this);
        }
        return null;
    }

    /**
     * @description Determines if the otherView should be shown for a given node.
     * Inspection mode (alt-tap) always wins — the inspector column is shown
     * regardless of whether the node opts out of navigation.
     * @param {SvNode} node The node to check.
     * @param {SvTile} [tile] The tile that was selected. Optional — when
     * absent, inspection state cannot be consulted and only the node-level
     * gate is checked.
     * @returns {boolean} True if the otherView should be shown, false otherwise.
     */
    shouldShowOtherViewForNode (node, tile) {
        if (!node) {
            return false;
        }

        // Inspection bypass: always show the inspector column when the
        // user explicitly tapped to inspect this tile.
        if (tile && tile.isInspecting && tile.isInspecting()) {
            return true;
        }

        // Honor a node's opt-out (e.g. fields, leaf option nodes).
        if (node.nodeCanNavInto && !node.nodeCanNavInto()) {
            return false;
        }

        // Selecting a tile IS opening its node, so ask the node to prepare
        // BEFORE judging whether it has anything to show. A node that fills
        // its subnodes on first access (e.g. a reference list that populates 300+
        // placeholders in prepareForFirstAccess) has zero subnodes until
        // asked; judging it first made canNavTo() false, the column never
        // opened, and nothing ever asked — so it could never be opened at
        // all (2026-09-12, three days after canNavTo replaced the always-
        // true default here). This is the same first-access hook the new
        // column's own view would fire, just moved ahead of the decision;
        // it is NOT the tile-render path, which must stay lazy (a cloud
        // document hydrating on selection is right, on list render wrong).
        if (node.prepareToAccess) {
            node.prepareToAccess();
        }

        return node.canNavTo ? node.canNavTo() : true;
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
            sv = SvStackView.clone().setNode(aNode);
            if (this.isCaching()) {
                sv.beginCaching();
            }
        }

        return sv;
    }

}.initThisClass());
