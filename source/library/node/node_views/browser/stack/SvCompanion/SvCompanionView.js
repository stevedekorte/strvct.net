"use strict";

/** * @module library.node.node_views.browser.stack.SvCompanion
 */

/** * @class SvCompanionView
 * @extends SvNodeView
 * @classdesc A self-contained collapsible companion panel. Its node is the
 * companion root (from the owning stack node's nodeCompanionNode()); it owns
 * its content view and its collapse tab, and manages the docked / tab /
 * overlay state machine internally — from the outside (SvDetailView) it is one
 * child whose width animates between panel width, tab width, and zero.
 *
 *     SvCompanionView (node = nodeCompanionNode())
 *     ├── contentView   ← the node's view (nodeViewClassName, default SvBrowserView)
 *     └── tabView (SvCompanionTabView)  ← collapsed form: title label + badge
 *
 * Modes:
 *   - docked:  enough space → fixed-size flex child, content visible
 *   - tab:     not enough → collapses to the tab strip (title + badge)
 *   - overlay: tab tapped → stays at tab width while the content view
 *     positions absolutely off its own inner edge, over the neighboring
 *     content; neither the detail view nor the stack knows overlay is showing
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
         * @member {String} mode - "docked" | "tab" | "overlay"
         * @category State
         */
        {
            const slot = this.newSlot("mode", "tab");
            slot.setSlotType("String");
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
        this.setPosition("relative"); // positioning context for the overlay content
        this.setFlexGrow(0);
        this.setFlexShrink(0);
        this.setOverflow("visible"); // the overlay content extends past the tab strip
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
     * @description Toggles the slide-over overlay while collapsed (tab tap).
     * @returns {SvCompanionView} The current instance.
     * @category Layout
     */
    toggleOverlay () {
        if (this.mode() === "overlay") {
            this.setMode("tab");
        } else if (this.mode() === "tab") {
            this.setMode("overlay");
        }
        this.applyMode();
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
            tab.hideDisplay();
            if (content) {
                content.unhideDisplay();
                content.setPosition("relative");
                content.setZIndex(null);
                content.setWidth("100%");
                content.setHeight("100%");
                content.setRight(null);
                content.setBottom(null);
                content.setTop(null);
                content.setBoxShadow(null);
            }
        } else {
            tab.unhideDisplay();
            if (content) {
                if (mode === "overlay") {
                    // slide over the neighboring content, anchored off our inner edge;
                    // the tab strip stays visible and clickable to close
                    content.unhideDisplay();
                    content.setPosition("absolute");
                    content.setZIndex(15);
                    content.setBackgroundColor("var(--SvCompanion-bg, #1a1a1a)");
                    content.setBoxShadow("0 0 20px rgba(0, 0, 0, 0.5)");
                    if (vertical) {
                        content.setTop("0px");
                        content.setHeight("100%");
                        content.setRight("100%"); // content's right edge at the tab's left edge
                        content.setBottom(null);
                        content.setMinAndMaxWidth(this.preferredLength());
                    } else {
                        content.setLeft("0px");
                        content.setWidth("100%");
                        content.setBottom("100%"); // content's bottom edge at the tab's top edge
                        content.setRight(null);
                        content.setMinAndMaxHeight(this.preferredLength());
                    }
                } else {
                    content.hideDisplay();
                }
            }
        }

        return this;
    }

}.initThisClass());
