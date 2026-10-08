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
 * geometry: every position is computed from the widths.
 *
 * Panes are absolutely positioned at computed left edges ("frames"), stacked
 * in tab order (a later tab's pane above an earlier one's) on an opaque
 * background, so a pane wider than its frame is simply covered by its right
 * neighbour.
 *
 * Motion (Plans/Anchor Tabs § Motion) without reflow: a change is laid out
 * once, at its end state, and then only transform and opacity animate —
 * compositor work, no layout per frame. Each pane slides (translateX) from
 * its old left edge to its new one; a shrinking pane keeps its old width
 * until the motion ends (it is covered where it overhangs), then settles to
 * its new width in one more layout. An opening pane slides out from where
 * its tab's slot was and fades its content in; a closing pane leaves the nav
 * path at once, slides under its neighbour, fades, and retires on a timer.
 * A change mid-motion continues smoothly from wherever things are: the
 * running slide's offset is computed from its own eased progress (timing
 * state, not geometry), and a new slide starts there. Slides are plain
 * (replace) transform animations, which the browser can run on the
 * compositor; additive ones ran on the main thread, a style pass a frame.
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
            const slot = this.newSlot("anchoredPaneControls", null); // Map pane -> { divider }
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredPaneFrames", null); // Map node -> { left, width, isFirst }: the laid-out frames
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredExitingPanes", null); // Map pane -> node: closed, sliding away, not yet retired
            slot.setSlotType("Map");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredSlides", null); // WeakMap element -> { animation, from, to }: slides running or done
            slot.setSlotType("WeakMap");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredSettleSerial", 0); // the latest change's settle timer
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("pendingTabMotionDuration", 0); // ms: the last pane change's motion, for the tab row to take
            slot.setSlotType("Number");
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
     * @description Shows exactly these panes at these widths. A pane that
     * stays is kept (its navigation inside survives a re-layout). Runs on
     * every sync of the stack: when no frame changed it writes nothing and
     * starts no motion.
     * @param {Array<SvNode>} openNodes - the open tabs' nodes, in tab order
     * @param {Map<SvNode, Number>} widths - each pane's width in px
     * @param {Boolean} isAnimated - a gesture's change (animates), not a resize or drag
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    syncAnchoredPanes (openNodes, widths, isAnimated) {
        this.ensureAnchoredPanesView();
        const frames = this.anchoredFramesFor(openNodes, widths);
        const changes = this.anchoredFramesChange(frames);
        if (changes) {
            const duration = isAnimated ? this.anchoredMotionDuration(frames) : 0;
            this.setPendingTabMotionDuration(duration);
            const oldFrames = this.anchoredPaneFrames();
            [...this.anchoredPaneViews().keys()].filter(node => !frames.has(node)).forEach(node => this.closeAnchoredPane(node, duration, frames));
            openNodes.forEach(node => this.placeAnchoredPane(node, frames, oldFrames, duration));
            this.setAnchoredPaneFrames(frames);
            this.scheduleAnchoredSettle(duration);
        }
        openNodes.forEach((node, i) => {
            const pane = this.anchoredPaneViews().get(node);
            this.syncAnchoredPaneTarget(pane, node); // a link tab re-pointed, frames unchanged
            this.syncAnchoredPaneControls(pane, i === 0);
        });
        return this;
    }

    /**
     * @description Each open pane's frame: its left edge and width, laid end
     * to end. A pane after the first carries a 1px divider (its left border)
     * inside its box, so the next pane starts one pixel further on.
     * @param {Array<SvNode>} openNodes
     * @param {Map<SvNode, Number>} widths
     * @returns {Map<SvNode, Object>} node -> { left, width, isFirst }
     * @category Anchored Tabs
     */
    /**
     * @description The tab row takes the last pane change's duration when it
     * moves its tabs — once (a later, unanimated move must not reuse it).
     * Handed over rather than read per sync: the tab row can be re-synced in
     * a nested pass after the change, which must still see it.
     * @returns {Number} ms
     * @category Anchored Tabs
     */
    takeTabMotionDuration () {
        const duration = this.pendingTabMotionDuration();
        this.setPendingTabMotionDuration(0);
        return duration;
    }

    anchoredFramesFor (openNodes, widths) {
        const divider = this.stackView().anchoredLayout().dividerWidth();
        const frames = new Map();
        let left = 0;
        openNodes.forEach((node, i) => {
            const width = Math.max(0, Math.round(widths.get(node) || 0));
            frames.set(node, { left: left, width: width, isFirst: i === 0 });
            left += width + (i > 0 ? divider : 0);
        });
        return frames;
    }

    anchoredFramesChange (frames) {
        const old = this.anchoredPaneFrames();
        if (old.size !== frames.size) {
            return true;
        }
        return [...frames.entries()].some(([node, f]) => {
            const o = old.get(node);
            return !o || o.left !== f.left || o.width !== f.width || o.isFirst !== f.isFirst;
        });
    }

    /**
     * @description How long this change animates: none for the first layout
     * or under reduced motion; a quick 120ms when panes swap and the rest
     * keep their widths; up to 300ms as more width moves between panes.
     * @param {Map<SvNode, Object>} frames
     * @returns {Number} milliseconds
     * @category Anchored Tabs
     */
    anchoredMotionDuration (frames) {
        const old = this.anchoredPaneFrames();
        if (old.size === 0 || SvWebBrowserScreen.shared().prefersReducedMotion()) {
            return 0;
        }
        const staying = [...frames.keys()].filter(node => old.has(node));
        const shift = staying.reduce((sum, node) => sum + Math.abs(frames.get(node).width - old.get(node).width), 0);
        return shift === 0 ? 120 : Math.min(300, Math.round(160 + shift * 0.2));
    }

    /**
     * @description Puts a pane at its new frame and, with motion, slides it
     * there from its old left edge (or, opening, from its tab's slot in the
     * old layout). While moving, its box is never narrower than it was, so
     * it never shows a gap; scheduleAnchoredSettle narrows it afterwards.
     * @param {SvNode} node
     * @param {Map<SvNode, Object>} frames
     * @param {Map<SvNode, Object>} oldFrames
     * @param {Number} duration
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    placeAnchoredPane (node, frames, oldFrames, duration) {
        const frame = frames.get(node);
        const old = oldFrames.get(node);
        const pane = this.anchoredPaneViews().get(node) || this.addAnchoredPaneForNode(node, frame);
        const boxWidth = (old && duration > 0) ? Math.max(this.anchoredBoxWidth(pane), frame.width) : frame.width;
        this.styleAnchoredPane(pane, frame, boxWidth);
        if (duration > 0) {
            const from = old ? old.left : this.anchoredSlotLeft(node, oldFrames);
            this.slideAnchoredView(pane, from - frame.left, 0, duration, "none");
            if (!old) {
                pane.element().animate([{ opacity: 0 }, { opacity: 0, offset: 0.5 }, { opacity: 1 }], { duration: duration });
            }
        }
        return this;
    }

    anchoredBoxWidth (pane) {
        return parseFloat(pane.getCssProperty("min-width")) || 0; // the inline style this view wrote
    }

    /**
     * @description Where a tab's zero-width slot sits in a set of frames: the
     * left edge of the first frame whose tab comes after it, else the end of
     * the last frame.
     * @param {SvNode} node
     * @param {Map<SvNode, Object>} frames
     * @returns {Number}
     * @category Anchored Tabs
     */
    anchoredSlotLeft (node, frames) {
        const order = this.stackView().anchoredTabNodes();
        const rank = order.indexOf(node);
        const after = [...frames.entries()].find(([other]) => order.indexOf(other) > rank);
        if (after) {
            return after[1].left;
        }
        const last = [...frames.values()].last();
        return last ? last.left + last.width + (last.isFirst ? 0 : this.stackView().anchoredLayout().dividerWidth()) : 0;
    }

    /**
     * @description A compositor-friendly slide: translateX from an offset
     * (relative to the view's new place) to another. If the view is still
     * sliding from an earlier change, it starts from where that slide has it
     * now — computed from the slide's eased progress, not measured.
     * @param {SvDomView} view
     * @param {Number} fromDx - the view's old place less its new place
     * @param {Number} toDx
     * @param {Number} duration
     * @param {String} fill - "none", or "forwards" to hold the end (a closing pane)
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    slideAnchoredView (view, fromDx, toDx, duration, fill) {
        const element = view.element();
        const running = this.anchoredSlides().get(element);
        const from = fromDx + (running ? this.slideOffsetNow(running) : 0);
        if (running) {
            running.animation.cancel();
            this.anchoredSlides().delete(element);
        }
        if (from !== toDx) {
            const keyframes = [{ transform: "translateX(" + from + "px)" }, { transform: "translateX(" + toDx + "px)" }];
            const animation = element.animate(keyframes, { duration: duration, easing: "ease", fill: fill });
            this.anchoredSlides().set(element, { animation: animation, from: from, to: toDx });
        }
        return this;
    }

    /**
     * @description Where a slide has its view now, relative to the place it
     * slides to: its eased progress (getComputedTiming includes the easing)
     * between its offsets; a finished slide is at its end.
     * @param {Object} slide - { animation, from, to }
     * @returns {Number}
     * @category Anchored Tabs
     */
    slideOffsetNow (slide) {
        const progress = slide.animation.effect ? slide.animation.effect.getComputedTiming().progress : null;
        return (progress === null || progress === undefined) ? slide.to : slide.from + (slide.to - slide.from) * progress;
    }

    /**
     * @description After the motion, each pane's box narrows to its frame
     * and the closed panes retire — together, so one layout, and each
     * narrowed pane's columns re-compact once. Only the latest change's
     * timer acts (a closed pane held at its faded end waits for it). Timers,
     * never animation events: those can stall in a background tab.
     * @param {Number} duration
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    scheduleAnchoredSettle (duration) {
        const serial = this.anchoredSettleSerial() + 1;
        this.setAnchoredSettleSerial(serial);
        if (duration > 0) {
            this.addWeakTimeout(() => {
                if (serial === this.anchoredSettleSerial()) {
                    this.settleAnchoredPanes();
                }
            }, duration + 20);
        }
        return this;
    }

    settleAnchoredPanes () {
        const frames = this.anchoredPaneFrames();
        if (frames) {
            frames.forEach((frame, node) => this.styleAnchoredPane(this.anchoredPaneViews().get(node), frame, frame.width));
            [...this.anchoredExitingPanes().keys()].forEach(pane => this.retireAnchoredPane(pane));
        }
        return this;
    }

    /**
     * @description A tab closed: its pane leaves the nav path now and, with
     * motion, slides to its tab's slot in the new layout (under its right
     * neighbour) and fades, then retires when the motion settles.
     * @param {SvNode} node
     * @param {Number} duration
     * @param {Map<SvNode, Object>} frames - the new frames
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    closeAnchoredPane (node, duration, frames) {
        const pane = this.anchoredPaneViews().get(node);
        const old = this.anchoredPaneFrames().get(node);
        this.anchoredPaneViews().delete(node);
        this.anchoredPaneControls().delete(pane);
        pane.releaseNavPathMembership();
        if (duration === 0 || !old) {
            return this.retireAnchoredPane(pane);
        }
        this.anchoredExitingPanes().set(pane, node);
        pane.setPointerEvents("none");
        this.slideAnchoredView(pane, 0, this.anchoredSlotLeft(node, frames) - old.left, duration, "forwards");
        pane.element().animate([{ opacity: 1 }, { opacity: 0, offset: 0.5 }, { opacity: 0 }], { duration: duration, fill: "forwards" });
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
        row.setPosition("relative"); // the panes are placed in it by their frames
        row.setFlexGrow(1);
        row.setFlexShrink(1);
        row.setMinWidth("0px");
        row.setHeight("100%");
        row.setOverflow("hidden");
        this.setAnchoredPanesView(row);
        this.setAnchoredPaneViews(new Map());
        this.setAnchoredPaneControls(new Map());
        this.setAnchoredPaneFrames(new Map());
        this.setAnchoredExitingPanes(new Map());
        this.setAnchoredSlides(new WeakMap());
        this.childStackView().setDisplay("none"); // the single-selection container is not used here
        this.addSubview(row);
        this.setHasStackContent(true);
        this.observeAnchoredContainer();
        return row;
    }

    /**
     * @description A new pane for a tab. Its columns lay out against its
     * frame's width from the start (handed to its root stack, not measured).
     * @param {SvNode} node
     * @param {Object} frame
     * @returns {SvBrowserView}
     * @category Anchored Tabs
     */
    addAnchoredPaneForNode (node, frame) {
        const pane = SvBrowserView.clone();
        pane.setHandlesGlobalNavRequests(false); // embedded: the outer browser routes navigation into it
        pane.setHidesBreadCrumbs(true); // its tab is its title
        pane.setAnchoredTabsHost(this.stackView()); // navigating or focusing in it makes it current
        pane.setIsRegisteredForFocus(true);
        pane.setNode(this.anchoredPaneTargetFor(node));
        pane.setPosition("absolute");
        pane.setTop("0px");
        pane.setHeight("100%");
        pane.setOverflow("hidden");
        pane.setZIndex(String(this.stackView().anchoredTabNodes().indexOf(node) + 1)); // later tabs above earlier ones
        pane.setCssProperty("background-color", "var(--sv-surface)"); // opaque, the page ground: it covers the pane it overlaps
        pane.stackView().rootStackView().setRootWidthCache(frame.width || null);
        this.anchoredPaneViews().set(node, pane);
        this.anchoredPanesView().addSubview(pane);
        this.addAnchoredPaneControls(pane, node);
        pane.syncNavPathMembership(); // an open pane is being looked at, current or not
        return pane;
    }

    /**
     * @description What a tab's pane shows: what its tile links to, as a
     * selection would (a link tab — "Me" — shows the character it points
     * at), else the tab's node itself.
     * @param {SvNode} node - the tab
     * @returns {SvNode}
     * @category Anchored Tabs
     */
    anchoredPaneTargetFor (node) {
        const target = node.nodeTileLink ? node.nodeTileLink() : null;
        return target || node;
    }

    /**
     * @description A link tab can be re-pointed (the player takes another
     * character): its pane follows.
     * @param {SvBrowserView} pane
     * @param {SvNode} node - the tab
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    syncAnchoredPaneTarget (pane, node) {
        const target = this.anchoredPaneTargetFor(node);
        if (pane.node() !== target) {
            pane.setNode(target);
        }
        return this;
    }

    addAnchoredPaneControls (pane, node) {
        const divider = SvAnchoredDividerHandle.clone();
        divider.setHost(this.stackView());
        divider.setRightNode(node);
        pane.addSubview(divider);
        this.anchoredPaneControls().set(pane, { divider: divider });
        return this;
    }

    syncAnchoredPaneControls (pane, isFirst) {
        const controls = this.anchoredPaneControls().get(pane);
        if (controls) {
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
        return this.anchoredPaneViews().has(node) ? this.closeAnchoredPane(node, 0, new Map()) : this;
    }

    /**
     * @description A pane's place and box. Same-value style writes are
     * skipped by setCssProperty, so re-applying an unchanged frame is free.
     * @param {SvBrowserView} pane
     * @param {Object} frame - { left, width, isFirst }
     * @param {Number} boxWidth - the frame's width, or wider while it moves
     * @returns {SvDetailView_anchoredTabs}
     * @category Anchored Tabs
     */
    styleAnchoredPane (pane, frame, boxWidth) {
        pane.setLeft(frame.left + "px");
        pane.setMinAndMaxWidth(boxWidth + "px");
        pane.setBorderLeft(frame.isFirst ? null : "1px solid var(--sv-hairline)");
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
        this.setAnchoredPaneFrames(null);
        this.setAnchoredExitingPanes(null);
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
