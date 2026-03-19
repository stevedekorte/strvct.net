/**
 * @module library.node.node_views.browser.stack
 */

"use strict";

/**
 * @class ScrollView
 * @extends DomView
 * @classdesc
 * ScrollView is a specialized view that provides scrolling functionality.
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
(class ScrollView extends DomView {

    /**
     * @description Initializes the prototype slots for the ScrollView
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
         * @member {SvScrollToBottomButton} scrollToBottomButton - Floating button shown when not at bottom
         * @category UI
         */
        {
            const slot = this.newSlot("scrollToBottomButton", null);
            slot.setSlotType("SvScrollToBottomButton");
        }
    }

    /**
     * @description Initializes the ScrollView
     * @returns {ScrollView} The initialized ScrollView instance
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
        return this;
    }

    /**
     * @description Returns the first subview as the scroll content view
     * @returns {DomView} The scroll content view
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
     * @returns {DomView} The content view
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
     * The button is added directly to the ScrollView's DOM element (not as a framework subview)
     * so it doesn't interfere with the subview hierarchy. Uses position:sticky to stay
     * fixed at the bottom of the scroll viewport.
     * @returns {ScrollView} The ScrollView instance.
     * @category UI
     */
    setupScrollToBottomButton () {
        if (!this.scrollToBottomButton()) {
            console.log("[AnchorScroll] ScrollView.setupScrollToBottomButton() creating button");
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
    onScroll (event) {
        this.updateScrollTracking();
        this.updateScrollToBottomButton();
        // Clear anchor padding once user re-engages auto-scroll
        if (this.wasAtBottom()) {
            this.clearAnchorPadding();
        }
    }

    /**
     * @description Handles content view mutations
     * @param {MutationRecord[]} mutations - The mutations that occurred
     * @category Event Handling
     */
    onContentViewMutations (mutations) {
        if (this.sticksToBottom()) {
            if (this.wasAtBottom()) {
                this.immediatelyScrollToBottom();
                this.setWasAtBottom(true);
                this.setLastScrollHeight(this.clientHeight());
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
     * @returns {ScrollView} The ScrollView instance
     * @category State
     */
    setScrollHeight (v) {
        super.setScrollHeight(v);
        this.updateScrollTracking();
        return this;
    }

    /**
     * @description Updates scroll tracking
     * @returns {ScrollView} The ScrollView instance
     * @category State
     */
    updateScrollTracking () {
        this.updateLastScrollHeight();
        this.updateWasAtBottom();
        return this;
    }

    /**
     * @description Updates the last scroll height
     * @returns {ScrollView} The ScrollView instance
     * @category State
     */
    updateLastScrollHeight () {
        this.setLastScrollHeight(this.scrollHeight());
        return this;
    }

    /**
     * @description Updates whether the view was at the bottom
     * @returns {ScrollView} The ScrollView instance
     * @category State
     */
    updateWasAtBottom () {
        if (this.wasAtBottom() !== this.isAtBottom()) {
            this.setWasAtBottom(this.isAtBottom());
        }
        return this;
    }

    // --- scroll-to-bottom button ---

    /**
     * @description Updates the visibility of the scroll-to-bottom button.
     * Shows when not at bottom and content overflows; hides when at bottom.
     * @returns {ScrollView} The ScrollView instance.
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
     * @returns {ScrollView} The ScrollView instance.
     * @category Scrolling
     */
    scrollToBottomSmooth () {
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
     * @param {DomView} aSubview - The subview to anchor at the top.
     * @returns {ScrollView} The ScrollView instance.
     * @category Scrolling
     */
    anchorOnSubview (aSubview) {
        console.log("[AnchorScroll] ScrollView.anchorOnSubview() subview:", aSubview ? aSubview.svType() : "null");
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
            console.log("[AnchorScroll]   set scrollTop to:", aSubview.element().offsetTop,
                "scrollHeight:", this.element().scrollHeight, "clientHeight:", viewportHeight);
        } else {
            // No anchor target — scroll to top
            this.element().scrollTop = 0;
        }
        // Force wasAtBottom to false to disengage auto-scroll.
        // Even though the scroll position may technically be "at bottom" right now
        // (because the response is empty/short), we don't want auto-scroll to
        // chase the response as it streams in.
        this.setWasAtBottom(false);
        this.updateLastScrollHeight();
        console.log("[AnchorScroll]   after anchor: isAtBottom:", this.isAtBottom(), "wasAtBottom:", this.wasAtBottom());
        this.updateScrollToBottomButton();
        return this;
    }

    /**
     * @description Removes the anchor padding from the content view.
     * Called when the user scrolls to the bottom (re-engages auto-scroll)
     * so the extra padding doesn't leave empty space.
     * @returns {ScrollView} The ScrollView instance.
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
