"use strict";

/** * @module library.node.node_views.browser.stack.SvCompanion
 */

/** * @class SvCompanionView
 * @extends SvNodeView
 * @classdesc A self-contained collapsible companion panel. Its node is the
 * companion root (from the owning stack node's nodeCompanionNode()); it owns
 * its content view and its collapse tab, and manages the docked / tab state
 * machine internally — from the outside (SvDetailView) it is one child whose
 * width animates between panel width and tab width.
 *
 *     SvCompanionView (node = nodeCompanionNode())
 *     ├── contentView   ← the node's view (nodeViewClassName, default SvBrowserView)
 *     └── tabView (SvCompanionTabView)  ← collapsed form: title label + badge
 *
 * Modes:
 *   - docked:  content visible beside a thin caret strip (the tab), in normal
 *     flow. The columns compact to make room (companionReservedWidth feeds
 *     compaction). The strip's caret collapses the panel.
 *   - tab:     just the caret strip; content not shown. The caret expands it.
 *   - hidden:  nothing shown (the window is too narrow for even the strip), so
 *     the content column gets the full width.
 *
 * The companion is always in normal flow — it NEVER floats over neighboring
 * content. Tapping the tab pins docked/tab (userMode); the columns compact to
 * fit rather than the panel overlapping them. A too-narrow window forces hidden
 * regardless of the pin.
 *
 * The state machine is axis-independent: edge "right" docks the panel at the
 * right (vertical tab strip); edge "bottom" docks it beneath (horizontal tab).
 * The owning SvDetailView sets the edge from the stack's direction and calls
 * setAvailableLength() with the space the companion may use.
 *
 * The badge is driven by the node's nodeViewShouldBadge() / nodeViewBadgeTitle()
 * protocol (aggregation across the companion subtree is the node's business).
 *
 * Background can be themed via --SvCompanion-bg.
 */

