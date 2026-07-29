/**
 * @module library.node.node_views.browser.stack
 */

"use strict";

/**
 * @class SvScrollView
 * @extends SvDomView
 * @classdesc
 * SvScrollView is a specialized view that provides scrolling with a
 * stick-to-bottom behavior for chat-like content.
 *
 * Design: scroll behavior is driven by INTENT, not by measured position.
 *
 * scrollIntent is one of:
 * - "bottom":   keep the viewport pinned to the bottom of the content
 * - "preserve": keep the tile the user is reading at a fixed viewport offset
 *
 * Intent changes ONLY on:
 * - user-initiated scrolling (wheel / touch / mouse / key input followed by
 *   scroll events): scrolling away from the bottom selects "preserve",
 *   reaching the bottom selects "bottom"
 * - explicit API calls: pinToBottom(), scrollToBottomSmooth(),
 *   anchorOnSubview() (question anchoring), resetForNewContent()
 *
 * Geometry changes (streaming text growth, images acquiring their intrinsic
 * size, tiles added or removed, viewport resizes) NEVER change intent — they
 * only cause the current intent to be re-applied. This is what makes the
 * scroll position immune to the async races of the previous
 * measure-then-latch design (stale wasAtBottom): a layout change can no
 * longer be mistaken for a user decision.
 *
 * Geometry changes are observed two ways:
 * - a MutationObserver (owned by SvScrollContentView) for childList changes
 * - a ResizeObserver on the scroller and content elements, which catches
 *   what the MutationObserver structurally cannot: text growing inside an
 *   existing DOM node (streaming), images acquiring their intrinsic size
 *   after decode, and viewport height changes
 *
 * Scroll events are classified into three kinds:
 * - programmatic: caused by our own scrollTop writes (matched against the
 *   pendingProgrammaticScrolls list) — never reinterpreted as user intent
 * - user: within a "user scroll session" armed by an input event and
 *   sustained by scroll-event continuity (which covers touch momentum after
 *   the finger lifts) — the ONLY kind that updates intent and the viewport
 *   reference
 * - foreign: everything else (e.g. the browser natively scrolling a focused
 *   element into view) — ignored; the current intent re-asserts on the next
 *   geometry change
 *
 * Anchor mode (question anchoring): anchorOnSubview() pins a message tile to
 * the top of the viewport (adding bottom padding so there is room to do so)
 * while its response streams in below. It is "preserve" intent plus padding
 * bookkeeping; releaseAnchor() ends it without moving the viewport.
 */
