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
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} sticksToBottom - Determines if the view should stick to the bottom
         */
        {
            const slot = this.newSlot("sticksToBottom", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} wasAtBottom - Tracks if the view was at the bottom before content change
         */
        {
            const slot = this.newSlot("wasAtBottom", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} lastScrollHeight - Stores the last scroll height
         */
        {
            const slot = this.newSlot("lastScrollHeight", 0);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the ScrollView
     * @returns {ScrollView} The initialized ScrollView instance
     */
    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setTopPx(null)
        this.setMsOverflowStyle("none")
        this.setOverflow("-moz-scrollbars-none")
        this.setBackgroundColor("transparent")
        return this
    }

    /**
     * @description Returns the first subview as the scroll content view
     * @returns {DomView} The scroll content view
     */
    scrollContentView () {
        return this.subviews().first()
    }

    /**
     * @description Starts listening for scroll events
     */
    listenForScroll () {
        this.scrollListener().setIsListening(true)
    }

    /**
     * @description Returns the first subview as the content view
     * @returns {DomView} The content view
     */
    contentView () {
        return this.subviews().first();
    }   

    /**
     * @description Sets whether the view should stick to the bottom
     * @param {Boolean} aBool - Whether to stick to the bottom
     */
    setSticksToBottom (aBool) {
        if (this._sticksToBottom !== aBool) {
            this._sticksToBottom = aBool;
            if (aBool) {
                this.listenForScroll();
                this.updateScrollTracking();
                this.contentView().startContentMutationObserverIfNeeded();
            }
        }
    }

    /**
     * @description Handles scroll events
     * @param {Event} event - The scroll event
     */
    onScroll (event) {
        this.updateScrollTracking()
    }

    /**
     * @description Handles content view mutations
     * @param {MutationRecord[]} mutations - The mutations that occurred
     */
    onContentViewMutations (mutations) {
        if (this.sticksToBottom()) {
            if (this.wasAtBottom()) {
                this.immediatelyScrollToBottom();
                this.setWasAtBottom(true);
                this.setLastScrollHeight(this.clientHeight());
            }
        }
    }

    /**
     * @description Checks if the view is currently at the bottom
     * @returns {Boolean} Whether the view is at the bottom
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
     */
    computeScrollTolerance () {
        return 10;
    }

    /**
     * @description Sets the scroll height and updates scroll tracking
     * @param {Number} v - The new scroll height
     * @returns {ScrollView} The ScrollView instance
     */
    setScrollHeight (v) {
        super.setScrollHeight(v)
        this.updateScrollTracking()
        return this
    }

    /**
     * @description Updates scroll tracking
     * @returns {ScrollView} The ScrollView instance
     */
    updateScrollTracking () {
        this.updateLastScrollHeight()
        this.updateWasAtBottom()
        return this
    }

    /**
     * @description Updates the last scroll height
     * @returns {ScrollView} The ScrollView instance
     */
    updateLastScrollHeight () {
        this.setLastScrollHeight(this.scrollHeight())
        return this
    }

    /**
     * @description Updates whether the view was at the bottom
     * @returns {ScrollView} The ScrollView instance
     */
    updateWasAtBottom () {
        if (this.wasAtBottom() !== this.isAtBottom()) {
            this.setWasAtBottom(this.isAtBottom())
        }
        return this
    }

}.initThisClass());