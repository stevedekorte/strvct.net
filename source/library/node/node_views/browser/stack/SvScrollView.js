/**
 * @module library.node.node_views.browser.stack
 */

"use strict";

/**
 * @class SvScrollView
 * @extends SvDomView
 * @classdesc
 * SvScrollView is a specialized view that provides scrolling functionality.
 * It implements a sticks-to-bottom behavior and handles content mutations.
 *
 * Notes:
 * - isAtBottom is a computed property that checks if scroll is at bottom now
 * - wasAtBottom tracks if scroll was at bottom before content change
 *
 * When user scrolls or setScrollHeight:
 * - update wasAtBottom (using isAtBottom)
 * - update lastScrollHeight (may be used elsewhere later)
 *
 * When content changes:
 * - auto scroll if wasAtBottom true
 * - update lastScrollHeight to bottom (may be used elsewhere later)
 */
(class SvScrollView extends SvDomView {

    /**
     * @description Initializes the prototype slots for the SvScrollView
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} sticksToBottom - Determines if the view should stick to the bottom
         * @category Configuration
         */
        {
            const slot = this.newSlot("sticksToBottom", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} wasAtBottom - Tracks if the view was at the bottom before content change
         * @category State
         */
        {
            const slot = this.newSlot("wasAtBottom", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} lastScrollHeight - Stores the last scroll height
         * @category State
         */
        {
            const slot = this.newSlot("lastScrollHeight", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {Boolean} isAnchored - True when anchor-scroll is active.
         * While anchored, updateWasAtBottom() is suppressed so transient
         * layout changes during view syncs cannot flip wasAtBottom to true
         * and trigger an unwanted scroll-to-bottom.
         * Cleared only by explicit user action (scroll-to-bottom button or
         * scrolling to the bottom manually).
         * @category State
         */
        {
            const slot = this.newSlot("isAnchored", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {SvNode} viewportRefNode - The node of the tile that was at
         * the top of the viewport at the last scroll event. After every content
         * mutation (while not at the bottom), scrollTop is restored so this
         * tile keeps its viewport position — which makes the reading position
         * immune to layout changes elsewhere: images completing above, tile
         * re-syncs tearing DOM down and back up, and browser scrollTop clamps
         * after transient shrinks. Tracked by NODE (not tile) so a re-created
         * tile still resolves.
         * @category State
         */
        {
            const slot = this.newSlot("viewportRefNode", null);
            slot.setSlotType("SvNode");
        }

        /**
         * @member {Number} viewportRefOffset - The reference tile's offset from
         * the viewport top (tile offsetTop - scrollTop) at the last scroll event.
         * @category State
         */
        {
            const slot = this.newSlot("viewportRefOffset", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {SvScrollToBottomButton} scrollToBottomButton - Floating button shown when not at bottom
         * @category UI
         */
        {
            const slot = this.newSlot("scrollToBottomButton", null);
            slot.setSlotType("SvScrollToBottomButton");
        }
    }

    /**
     * @description Initializes the SvScrollView
     * @returns {SvScrollView} The initialized SvScrollView instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("block");
        this.setPosition("relative");
        this.setTopPx(null);
        this.setMsOverflowStyle("none");
        this.setOverflow("-moz-scrollbars-none");
        this.setBackgroundColor("transparent");
        this.setIsRegisteredForBrowserDrop(true);
        return this;
    }

    // --- drop delegation to content view ---

    /**
     * @description Delegates drop acceptance to the scroll content view.
     * This ensures drops anywhere in the scroll area (including empty
     * space below the content) are handled by the content view.
     * @param {Event} event - The drag/drop event.
     * @returns {boolean} Whether the content view accepts the drop.
     * @category Drop Handling
     */
    acceptsDrop (event) {
        const cv = this.scrollContentView();
        const result = cv && cv.acceptsDrop ? cv.acceptsDrop(event) : false;
        console.log("SvScrollView: acceptsDrop: event:", event.type, "result:", result);
        return result;
    }

    /**
     * @description Delegates the drop event to the scroll content view.
     * @param {Event} event - The drop event.
     * @returns {boolean} Whether the drop was handled.
     * @category Drop Handling
     */
    onBrowserDrop (event) {
        const cv = this.scrollContentView();
        if (cv) {
            return cv.onBrowserDrop(event);
        }
        event.preventDefault();
        return false;
    }

    /**
     * @description Returns the first subview as the scroll content view
     * @returns {SvDomView} The scroll content view
     * @category View Hierarchy
     */
    scrollContentView () {
        return this.subviews().first();
    }

    /**
     * @description Starts listening for scroll events
     * @category Event Handling
     */
    listenForScroll () {
        this.scrollListener().setIsListening(true);
    }

    /**
     * @description Returns the first subview as the content view
     * @returns {SvDomView} The content view
     * @category View Hierarchy
     */
    contentView () {
        return this.subviews().first();
    }

    /**
     * @description Sets whether the view should stick to the bottom
     * @param {Boolean} aBool - Whether to stick to the bottom
     * @category Configuration
     */
    setSticksToBottom (aBool) {
        if (this._sticksToBottom !== aBool) {
            this._sticksToBottom = aBool;
            if (aBool) {
                this.listenForScroll();
                this.updateScrollTracking();
                this.contentView().startContentMutationObserverIfNeeded();
                this.setupScrollToBottomButton();

                // TEMP diagnostic for chat scroll jumps — programmatic focus()
                // scrolls the focused element into view natively, without any
                // scroll API call our other logging could catch
                if (!this._scrollDebugFocusListener) {
                    this._scrollDebugFocusListener = (event) => {
                        const t = event.target;
                        console.log("[ScrollDebug] focusin inside scroll view: <" + t.tagName.toLowerCase() + "> class='" +
                            String(t.className).slice(0, 80) + "'\n" + new Error().stack.split("\n").slice(2, 7).join("\n"));
                    };
                    this.element().addEventListener("focusin", this._scrollDebugFocusListener);
                }
            }
        }
    }

    /**
     * @description Creates and adds the scroll-to-bottom button if not already present.
     * The button is added directly to the SvScrollView's DOM element (not as a framework subview)
     * so it doesn't interfere with the subview hierarchy. Uses position:sticky to stay
     * fixed at the bottom of the scroll viewport.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category UI
     */
    setupScrollToBottomButton () {
        if (!this.scrollToBottomButton()) {
            //console.log("[AnchorScroll] SvScrollView.setupScrollToBottomButton() creating button");
            const button = SvScrollToBottomButton.clone();
            button.setScrollView(this);
            this.setScrollToBottomButton(button);
            // Append to DOM directly rather than using addSubview,
            // to avoid interfering with contentView()/scrollContentView()
            this.element().appendChild(button.element());
        }
        return this;
    }

    /**
     * @description Handles scroll events
     * @param {Event} event - The scroll event
     * @category Event Handling
     */
    onScroll (/*event*/) {
        // TEMP diagnostic for chat scroll jumps — logs any scroll event that
        // moved more than a screenful since the last one
        {
            const e = this.element();
            const last = this._scrollDebugLastTop;
            if (last !== undefined && Math.abs(e.scrollTop - last) > e.clientHeight) {
                console.log("[ScrollDebug] " + this.svTypeId() + " JUMP " + last + " -> " + e.scrollTop +
                    " (scrollHeight " + e.scrollHeight + ", clientHeight " + e.clientHeight +
                    ", isAnchored " + this.isAnchored() +
                    ", refNode " + (this.viewportRefNode() ? this.viewportRefNode().svTypeId() : "null") +
                    ", wasAtBottom " + this.wasAtBottom() + ")");
            }
            this._scrollDebugLastTop = e.scrollTop;
        }

        // If anchored and user has scrolled to the bottom, disengage anchor mode.
        // Not during a teardown window — an emptied scroller falsely reads as
        // "at bottom" when the browser clamps scrollTop.
        if (this.isAnchored() && this.isAtBottom() && !this.isInTransientTeardown()) {
            //console.log("[AnchorScroll] onScroll: user reached bottom, disengaging anchor");
            this.setIsAnchored(false);
            this.clearAnchorPadding();
        }
        this.updateViewportRef();
        this.updateScrollTracking();
        this.updateScrollToBottomButton();
    }

    /**
     * @description Records which tile is currently at the top of the viewport
     * and its offset, as the reference for keeping the reading position stable
     * across content mutations. Called on every scroll event (user, browser
     * scroll-anchoring adjustments, clamps, and our own restores alike) — the
     * most recent scroll position is by definition the position to preserve.
     * Skipped while the current reference tile is missing from the DOM (a view
     * re-sync mid-teardown, or the clamp that shrink causes) so a transient
     * state can't overwrite a good reference before restore runs.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category State
     */
    /**
     * @description True while the reference tile is absent from the DOM but its
     * node still exists in the model — i.e. a view re-sync has torn tiles down
     * and not yet rebuilt them. In that window the scroller's geometry is
     * meaningless (an emptied scroller reads as "at bottom"), so scroll-state
     * bookkeeping must not trust it. A node deleted from the model is NOT
     * transient: the reference is cleared and normal behavior resumes.
     * @returns {Boolean} Whether a transient teardown is in progress.
     * @category State
     */
    isInTransientTeardown () {
        const refNode = this.viewportRefNode();
        const contentView = this.contentView();
        if (!refNode || !contentView || !contentView.subviewForNode) {
            return false;
        }
        const tile = contentView.subviewForNode(refNode);
        if (tile && tile.element().isConnected) {
            return false;
        }
        if (refNode.parentNode && !refNode.parentNode()) {
            // actually deleted from the model — not a teardown window
            this.setViewportRefNode(null);
            return false;
        }
        return true;
    }

    updateViewportRef () {
        const contentView = this.contentView();
        if (!contentView || !this.sticksToBottom()) {
            return this;
        }

        if (this.isInTransientTeardown()) {
            // keep the existing reference until tiles are rebuilt
            return this;
        }

        const scrollTop = this.element().scrollTop;
        const tiles = contentView.subviews();
        for (let i = 0; i < tiles.length; i++) {
            const te = tiles[i].element();
            if (te.offsetTop + te.offsetHeight > scrollTop + 1) {
                if (tiles[i].node) {
                    this.setViewportRefNode(tiles[i].node());
                    this.setViewportRefOffset(te.offsetTop - scrollTop);
                }
                break;
            }
        }
        return this;
    }

    /**
     * @description Restores the scroll position so the reference tile (the one
     * at the top of the viewport at the last scroll event) keeps its viewport
     * offset. Called after content mutations while not at the bottom. This is
     * what keeps the reading position stable when layout changes elsewhere —
     * an image finishing above, tiles being torn down and re-created by a view
     * sync, or the browser clamping scrollTop after a transient shrink. When
     * the browser's native scroll anchoring already compensated correctly this
     * computes the same value and is a no-op.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    restoreViewportPosition () {
        const refNode = this.viewportRefNode();
        const contentView = this.contentView();
        if (!refNode || !contentView || !contentView.subviewForNode) {
            return this;
        }

        const tile = contentView.subviewForNode(refNode);
        if (!tile || !tile.element().isConnected) {
            // The reference tile is gone right now (teardown in progress, or
            // the message was deleted). Keep the reference — if the tile is
            // re-created, the next mutation restores against it.
            return this;
        }

        const e = this.element();
        const targetTop = tile.element().offsetTop - this.viewportRefOffset();
        const clampedTarget = Math.max(0, Math.min(targetTop, e.scrollHeight - e.clientHeight));
        if (Math.abs(e.scrollTop - clampedTarget) > 1) {
            // TEMP diagnostic for chat scroll jumps
            console.log("[ScrollDebug] " + this.svTypeId() + ".restoreViewportPosition() " + e.scrollTop + " -> " + clampedTarget +
                " (ref " + refNode.svTypeId() + " offset " + this.viewportRefOffset() + ")");
            e.scrollTop = clampedTarget;
        }
        return this;
    }

    /**
     * @description Handles content view mutations
     * @param {MutationRecord[]} mutations - The mutations that occurred
     * @category Event Handling
     */
    onContentViewMutations (/*mutations*/) {
        if (this.sticksToBottom()) {
            if (this.wasAtBottom()) {
                this.immediatelyScrollToBottom();
                this.setWasAtBottom(true);
                this.setLastScrollHeight(this.clientHeight());
            } else {
                // Reading somewhere above the bottom — keep the viewport
                // stable relative to the content the user is looking at.
                this.restoreViewportPosition();
            }
            this.updateScrollToBottomButton();
        }
    }

    /**
     * @description Checks if the view is currently at the bottom
     * @returns {Boolean} Whether the view is at the bottom
     * @category State
     */
    isAtBottom () {
        const e = this.element();
        const tolerance = this.computeScrollTolerance();
        const difference = e.scrollHeight - (e.scrollTop + e.clientHeight);
        return difference <= tolerance;
    }

    /**
     * @description Computes the scroll tolerance
     * @returns {Number} The computed scroll tolerance
     * @category Calculation
     */
    computeScrollTolerance () {
        return 10;
    }

    /**
     * @description Sets the scroll height and updates scroll tracking
     * @param {Number} v - The new scroll height
     * @returns {SvScrollView} The SvScrollView instance
     * @category State
     */
    setScrollHeight (v) {
        super.setScrollHeight(v);
        this.updateScrollTracking();
        return this;
    }

    /**
     * @description Updates scroll tracking
     * @returns {SvScrollView} The SvScrollView instance
     * @category State
     */
    updateScrollTracking () {
        this.updateLastScrollHeight();
        this.updateWasAtBottom();
        return this;
    }

    /**
     * @description Updates the last scroll height
     * @returns {SvScrollView} The SvScrollView instance
     * @category State
     */
    updateLastScrollHeight () {
        this.setLastScrollHeight(this.scrollHeight());
        return this;
    }

    /**
     * @description Updates whether the view was at the bottom
     * @returns {SvScrollView} The SvScrollView instance
     * @category State
     */
    updateWasAtBottom () {
        if (this.isAnchored()) {
            // While anchored, never flip wasAtBottom to true.
            // This prevents transient layout changes during view syncs
            // from re-engaging auto-scroll.
            return this;
        }
        if (this.isInTransientTeardown()) {
            // Tiles are torn down mid-sync: the emptied scroller reads as
            // "at bottom", which would make the rebuild stick-to-bottom
            // instead of restoring the reading position.
            return this;
        }
        if (this.wasAtBottom() !== this.isAtBottom()) {
            this.setWasAtBottom(this.isAtBottom());
        }
        return this;
    }

    // --- scroll-to-bottom button ---

    /**
     * @description Updates the visibility of the scroll-to-bottom button.
     * Shows when not at bottom and content overflows; hides when at bottom.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category UI
     */
    updateScrollToBottomButton () {
        const button = this.scrollToBottomButton();
        if (button) {
            const e = this.element();
            // Account for anchor padding — the real content height is
            // scrollHeight minus any padding we added for anchoring
            const contentView = this.contentView();
            const anchorPadding = contentView ? parseFloat(contentView.paddingBottom()) || 0 : 0;
            const realContentHeight = e.scrollHeight - anchorPadding;
            const realContentOverflows = realContentHeight > e.clientHeight;
            // Also check that the scroll position isn't just sitting in the padding area
            const scrollBottom = e.scrollTop + e.clientHeight;
            const pastRealContent = scrollBottom <= realContentHeight;

            if (!this.isAtBottom() && realContentOverflows && pastRealContent) {
                button.showButton();
            } else {
                button.hideButton();
            }
        }
        return this;
    }

    /**
     * @description Smooth-scrolls to the bottom of the scroll view.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    scrollToBottomSmooth () {
        // Disengage anchor mode — user is explicitly requesting scroll to bottom
        if (this.isAnchored()) {
            //console.log("[AnchorScroll] scrollToBottomSmooth: disengaging anchor");
            this.setIsAnchored(false);
            this.clearAnchorPadding();
        }
        this.element().scrollTo({
            top: this.element().scrollHeight,
            behavior: "smooth"
        });
        return this;
    }

    // --- anchor scroll ---

    /**
     * @description Scrolls so that the given subview is at the top of the viewport.
     * Disengages auto-scroll by updating scroll tracking (wasAtBottom becomes false).
     * @param {SvDomView} aSubview - The subview to anchor at the top.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    anchorOnSubview (aSubview) {
        //console.log("[AnchorScroll] SvScrollView.anchorOnSubview() subview:", aSubview ? aSubview.svType() : "null");
        const contentView = this.contentView();

        if (aSubview) {
            // Add bottom padding so we can scroll the target to the top of the viewport
            // even when it's near the end of the content. The padding gives the browser
            // room to scroll past the natural end of the content.
            const viewportHeight = this.element().clientHeight;
            if (contentView) {
                contentView.setPaddingBottom(viewportHeight + "px");
            }

            this.element().scrollTop = aSubview.element().offsetTop;
            // TEMP diagnostic for chat scroll jumps
            console.log("[ScrollDebug] " + this.svTypeId() + ".anchorOnSubview(" + aSubview.svTypeId() + ")" +
                " offsetTop " + aSubview.element().offsetTop +
                " -> scrollTop " + this.element().scrollTop +
                " (scrollHeight " + this.element().scrollHeight + ", clientHeight " + viewportHeight +
                ", offsetParent " + (aSubview.element().offsetParent === this.element() ? "scrollView" : (aSubview.element().offsetParent ? aSubview.element().offsetParent.className : "null")) + ")");
            // Seed the viewport reference to the anchored tile so mutations
            // keep it pinned even before the next scroll event.
            if (aSubview.node) {
                this.setViewportRefNode(aSubview.node());
                this.setViewportRefOffset(0);
            }
        } else {
            // No anchor target — scroll to top
            this.element().scrollTop = 0;
            this.setViewportRefNode(null);
        }
        // Engage anchor mode — suppresses wasAtBottom from being flipped
        // to true by transient layout changes during view syncs.
        this.setIsAnchored(true);
        this.setWasAtBottom(false);
        this.updateLastScrollHeight();
        //console.log("[AnchorScroll]   after anchor: isAnchored:", this.isAnchored(), "isAtBottom:", this.isAtBottom(), "wasAtBottom:", this.wasAtBottom());
        this.updateScrollToBottomButton();
        return this;
    }

    /**
     * @description Removes the anchor padding from the content view.
     * Called when the user scrolls to the bottom (re-engages auto-scroll)
     * so the extra padding doesn't leave empty space.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    clearAnchorPadding () {
        const contentView = this.contentView();
        if (contentView) {
            contentView.setPaddingBottom("0px");
        }
        return this;
    }

}.initThisClass());
