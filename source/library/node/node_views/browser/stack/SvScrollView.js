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
         * @member {SvDomView} anchoredSubview - The subview the anchor is pinned to.
         * While set, content mutations re-pin scrollTop to this subview's current
         * offsetTop so layout changes (image loads, tile re-syncs, scrollTop
         * clamping after transient DOM shrink) can't drift the viewport away
         * from the anchored message. Cleared when the user scrolls manually
         * or the anchor disengages.
         * @category State
         */
        {
            const slot = this.newSlot("anchoredSubview", null);
            slot.setSlotType("SvDomView");
        }

        /**
         * @member {Number} expectedScrollTop - The scrollTop we last set
         * programmatically while anchored. If a scroll event arrives with a
         * different value, the user moved the viewport and re-pinning stops.
         * @category State
         */
        {
            const slot = this.newSlot("expectedScrollTop", null);
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
        // If anchored and user has scrolled to the bottom, disengage anchor mode
        if (this.isAnchored() && this.isAtBottom()) {
            //console.log("[AnchorScroll] onScroll: user reached bottom, disengaging anchor");
            this.setIsAnchored(false);
            this.stopRepinning();
            this.clearAnchorPadding();
        } else if (this.isRepinning()) {
            // A scroll position we didn't set means the user moved the
            // viewport — stop re-pinning so mutations can't yank them back.
            // (Anchor mode itself stays engaged: auto-scroll remains
            // suppressed until they reach the bottom.)
            const delta = Math.abs(this.element().scrollTop - this.expectedScrollTop());
            if (delta > this.computeScrollTolerance()) {
                //console.log("[AnchorScroll] onScroll: user scroll detected (delta " + delta + "), stop re-pinning");
                this.stopRepinning();
            }
        }
        this.updateScrollTracking();
        this.updateScrollToBottomButton();
    }

    /**
     * @description Whether the anchor is actively re-pinning to a subview.
     * @returns {Boolean} True when anchored with a live re-pin target.
     * @category State
     */
    isRepinning () {
        return this.isAnchored() && this.anchoredSubview() !== null && this.expectedScrollTop() !== null;
    }

    /**
     * @description Stops re-pinning the anchored subview. Anchor mode
     * (auto-scroll suppression) is unaffected.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category State
     */
    stopRepinning () {
        this.setAnchoredSubview(null);
        this.setExpectedScrollTop(null);
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
            } else if (this.isRepinning()) {
                this.repinAnchor();
            }
            this.updateScrollToBottomButton();
        }
    }

    /**
     * @description Re-pins the scroll position to the anchored subview's
     * current offsetTop. Content mutations (streaming tokens, image loads,
     * tile re-syncs) move the anchored message's layout position while
     * scrollTop stays a fixed pixel value — and a transient DOM shrink can
     * clamp scrollTop far away. Only re-pins while the scroll position is
     * still where we last put it (i.e. the user hasn't scrolled).
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    repinAnchor () {
        const e = this.element();
        // Only correct if the position is still ours. A user scroll between
        // events shows up here as a mismatch — leave their position alone
        // (onScroll will stop re-pinning shortly anyway). Exception: a
        // browser clamp after a transient DOM shrink lands exactly at the
        // scroll limit, below where we pinned — that's not the user, so
        // correct it. (This mutation callback runs as a microtask, before
        // the clamp's scroll event task, so onScroll won't misread the
        // clamped position as the user reaching the bottom.)
        const tolerance = this.computeScrollTolerance();
        const positionIsOurs = Math.abs(e.scrollTop - this.expectedScrollTop()) <= tolerance;
        const wasClamped = e.scrollTop < this.expectedScrollTop() &&
            e.scrollTop >= e.scrollHeight - e.clientHeight - tolerance;
        if (!positionIsOurs && !wasClamped) {
            return this;
        }

        let subview = this.anchoredSubview();
        if (!subview.element().isConnected) {
            // The tile was torn down and re-created by a view sync — re-resolve
            // the new tile for the same node, or give up if it's gone.
            const node = subview.node ? subview.node() : null;
            const contentView = this.contentView();
            subview = (node && contentView && contentView.subviewForNode) ? contentView.subviewForNode(node) : null;
            if (!subview) {
                //console.log("[AnchorScroll] repinAnchor: anchored subview gone, stop re-pinning");
                this.stopRepinning();
                return this;
            }
            this.setAnchoredSubview(subview);
        }

        const targetTop = subview.element().offsetTop;
        if (e.scrollTop !== targetTop) {
            //console.log("[AnchorScroll] repinAnchor: correcting scrollTop", e.scrollTop, "->", targetTop);
            e.scrollTop = targetTop;
        }
        this.setExpectedScrollTop(e.scrollTop); // read back — may be clamped
        return this;
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
            this.stopRepinning();
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
            //console.log("[AnchorScroll]   set scrollTop to:", aSubview.element().offsetTop,
            //    "scrollHeight:", this.element().scrollHeight, "clientHeight:", viewportHeight);
            this.setAnchoredSubview(aSubview);
            this.setExpectedScrollTop(this.element().scrollTop); // read back — may be clamped
        } else {
            // No anchor target — scroll to top
            this.element().scrollTop = 0;
            this.stopRepinning();
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
