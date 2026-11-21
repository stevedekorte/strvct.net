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
 * NAVIGATION HAS ONE ENTRY POINT: navigate(aRequest), given an
 * SvNavigationRequest that says where to go and who asked (the user, a URL,
 * code, or the base state). Breadcrumbs, links in content, the URL, and the
 * model's navigation notes all arrive there; nothing else selects a path in a
 * browser from outside its columns. A tile the user taps or reaches by key is
 * selected by the columns themselves, and the browser hears of that path
 * change afterwards and records it as the user's own. Either way
 * lastNavigationRequest() is the request behind the latest path change, so a
 * listener to "onBrowserViewPathChange" can ask who caused it.
 *
 * Only a browser with handlesGlobalNavRequests (default true — set it false on
 * embedded browsers) responds to the global navigation-request notes, which
 * are how model code asks (a model never references a view):
 *
 *   - "onRequestNavigateToNode" — info is the target node, reached by its own
 *     parent chain
 *   - "onRequestSelectNodePath" — info is an explicit array of visible-tile
 *     node refs whose tiles form the desired path. The stack walks the array
 *     column-by-column, and tileWithNode matches on tile.nodeTileLink() —
 *     which for a link tile resolves to the link's target. So an array like
 *     [realm.mySessions(), specificSession] matches the visible "My Sessions"
 *     link tile then the session tile in the next column. This is for a node
 *     whose parent chain runs through hidden intermediates or link redirects,
 *     which "onRequestNavigateToNode" cannot walk. A leading component equal
 *     to the browser's root node is tolerated and skipped (models may post
 *     absolute paths).
 */

