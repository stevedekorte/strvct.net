"use strict";

/**
 * @module library.node.node_views.browser.stack.SvAnchoredTabs
 */

/**
 * @class SvDetailView_anchoredTabs
 * @extends SvDetailView
 * @classdesc The detail view of an anchored-tabs stack (Plans/Anchor Tabs,
 * milestone 2a): instead of one child stack for one selection, a row of
 * panes, one per open tab, side by side in tab order and sized by the
 * stack's SvAnchoredTabsLayout. Each pane is an embedded SvBrowserView for
 * its tab's node — a stack boundary, so the pane's columns compact against
 * the pane's width, not the window's, and drilling in stays inside the pane.
 *
 * Widths come only from the layout object; the container width reaches it
 * through a ResizeObserver (contentRect, no measurement). Nothing here reads
 * geometry during a sync.
 */
(class SvDetailView_anchoredTabs extends SvDetailView {

    initPrototypeSlots_anchoredTabs () {
        {
            const slot = this.newSlot("anchoredPanesView", null); // the row of panes
            slot.setSlotType("SvFlexDomView");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredPaneViews", null); // Map node -> pane (SvBrowserView)
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("pendingAnchoredWidth", null); // observed, not yet applied
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredResizeObserver", null);
            slot.setSlotType("ResizeObserver");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Shows exactly these panes, in this order, at these widths.
     * Panes for tabs that closed are removed; a pane that stays is kept (its
     * navigation inside survives a re-layout).
     * @param {Array<SvNode>} openNodes - the open tabs' nodes, in tab order
     * @param {Map<SvNode, Number>} widths - each pane's width in px
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    syncAnchoredPanes (openNodes, widths) {
        const row = this.ensureAnchoredPanesView();
        const panes = this.anchoredPaneViews();
        [...panes.keys()].filter(node => !openNodes.includes(node)).forEach(node => this.removeAnchoredPaneForNode(node));
        openNodes.forEach((node, i) => {
            const pane = panes.get(node) || this.addAnchoredPaneForNode(node);
            this.styleAnchoredPane(pane, widths.get(node), i === 0);
        });
        this.orderAnchoredPanes(row, openNodes.map(node => panes.get(node)));
        return this;
    }

    ensureAnchoredPanesView () {
        if (this.anchoredPanesView()) {
            return this.anchoredPanesView();
        }
        const row = SvFlexDomView.clone();
        row.setElementClassName("SvAnchoredPanesView");
        row.setFlexDirection("row");
        row.setFlexGrow(1);
        row.setFlexShrink(1);
        row.setMinWidth("0px");
        row.setHeight("100%");
        row.setOverflow("hidden");
        this.setAnchoredPanesView(row);
        this.setAnchoredPaneViews(new Map());
        this.childStackView().setDisplay("none"); // the single-selection container is not used here
        this.addSubview(row);
        this.setHasStackContent(true);
        this.observeAnchoredContainer();
        return row;
    }

    addAnchoredPaneForNode (node) {
        const pane = SvBrowserView.clone();
        pane.setHandlesGlobalNavRequests(false); // embedded: never answers global nav requests (milestone 2b routes them)
        pane.setNode(node);
        pane.setHeight("100%");
        pane.setOverflow("hidden");
        pane.setFlexGrow(0);
        pane.setFlexShrink(0);
        this.anchoredPaneViews().set(node, pane);
        this.anchoredPanesView().addSubview(pane);
        return pane;
    }

    removeAnchoredPaneForNode (node) {
        const pane = this.anchoredPaneViews().get(node);
        this.anchoredPaneViews().delete(node);
        if (pane) {
            pane.removeFromParentView();
        }
        return this;
    }

    /**
     * @description Width and divider for a pane. Same-value style writes are
     * skipped by setCssProperty, so re-applying an unchanged layout is free.
     * @param {SvBrowserView} pane
     * @param {Number} width
     * @param {Boolean} isFirst
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    styleAnchoredPane (pane, width, isFirst) {
        pane.setMinAndMaxWidth(Math.max(0, Math.round(width || 0)) + "px");
        pane.setBorderLeft(isFirst ? null : "1px solid var(--sv-hairline, rgba(128, 128, 128, 0.35))");
        return this;
    }

    orderAnchoredPanes (row, orderedPanes) {
        const current = row.subviews();
        const inOrder = orderedPanes.length === current.length && orderedPanes.every((pane, i) => current[i] === pane);
        if (!inOrder) {
            orderedPanes.forEach(pane => {
                pane.removeFromParentView();
                row.addSubview(pane);
            });
        }
        return this;
    }

    /**
     * @description Leaves anchored mode (the stack now shows a node that does
     * not ask for anchored tabs): removes the panes and restores the single
     * child-stack container.
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    removeAnchoredPanes () {
        if (!this.anchoredPanesView()) {
            return this;
        }
        this.unobserveAnchoredContainer();
        this.anchoredPanesView().removeFromParentView();
        this.setAnchoredPanesView(null);
        this.setAnchoredPaneViews(null);
        this.childStackView().setDisplay("flex");
        return this;
    }

    // --- container width ---

    observeAnchoredContainer () {
        if (!this.anchoredResizeObserver() && typeof ResizeObserver !== "undefined") {
            const ro = new ResizeObserver((entries) => this.onAnchoredContainerResize(entries));
            ro.observe(this.element());
            this.setAnchoredResizeObserver(ro);
        }
        return this;
    }

    unobserveAnchoredContainer () {
        if (this.anchoredResizeObserver()) {
            this.anchoredResizeObserver().disconnect();
            this.setAnchoredResizeObserver(null);
        }
        return this;
    }

    /**
     * @description ResizeObserver callback: hands the width it was given
     * (contentRect — no measurement) to the stack, which re-lays the panes
     * out only when it changed.
     * @param {ResizeObserverEntry[]} entries
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    onAnchoredContainerResize (entries) {
        const entry = entries && entries.length ? entries[entries.length - 1] : null;
        const width = entry && entry.contentRect ? Math.round(entry.contentRect.width) : 0;
        if (width > 0) {
            // applied just after the callback, not inside it: resizing panes
            // inside an observer callback is the "ResizeObserver loop
            // completed with undelivered notifications" error
            this.setPendingAnchoredWidth(width);
            this.addWeakTimeout(() => this.applyPendingAnchoredWidth(), 0);
        }
        return this;
    }

    applyPendingAnchoredWidth () {
        const width = this.pendingAnchoredWidth();
        const stack = this.stackView();
        this.setPendingAnchoredWidth(null);
        if (width && stack && stack.onAnchoredContainerWidth) {
            stack.onAnchoredContainerWidth(width);
        }
        return this;
    }

}.initThisCategory());
