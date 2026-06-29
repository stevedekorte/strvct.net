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
        SvStackView.updateCompactionChain()

    Drag & Drop:

        When dragging & dropping, hierarchy views for nodes are cached (in nodeToStackCache) in order to make the drag & drop implementation
        more manageable. For example, the source tilesView needs to remember where the dragged item was when returning to it.


 */

(class SvStackView extends SvNodeView {

    initPrototypeSlots () {

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
        this.setIsRegisteredForWindowResize(true);
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
            this.makeOrientationLeft();
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
     * @description Makes the orientation of the stack view left.
     * @returns {SvStackView} The stack view.
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
        this.setDirection(this.node().nodeOrientation());

        this.syncOrientation();
        //this.navView().syncFromNodeNow();
        this.syncFromNavSelection();
        this.detailView().syncCompanionFromNode(this.node());

        //this.setupColumnGroupColors();
        //this.fitColumns();
        return this;
    }

    /**
     * @description Handles the window resize event.
     * @param {Event} event The window resize event.
     * @returns {SvStackView} The stack view.
     */
    onWindowResize (/*event*/) {
        /*
        if (this.isRootStackView()) {
            this.safeUpdateCompactionChain();
        }
        */
        // TODO: change so only top stack view registers for resize
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

            return false;
        }

        //this.syncFromNavSelection();
        //console.log("- selectedTile '" + selectedTile.node().title() + "'");

        const childStack = this.nextStackView();
        if (childStack) {
            childStack.selectNodePathArray(nextNodePathArray);
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

            parts.removeLast();
        }

        return parts.map(sv => {
            if (!sv.node()) {
                throw new Error("this stack view has a null node");
            }
            return sv.node();
        });
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

    // --- set path titles ----

    /**
     * @description Sets the selected path titles array.
     * @param {Array} titles The titles array to set.
     * @returns {SvStackView} The stack view.
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
     * @returns {SvStackView} The stack view.
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

        this.safeUpdateCompactionChain();
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
     * @description Safely updates the compaction chain.
     * @returns {SvStackView} The stack view.
     */
    safeUpdateCompactionChain () {
        //this.bottomStackView().updateCompactionChain();
        this.updateCompactionChain();
    }

    /**
     * @description Recompacts the whole stack chain of THIS browser. Delegates
     * to recompactBrowserChain — kept as the public name existing callers use.
     * (Was: updateCompaction() + tellParentViews("updateCompaction"), which
     * propagated UPWARD via the raw view chain and so crossed embedded-browser
     * boundaries into outer stacks — the cause of the companion-toggle nav
     * uncollapse. Compaction is per-browser, so the chain must be bounded.)
     * @returns {SvStackView} The stack view.
     */
    updateCompactionChain () {
        this.recompactBrowserChain();
        return this;
    }

    /**
     * @description Recompacts this browser's stack chain to a fixed point.
     * Iterates the BOUNDED chain (rootStackView().stackViewSubchain(), which
     * stops at the browser boundary) calling updateCompaction() until nothing
     * changes — needed because a companion docking/undocking changes the width
     * budget and can require a column that was already visited to (un)collapse.
     * Bounded iteration guards against any oscillation. Browser-scoped by
     * construction: it cannot touch an outer browser's columns.
     * @returns {SvStackView} The stack view.
     */
    recompactBrowserChain () {
        const chain = this.rootStackView().stackViewSubchain();
        let changed = true;
        let guard = 0;
        while (changed && guard < 5) {
            changed = false;
            guard += 1;
            chain.forEach((sv) => {
                if (sv.updateCompaction && sv.updateCompaction()) {
                    changed = true;
                }
            });
        }
        return this;
    }

    /**
     * @description Compacts this single stack level: collapses/expands its nav
     * along its axis and resolves its companion's docked/tab state.
     * @returns {Boolean} true if this level's collapse or companion state
     * changed (drives the recompactBrowserChain fixed point).
     */
    updateCompaction () {
        const navChanged = this.compactNavAsNeeded();
        const companionChanged = this.detailView().updateCompanionLayout();
        return navChanged || companionChanged;
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
        let w = verticalNavViews.sum(nv => nv.targetWidth());
        // companions reserve space in the row exactly as another column would
        w += this.stackViewSubchain().sum(sv => sv.detailView().companionReservedWidth());
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
        if (view.parentView() === SvDocumentBody.shared()) {
            return window.innerWidth; // assume it fills the window? what about margins, padding?
        }
        return view.size().width(); // clientWidth works here, but maybe all cases
        //return this.rootStackView().calcSize().width();
    }

    /**
     * @description Compacts the nav as needed.
     * @returns {SvStackView} The stack view.
     */
    compactNavAsNeeded () {
        // this method is called on each stack view in the chain, from left to right (earliest to last view),
        // in order to compact them as needed to fit the available width.
        // So each will see the current compaction state (via sumOfNavWidths()) of all previous views in the chain when it makes its decision.

        if (this.direction() === "right") {
            //console.log("SvStackView " + this.node().title() + " compactNavAsNeeded");

            const wasCollapsed = this.navView().isCollapsed();
            const maxWidth = this.topViewWidth(); // our subviews need to fit into this width

            // Calculate the sum WITHOUT this nav view
            // const verticalNavViews = this.navViewSubchain().filter(nv => nv.isVertical());
            let sum = this.sumOfNavWidths();

            /*
            // if this is the last view, we don't need to check if it can fit
            if (this.nextStackView() === null) {
                sum -= this.navView().targetWidth();
            }
            */

            //this.topViewWidth();


            //const thisWidth = this.navView().targetWidth();
            //const cw = this.navView().clientWidth();

            // The content fill nav (e.g. the narration) must never fully
            // collapse to display:none — it is the column the user is looking at.
            // When space is tight it shrinks via flex (flexGrow/shrink + min-width
            // 0, see SvNavView), so a docked companion squeezes it rather than
            // hiding it (which would leave the companion stranded with dead space).
            const isFillNav = this.navView().shouldCurrentlyFillAvailble
                && this.navView().shouldCurrentlyFillAvailble();
            if (isFillNav || sum < maxWidth) {
                this.navView().uncollapse();
                //console.log(" -> '" + this.node().title() + "' w: " + thisWidth + " cw: " + cw + " sum " + sum + " < win " + maxWidth); // + " UNCOLLAPSE " + this.direction());
            } else {
                this.navView().collapse();
                //console.log(" <- '" + this.node().title() + "' w: " + thisWidth + " cw: " + cw + " sum:" + sum + " > win " + maxWidth); //+ " COLLAPSE " + this.direction());
            }

            // Update SvNavView width constraints for window size
            this.navView().updateWidthForWindow();

            return wasCollapsed !== this.navView().isCollapsed();
        } else {
            //console.log(" X '" + this.node().title()); // + "' skip " + this.direction());
        }

        return false;
    };

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

        return true; // Default Miller Column behavior: detail column for selected node.
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
