"use strict";

/**
 * @module library.node.node_views.browser.stack
 */

/**
 * @class SvScrollView_follow
 * @extends SvScrollView
 * @classdesc Following a reveal: content that appears piece by piece (a
 * response shown as far as it has been spoken) asks to keep its newest piece
 * in view. The view scrolls just enough to show that piece's bottom — never
 * so far that its top leaves the viewport — and only while the reader is
 * with it: a piece that starts well below the viewport means the reader has
 * scrolled away to read something else, so nothing moves until they come
 * back down to it. A scroll gesture in progress is never fought.
 *
 * Measures once per animation frame, in a read-then-write pass, after the
 * caller's DOM writes have landed.
 */
(class SvScrollView_follow extends SvScrollView {

    initPrototypeSlots_follow () {
        /**
         * @member {Element} followedElement - The newest revealed piece to
         * keep in view at the next frame (null: none pending).
         * @category Following
         */
        {
            const slot = this.newSlot("followedElement", null);
            slot.setSlotType("Element");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Asks to keep this element (the newest revealed piece of
     * the content) in view: applied at the next animation frame, so a burst
     * of reveals measures once.
     * @param {Element} element
     * @returns {SvScrollView}
     * @category Following
     */
    keepElementInView (element) {
        const isPending = this.followedElement() !== null;
        this.setFollowedElement(element);
        if (!isPending) {
            requestAnimationFrame(() => this.followNow());
        }
        return this;
    }

    /**
     * @description The frame's pass: measure, then scroll if the reader is
     * following and the piece is not fully in view.
     * @returns {SvScrollView}
     * @category Following
     */
    followNow () {
        const element = this.followedElement();
        this.setFollowedElement(null);
        if (!element || !element.isConnected || !this.sticksToBottom() || this.isInUserScrollSession()) {
            return this;
        }
        const target = this.followTargetFor(this.followGeometry(element));
        if (target !== null) {
            this.scrollToFollow(target);
        }
        return this;
    }

    /**
     * @description One read phase: the viewport and the element's top and
     * bottom in content coordinates.
     * @param {Element} element
     * @returns {Object} { scrollTop, clientHeight, scrollHeight, top, bottom }
     * @category Following
     */
    followGeometry (element) {
        const g = this.scrollGeometry();
        const viewTop = this.element().getBoundingClientRect().top;
        const r = element.getBoundingClientRect();
        return Object.assign(g, { top: r.top - viewTop + g.scrollTop, bottom: r.bottom - viewTop + g.scrollTop, height: r.height });
    }

    /**
     * @description Where to scroll so the piece shows, or null to stay: it is
     * already in view, it has no size, or it starts below where the reader
     * is looking (they scrolled away).
     * @param {Object} f - followGeometry()
     * @returns {Number|null} the scrollTop to move to
     * @category Following
     */
    followTargetFor (f) {
        const margin = this.followMarginPx();
        const viewBottom = f.scrollTop + f.clientHeight;
        if (f.height === 0 || f.bottom + margin <= viewBottom || f.top > viewBottom + this.followSlackPx()) {
            return null;
        }
        const target = Math.min(f.bottom + margin - f.clientHeight, f.top - margin); // its top stays in view
        return target > f.scrollTop ? target : null; // following only ever moves down
    }

    /**
     * @description Scrolls smoothly to the target and makes it the reading
     * position "preserve" intent holds.
     * @param {Number} target
     * @returns {SvScrollView}
     * @category Following
     */
    scrollToFollow (target) {
        this.deriveViewportRef({ scrollTop: target });
        this.pendingProgrammaticScrolls().push({ top: target, at: performance.now() });
        this.element().scrollTo({ top: target, behavior: "smooth" });
        return this;
    }

    /**
     * @description Room kept below the followed piece.
     * @returns {Number} px
     * @category Following
     */
    followMarginPx () {
        return 24;
    }

    /**
     * @description How far below the viewport a new piece may start and
     * still be followed: about two lines. Farther means the reader has
     * scrolled up to something else.
     * @returns {Number} px
     * @category Following
     */
    followSlackPx () {
        return 64;
    }

}.initThisCategory());
