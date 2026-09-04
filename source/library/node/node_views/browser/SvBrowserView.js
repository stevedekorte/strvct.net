/**
 * @module library.node.node_views.browser
 */

"use strict";

/**
 * @class SvBrowserView
 * @extends SvNodeView
 * @classdesc A browser over a node tree: a breadcrumb bar above a Miller-column
 * SvStackView rooted at this view's node.
 *
 *     SvBrowserView (column flex)
 *     ├── breadCrumbsView (SvBreadCrumbsView — plain view, no node)
 *     └── stackView (SvStackView, node = this view's node)
 *
 * The browser's node is the model root itself — no synthetic breadcrumb node
 * is inserted into the model graph (the breadcrumb bar is owned view furniture).
 *
 * Multiple SvBrowserViews can exist concurrently (e.g. the main browser plus
 * one embedded in a companion panel). Navigation scoping is structural: when a
 * stack's selection path changes, the root stack bubbles childUpdatedNavPath
 * up the view parent chain (tellParentViews); the first SvBrowserView ancestor
 * handles it — updating its own breadcrumbs and posting a sender-scoped
 * "onBrowserViewPathChange" note — and returns true to stop propagation, so an
 * embedded browser's navigation can never reach an outer browser.
 *
 * The legacy global "onStackViewPathChange" note still posts (from the root
 * stack view) for app-level consumers.
 *
 * Only a browser with handlesGlobalNavRequests (default true — set it false on
 * embedded browsers) responds to the global navigation-request notes:
 *
 *   - "onRequestNavigateToNode" — info is the target node
 *   - "onRequestSelectNodePath" — info is an explicit array of visible-tile
 *     node refs whose tiles form the desired path. selectNodePathArray walks
 *     the array column-by-column, and tileWithNode matches on
 *     tile.nodeTileLink() — which for a link tile resolves to the link's
 *     target. So an array like [realm.mySessions(), specificSession] matches
 *     the visible "My Sessions" link tile then the session tile in the next
 *     column. This bypasses navigateToNode's nodePathArray() lookup, which
 *     walks the model parent chain through hidden intermediates and fails on
 *     link redirects. A leading component equal to the browser's root node is
 *     tolerated and skipped (models may post absolute paths).
 */