(class SvBrowserView extends SvNodeView {

    initPrototypeSlots () {
        /**
         * @member {Set} navPathNodes - The nodes on this browser's selected
         * path as of the last path change (see syncNavPathMembership)
         * @category Navigation
         */
        {
            const slot = this.newSlot("navPathNodes", null);
            slot.setSlotType("Set");
            slot.setAllowsNullValue(true);
        }

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
         * @member {ResizeObserver|null} containerResizeObserver - an EMBEDDED
         * browser's "window" is its container. The main browser recompacts on
         * window resize; an embedded one (the narration companion) must
         * recompact when its container's width changes — docking, undocking,
         * a sibling column growing — none of which resize the window.
         * @category Layout
         */
        {
            /**
             * @member {Boolean} hidesBreadCrumbsAtRoot - the embedding view
             * supplies this browser's title (an anchored-tabs pane: its tab
             * is its title), so the breadcrumb bar shows only once the
             * browser is navigated below its root — then it is the way back
             * @category UI
             */
            const slot = this.newSlot("hidesBreadCrumbsAtRoot", false);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {Boolean} hasBeenNavigated - a path was selected in this
             * browser. The base state (moveToBase, scheduled at init) applies
             * only to a browser nobody has navigated yet: a pane created and
             * navigated in the same cycle had its selection wiped by the
             * scheduled reset (a URL into a new anchored-tabs pane, 2026-10-06).
             * @category Navigation
             */
            const slot = this.newSlot("hasBeenNavigated", false);
            slot.setSlotType("Boolean");
        }
        {
            /**
             * @member {SvStackView|null} anchoredTabsHost - the anchored-tabs
             * stack this browser is a pane of; told when the pane is navigated
             * in or focused, so it becomes the current pane and the outer path
             * (breadcrumbs, URL) follows it
             * @category Navigation
             */
            const slot = this.newSlot("anchoredTabsHost", null);
            slot.setSlotType("SvStackView");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("containerResizeObserver", null);
            slot.setSlotType("ResizeObserver");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Number|null} lastContainerWidth - the container width the
         * observer last acted on, so height-only changes (a footer growing)
         * and repeat callbacks at the same width do not recompact.
         * @category Layout
         */
        {
            const slot = this.newSlot("lastContainerWidth", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvNavigationRequest|null} pendingNavigationRequest - the
         * request being carried out: set by navigate(), cleared when its path
         * is selected or it is given up on. A path it names can need a few
         * scheduler cycles while columns materialize.
         * @category Navigation
         */
        {
            const slot = this.newSlot("pendingNavigationRequest", null);
            slot.setSlotType("SvNavigationRequest");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {Number} pendingNavigationAttempt - how many times the
         * pending request has been tried
         * @category Navigation
         */
        {
            const slot = this.newSlot("pendingNavigationAttempt", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {SvNavigationRequest|null} lastNavigationRequest - the
         * request behind the latest change of this browser's path; a selection
         * made in the columns is recorded as one whose cause is the user
         * @category Navigation
         */
        {
            const slot = this.newSlot("lastNavigationRequest", null);
            slot.setSlotType("SvNavigationRequest");
            slot.setAllowsNullValue(true);
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
        // The root stack is the one stack of this browser that answers a
        // window resize (it recompacts the whole chain). A pane's browser
        // registers its own root too: the window handler also runs on a
        // height-only resize, which the pane's width observer doesn't see.
        stack.setIsRegisteredForWindowResize(true);
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
        this.noteCauseOfPathChange();
        this.syncNavPathMembership();
        this.breadCrumbsView().didChangeBrowserPath();
        this.syncBreadCrumbsVisibilityHint();
        this.postNoteNamed("onBrowserViewPathChange");
        if (this.anchoredTabsHost()) {
            this.anchoredTabsHost().onAnchoredPaneActivated(this); // a pane navigated in: it is the current one
        }
        return true;
    }

    /**
     * @description Something inside this browser took focus (a tile, a text
     * field). As an anchored-tabs pane, that makes it the current pane.
     * Registered only for panes (SvDetailView_anchoredTabs).
     * @param {Event} event
     * @returns {Boolean}
     * @category Navigation
     */
    onFocusIn (event) {
        if (this.anchoredTabsHost()) {
            this.anchoredTabsHost().onAnchoredPaneActivated(this);
        }
        return super.onFocusIn(event);
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
        if (this.hidesBreadCrumbsAtRoot()) {
            this.watchBreadCrumbsHintOwner(null);
            this.applyBreadCrumbsVisible(this.isBelowRoot());
            return this;
        }
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
     * @description Whether something below the root is selected: the path
     * holds the root's node, then each selection after it.
     * @returns {Boolean}
     * @category UI
     */
    isBelowRoot () {
        return this.selectedNodePathArray().length > 1;
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
        if (this._appliedCrumbsVisible === undefined && !visible) {
            return this.hideBreadCrumbsNow(); // a new browser starts without them, no motion
        }
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
     * @description Hides the breadcrumb bar at once, as the end state of
     * applyBreadCrumbsVisible(false) — zero height, not display none — so a
     * later applyBreadCrumbsVisible(true) slides it in.
     * @returns {SvBrowserView}
     * @category UI
     */
    hideBreadCrumbsNow () {
        this._appliedCrumbsVisible = false;
        const crumbs = this.breadCrumbsView();
        crumbs.setOverflowY("hidden");
        crumbs.setMinHeight("0px");
        crumbs.setMaxHeight("0px");
        crumbs.setOpacity(0);
        crumbs.setCssProperty("border-bottom-width", "0px");
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
     * @description THE navigation entry point: goes where the request says,
     * on behalf of whoever it says asked. A column on the way that has not
     * materialized yet is waited for (performPendingNavigation retries); a
     * newer request replaces one still being carried out.
     * @param {SvNavigationRequest} aRequest
     * @returns {SvBrowserView} The current instance.
     * @category Navigation
     */
    navigate (aRequest) {
        if (aRequest.isBaseState() && this.hasBeenNavigated()) {
            return this; // navigated before the base state arrived: keep that
        }
        this.setPendingNavigationRequest(aRequest);
        this.setPendingNavigationAttempt(0);
        return this.performPendingNavigation();
    }

    /**
     * @description Tries the pending request. If its place cannot be shown
     * yet (a tile on the way is not materialized, or no node is at its path
     * yet), retries on the next scheduler cycle, bounded. The target tile
     * (e.g. a link in the root column) can post-date the UI becoming ready
     * since the root column renders on a scheduled cycle, and a single
     * attempt would otherwise be lost. Driven by the resolve result, not a
     * render guess.
     * @returns {SvBrowserView}
     * @category Navigation
     */
    performPendingNavigation () {
        const request = this.pendingNavigationRequest();
        if (!request) {
            return this;
        }
        const path = request.pathIn(this);
        const didArrive = path !== null && this.selectPathNow(path);
        if (!didArrive && this.pendingNavigationAttempt() < 12) {
            this.setPendingNavigationAttempt(this.pendingNavigationAttempt() + 1);
            // MUST be the next-cycle variant: this retry runs AS a scheduled
            // action, and scheduleMethod() of the same target+method from
            // within its own processing trips the scheduler's LOOP DETECTED
            // throw (seen in prod when deleting a session left the pending
            // path unresolvable — the second consecutive failed resolve threw).
            this.scheduleMethodForNextCycle("performPendingNavigation");
            return this;
        }
        if (!didArrive) {
            console.warn(this.svType() + " could not navigate to " + request.summary());
        }
        this.finishPendingNavigation(request.announcesArrivalAt(path));
        return this;
    }

    /**
     * @description Selects a path in the columns, now.
     * @param {Array<SvNode>} path - the nodes after this browser's root
     * @returns {Boolean} false if a tile in it wasn't found
     * @category Navigation
     * @private
     */
    selectPathNow (path) {
        if (path.length > 0) {
            this.setHasBeenNavigated(true);
        }
        return this.stackView().selectNodePathArray(path);
    }

    /**
     * @description The pending request is over. Selecting a path selects
     * tiles without tapping them, so nothing has announced the new path: the
     * breadcrumbs and the app's URL would keep the old one (a tile opened
     * from inside an inline document never appeared in either). Announce it
     * as a tap does, while the request is still the pending one, so the path
     * change is recorded as its doing; an unchanged path posts nothing.
     * @param {Boolean} announces
     * @returns {SvBrowserView}
     * @category Navigation
     * @private
     */
    finishPendingNavigation (announces) {
        if (announces) {
            this.stackView().didChangeNavSelection();
        }
        this.setPendingNavigationRequest(null);
        return this;
    }

    /**
     * @description This browser's path changed: remember why. A change with
     * a request being carried out is that request's; any other was made in
     * the columns themselves — the user's tap or key. (A model's
     * focus-this-subnode note also lands in the columns and is recorded as
     * the user's for now: docs/Plans/Browser Cleanup, part 1, second pass.)
     * @returns {SvBrowserView}
     * @category Navigation
     * @private
     */
    noteCauseOfPathChange () {
        const path = this.selectedNodePathArray().filter(node => node);
        this.setLastNavigationRequest(this.pendingNavigationRequest() || SvNavigationRequest.toPath(path).setCause("user"));
        return this;
    }

    /**
     * @description A request to a path, on behalf of whoever is behind the
     * navigation going on in this browser now — the user, when there is
     * none. For a view that carries a navigation further (an anchored-tabs
     * stack handing the rest of a path to its pane).
     * @param {Array<SvNode>} path
     * @returns {SvNavigationRequest}
     * @category Navigation
     */
    continuingRequestToPath (path) {
        const pending = this.pendingNavigationRequest();
        return SvNavigationRequest.toPath(path).setCause(pending ? pending.cause() : "user");
    }

    /**
     * @description The path of the base state, after the root: empty, or —
     * when the root opts in with nodeViewShouldAutoSelectFirstSubnode() —
     * its first child, and so on down while each one opts in. The hint
     * CASCADES so nested opt-ins (e.g. root → Party → the local player's
     * panel) land on real content rather than an intermediate list. Bounded
     * against cycles.
     * @returns {Array<SvNode>}
     * @category Navigation
     */
    basePathArray () {
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
        return path;
    }

    /**
     * @description Whether the selection is the base state (basePathArray).
     * @returns {Boolean}
     * @category Navigation
     */
    isAtBase () {
        const now = this.selectedNodePathArray().slice(1).filter(node => node);
        const base = this.basePathArray();
        return now.length === base.length && now.every((node, i) => node === base[i]);
    }

    /**
     * @description Navigates back to the base state, whatever was selected:
     * the columns past it close (e.g. a tab tapped again goes to its root).
     * @returns {SvBrowserView}
     * @category Navigation
     */
    returnToBase () {
        return this.navigate(SvNavigationRequest.toPath(this.basePathArray()).setCause("user"));
    }

    /**
     * @description Moves the view to the base state. Normally that's no
     * selection (just the root column). A root node may opt into showing its
     * first child by default — `nodeViewShouldAutoSelectFirstSubnode()` — e.g. a
     * tab-strip node (horizontal) that wants its first tab's content shown
     * beneath it rather than a bare strip. It applies only to a browser nobody
     * has navigated yet, and lands even if the root column isn't materialized
     * on the first cycle (see navigate).
     * @returns {SvBrowserView} The current SvBrowserView instance.
     * @category Navigation
     */
    moveToBase () {
        this.navigate(SvNavigationRequest.toBaseState());
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
        this.syncContainerResizeObserver(!handles);
        return this;
    }

    // --- container resize (embedded browsers) ---

    /**
     * @description Starts or stops watching this browser's own element for
     * width changes. Only embedded browsers watch: the main browser's
     * container is the window, which SvStackView.onWindowResize already
     * covers.
     *
     * Why this exists (2026-09-09): the companion's embedded browser laid its
     * columns out while the panel was still arbitrating its width, so
     * compaction ran against 0 (column hidden) or against the window-width
     * fallback (column at its default 270 instead of filling the 437 panel),
     * and nothing re-ran once the panel had its real width. A timed relayout
     * on the tab→docked transition (SvCompanionView.relayoutDockedContent)
     * guessed at when that would be; a companion that MOUNTS docked fires it
     * before the content exists. Observing the container is the general
     * answer and needs no guess.
     * @param {Boolean} shouldWatch
     * @returns {SvBrowserView}
     * @category Layout
     */
    syncContainerResizeObserver (shouldWatch) {
        const observer = this.containerResizeObserver();
        if (shouldWatch && !observer && typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver((entries) => this.onContainerResize(entries));
            ro.observe(this.element());
            this.setContainerResizeObserver(ro);
        } else if (!shouldWatch && observer) {
            observer.disconnect();
            this.setContainerResizeObserver(null);
            this.setLastContainerWidth(null);
        }
        return this;
    }

    /**
     * @description ResizeObserver callback. Reads the width the observer hands
     * over (contentRect — no measurement, so no forced layout here) and
     * schedules one recompaction when it has actually changed and is real.
     * @param {ResizeObserverEntry[]} entries
     * @returns {SvBrowserView}
     * @category Layout
     */
    onContainerResize (entries) {
        const entry = entries && entries.length ? entries[entries.length - 1] : null;
        const w = entry && entry.contentRect ? Math.round(entry.contentRect.width) : null;
        if (w === null || w === this.lastContainerWidth()) {
            return this;
        }
        this.setLastContainerWidth(w);
        if (w > 0) {
            this.scheduleMethod("recompactForContainer");
        }
        return this;
    }

    /**
     * @description Re-runs this browser's own compaction chain (browser-scoped
     * by construction) now that its container has a new width. The root
     * stack is handed the width the observer delivered rather than told to
     * re-measure: an animated pane resizes every frame, and a re-measure per
     * frame was a forced layout per frame per moving pane (2026-10-07).
     * @returns {SvBrowserView}
     * @category Layout
     */
    recompactForContainer () {
        const stack = this.stackView();
        if (stack && stack.recompactBrowserChain) {
            const root = stack.rootStackView ? stack.rootStackView() : null;
            if (root && root.setRootWidthCache) {
                root.setRootWidthCache(this.lastContainerWidth()); // the container's new width, as observed
            }
            stack.recompactBrowserChain();
        }
        return this;
    }

    // --- navigation-path membership ---

    /**
     * @description Tells nodes when they join or leave this browser's selected
     * path — the model's way to know it is being looked at without asking the
     * UI (a session makes sound only while it is on a path). Nodes opt in by
     * implementing didEnterNavPath / didExitNavPath. Counts are shared across
     * browsers, so a node on two paths hears only the first entry and the
     * last exit.
     * @category Navigation
     */
    syncNavPathMembership () {
        const now = new Set(this.selectedNodePathArray().filter(node => node));
        const before = this.navPathNodes() || new Set();
        before.forEach(node => { if (!now.has(node)) { SvBrowserView.nodeDidLeaveNavPath(node); } });
        now.forEach(node => { if (!before.has(node)) { SvBrowserView.nodeDidJoinNavPath(node); } });
        this.setNavPathNodes(now);
        return this;
    }

    /**
     * @description A retiring browser's path nodes leave its path.
     * @category Navigation
     */
    releaseNavPathMembership () {
        (this.navPathNodes() || new Set()).forEach(node => SvBrowserView.nodeDidLeaveNavPath(node));
        this.setNavPathNodes(null);
        return this;
    }

    /**
     * @description How many browsers currently show each node on their path.
     * @returns {Map<SvNode, Number>}
     * @category Navigation
     */
    static navPathCounts () {
        if (!this._navPathCounts) { this._navPathCounts = new Map(); }
        return this._navPathCounts;
    }

    static nodeDidJoinNavPath (node) {
        const counts = this.navPathCounts();
        const count = (counts.get(node) || 0) + 1;
        counts.set(node, count);
        if (count === 1 && typeof node.didEnterNavPath === "function") {
            node.didEnterNavPath();
        }
    }

    static nodeDidLeaveNavPath (node) {
        const counts = this.navPathCounts();
        const count = (counts.get(node) || 0) - 1;
        if (count > 0) {
            counts.set(node, count);
            return;
        }
        counts.delete(node);
        if (typeof node.didExitNavPath === "function") {
            node.didExitNavPath();
        }
    }

    prepareToRetire () {
        this.releaseNavPathMembership();
        this.syncContainerResizeObserver(false);
        return super.prepareToRetire();
    }

    // --- the model's navigation notes (see the class comment) ---

    onRequestNavigateToNode (aNote) {
        return this.navigate(SvNavigationRequest.toNode(aNote.info()));
    }

    /**
     * @param {SvNotification} aNote — info() is the path array.
     * @returns {SvBrowserView}
     */
    onRequestSelectNodePath (aNote) {
        const path = aNote.info();
        if (Array.isArray(path) && path.length > 0) {
            this.navigate(SvNavigationRequest.toPath(path));
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
