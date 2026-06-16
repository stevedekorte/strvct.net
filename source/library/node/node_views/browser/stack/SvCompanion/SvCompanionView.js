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
 *   - docked:  fixed-size flex child in normal flow, content visible. The
 *     columns compact to make room (companionReservedWidth feeds compaction).
 *   - tab:     collapses to the tab strip (title + badge); content not shown.
 *
 * The companion is always in normal flow — it NEVER floats over neighboring
 * content. Tapping the tab pins it docked (userExpanded); the columns compact
 * to fit rather than the panel overlapping them.
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
         * @member {String} mode - "docked" | "tab"
         * @category State
         */
        {
            const slot = this.newSlot("mode", "tab");
            slot.setSlotType("String");
        }

        /**
         * @member {Boolean} userExpanded - the user tapped the tab to pin the
         * companion open. While true the companion stays docked (taking real
         * layout space) regardless of auto space arbitration; it never floats
         * over neighboring content.
         * @category State
         */
        {
            const slot = this.newSlot("userExpanded", false);
            slot.setSlotType("Boolean");
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
            tab.setTitle("");
            tab.setBadge(false, null);
            return this;
        }

        tab.setTitle(node.title ? node.title() : "");

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
        return this.mode() === "docked" ? this.preferredLength() : this.tabLength();
    }

    /**
     * @description Called by the owning SvDetailView with the space available
     * to the companion along the dock axis. Decides docked vs tab.
     * @param {Number} availableLength The available space in px.
     * @returns {SvCompanionView} The current instance.
     * @category Layout
     */
    setAvailableLength (availableLength) {
        // User-pinned open: stay docked regardless of auto arbitration. The
        // reserved width feeds column compaction, so the columns make room —
        // the companion never floats over them.
        if (this.userExpanded()) {
            if (this.mode() !== "docked") {
                this.setMode("docked");
                this.applyMode();
            }
            return this;
        }
        const canDock = availableLength >= this.preferredLength();
        if (canDock && this.mode() !== "docked") {
            this.setMode("docked");
            this.applyMode();
        } else if (!canDock && this.mode() === "docked") {
            this.setMode("tab");
            this.applyMode();
        }
        return this;
    }

    /**
     * @description Tab tap: toggle the companion open (docked) or collapsed
     * (tab). Docked takes real layout space and the columns compact to fit —
     * the companion never overlaps neighboring content. Asks the owning detail
     * view + stack to re-arbitrate so the reservation takes effect.
     * @returns {SvCompanionView} The current instance.
     * @category Layout
     */
    toggleExpanded () {
        this.setUserExpanded(!this.userExpanded());
        this.setMode(this.userExpanded() ? "docked" : "tab");
        this.applyMode();

        // Re-size the companion within its OWN detail view only. Do NOT trigger
        // a stack compaction chain here: updateCompactionChain propagates via
        // tellParentViews across the embedded-browser boundary into the outer
        // app stack, which — not accounting for this nested companion's
        // reservation — uncollapses the outer nav and pushes the companion off
        // the right edge. The narration reflows to make room via flex
        // (SvDetailView/childStackView min-width:0), the same as the
        // auto-docked path, without disturbing the outer columns.
        const detail = this.parentView();
        if (detail && detail.updateCompanionLayout) {
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

        // size along the dock axis
        const length = (mode === "docked") ? this.preferredLength() : this.tabLength();
        if (vertical) {
            this.setMinAndMaxWidth(length);
            this.setMinAndMaxHeight(null);
            this.setHeight("100%");
        } else {
            this.setMinAndMaxHeight(length);
            this.setMinAndMaxWidth(null);
            this.setWidth("100%");
        }

        tab.setIsVerticalTab(vertical);

        if (mode === "docked") {
            // In normal flow: a fixed-size flex child. The columns compact to
            // make room (companionReservedWidth feeds compaction) — it never
            // floats over neighboring content.
            tab.hideDisplay();
            if (content) {
                content.unhideDisplay();
                content.setPosition("relative");
                content.setZIndex(null);
                content.setWidth("100%");
                content.setHeight("100%");
                content.setLeft(null);
                content.setRight(null);
                content.setBottom(null);
                content.setTop(null);
                content.setBoxShadow(null);
                content.setMinAndMaxWidth(null);
                content.setMinAndMaxHeight(null);
            }
        } else {
            // tab: collapsed to the strip; content is not shown at all (no
            // slide-over overlay — the companion must never overlap).
            tab.unhideDisplay();
            if (content) {
                content.hideDisplay();
            }
        }

        return this;
    }

}.initThisClass());
