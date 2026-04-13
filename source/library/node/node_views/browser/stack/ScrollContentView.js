/**
 * @module library.node.node_views.browser.stack
 */

"use strict";

/**
 * @class ScrollContentView
 * @extends NodeView
 * @classdesc Represents a scrollable content view within a scroll view.
 */
(class ScrollContentView extends NodeView {

    /**
     * Initialize prototype slots for the ScrollContentView.
     * @description Sets up the contentMutationObserver slot for the ScrollView sticksToBottom feature.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {MutationObserver} contentMutationObserver - Observer for content mutations, triggers onContentMutations() event.
         * @category DOM
         */
        {
            const slot = this.newSlot("contentMutationObserver", null);
            slot.setSlotType("MutationObserver");
        }

        /**
         * @member {SvObservation} anchorScrollObservation - Observation for requestAnchorScroll notifications.
         * @category Notification
         */
        {
            const slot = this.newSlot("anchorScrollObservation", null);
            slot.setSlotType("SvObservation");
        }
    }

    /**
     * Prepare the view for retirement.
     * @description Stops the content mutation observer and calls the superclass method.
     * @returns {ScrollContentView} The current instance.
     * @category Lifecycle
     */
    prepareToRetire () {
        super.prepareToRetire();
        this.stopContentMutationObserver();
        const obs = this.anchorScrollObservation();
        if (obs) {
            obs.stopWatching();
            this.setAnchorScrollObservation(null);
        }
        return this;
    }

    /**
     * Get the parent scroll view.
     * @returns {NodeView} The parent scroll view.
     * @category Hierarchy
     */
    scrollView () {
        return this.parentView();
    }

    /**
     * Synchronize the view with its node.
     * @description Updates the sticksToBottom property of the scroll view if the node has it.
     * @returns {ScrollContentView} The current instance.
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode();
        const node = this.node();
        if (node && node.subviewsScrollSticksToBottom) {
            this.scrollView().setSticksToBottom(node.subviewsScrollSticksToBottom());
        }
        return this;
    }

    /**
     * Set the node for this view.
     * @param {Object} aNode - The node to set.
     * @returns {ScrollContentView} The current instance.
     * @category Node Management
     */
    setNode (aNode) {
        const didChange = this.node() !== aNode;
        super.setNode(aNode);

        if (didChange) {
            // Stop watching old node
            const oldObs = this.anchorScrollObservation();
            if (oldObs) {
                oldObs.stopWatching();
                this.setAnchorScrollObservation(null);
            }

            if (aNode) {
                if (aNode.subviewsScrollSticksToBottom && aNode.subviewsScrollSticksToBottom()) {
                    this.setJustifyContent("flex-end");
                    this.addWeakTimeout(() => { this.scrollToBottom(); }, 0);
                }

                // Watch for anchor scroll requests from this node
                const obs = this.watchForNoteFrom("requestAnchorScroll", aNode);
                this.setAnchorScrollObservation(obs);
                //console.log("[AnchorScroll] ScrollContentView.setNode() watching requestAnchorScroll from:", aNode.svType());
            }
        }
        return this;
    }

    /**
     * Handles the requestAnchorScroll notification.
     * Scrolls the target message's tile to the top of the viewport.
     * @param {BMNotification} aNote - The notification with the target message as info.
     * @returns {ScrollContentView} The current instance.
     * @category Scrolling
     */
    requestAnchorScroll (aNote) {
        const targetNode = aNote.info();
        const scrollView = this.scrollView();

        //console.log("[AnchorScroll] requestAnchorScroll received, targetNode:", targetNode ? targetNode.svType() : "null");

        if (!scrollView) {
            return this;
        }

        if (!targetNode) {
            scrollView.anchorOnSubview(null);
            return this;
        }

        // Defer to allow view sync to complete — the tile may not exist yet
        // since notifications fire before the view hierarchy updates
        this.addWeakTimeout(() => {
            this.syncFromNodeNow(); // force sync so tile exists
            const subview = this.subviewForNode(targetNode);
            //console.log("[AnchorScroll]   after sync, subviewForNode:", subview ? subview.svType() : "null",
            //    "subviews:", this.subviews().length, "subnodeMap entries:", this._subnodeToSubview ? Object.keys(this._subnodeToSubview).length : 0);
            if (subview) {
                scrollView.anchorOnSubview(subview);
            }
        }, 0);

        return this;
    }

    /**
     * Handle scroll events from the scroll view.
     * @param {Event} event - The scroll event.
     * @category Event Handling
     */
    onScrollViewScroll (event) {

    }

    /**
     * Start the content mutation observer if it hasn't been started yet.
     * @returns {ScrollContentView} The current instance.
     * @category DOM
     */
    startContentMutationObserverIfNeeded () {
        if (!this.contentMutationObserver()) {
            const observer = new MutationObserver((mutations) => {
                this.onContentMutations(mutations);
            });

            this.setContentMutationObserver(observer);

            const observerOptions = {
                childList: true,
                subtree: true
            };

            observer.observe(this.element(), observerOptions);
        }
        return this;
    }

    /**
     * Stop the content mutation observer.
     * @returns {ScrollContentView} The current instance.
     * @category DOM
     */
    stopContentMutationObserver () {
        const obs = this.contentMutationObserver();
        if (obs) {
            obs.disconnect();
            this.setContentMutationObserver(null);
        }
        return this;
    }

    /**
     * Handle content mutations.
     * @param {MutationRecord[]} mutations - The array of mutation records.
     * @returns {ScrollContentView} The current instance.
     * @category Event Handling
     */
    onContentMutations (mutations) {
        const scrollView = this.scrollView();
        if (scrollView) {
            scrollView.onContentViewMutations(mutations);
        }
        return this;
    }

}.initThisClass());
