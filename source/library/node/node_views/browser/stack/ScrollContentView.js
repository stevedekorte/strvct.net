"use strict";

/*
    
    ScrollContentView
    
*/

(class ScrollContentView extends NodeView {

    initPrototypeSlots () {

        /* 
            Slots for implementing sticks-to-bottom behavior

            Notes:
            
            When user scrolls or setScrollHeight:
            - update wasAtBottom
            - update lastScrollHeight (may be used elsewhere later)

            When content changes:
            - auto scroll if wasAtBottom true
            - update lastScrollHeight to bottom (may be used elsewhere later)
        */

        {
            const slot = this.newSlot("sticksToBottom", false); // turn on/off behavior
        }

        {
            const slot = this.newSlot("contentMutationObserver", null); // setup onContentMutations() event, within which we scroll to bottom if needed
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
    }

    // -----

    syncFromNode () {
        super.syncFromNode()
        const node = this.node()
        if (node && node.subviewsScrollSticksToBottom) {
                this.setSticksToBottom(node.subviewsScrollSticksToBottom())
        }
        return this
    }

    setSticksToBottom (aBool) {
        if (this._sticksToBottom !== aBool) {
            this._sticksToBottom = aBool;
            if (aBool) {
                //debugger
                this.scrollListener().setIsListening(true)
                this.updateScrollTracking()
                this.startContentMutationObserverIfNeeded() // only starts if it's not already started
            } else {
                this.scrollListener().setIsListening(true) // can't do this as something else might need it...
                this.stopContentMutationObserver() // not safe as we don't know if this is needed elsewhere
            }
        }
    }

    scrollView () {
        return this.parentView()
    }

    onRequestScrollToBottom (aNote) {
        /*
        console.log(this.typeId() + " onRequestScrollToBottom")
        this.addTimeout(() => { 
            //this.scrollView().domScrollToBottom() 
            this.parentView().domScrollToBottom()
        }, 1);
        this.setWasAtBottom(true)
        this.setLastScrollHeight(this.clientHeight())
        */
    }

    // --- scroll events ---

    listenForScroll () {
        this.scrollListener().setIsListening(true) // start listing for scroll events
    }

    onScroll (event) {
        this.updateScrollTracking()
        //this.scrollView().onContentViewScroll(this)
    }

    // --- code to do auto stick-to-bottom type behavior ---


    // --- content mutation observer ---

    didUpdateSlotElement (e) {
        super.didUpdateSlotElement(e)
        if (e) {
            this.startContentMutationObserver()
        } else {
            this.stopContentMutationObserver()
        }
    }

    startContentMutationObserverIfNeeded () {
        if (!this.contentMutationObserver()) {
            const observer = new MutationObserver((mutations) => {
                this.onContentMutations(mutations) // do we need to wrap this event?
            });

            this.setContentMutationObserver(observer);

            const observerOptions = {
                childList: true,
                subtree: true
            };

            observer.observe(this.element(), observerOptions);
        }
        return this
    }

    stopContentMutationObserver () {
        const mo = this.contentMutationObserver();
        if (mo) {
            mo.disconnect();
            this.setContentMutationObserver(null);
        }
        return this;
    }

    onContentMutations (mutations) {
        if (this.sticksToBottom()) {
            if (this.wasAtBottom()) {
                console.log("ScrollContentView scrollToBottom")
                //this.domScrollToBottom()
                this.parentView().domScrollToBottom()
                this.setWasAtBottom(true)
                this.setLastScrollHeight(this.clientHeight())
                
                //this.onRequestScrollToBottom(null)
                //this.setWasAtBottom(true) // in case scroll is animated?
            }
            //this.updateScrollTracking()
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
        this.setWasAtBottom(this.isAtBottom())
        return this
    }

}.initThisClass());