(class SvBrowserView extends SvNodeView {

    initPrototypeSlots () {
        /**
         * @member {SvBreadCrumbsView} breadCrumbsView - the breadcrumb bar above the columns
         * @category UI
         */
        {
            const slot = this.newSlot("breadCrumbsView", null);
            slot.setSlotType("SvBreadCrumbsView");
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

        /**
         * @member {SvStackView} stackView - the Miller-column stack rooted at this browser's node
         * @category UI
         */
        {
            const slot = this.newSlot("stackView", null);
            slot.setSlotType("SvStackView");
        }

        /**
         * @member {Boolean} handlesGlobalNavRequests - whether this browser responds to the
         * global navigation-request notes and app-level keyboard shortcuts. True for the
         * main browser; set false on embedded browsers (e.g. inside a companion panel).
         * @category Navigation
         */
        {
            const slot = this.newSlot("handlesGlobalNavRequests", true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {SvObservation} navigateToNodeObs
         * @category Observation
         */
        {
            const slot = this.newSlot("navigateToNodeObs", null);
            slot.setSlotType("SvObservation");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvObservation} selectNodePathObs
         * @category Observation
         */
        {
            const slot = this.newSlot("selectNodePathObs", null);
            slot.setSlotType("SvObservation");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvNode} breadCrumbsHintOwner - the node currently answering
         * the nodeWantsBreadCrumbs() view hint, or null when no node on the
         * selected path implements it. Observed while it owns the answer (see
         * watchBreadCrumbsHintOwner).
         * @category UI
         */
        {
            const slot = this.newSlot("breadCrumbsHintOwner", null);
            slot.setSlotType("SvNode");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvObservation} breadCrumbsHintObs - observation of the hint
         * owner's onUpdatedNode, so a dynamic answer re-applies without a
         * navigation change.
         * @category Observation
         */
        {
            const slot = this.newSlot("breadCrumbsHintObs", null);
            slot.setSlotType("SvObservation");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Initializes the SvBrowserView instance.
     * @returns {SvBrowserView} The initialized SvBrowserView instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setFlexDirection("column");
        this.setWidth("100%");
        this.setHeight("100%");
        this.setOverflow("hidden");

        const crumbs = SvBreadCrumbsView.clone();
        crumbs.setBrowserView(this);
        this.setBreadCrumbsView(crumbs);
        this.addSubview(crumbs);

        const stack = SvStackView.clone();
        // the stack fills the space below the breadcrumb bar
        stack.setHeight(null);
        stack.setMinHeight("0px");
        stack.setFlexGrow(1);
        stack.setFlexShrink(1);
        this.setStackView(stack);
        this.addSubview(stack);

        this.scheduleMethod("moveToBase");
        this.updateGlobalNavRegistration();
        return this;
    }

    /**
     * @description Roots the stack at the new node and refreshes the breadcrumbs.
     * @returns {SvBrowserView} The current instance.
     * @category Node Management
     */
    didChangeNode () {
        super.didChangeNode();
        this.stackView().setNode(this.node());
        this.breadCrumbsView().didChangeBrowserPath();
        this.syncBreadCrumbsVisibilityHint();
        return this;
    }

    /**
     * @description This view manages its own fixed subviews (crumbs + stack);
     * it never auto-generates subviews from subnodes like the SvNodeView default.
     * @returns {boolean} false — subviews never change here.
     * @category Synchronization
     */
    syncFromNode () {
        this.syncCssFromNode();
        this.syncSurfaceFromNode();
        this.stackView().syncFromNode();
        return false;
    }

    /**
     * @description Paints this browser from its node's
     * nodeContainerSurfaceName, which colors the whole region: the breadcrumb
     * bar and every tile inside are transparent by default, so they show this
     * background rather than each needing one of their own.
     *
     * This is what lets the app's browser and a companion's browser — the SAME
     * view class, with different nodes — read as different surfaces without a
     * subclass of this view, of the breadcrumb bar, or of any tile.
     * @returns {SvBrowserView}
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
     * @description Stack chains never cross browser boundaries: an embedded
     * browser's stacks must not see an outer browser's stacks as ancestors.
     * Checked by SvStackView.previousStackView()'s parent walk.
     * @returns {boolean} true
     * @category Navigation
     */
    isStackBoundaryView () {
        return true;
    }

    // --- path change bubbling (see SvStackView.didChangePath) ---

    /**
     * @description Handles a navigation path change bubbled up (via
     * tellParentViews) from this browser's stack chain. Returning true stops
     * the bubble here, so navigation inside this browser never reaches an
     * outer browser.
     * @param {SvStackView} aStackView The stack view whose path changed.
     * @returns {boolean} true — propagation stops at the owning browser.
     * @category Navigation
     */
    childUpdatedNavPath (/*aStackView*/) {
        this.breadCrumbsView().didChangeBrowserPath();
        this.syncBreadCrumbsVisibilityHint();
        this.postNoteNamed("onBrowserViewPathChange");
        return true;
    }

    // --- breadcrumb visibility hint (nodeWantsBreadCrumbs) ---

    /**
     * @description Re-evaluates the breadcrumb bar's visibility from the
     * nodeWantsBreadCrumbs() view hint. Embedded browsers (the companion
     * panel) always show crumbs — theatre-mode hiding is a main-browser
     * title-bar concern, and walking the *model* parent chain from a
     * link-followed node can leak that hint into the companion and trap
     * the user with no way back. The main browser walks its selected path
     * (not the model parent chain) so a link jump cannot pick up an
     * ancestor that is not actually on this browser's path.
     * @returns {SvBrowserView}
     * @category UI
     */
    syncBreadCrumbsVisibilityHint () {
        if (!this.handlesGlobalNavRequests()) {
            this.watchBreadCrumbsHintOwner(null);
            this.applyBreadCrumbsVisible(true);
            return this;
        }
        const owner = this.breadCrumbsHintOwnerOnSelectedPath();
        this.watchBreadCrumbsHintOwner(owner);
        const wantsCrumbs = owner ? (owner.nodeWantsBreadCrumbs() !== false) : true;
        this.applyBreadCrumbsVisible(wantsCrumbs);
        return this;
    }

    /**
     * @description The nearest selected-path node that implements
     * nodeWantsBreadCrumbs(), walking from the tail toward the root.
     * @returns {SvNode|null}
     * @category UI
     */
    breadCrumbsHintOwnerOnSelectedPath () {
        const path = this.selectedNodePathArray();
        for (let i = path.length - 1; i >= 0; i--) {
            const node = path[i];
            if (node && node.respondsTo && node.respondsTo("nodeWantsBreadCrumbs")) {
                return node;
            }
        }
        return null;
    }

    /**
     * @description Collapses/restores the breadcrumb bar as a max-height
     * slide with an opacity fade (prototype-parity motion, one gesture with
     * the theatre opening beneath it). The bar keeps its display — height
     * zero plus hidden overflow retires it visually and interactively.
     * @param {Boolean} visible
     * @returns {SvBrowserView}
     * @category UI
     */
    applyBreadCrumbsVisible (visible) {
        if (this._appliedCrumbsVisible === undefined) {
            this._appliedCrumbsVisible = true;
        }
        if (this._appliedCrumbsVisible === visible) {
            return this;
        }
        this._appliedCrumbsVisible = visible;

        const crumbs = this.breadCrumbsView();
        const curve = "cubic-bezier(.2,.8,.2,1)";
        crumbs.setTransition("max-height 0.34s " + curve + ", min-height 0.34s " + curve + ", opacity 0.26s ease-out");
        crumbs.setOverflowY("hidden");
        if (visible) {
            crumbs.setIsDisplayHidden(false); // in case an older path display-hid it
            crumbs.setMinHeight("55px");
            crumbs.setMaxHeight("55px");
            crumbs.setOpacity(1);
            crumbs.setCssProperty("border-bottom-width", "1px");
            this.addTimeout(() => {
                if (this._appliedCrumbsVisible === true) {
                    crumbs.setMaxHeight(null);
                }
            }, 360, "crumbsMotion");
        } else {
            crumbs.setMaxHeight("55px"); // a definite FROM value...
            this.addTimeout(() => {
                if (this._appliedCrumbsVisible === false) {
                    crumbs.setMinHeight("0px");
                    crumbs.setMaxHeight("0px"); // ...slides to zero
                    crumbs.setOpacity(0);
                    // WIDTH, not the shorthand: a zero-height bar's border
                    // still renders as a 1px line over the theatre
                    crumbs.setCssProperty("border-bottom-width", "0px");
                }
            }, 16, "crumbsMotion");
        }
        return this;
    }

    /**
     * @description Observes the hint owner's onUpdatedNode so a dynamic answer
     * (e.g. an immersive band opening under an unchanged selection) re-applies
     * without a navigation change. Re-subscribes only when the owner changes.
     * @param {SvNode|null} owner - the node answering nodeWantsBreadCrumbs().
     * @returns {SvBrowserView}
     * @category UI
     */
    watchBreadCrumbsHintOwner (owner) {
        if (owner === this.breadCrumbsHintOwner()) {
            return this;
        }
        if (this.breadCrumbsHintObs()) {
            this.breadCrumbsHintObs().stopWatching();
            this.setBreadCrumbsHintObs(null);
        }
        this.setBreadCrumbsHintOwner(owner);
        if (owner) {
            this.setBreadCrumbsHintObs(this.watchForNoteFrom("onUpdatedNode", owner).setSendName("onBreadCrumbsHintOwnerUpdated"));
        }
        return this;
    }

    onBreadCrumbsHintOwnerUpdated (/*aNote*/) {
        this.syncBreadCrumbsVisibilityHint();
    }

    // --- navigation API ---

    /**
     * @description The selected node path, beginning with this browser's root node.
     * @returns {Array} The node path array.
     * @category Navigation
     */
    selectedNodePathArray () {
        return this.stackView().selectedNodePathArray();
    }

    /**
     * @description Selects the given node path. The array holds the nodes
     * *after* this browser's root node.
     * @param {Array} nodePathArray The nodes to select, in order.
     * @returns {SvBrowserView} The current instance.
     * @category Navigation
     */
    selectNodePathArray (nodePathArray) {
        // returns true if the path resolved, false if a tile in it wasn't found
        return this.stackView().selectNodePathArray(nodePathArray);
    }

    /**
     * @description Navigates to the specified node.
     * @param {Node} aNode - The node to navigate to.
     * @returns {SvBrowserView} The current SvBrowserView instance.
     * @category Navigation
     */
    navigateToNode (aNode) {
        const pathArray = aNode.nodePathArray();
        pathArray.shift(); // remove the root node (the browser's own node)
        this.selectNodePathArray(pathArray);
        return this;
    }

    /**
     * @description Selects the node at the given slash-separated title path.
     * A leading component equal to the root node's title is tolerated and
     * skipped, so absolute paths (e.g. URL hashes of the form
     * "Root/Section/Item") keep working.
     * @param {string} aPath The path string.
     * @returns {SvBrowserView} The current instance.
     * @category Navigation
     */
    selectNodePathString (aPath) {
        assert(Type.isString(aPath), "aPath must be a string");
        const components = aPath.split("/");

        if (components.length === 1 && components[0] === "") {
            this.moveToBase();
            return this;
        }

        if (components.first() === "") {
            components.shift(); // remove empty leading component
        }

        if (this.node() && components.first() === this.node().title()) {
            components.shift(); // tolerate absolute paths that include the root node
        }

        const selectedNode = this.node().nodeAtSubpathArray(components);
        if (selectedNode) {
            const pathArray = selectedNode.nodePathArray();
            pathArray.shift(); // remove the root node

            if (pathArray.length > 0) {
                this.selectNodePathArray(pathArray);
            }
        } else {
            console.warn("no node found for path: '" + aPath + "'");
        }
        return this;
    }

    /**
     * @description Moves the view to the base state. Normally that's no
     * selection (just the root column). A root node may opt into showing its
     * first child by default — `nodeViewShouldAutoSelectFirstSubnode()` — e.g. a
     * tab-strip node (horizontal) that wants its first tab's content shown
     * beneath it rather than a bare strip. The selection goes through the bounded
     * pending-path retry, so it lands even if the root column isn't materialized
     * on the first cycle.
     * @returns {SvBrowserView} The current SvBrowserView instance.
     * @category Navigation
     */
    moveToBase () {
        // The hint CASCADES: each auto-selecting node on the way down adds
        // its first child, so nested opt-ins (e.g. the narration companion's
        // root → Party → the local player's panel) land on real content
        // rather than an intermediate list. Bounded against cycles.
        const path = [];
        let node = this.node();
        while (node && node.nodeViewShouldAutoSelectFirstSubnode
            && node.nodeViewShouldAutoSelectFirstSubnode()
            && node.subnodes && node.subnodes().length > 0
            && path.length < 8) {
            const first = node.subnodes().first();
            // tiles navigate by nodeTileLink(), so a link tile's path uses its target
            const target = (first.nodeTileLink && first.nodeTileLink()) ? first.nodeTileLink() : first;
            path.push(target);
            node = target;
        }
        if (path.length > 0) {
            this._pendingSelectPath = path;
            this._pendingSelectAttempt = 0;
            this.trySelectPendingPath();
        } else {
            this.selectNodePathArray([]);
        }
        // The root column is now materialized, so the main browser can fulfill
        // navigation requests. Signal app-level UI readiness once (SvApp
        // dedups) so model code awaiting promiseUserInterfaceReady() can post
        // navigation without polling. Only the global-nav browser signals.
        if (this.handlesGlobalNavRequests() && typeof SvApp !== "undefined" && SvApp.hasShared()) {
            SvApp.shared().markUserInterfaceReady();
        }
        return this;
    }

    // --- global navigation requests (main browser only) ---

    didUpdateSlotHandlesGlobalNavRequests (/*oldValue, newValue*/) {
        this.updateGlobalNavRegistration();
        return this;
    }

    updateGlobalNavRegistration () {
        const handles = this.handlesGlobalNavRequests();

        if (handles && !this.navigateToNodeObs()) {
            this.setNavigateToNodeObs(this.watchForNote("onRequestNavigateToNode"));
            this.setSelectNodePathObs(this.watchForNote("onRequestSelectNodePath"));
        } else if (!handles && this.navigateToNodeObs()) {
            this.navigateToNodeObs().stopWatching();
            this.setNavigateToNodeObs(null);
            this.selectNodePathObs().stopWatching();
            this.setSelectNodePathObs(null);
        }

        this.setIsRegisteredForKeyboard(handles); // for app-level shortcuts like Option-D
        return this;
    }

    onRequestNavigateToNode (aNote) {
        const node = aNote.info();
        this.navigateToNode(node);
        return this;
    }

    /**
     * @description Programmatic-nav with an explicit path array. See the
     * class comment for why this exists.
     * @param {SvNotification} aNote — info() is the path array.
     * @returns {SvBrowserView}
     */
    onRequestSelectNodePath (aNote) {
        const path = aNote.info();
        if (Array.isArray(path) && path.length > 0) {
            this.selectPathWithRetry(path);
        }
        return this;
    }

    /**
     * @description Selects a path, retrying if a tile has not materialized
     * yet. Breadcrumb clicks use this so a single missed column does not
     * swallow the navigation.
     * @param {Array} path The nodes to select (after the root, or absolute).
     * @returns {SvBrowserView}
     * @category Navigation
     */
    selectPathWithRetry (path) {
        this._pendingSelectPath = path;
        this._pendingSelectAttempt = 0;
        return this.trySelectPendingPath();
    }

    /**
     * @description Attempts the pending select-path; if a tile in it isn't
     * materialized yet (selectNodePathArray returns false), retries on the next
     * scheduler cycle, bounded. This replaces the old model-side DOM-polling
     * retry: the target tile (e.g. the "My Sessions" link) can post-date the
     * UI becoming ready since the root column renders on a scheduled cycle, and
     * a single post would otherwise be lost. View-side and driven by the
     * resolve result, not a render guess.
     * @returns {SvBrowserView}
     * @category Navigation
     */
    trySelectPendingPath () {
        const path = this._pendingSelectPath;
        if (!path) {
            return this;
        }
        const nodePath = path.shallowCopy();
        if (nodePath.first() === this.node()) {
            nodePath.shift(); // tolerate absolute paths that include the root node
        }
        const resolved = this.selectNodePathArray(nodePath);
        if (resolved === false && this._pendingSelectAttempt < 12) {
            this._pendingSelectAttempt += 1;
            // MUST be the next-cycle variant: this retry runs AS a scheduled
            // action, and scheduleMethod() of the same target+method from
            // within its own processing trips the scheduler's LOOP DETECTED
            // throw (seen in prod when deleting a session left the pending
            // path unresolvable — the second consecutive failed resolve threw).
            this.scheduleMethodForNextCycle("trySelectPendingPath");
        } else {
            this._pendingSelectPath = null;
        }
        return this;
    }

    // --- app-level keyboard shortcuts ---

    onAlternate_D_KeyUp (/*event*/) {
        return true;
    }

    onAlternate_D_KeyDown (/*event*/) {
        SvApp.shared().toggleDeveloperMode();
        return true;
    }

    // --- collapsible-region shortcuts (see SvEdgeHandleView) ---

    /**
     * @description Walks this browser's stack chain front to back.
     * @param {Function} fn - visitor receiving each SvStackView; a truthy
     * return stops the walk and is returned.
     * @returns {*} The visitor's first truthy result, or null.
     * @category Navigation
     */
    detectStackViewInChain (fn) {
        let stack = this.stackView();
        while (stack) {
            const result = fn(stack);
            if (result) {
                return result;
            }
            stack = stack.nextStackView();
        }
        return null;
    }

    /**
     * @description Meta-Backslash toggles the deepest visible companion
     * panel. Generic: the companion is a framework region; which stack has
     * one is discovered, not assumed.
     * @returns {Boolean} false when handled (stops propagation).
     * @category Keyboard
     */
    onMetaBackslashKeyDown (event) {
        let companion = null;
        this.detectStackViewInChain((stack) => {
            const detail = stack.detailView();
            const c = (detail && detail.companionView) ? detail.companionView() : null;
            if (c && c.mode() !== "hidden") {
                companion = c; // keep walking: the DEEPEST visible companion wins
            }
            return false;
        });
        if (companion) {
            companion.toggleExpanded();
            event.preventDefault();
            return false;
        }
        return true;
    }

    /**
     * @description Escape collapses an expanded collapsible header region
     * (e.g. a theatre band). Focused text editing wins — SvTextView consumes
     * Escape before it can bubble here — so this only fires when nothing
     * closer claimed the key.
     * @returns {Boolean} false when handled (stops propagation).
     * @category Keyboard
     */
    onEscapeKeyDown (/*event*/) {
        const region = this.detectStackViewInChain((stack) => {
            const nav = stack.navView();
            const headerRegion = (nav && nav.headerRegion) ? nav.headerRegion() : null;
            return (headerRegion && headerRegion.isExpanded() === true) ? headerRegion : null;
        });
        if (region) {
            region.toggleExpanded();
            return false;
        }
        return true;
    }

}.initThisClass());