(class SvCompanionView extends SvNodeView {

    initPrototypeSlots () {
        /**
         * @member {SvDomView} contentView - the companion node's view
         * @category UI
         */
        {
            const slot = this.newSlot("contentView", null);
            slot.setSlotType("SvDomView");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvCompanionTabView} tabView - the collapsed form
         * @category UI
         */
        {
            const slot = this.newSlot("tabView", null);
            slot.setSlotType("SvCompanionTabView");
        }

        /**
         * @member {String} mode - "docked" | "tab" | "hidden". docked = content
         * shown beside a thin collapse strip; tab = just the strip (a caret to
         * expand); hidden = nothing shown (window too narrow even for the strip).
         * @category State
         */
        {
            const slot = this.newSlot("mode", "tab");
            slot.setSlotType("String");
        }

        /**
         * @member {String} userMode - the user's pinned preference set by tapping
         * the tab: "docked", "tab", or null (auto-arbitrate from available space).
         * A pin survives resizes; only a too-narrow window (→ hidden) overrides it.
         * @category State
         */
        {
            const slot = this.newSlot("userMode", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {String} edge - which edge the companion docks at: "right" | "bottom"
         * @category Layout
         */
        {
            const slot = this.newSlot("edge", "right");
            slot.setSlotType("String");
        }

        /**
         * @member {Number} preferredLength - docked size along the dock axis (px)
         * @category Layout
         */
        {
            const slot = this.newSlot("preferredLength", 380);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} tabLength - collapsed size along the dock axis (px)
         * @category Layout
         */
        {
            const slot = this.newSlot("tabLength", 30);
            slot.setSlotType("Number");
        }
    }

    init () {
        super.init();
        this.setElementClassName("SvCompanionView");
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setFlexGrow(0);
        this.setFlexShrink(0);
        this.setOverflow("hidden"); // content stays within the panel; never floats over neighbors
        this.setBackgroundColor("var(--SvCompanion-bg, rgba(255, 255, 255, 0.03))");

        const tab = SvCompanionTabView.clone();
        tab.setCompanionView(this);
        this.setTabView(tab);
        this.addSubview(tab);

        this.applyMode();
        return this;
    }

    // --- node binding ---

    /**
     * @description Rebuilds the content view for the new companion node and
     * syncs the tab.
     * @returns {SvCompanionView} The current instance.
     * @category Node Management
     */
    didChangeNode () {
        super.didChangeNode();

        if (this.contentView()) {
            this.contentView().removeFromParentView();
            this.setContentView(null);
        }

        const node = this.node();
        if (node) {
            const view = this.newContentViewForNode(node);
            this.setContentView(view);
            this.addSubview(view);
            if (view.syncFromNode) {
                view.syncFromNode();
            }
        }

        this.applyMode();
        this.syncTabFromNode();
        return this;
    }

    /**
     * @description Resolves the content view class through the node-view
     * protocol: an explicit nodeViewClassName wins; the default is an
     * embedded SvBrowserView (own breadcrumbs, isolated navigation).
     * @param {SvNode} node The companion root node.
     * @returns {SvDomView} The content view.
     * @category View Creation
     */
    newContentViewForNode (node) {
        let viewClass = null;
        if (node.nodeViewClassName && node.nodeViewClassName()) {
            viewClass = Object.getClassNamed(node.nodeViewClassName());
        }
        if (!viewClass) {
            viewClass = SvBrowserView;
        }

        const view = viewClass.clone();
        if (view.setHandlesGlobalNavRequests) {
            view.setHandlesGlobalNavRequests(false); // embedded: never answer global nav requests
        }
        if (view.setNode) {
            view.setNode(node);
        }
        return view;
    }

    /**
     * @description This view manages its own fixed subviews; node updates
     * refresh the tab (title, badge) only.
     * @returns {boolean}
     * @category Synchronization
     */
    syncFromNode () {
        this.syncTabFromNode();
        return false;
    }

    syncTabFromNode () {
        const node = this.node();
        const tab = this.tabView();
        if (!node) {
            tab.setBadge(false, null);
            return this;
        }

        // No title on the tab (the strip is too narrow) — only the badge.
        const shouldBadge = (node.nodeViewShouldBadge && node.nodeViewShouldBadge() === true);
        const badgeTitle = (shouldBadge && node.nodeViewBadgeTitle) ? node.nodeViewBadgeTitle() : null;
        tab.setBadge(shouldBadge, badgeTitle);
        return this;
    }

    // --- layout state machine ---

    isVerticalEdge () {
        return this.edge() === "right";
    }

    /**
     * @description The space this companion currently reserves along the dock
     * axis — what the stack's compaction should account for.
     * @returns {Number} The reserved length in px.
     * @category Layout
     */
    currentReservedLength () {
        const mode = this.mode();
        if (mode === "docked") {
            return this.preferredLength();
        }
        if (mode === "tab") {
            return this.tabLength();
        }
        return 0; // hidden
    }

    /**
     * @description Called by the owning SvDetailView with the space available
     * to the companion along the dock axis (the window minus the content
     * column's own claim — see SvDetailView.updateCompanionLayout). Resolves the
     * three-state mode: too little room → hidden (even the tab is dropped so the
     * content gets the full width); a user pin wins inside the viable range;
     * otherwise auto docks when the panel fits and tabs when it doesn't.
     * @param {Number} availableLength The available space in px.
     * @returns {Boolean} true if the mode changed (drives the compaction fixed point).
     * @category Layout
     */
    setAvailableLength (availableLength) {
        const before = this.mode();
        let mode;
        if (availableLength < this.tabLength()) {
            mode = "hidden"; // too narrow — hide the panel AND its tab
        } else if (this.userMode() === "docked") {
            mode = "docked";
        } else if (this.userMode() === "tab") {
            mode = "tab";
        } else {
            mode = (availableLength >= this.preferredLength()) ? "docked" : "tab";
        }
        if (mode !== before) {
            this.setMode(mode);
            this.applyMode();
        }
        return mode !== before; // report mode change for the compaction fixed point
    }

    /**
     * @description Tab tap: pin the companion open (docked) or collapsed (tab),
     * the opposite of its current state. Docked takes real layout space and the
     * columns compact to fit — the companion never overlaps neighboring content.
     * Asks the owning detail view + stack to re-arbitrate so the reservation
     * takes effect.
     * @returns {SvCompanionView} The current instance.
     * @category Layout
     */
    toggleExpanded () {
        const willDock = this.mode() !== "docked";
        this.setUserMode(willDock ? "docked" : "tab");
        this.setMode(willDock ? "docked" : "tab");
        this.applyMode();

        // Recompact this companion's OWN browser chain to a fixed point. It is
        // bounded (rootStackView/stackViewSubchain stop at the browser
        // boundary), so the session's columns make room for the docked
        // companion without disturbing the outer app stack — the cross-boundary
        // uncollapse bug can't recur.
        const detail = this.parentView();
        const stack = (detail && detail.stackView) ? detail.stackView() : null;
        if (stack && stack.recompactBrowserChain) {
            stack.recompactBrowserChain();
        } else if (detail && detail.updateCompanionLayout) {
            detail.updateCompanionLayout();
        }
        return this;
    }

    /**
     * @description Applies the current mode + edge to the subviews.
     * @returns {SvCompanionView} The current instance.
     * @category Layout
     */
    applyMode () {
        const mode = this.mode();
        const vertical = this.isVerticalEdge();
        const tab = this.tabView();
        const content = this.contentView();

        // The tab hugs the dock edge (right for a side dock, bottom otherwise),
        // so the content sits before it in flow order.
        this.setFlexDirection(vertical ? "row" : "column");
        if (content) {
            content.setOrder(0);
        }
        tab.setOrder(1);
        tab.setIsVerticalTab(vertical);
        tab.setCompanionIsDocked(mode === "docked");

        // size of the whole companion along the dock axis
        const length = (mode === "docked") ? this.preferredLength()
            : (mode === "tab") ? this.tabLength() : 0;
        if (vertical) {
            this.setMinAndMaxWidth(length);
            this.setMinAndMaxHeight(null);
            this.setHeight("100%");
        } else {
            this.setMinAndMaxHeight(length);
            this.setMinAndMaxWidth(null);
            this.setWidth("100%");
        }

        if (mode === "hidden") {
            // Too narrow: drop the panel and its tab entirely so the content
            // column gets the full width.
            tab.hideDisplay();
            if (content) {
                content.hideDisplay();
            }
            return this;
        }

        // The tab is a persistent control in both docked and tab modes: a thin
        // fixed strip on the dock edge whose caret expands (when a tab) or
        // collapses (when docked) the panel.
        tab.unhideDisplay();
        tab.setFlexGrow(mode === "tab" ? 1 : 0); // fills the strip when alone; fixed beside content when docked
        tab.setFlexShrink(0);
        if (vertical) {
            tab.setMinAndMaxWidth(this.tabLength());
            tab.setMinAndMaxHeight(null);
            tab.setHeight("100%");
        } else {
            tab.setMinAndMaxHeight(this.tabLength());
            tab.setMinAndMaxWidth(null);
            tab.setWidth("100%");
        }

        if (mode === "docked") {
            if (content) {
                content.unhideDisplay();
                content.setPosition("relative");
                content.setZIndex(null);
                content.setFlexGrow(1);
                content.setFlexShrink(1);
                content.setLeft(null);
                content.setRight(null);
                content.setBottom(null);
                content.setTop(null);
                content.setBoxShadow(null);
                if (vertical) {
                    content.setWidth(null);
                    content.setHeight("100%");
                    content.setMinWidth("0px"); // shrink so the fixed tab keeps its strip
                    content.setMaxWidth(null);
                    content.setMinAndMaxHeight(null);
                } else {
                    content.setHeight(null);
                    content.setWidth("100%");
                    content.setMinHeight("0px");
                    content.setMaxHeight(null);
                    content.setMinAndMaxWidth(null);
                }
            }
            // The embedded content (an SvBrowserView) may have first laid out
            // its columns while we were a tab — i.e. hidden / zero-width — so
            // its nav compacted to nothing and stayed blank until a window
            // resize re-ran compaction. Now that we're docked at a real width,
            // re-run its compaction next cycle (once the flex layout has given
            // it width) so the content shows without needing a manual resize.
            this.scheduleMethod("relayoutDockedContent");
        } else {
            // tab only: content not shown (never a slide-over overlay).
            if (content) {
                content.hideDisplay();
            }
        }

        return this;
    }

    /**
     * @description Re-runs the embedded content browser's compaction now that
     * the companion is docked at a real width, so a content view that first
     * laid out while hidden (blank columns) renders without a manual resize.
     * No-op unless the content is a browser with a recompactable stack.
     * @returns {SvCompanionView} The current instance.
     * @category Layout
     */
    relayoutDockedContent () {
        if (this.mode() !== "docked") {
            return this;
        }
        const content = this.contentView();
        const stack = (content && content.stackView) ? content.stackView() : null;
        if (stack && stack.recompactBrowserChain) {
            stack.recompactBrowserChain();
        }
        return this;
    }

}.initThisClass());
