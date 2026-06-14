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
        this.stackView().syncFromNode();
        return false;
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
        this.postNoteNamed("onBrowserViewPathChange");
        return true;
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
        this.stackView().selectNodePathArray(nodePathArray);
        return this;
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
     * @description Moves the view to the base state (no selection; the root column shows).
     * @returns {SvBrowserView} The current SvBrowserView instance.
     * @category Navigation
     */
    moveToBase () {
        this.selectNodePathArray([]);
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
            const nodePath = path.shallowCopy();
            if (nodePath.first() === this.node()) {
                nodePath.shift(); // tolerate absolute paths that include the root node
            }
            this.selectNodePathArray(nodePath);
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

}.initThisClass());