(class SvScrollView extends SvDomView {

    /**
     * @description Initializes the prototype slots for the SvScrollView
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} sticksToBottom - Whether the stick-to-bottom
         * machinery (intent tracking, observers, button) is active
         * @category Configuration
         */
        {
            const slot = this.newSlot("sticksToBottom", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {String} scrollIntent - "bottom" (pin viewport to content
         * bottom) or "preserve" (hold the reading position). Changed only by
         * user-classified scrolling and explicit API calls — never by
         * geometry measurements.
         * @category State
         */
        {
            const slot = this.newSlot("scrollIntent", "bottom");
            slot.setSlotType("String");
        }

        /**
         * @member {Boolean} isAnchored - True while question-anchor mode is
         * active: "preserve" intent plus bottom padding that makes room to
         * hold the anchored tile at the viewport top.
         * @category State
         */
        {
            const slot = this.newSlot("isAnchored", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {SvNode} viewportRefNode - The node of the tile at the top
         * of the viewport, used by "preserve" intent to restore the reading
         * position after layout changes elsewhere (images completing above,
         * tile re-syncs, browser scrollTop clamps). Tracked by NODE (not
         * tile) so a re-created tile still resolves.
         * @category State
         */
        {
            const slot = this.newSlot("viewportRefNode", null);
            slot.setSlotType("SvNode");
        }

        /**
         * @member {Number} viewportRefOffset - The reference tile's offset
         * from the viewport top (tile offsetTop - scrollTop) at the last
         * user scroll.
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

        /**
         * @member {ResizeObserver} contentResizeObserver - Observes the
         * scroller and content elements so pure height changes (streaming
         * text growth, image decode, viewport resize) re-apply the current
         * intent. The MutationObserver alone cannot see these.
         * @category DOM
         */
        {
            const slot = this.newSlot("contentResizeObserver", null);
            slot.setSlotType("ResizeObserver");
        }

        /**
         * @member {Function} userInputListener - Shared handler recording
         * user input (wheel / touch / mouse / key) that arms a user scroll
         * session. Kept for removal on retire.
         * @category DOM
         */
        {
            const slot = this.newSlot("userInputListener", null);
            slot.setSlotType("Function");
        }

        /**
         * @member {Number} userScrollSessionUntil - Timestamp (performance.now
         * ms) until which scroll events are classified as user-initiated.
         * Armed by input events, extended by scroll-event continuity so touch
         * momentum stays classified as the user's scroll.
         * @category State
         */
        {
            const slot = this.newSlot("userScrollSessionUntil", 0);
            slot.setSlotType("Number");
        }

        /**
         * @member {Array} pendingProgrammaticScrolls - Records of our own
         * scrollTop writes ({top, at}) awaiting their scroll events, so those
         * events are never reinterpreted as user intent.
         * @category State
         */
        {
            const slot = this.newSlot("pendingProgrammaticScrolls", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Boolean} isSmoothScrollingToBottom - True while the
         * smooth scroll started by scrollToBottomSmooth() is in flight; its
         * intermediate scroll events must not be classified as user intent.
         * @category State
         */
        {
            const slot = this.newSlot("isSmoothScrollingToBottom", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} hasPendingIntentRetry - True while a deferred
         * applyScrollIntent() is scheduled (used when an apply is suppressed
         * during an active user scroll session).
         * @category State
         */
        {
            const slot = this.newSlot("hasPendingIntentRetry", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} jumpLogLastScrollTop - Last scrollTop seen by the
         * always-on scroll-jump diagnostic.
         * @category Diagnostics
         */
        {
            const slot = this.newSlot("jumpLogLastScrollTop", null);
            slot.setSlotType("Number");
        }

        /**
         * @member {Function} scrollDebugFocusListener - Opt-in diagnostic
         * focusin listener (localStorage.SvScrollDebug = "1").
         * @category Diagnostics
         */
        {
            const slot = this.newSlot("scrollDebugFocusListener", null);
            slot.setSlotType("Function");
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
        this.setPendingProgrammaticScrolls([]);
        return this;
    }

    /**
     * @description Releases observers and listeners.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Lifecycle
     */
    prepareToRetire () {
        super.prepareToRetire();
        const observer = this.contentResizeObserver();
        if (observer) {
            observer.disconnect();
            this.setContentResizeObserver(null);
        }
        const listener = this.userInputListener();
        if (listener) {
            this.userInputEventNames().forEach((name) => {
                this.element().removeEventListener(name, listener, { capture: true });
            });
            this.setUserInputListener(null);
        }
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

    // --- view hierarchy ---

    /**
     * @description Returns the first subview as the scroll content view
     * @returns {SvDomView} The scroll content view
     * @category View Hierarchy
     */
    scrollContentView () {
        return this.subviews().first();
    }

    /**
     * @description Returns the first subview as the content view
     * @returns {SvDomView} The content view
     * @category View Hierarchy
     */
    contentView () {
        return this.subviews().first();
    }

    // --- setup ---

    /**
     * @description Starts listening for scroll events
     * @category Event Handling
     */
    listenForScroll () {
        this.scrollListener().setIsListening(true);
    }

    /**
     * @description Sets whether the view should stick to the bottom,
     * starting the observers and listeners the feature needs.
     * @param {Boolean} aBool - Whether to stick to the bottom
     * @returns {SvScrollView} The SvScrollView instance
     * @category Configuration
     */
    setSticksToBottom (aBool) {
        if (this._sticksToBottom !== aBool) {
            this._sticksToBottom = aBool;
            if (aBool) {
                this.listenForScroll();
                this.startUserInputMonitoringIfNeeded();
                this.startResizeObserverIfNeeded();
                this.contentView().startContentMutationObserverIfNeeded();
                this.setupScrollToBottomButton();
                this.startScrollDebugFocusListenerIfNeeded();
            }
        }
        return this;
    }

    /**
     * @description Event names whose occurrence identifies subsequent scroll
     * events as user-initiated.
     * @returns {Array} The event names.
     * @category Event Handling
     */
    userInputEventNames () {
        return ["wheel", "touchstart", "touchmove", "mousedown", "keydown"];
    }

    /**
     * @description Installs passive capture listeners that timestamp user
     * input, arming the user-scroll-session classifier. NOTE: these are
     * deliberately raw listeners (a framework-internal exception to the
     * event-listener-class convention) — they must only record a timestamp,
     * with no delegate dispatch or gesture side effects.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Event Handling
     */
    startUserInputMonitoringIfNeeded () {
        if (!this.userInputListener()) {
            const listener = () => this.recordUserInput();
            this.setUserInputListener(listener);
            this.userInputEventNames().forEach((name) => {
                this.element().addEventListener(name, listener, { passive: true, capture: true });
            });
        }
        return this;
    }

    /**
     * @description Starts the ResizeObserver on the scroller and content
     * elements. This is what catches geometry changes the MutationObserver
     * cannot: streaming text growing inside an existing DOM node, images
     * acquiring their intrinsic size after decode, and viewport resizes.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category DOM
     */
    startResizeObserverIfNeeded () {
        if (this.contentResizeObserver() || (typeof ResizeObserver === "undefined")) {
            return this;
        }
        const observer = new ResizeObserver(() => this.onContentGeometryChanged());
        this.setContentResizeObserver(observer);
        this.observeElementResize(this.element());
        const contentView = this.contentView();
        if (contentView) {
            this.observeElementResize(contentView.element());
        }
        return this;
    }

    /**
     * @description Observes an element's border-box size (falling back to
     * the default box on browsers without options support).
     * @param {Element} element - The element to observe.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category DOM
     */
    observeElementResize (element) {
        const observer = this.contentResizeObserver();
        try {
            observer.observe(element, { box: "border-box" });
        } catch {
            observer.observe(element); // older Safari: no observe options support
        }
        return this;
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
     * @description Installs the opt-in focusin diagnostic
     * (localStorage.SvScrollDebug = "1") — programmatic focus() scrolls the
     * focused element into view natively, without any scroll API call our
     * other logging could catch.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Diagnostics
     */
    startScrollDebugFocusListenerIfNeeded () {
        if (!this.scrollDebugFocusListener() && this.isScrollDebugging()) {
            const listener = (event) => {
                const t = event.target;
                console.log("[ScrollDebug] focusin inside scroll view: <" + t.tagName.toLowerCase() + "> class='" +
                    String(t.className).slice(0, 80) + "'\n" + new Error().stack.split("\n").slice(2, 7).join("\n"));
            };
            this.setScrollDebugFocusListener(listener);
            this.element().addEventListener("focusin", listener);
        }
        return this;
    }

    /**
     * @description Whether verbose scroll diagnostics are enabled
     * (localStorage.SvScrollDebug = "1").
     * @returns {Boolean} Whether scroll debugging is on.
     * @category Diagnostics
     */
    isScrollDebugging () {
        return (typeof localStorage !== "undefined") && (localStorage.getItem("SvScrollDebug") === "1");
    }

    // --- scroll event classification ---

    /**
     * @description Records user input, arming (or extending) the user scroll
     * session and cancelling any in-flight smooth scroll.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Event Handling
     */
    recordUserInput () {
        const now = performance.now();
        this.setUserScrollSessionUntil(Math.max(this.userScrollSessionUntil(), now + this.userInputArmMs()));
        this.setIsSmoothScrollingToBottom(false);
        return this;
    }

    /**
     * @description How long after an input event scroll events count as
     * user-initiated.
     * @returns {Number} Milliseconds.
     * @category Configuration
     */
    userInputArmMs () {
        return 250;
    }

    /**
     * @description How long scroll-event continuity keeps a user scroll
     * session alive (covers touch momentum between frames).
     * @returns {Number} Milliseconds.
     * @category Configuration
     */
    scrollSessionExtendMs () {
        return 200;
    }

    /**
     * @description How long an unmatched programmatic-scroll record is kept
     * before being discarded (its event was coalesced away).
     * @returns {Number} Milliseconds.
     * @category Configuration
     */
    pendingScrollTtlMs () {
        return 1000;
    }

    /**
     * @description Whether we are currently inside a user scroll session.
     * @returns {Boolean} True if scroll events should be classified as user-initiated.
     * @category State
     */
    isInUserScrollSession () {
        return performance.now() <= this.userScrollSessionUntil();
    }

    /**
     * @description Handles scroll events: classifies them as programmatic /
     * user / foreign, and updates intent only for user-classified ones.
     * @category Event Handling
     */
    onScroll (/*event*/) {
        this.logScrollJumpIfNeeded();
        if (!this.sticksToBottom()) {
            return;
        }
        const now = performance.now();
        this.purgeStalePendingScrolls(now);
        if (!this.consumePendingProgrammaticScroll() && !this.isSmoothScrollingToBottomStill()) {
            if (now <= this.userScrollSessionUntil()) {
                this.setUserScrollSessionUntil(now + this.scrollSessionExtendMs());
                this.updateIntentFromUserScroll();
            }
            // else: foreign scroll (e.g. browser-native focus scrolling) —
            // change nothing; the current intent re-asserts on the next
            // geometry change
        }
        this.updateScrollToBottomButton();
    }

    /**
     * @description Whether the smooth scroll to bottom is still in flight,
     * clearing the flag once the bottom is reached.
     * @returns {Boolean} True while intermediate smooth-scroll events should be ignored.
     * @category State
     */
    isSmoothScrollingToBottomStill () {
        if (!this.isSmoothScrollingToBottom()) {
            return false;
        }
        if (this.isAtBottom()) {
            this.setIsSmoothScrollingToBottom(false);
        }
        return true;
    }

    /**
     * @description Consumes the pending programmatic-scroll record matching
     * the current scrollTop, if any. Earlier records are dropped too, since
     * their events were coalesced into this one.
     * @returns {Boolean} Whether this scroll event was one of our own writes.
     * @category Event Handling
     */
    consumePendingProgrammaticScroll () {
        const pending = this.pendingProgrammaticScrolls();
        const top = this.element().scrollTop;
        const index = pending.findIndex((entry) => Math.abs(entry.top - top) <= 1);
        if (index === -1) {
            return false;
        }
        pending.splice(0, index + 1);
        return true;
    }

    /**
     * @description Drops programmatic-scroll records whose events never
     * arrived (coalesced away by the browser).
     * @param {Number} now - Current performance.now() timestamp.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Event Handling
     */
    purgeStalePendingScrolls (now) {
        const pending = this.pendingProgrammaticScrolls();
        while (pending.length && (now - pending[0].at) > this.pendingScrollTtlMs()) {
            pending.shift();
        }
        return this;
    }

    /**
     * @description Updates intent from a user-classified scroll event:
     * reaching the bottom pins, scrolling away preserves the new reading
     * position.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category State
     */
    updateIntentFromUserScroll () {
        if (this.isAtBottom()) {
            if (this.scrollIntent() !== "bottom" || this.isAnchored()) {
                this.pinToBottom();
            }
        } else {
            this.setScrollIntent("preserve");
            this.deriveViewportRef();
        }
        return this;
    }

    /**
     * @description Sets the scroll intent, logging transitions when
     * diagnostics are enabled.
     * @param {String} intent - "bottom" or "preserve".
     * @returns {SvScrollView} The SvScrollView instance.
     * @category State
     */
    setScrollIntent (intent) {
        if (this._scrollIntent !== intent) {
            if (this.isScrollDebugging()) {
                console.log("[ScrollDebug] " + this.svTypeId() + " intent " + this._scrollIntent + " -> " + intent);
            }
            this._scrollIntent = intent;
        }
        return this;
    }

    // --- geometry changes ---

    /**
     * @description Handles content view mutations (from the content view's
     * MutationObserver).
     * @param {MutationRecord[]} mutations - The mutations that occurred
     * @category Event Handling
     */
    onContentViewMutations (/*mutations*/) {
        this.onContentGeometryChanged();
    }

    /**
     * @description Handles any geometry change (mutation or resize) by
     * re-applying the current intent. Geometry changes never CHANGE intent.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Event Handling
     */
    onContentGeometryChanged () {
        this.applyScrollIntent();
        return this;
    }

    // --- applying intent ---

    /**
     * @description Applies the current intent to the scroll position:
     * "bottom" pins to the natural content bottom, "preserve" restores the
     * reading position. Suppressed (and retried shortly after) while the
     * user is actively scrolling away from the bottom, so we never fight a
     * gesture in progress.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    applyScrollIntent () {
        if (!this.sticksToBottom()) {
            return this;
        }
        if (this.isInUserScrollSession() && !this.isAtBottom()) {
            this.scheduleIntentRetry();
            return this;
        }
        if (this.scrollIntent() === "bottom") {
            this.programmaticScrollTo(this.naturalScrollHeight() - this.element().clientHeight);
        } else {
            this.restoreViewportPosition();
        }
        this.updateScrollToBottomButton();
        return this;
    }

    /**
     * @description Schedules a deferred applyScrollIntent() for after the
     * user scroll session ends.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    scheduleIntentRetry () {
        if (!this.hasPendingIntentRetry()) {
            this.setHasPendingIntentRetry(true);
            this.addWeakTimeout(() => {
                this.setHasPendingIntentRetry(false);
                this.applyScrollIntent();
            }, this.scrollSessionExtendMs() + 50);
        }
        return this;
    }

    /**
     * @description Writes scrollTop (clamped), recording the write so the
     * resulting scroll event is classified as programmatic. All scroll
     * position writes MUST go through this method.
     * @param {Number} target - The desired scrollTop.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    programmaticScrollTo (target) {
        const e = this.element();
        const clamped = Math.max(0, Math.min(target, e.scrollHeight - e.clientHeight));
        if (Math.abs(e.scrollTop - clamped) >= 1) {
            e.scrollTop = clamped;
            this.pendingProgrammaticScrolls().push({ top: e.scrollTop, at: performance.now() });
        }
        return this;
    }

    // --- viewport reference (reading position) ---

    /**
     * @description Records which tile is at the top of the viewport and its
     * offset, as the reference "preserve" intent restores against. Called
     * only from user-classified scrolls and anchor seeding — never from
     * transient layout states.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category State
     */
    deriveViewportRef () {
        const contentView = this.contentView();
        if (!contentView) {
            return this;
        }
        const scrollTop = this.element().scrollTop;
        const tiles = contentView.subviews();
        for (let i = 0; i < tiles.length; i++) {
            const te = tiles[i].element();
            if (te.isConnected && (te.offsetTop + te.offsetHeight > scrollTop + 1)) {
                if (tiles[i].node && tiles[i].node()) {
                    this.setViewportRefNode(tiles[i].node());
                    this.setViewportRefOffset(te.offsetTop - scrollTop);
                }
                break;
            }
        }
        return this;
    }

    /**
     * @description The reference tile, if it currently exists in the DOM.
     * @returns {SvDomView|null} The reference tile or null.
     * @category State
     */
    viewportRefTile () {
        const refNode = this.viewportRefNode();
        const contentView = this.contentView();
        if (!refNode || !contentView || !contentView.subviewForNode) {
            return null;
        }
        const tile = contentView.subviewForNode(refNode);
        if (tile && tile.element().isConnected) {
            return tile;
        }
        return null;
    }

    /**
     * @description Whether the content view currently has any tile in the DOM.
     * False means a view re-sync has torn tiles down and not yet rebuilt them.
     * @returns {Boolean} Whether live tiles exist.
     * @category State
     */
    contentHasConnectedTiles () {
        const contentView = this.contentView();
        if (!contentView) {
            return false;
        }
        return contentView.subviews().some((sv) => sv.element().isConnected);
    }

    /**
     * @description Restores the scroll position so the reference tile keeps
     * its viewport offset. If the reference tile is gone but other tiles are
     * live, the reference was deleted or hidden — re-derive it from wherever
     * the viewport is now. If no tiles are live we are mid-teardown: keep
     * everything and wait for the rebuild to trigger the next apply.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    restoreViewportPosition () {
        const tile = this.viewportRefTile();
        if (!tile) {
            if (this.contentHasConnectedTiles()) {
                this.deriveViewportRef();
            }
            return this;
        }
        const e = this.element();
        const target = tile.element().offsetTop - this.viewportRefOffset();
        const clamped = Math.max(0, Math.min(target, e.scrollHeight - e.clientHeight));
        if (Math.abs(e.scrollTop - clamped) > 1) {
            // TEMP diagnostic for chat scroll jumps
            console.log("[ScrollDebug] " + this.svTypeId() + ".restoreViewportPosition() " + e.scrollTop + " -> " + clamped +
                " (ref " + this.viewportRefNode().svTypeId() + " offset " + this.viewportRefOffset() + ")");
        }
        this.programmaticScrollTo(target);
        return this;
    }

    // --- position measurements ---

    /**
     * @description The content height excluding any anchor padding — the
     * height of what the user perceives as the content.
     * @returns {Number} The natural scroll height in pixels.
     * @category Calculation
     */
    naturalScrollHeight () {
        return this.element().scrollHeight - this.anchorPaddingPx();
    }

    /**
     * @description The bottom padding currently applied to the content view
     * for anchor mode.
     * @returns {Number} The padding in pixels.
     * @category Calculation
     */
    anchorPaddingPx () {
        const contentView = this.contentView();
        if (!contentView) {
            return 0;
        }
        return parseFloat(contentView.paddingBottom()) || 0;
    }

    /**
     * @description Checks if the viewport is at the bottom of the natural
     * content (anchor padding excluded).
     * @returns {Boolean} Whether the view is at the bottom
     * @category State
     */
    isAtBottom () {
        const e = this.element();
        const difference = this.naturalScrollHeight() - (e.scrollTop + e.clientHeight);
        return difference <= this.computeScrollTolerance();
    }

    /**
     * @description Computes the scroll tolerance
     * @returns {Number} The computed scroll tolerance
     * @category Calculation
     */
    computeScrollTolerance () {
        return 10;
    }

    // --- explicit intent API ---

    /**
     * @description Pins the viewport to the bottom: clears any anchor state
     * and padding, sets "bottom" intent, and applies it immediately.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    pinToBottom () {
        this.setIsAnchored(false);
        this.clearAnchorPadding();
        this.setScrollIntent("bottom");
        this.applyScrollIntent();
        return this;
    }

    /**
     * @description Smooth-scrolls to the bottom (scroll-to-bottom button),
     * setting "bottom" intent up front so streaming during the animation
     * cannot fight it.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    scrollToBottomSmooth () {
        this.setIsAnchored(false);
        this.clearAnchorPadding();
        this.setScrollIntent("bottom");
        this.setIsSmoothScrollingToBottom(true);
        this.element().scrollTo({
            top: this.element().scrollHeight,
            behavior: "smooth"
        });
        return this;
    }

    /**
     * @description Resets scroll state for newly displayed content (the
     * content view was bound to a different node): conversations open pinned
     * to the bottom.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    resetForNewContent () {
        this.setIsAnchored(false);
        this.clearAnchorPadding();
        this.setViewportRefNode(null);
        this.setViewportRefOffset(0);
        this.setIsSmoothScrollingToBottom(false);
        this.setPendingProgrammaticScrolls([]);
        this.setUserScrollSessionUntil(0);
        this.setScrollIntent("bottom");
        this.applyScrollIntent();
        return this;
    }

    // --- scroll-to-bottom button ---

    /**
     * @description Updates the visibility of the scroll-to-bottom button.
     * Shows when not at bottom and content overflows; hides when at bottom
     * or when the viewport is inside the anchor padding area.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category UI
     */
    updateScrollToBottomButton () {
        const button = this.scrollToBottomButton();
        if (button) {
            const e = this.element();
            const naturalHeight = this.naturalScrollHeight();
            const contentOverflows = naturalHeight > e.clientHeight;
            const withinContent = (e.scrollTop + e.clientHeight) <= naturalHeight;
            if (!this.isAtBottom() && contentOverflows && withinContent) {
                button.showButton();
            } else {
                button.hideButton();
            }
        }
        return this;
    }

    // --- anchor scroll ---

    /**
     * @description Scrolls so the given subview sits at the top of the
     * viewport and engages anchor mode: bottom padding makes room to hold it
     * there while its response streams in below, and the subview becomes the
     * viewport reference for "preserve" intent.
     * @param {SvDomView} aSubview - The subview to anchor at the top.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    anchorOnSubview (aSubview) {
        if (aSubview) {
            this.applyAnchorPadding();
            this.programmaticScrollTo(aSubview.element().offsetTop);
            // TEMP diagnostic for chat scroll jumps
            console.log("[ScrollDebug] " + this.svTypeId() + ".anchorOnSubview(" + aSubview.svTypeId() + ")" +
                " offsetTop " + aSubview.element().offsetTop +
                " -> scrollTop " + this.element().scrollTop +
                " (scrollHeight " + this.element().scrollHeight + ", clientHeight " + this.element().clientHeight + ")");
            if (aSubview.node && aSubview.node()) {
                this.setViewportRefNode(aSubview.node());
                this.setViewportRefOffset(0);
            }
        } else {
            this.programmaticScrollTo(0);
            this.setViewportRefNode(null);
        }
        this.setIsAnchored(true);
        this.setScrollIntent("preserve");
        this.updateScrollToBottomButton();
        return this;
    }

    /**
     * @description Adds bottom padding equal to the viewport height so a
     * tile near the end of the content can be scrolled to the viewport top.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    applyAnchorPadding () {
        const contentView = this.contentView();
        if (contentView) {
            contentView.setPaddingBottom(this.element().clientHeight + "px");
        }
        return this;
    }

    /**
     * @description Disengages anchor mode without moving the viewport:
     * shrinks the anchor padding to the minimum that avoids a scrollTop
     * clamp, then resumes normal semantics — pinning if the user is at the
     * natural bottom, preserving their position otherwise. Called when the
     * anchored exchange's response completes.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    releaseAnchor () {
        if (!this.isAnchored()) {
            return this;
        }
        // TEMP diagnostic for chat scroll jumps
        console.log("[ScrollDebug] " + this.svTypeId() + ".releaseAnchor() scrollTop " + this.element().scrollTop);
        this.setIsAnchored(false);
        this.reduceAnchorPaddingSafely();
        if (this.isAtBottom()) {
            this.pinToBottom();
        }
        this.updateScrollToBottomButton();
        return this;
    }

    /**
     * @description Shrinks the anchor padding to the minimum that keeps the
     * current scrollTop valid — clearing it outright could clamp scrollTop
     * and visibly yank the viewport. Any remainder is cleared when the user
     * next reaches the bottom (pinToBottom).
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    reduceAnchorPaddingSafely () {
        const contentView = this.contentView();
        const currentPadding = this.anchorPaddingPx();
        if (!contentView || currentPadding === 0) {
            return this;
        }
        const e = this.element();
        const naturalHeight = e.scrollHeight - currentPadding;
        const needed = Math.max(0, (e.scrollTop + e.clientHeight) - naturalHeight);
        if (needed < currentPadding) {
            contentView.setPaddingBottom(Math.ceil(needed) + "px");
        }
        return this;
    }

    /**
     * @description Removes the anchor padding from the content view.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Scrolling
     */
    clearAnchorPadding () {
        const contentView = this.contentView();
        if (contentView && this.anchorPaddingPx() !== 0) {
            contentView.setPaddingBottom("0px");
        }
        return this;
    }

    // --- diagnostics ---

    /**
     * @description Scroll-jump diagnostic — ALWAYS ON. Fires only on a move
     * larger than a screenful between scroll events, so it is silent in
     * normal use; when a "jumped back to earlier messages" bug strikes, the
     * console names the state at the jump.
     * @returns {SvScrollView} The SvScrollView instance.
     * @category Diagnostics
     */
    logScrollJumpIfNeeded () {
        const e = this.element();
        const last = this.jumpLogLastScrollTop();
        if (last !== null && Math.abs(e.scrollTop - last) > e.clientHeight) {
            console.log("[ScrollDebug] " + this.svTypeId() + " JUMP " + last + " -> " + e.scrollTop +
                " (scrollHeight " + e.scrollHeight + ", clientHeight " + e.clientHeight +
                ", intent " + this.scrollIntent() +
                ", isAnchored " + this.isAnchored() +
                ", refNode " + (this.viewportRefNode() ? this.viewportRefNode().svTypeId() : "null") +
                ", inUserSession " + this.isInUserScrollSession() + ")");
        }
        this.setJumpLogLastScrollTop(e.scrollTop);
        return this;
    }

}.initThisClass());
