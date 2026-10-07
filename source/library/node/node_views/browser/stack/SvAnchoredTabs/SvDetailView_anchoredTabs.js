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
 *
 * Motion (Plans/Anchor Tabs § Motion, milestone 4): a gesture's change
 * animates; a resize or a divider drag does not. Panes that stay resize by a
 * CSS transition on the widths written here, and the tabs' gaps by the same
 * transition (one duration, one easing, so a tab stays over its pane all the
 * way). An opening pane grows from zero and fades its content in at the end;
 * a closing pane leaves the nav path at once, shrinks to zero with its
 * content faded out, and retires on a timer. The resting layout is written
 * immediately, so it never depends on an animation finishing; a new change
 * mid-animation finishes the entrances and retargets the transitions.
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
            const slot = this.newSlot("anchoredPaneControls", null); // Map pane -> { pin, divider }
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredExitingPanes", null); // Map pane -> node: closed, shrinking, not yet retired
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredEntrances", null); // Set of running entrance Animations
            slot.setSlotType("Set");
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
     * navigation inside survives a re-layout). Runs on every sync of the
     * stack: when nothing changed it only re-stamps the same styles (skipped
     * writes) and starts no motion.
     * @param {Array<SvNode>} openNodes - the open tabs' nodes, in tab order
     * @param {Map<SvNode, Number>} widths - each pane's width in px
     * @param {Set<SvNode>} pinnedNodes - the open tabs that are pinned
     * @param {Boolean} isAnimated - a gesture's change (animates), not a resize or drag
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    syncAnchoredPanes (openNodes, widths, pinnedNodes, isAnimated) {
        const row = this.ensureAnchoredPanesView();
        const panes = this.anchoredPaneViews();
        if (this.anchoredPanesChange(openNodes, widths)) {
            const duration = isAnimated ? this.anchoredMotionDuration(openNodes, widths) : 0;
            this.finishAnchoredEntrances();
            this.setAnchoredMotionDuration(duration);
            [...panes.keys()].filter(node => !openNodes.includes(node)).forEach(node => this.closeAnchoredPane(node, duration));
            openNodes.filter(node => !panes.has(node)).forEach(node => this.openAnchoredPane(node, widths.get(node), duration));
        }
        openNodes.forEach((node, i) => {
            const pane = panes.get(node);
            this.styleAnchoredPane(pane, widths.get(node), i === 0);
            this.syncAnchoredPaneControls(pane, i === 0, pinnedNodes.has(node));
        });
        this.orderAnchoredPanes(row, openNodes.map(node => panes.get(node)));
        return this;
    }

    /**
     * @description Whether this layout differs from what the panes show: a
     * pane opens or closes, or one's width (the inline width this view wrote
     * — not a measurement) changes.
     * @param {Array<SvNode>} openNodes
     * @param {Map<SvNode, Number>} widths
     * @returns {Boolean}
     * @category Anchored Tabs
     */
    anchoredPanesChange (openNodes, widths) {
        const panes = this.anchoredPaneViews();
        if (panes.size !== openNodes.length || openNodes.some(node => !panes.has(node))) {
            return true;
        }
        return openNodes.some(node => this.anchoredPaneWidth(panes.get(node)) !== Math.round(widths.get(node) || 0));
    }

    anchoredPaneWidth (pane) {
        return parseFloat(pane.getCssProperty("min-width")) || 0; // the inline style this view wrote
    }

    /**
     * @description How long this change animates: none for the first layout
     * or under reduced motion; a quick 120ms when panes swap and the rest
     * keep their widths; up to 300ms as more width moves between panes.
     * @param {Array<SvNode>} openNodes
     * @param {Map<SvNode, Number>} widths
     * @returns {Number} milliseconds
     * @category Anchored Tabs
     */
    anchoredMotionDuration (openNodes, widths) {
        const panes = this.anchoredPaneViews();
        if (panes.size === 0 || SvWebBrowserScreen.shared().prefersReducedMotion()) {
            return 0;
        }
        const staying = openNodes.filter(node => panes.has(node));
        const shift = staying.reduce((sum, node) => sum + Math.abs((widths.get(node) || 0) - this.anchoredPaneWidth(panes.get(node))), 0);
        return shift === 0 ? 120 : Math.min(300, Math.round(160 + shift * 0.2));
    }

    /**
     * @description The duration the transitions use, as a custom property on
     * the stack — inherited by the tab row and the panes alike.
     * @param {Number} ms
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    setAnchoredMotionDuration (ms) {
        this.stackView().setCssProperty("--sv-anchor-duration", ms + "ms");
        return this;
    }

    anchoredMotionTransition () {
        return "min-width var(--sv-anchor-duration, 0ms) ease, max-width var(--sv-anchor-duration, 0ms) ease";
    }

    /**
     * @description A new change arrived mid-animation: opening panes jump to
     * their full width (their transitions then carry on from there).
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    finishAnchoredEntrances () {
        this.anchoredEntrances().forEach(animation => animation.finish());
        this.anchoredEntrances().clear();
        return this;
    }

    /**
     * @description Adds a tab's pane. Its columns lay out against its final
     * width from the start (handed to its root stack, not measured: a pane
     * growing from zero measures 0, which is never cached, so every ask
     * re-measured — eleven forced layouts in the first frame). With motion it
     * grows from zero and fades its content in near the end.
     * @param {SvNode} node
     * @param {Number} width
     * @param {Number} duration - ms, 0 for none
     * @returns {SvBrowserView}
     * @category Anchored Tabs
     */
    openAnchoredPane (node, width, duration) {
        const pane = this.addAnchoredPaneForNode(node);
        pane.stackView().rootStackView().setRootWidthCache(Math.round(width || 0) || null);
        if (duration > 0) {
            const px = Math.round(width || 0) + "px";
            const grow = pane.element().animate([{ minWidth: "0px", maxWidth: "0px" }, { minWidth: px, maxWidth: px }], { duration: duration, easing: "ease" });
            const fade = pane.element().animate([{ opacity: 0 }, { opacity: 0, offset: 0.6 }, { opacity: 1 }], { duration: duration });
            [grow, fade].forEach(animation => this.anchoredEntrances().add(animation));
        }
        return pane;
    }

    /**
     * @description A tab closed: its pane leaves the nav path now, and
     * shrinks away (from wherever it is, mid-transition or not) before it
     * retires — on a timer, never on an animation event.
     * @param {SvNode} node
     * @param {Number} duration
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    closeAnchoredPane (node, duration) {
        const pane = this.anchoredPaneViews().get(node);
        this.anchoredPaneViews().delete(node);
        this.anchoredPaneControls().delete(pane);
        pane.releaseNavPathMembership();
        if (duration === 0) {
            return this.retireAnchoredPane(pane);
        }
        this.anchoredExitingPanes().set(pane, node);
        pane.setPointerEvents("none");
        pane.element().animate([{ minWidth: "0px", maxWidth: "0px" }], { duration: duration, easing: "ease", fill: "forwards" });
        pane.element().animate([{ opacity: 1 }, { opacity: 0, offset: 0.4 }, { opacity: 0 }], { duration: duration, fill: "forwards" });
        this.addWeakTimeout(() => this.retireAnchoredPane(pane), duration + 50);
        return this;
    }

    retireAnchoredPane (pane) {
        if (this.anchoredExitingPanes()) {
            this.anchoredExitingPanes().delete(pane);
        }
        if (pane.parentView()) {
            pane.removeFromParentView();
            pane.prepareToRetire(); // its nodes leave the nav path; listeners and observers go
        }
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
        this.setAnchoredPaneControls(new Map());
        this.setAnchoredExitingPanes(new Map());
        this.setAnchoredEntrances(new Set());
        this.setAnchoredMotionDuration(0); // not inherited from an anchored stack this one sits in
        this.childStackView().setDisplay("none"); // the single-selection container is not used here
        this.addSubview(row);
        this.setHasStackContent(true);
        this.observeAnchoredContainer();
        return row;
    }

    addAnchoredPaneForNode (node) {
        const pane = SvBrowserView.clone();
        pane.setHandlesGlobalNavRequests(false); // embedded: never answers global nav requests (milestone 2b routes them)
        pane.setHidesBreadCrumbs(true); // its tab is its title
        pane.setAnchoredTabsHost(this.stackView()); // navigating or focusing in it makes it current
        pane.setIsRegisteredForFocus(true);
        pane.setNode(node);
        pane.setHeight("100%");
        pane.setOverflow("hidden");
        pane.setFlexGrow(0);
        pane.setFlexShrink(0);
        pane.setPosition("relative"); // its pin and divider handle sit at its edges
        pane.setTransition(this.anchoredMotionTransition());
        this.anchoredPaneViews().set(node, pane);
        this.anchoredPanesView().atInsertSubview(this.anchoredInsertIndexFor(node), pane);
        this.addAnchoredPaneControls(pane, node);
        pane.syncNavPathMembership(); // an open pane is being looked at, current or not
        return pane;
    }

    /**
     * @description Where a new pane goes in the row: after every pane —
     * open or still shrinking away — whose tab comes before its tab.
     * @param {SvNode} node
     * @returns {Number}
     * @category Anchored Tabs
     */
    anchoredInsertIndexFor (node) {
        const order = this.stackView().anchoredTabNodes();
        const rank = order.indexOf(node);
        return this.anchoredPanesView().subviews().filter(pane => order.indexOf(this.anchoredAnyNodeForPane(pane)) < rank).length;
    }

    anchoredAnyNodeForPane (pane) {
        return this.anchoredNodeForPane(pane) || this.anchoredExitingPanes().get(pane) || null;
    }

    addAnchoredPaneControls (pane, node) {
        const pin = SvAnchoredPinButton.clone();
        pin.setHost(this.stackView());
        pin.setPaneNode(node);
        const divider = SvAnchoredDividerHandle.clone();
        divider.setHost(this.stackView());
        divider.setRightNode(node);
        pane.addSubview(pin);
        pane.addSubview(divider);
        this.anchoredPaneControls().set(pane, { pin: pin, divider: divider });
        return this;
    }

    syncAnchoredPaneControls (pane, isFirst, isPinned) {
        const controls = this.anchoredPaneControls().get(pane);
        if (controls) {
            controls.pin.setIsPinned(isPinned);
            controls.divider.setDisplay(isFirst ? "none" : "block"); // no divider left of the first pane
        }
        return this;
    }

    anchoredPaneForNode (node) {
        const panes = this.anchoredPaneViews();
        return panes ? (panes.get(node) || null) : null;
    }

    anchoredNodeForPane (pane) {
        const panes = this.anchoredPaneViews();
        const entry = panes ? [...panes.entries()].find(([, p]) => p === pane) : null;
        return entry ? entry[0] : null;
    }

    removeAnchoredPaneForNode (node) {
        return this.anchoredPaneViews().has(node) ? this.closeAnchoredPane(node, 0) : this;
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

    /**
     * @description A safety net: new panes are inserted in place, so the open
     * panes are normally already in tab order. If not, the shrinking ones
     * retire at once and the open ones are re-added in order.
     * @param {SvFlexDomView} row
     * @param {Array<SvBrowserView>} orderedPanes
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    orderAnchoredPanes (row, orderedPanes) {
        const live = row.subviews().filter(pane => orderedPanes.includes(pane));
        const inOrder = orderedPanes.length === live.length && orderedPanes.every((pane, i) => live[i] === pane);
        if (!inOrder) {
            [...this.anchoredExitingPanes().keys()].forEach(pane => this.retireAnchoredPane(pane));
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
        [...this.anchoredPaneViews().keys()].forEach(node => this.removeAnchoredPaneForNode(node));
        [...this.anchoredExitingPanes().keys()].forEach(pane => this.retireAnchoredPane(pane));
        this.anchoredPanesView().removeFromParentView();
        this.setAnchoredPanesView(null);
        this.setAnchoredPaneViews(null);
        this.setAnchoredPaneControls(null);
        this.setAnchoredExitingPanes(null);
        this.setAnchoredEntrances(null);
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
