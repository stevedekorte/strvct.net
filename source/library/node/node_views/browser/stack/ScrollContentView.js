"use strict";

/*
    
    ScrollContentView
    
*/

(class ScrollContentView extends NodeView {

    initPrototypeSlots () {


        // needed for ScrollView sticksToBottom feature
        {
            const slot = this.newSlot("contentMutationObserver", null); // setup onContentMutations() event, within which we scroll to bottom if needed
        }

    }

    init () {
        super.init();
    }

    // -----


    prepareToRetire () {
        super.prepareToRetire();
        this.stopContentMutationObserver();
        return this;
    }

    scrollView () {
        return this.parentView()
    }

    /*
    onRequestScrollToBottom (aNote) {
        this.addTimeout(() => { 
            this.parentView().immediatelyScrollToBottom()
        }, 1);
        this.setWasAtBottom(true)
        this.setLastScrollHeight(this.clientHeight())
    }
    */

    // --- scroll events ---

    syncFromNode () {
        super.syncFromNode()
        const node = this.node()
        if (node && node.subviewsScrollSticksToBottom) {
            this.scrollView().setSticksToBottom(node.subviewsScrollSticksToBottom())
        }
        return this
    }

    setNode (aNode) {
        const didChange = this.node() !== aNode;
        super.setNode(aNode);
        //debugger;

        if (didChange && aNode && aNode.subviewsScrollSticksToBottom && aNode.subviewsScrollSticksToBottom()) {
            //this.setHeight(null)
            this.setJustifyContent("flex-end")
            //this.setHeight("fit-content")
            ///this.setMinHeight(null)
            ///this.setMaxHeight(null)
            ///this.setMarginTop("auto")
            this.addTimeout(() => { this.scrollToBottom() }, 0);
            
        }
        return this
    }

    onScrollViewScroll (event) {

    }

    // --- code to do auto stick-to-bottom type behavior ---


    // --- content mutation observer ---

    /*
    didUpdateSlotElement (oldValue, newValue) {
        super.didUpdateSlotElement(newValue)
        if (newValue) {
            this.startContentMutationObserverIfNeeded();
        } else {
            this.stopContentMutationObserver();
        }
    }
    */

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
        const obs = this.contentMutationObserver();
        if (obs) {
            obs.disconnect();
            this.setContentMutationObserver(null);
        }
        return this;
    }

    onContentMutations (mutations) {
        const scrollView = this.scrollView();
        if (scrollView) {
            scrollView.onContentViewMutations(mutations);
        }
        return this;
    }

}.initThisClass());
