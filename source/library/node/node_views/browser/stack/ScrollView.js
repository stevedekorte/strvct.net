"use strict";

/*

    ScrollView

*/

(class ScrollView extends DomView { 
    
    initPrototypeSlots () {

        /* 
        Slots for implementing sticks-to-bottom behavior

        Notes:
        
        - isAtBottom is a computed property that checks if scroll is at bottom now
        - wasAtBottom tracks if scroll was at bottom before content change

        When user scrolls or setScrollHeight:
        - update wasAtBottom (using isAtBottom)
        - update lastScrollHeight (may be used elsewhere later)

        When content changes:
        - auto scroll if wasAtBottom true
        - update lastScrollHeight to bottom (may be used elsewhere later)
        */

        {
            const slot = this.newSlot("sticksToBottom", false); // turn on/off behavior
        }

        {
            const slot = this.newSlot("wasAtBottom", false); // on user onScroll events, marked to true if at bottom
        }

        {
            const slot = this.newSlot("lastScrollHeight", 0);
        }

    }

    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setTopPx(null)
        //this.makeVertical()
        this.setMsOverflowStyle("none") // removes scrollbars on IE 10+ 
        this.setOverflow("-moz-scrollbars-none") // removes scrollbars on Firefox 
        this.setBackgroundColor("transparent")
        //this.setBorder("1px solid purple")
        return this
    }

    scrollContentView () {
        return this.subviews().first()
    }


    // --- scroll events ---

    listenForScroll () {
        this.scrollListener().setIsListening(true) // start listing for scroll events
        /*
        this.element().addEventListener('scroll', (event) => { 
            this.onScroll(event) 
        });
        */
    }

    contentView () {
        return this.subviews().first();
    }   

    // --- sticks to bottom ---

    setSticksToBottom (aBool) {
        if (this._sticksToBottom !== aBool) {
            this._sticksToBottom = aBool;
            if (aBool) {
                this.listenForScroll();
                this.updateScrollTracking();
                this.contentView().startContentMutationObserverIfNeeded(); // only starts if it's not already started
            } else {
                //this.scrollListener().setIsListening(false); // can't do this as something else might need it...
                //this.stopContentMutationObserver(); // not safe as we don't know if this is needed elsewhere
            }
        }
    }


    onScroll (event) {
        //debugger;
        /*
        const cv = this.contentView();
        if (cv && cv.onScrollViewScroll) {
            cv.onScrollViewScroll(this)
        }
        */
        this.updateScrollTracking()
    }

    onContentViewMutations (mutations) {
        // sent from contentView when it mutates
        if (this.sticksToBottom()) {
            if (this.wasAtBottom()) {
                this.immediatelyScrollToBottom();
                //this.contentView().scrollToBottom();
                this.setWasAtBottom(true); // since we will be scrolling to bottom, we can set this to true now, so even if it's in progress on next mutation, it will be true
                this.setLastScrollHeight(this.clientHeight());
            }
        }
    }

    // --- is at bottom calc ---

    isAtBottom () {
        const e = this.element();
        // Check if the content is at the bottom before adding new content
        const tolerance = this.computeScrollTolerance(); // Tolerance value to account for subpixel values and rounding errors, cache this?
        const difference = e.scrollHeight - (e.scrollTop + e.clientHeight);
        //this.setWasAtBottom(difference <= tolerance)
        return difference <= tolerance;
    }

    computeScrollTolerance () {
        return 10; // was 5
        /*
        const e = this.element();
        const style = window.getComputedStyle(e);
    
        // Get border widths
        const borderTop = parseFloat(style.borderTopWidth);
        const borderBottom = parseFloat(style.borderBottomWidth);
    
        // Get paddings
        const paddingTop = parseFloat(style.paddingTop);
        const paddingBottom = parseFloat(style.paddingBottom);
    
        // Potential subpixel discrepancies
        const subpixelTolerance = 1 / (window.devicePixelRatio || 1);
    
        // Total tolerance is the sum of all the factors
        return borderTop + borderBottom + paddingTop + paddingBottom + subpixelTolerance;
        */
    }

    setScrollHeight (v) {
        super.setScrollHeight(v)
        this.updateScrollTracking()
        return this
    }

    // -- updates ---

    updateScrollTracking () {
        this.updateLastScrollHeight()
        this.updateWasAtBottom()
        return this
    }

    updateLastScrollHeight () {
        this.setLastScrollHeight(this.scrollHeight())
        return this
    }

    updateWasAtBottom () {
        if (this.wasAtBottom() !== this.isAtBottom()) {
            this.setWasAtBottom(this.isAtBottom())
        }
        return this
    }

}.initThisClass());


