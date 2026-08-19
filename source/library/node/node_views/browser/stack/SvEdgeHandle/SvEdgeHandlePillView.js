"use strict";

/**
 * @module library.node.node_views.browser.stack.SvEdgeHandle
 */

/**
 * @class SvEdgeHandlePillView
 * @extends SvFlexDomView
 * @classdesc The interactive pill of an SvEdgeHandleView: a hit box (~8.6em
 * along the boundary) centered on a short tick mark (~2.2em x 2px) drawn in
 * the body text color at very low opacity. Only this box takes the pointer —
 * the rest of the boundary strip is inert, so crossing the boundary elsewhere
 * does nothing (a fully clickable edge fired constantly by accident).
 *
 * States (the whole interaction model — there is no idle fade):
 *   - resting: 2.2em tick; opacity from --sv-edge-handle-resting-opacity
 *     (coarse pointers use --sv-edge-handle-coarse-opacity — no hover)
 *   - hot (pointer within the box, or touch held): 3x length,
 *     --sv-edge-handle-hot-opacity
 *
 * Growth is transform: scaleX/scaleY — never a width/height transition — so
 * hover costs no layout. On a 2px hairline the corner-radius distortion under
 * scale is invisible.
 *
 * The glint: a pill ENTERING the UI appears in the attention color
 * (--sv-attention) at hot opacity, holds ~0.8s, then settles to resting over
 * ~1.6s. Color and opacity only — it teaches the control's location without
 * text, and once settled there is nothing left to dismiss. Skipped entirely
 * under prefers-reduced-motion.
 *
 * Over a dark field (theatre mode) the tick inverts to the page background
 * color via setIsInverted.
 */

(class SvEdgeHandlePillView extends SvFlexDomView {

    initPrototypeSlots () {
        /**
         * @member {SvEdgeHandleView} handleView - the owning boundary strip
         * @category Data
         */
        {
            const slot = this.newSlot("handleView", null);
            slot.setSlotType("SvEdgeHandleView");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvDomView} tickView - the short rounded mark
         * @category UI
         */
        {
            const slot = this.newSlot("tickView", null);
            slot.setSlotType("SvDomView");
        }

        /**
         * @member {String} axis - "horizontal" (tick lies along a horizontal
         * boundary) or "vertical" (a side-panel boundary)
         * @category Layout
         */
        {
            const slot = this.newSlot("axis", "horizontal");
            slot.setSlotType("String");
        }

        /**
         * @member {Boolean} isHot - pointer within the box / touch held
         * @category State
         */
        {
            const slot = this.newSlot("isHot", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} isInverted - tick drawn in the page background
         * color (for pills floating over the theatre's dark field)
         * @category State
         */
        {
            const slot = this.newSlot("isInverted", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} isGlinting - entrance emphasis in progress; the
         * tick holds the attention color until the settle completes
         * @category State
         */
        {
            const slot = this.newSlot("isGlinting", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setElementClassName("SvEdgeHandlePillView");
        this.setDisplay("flex");
        this.setAlignItems("center");
        this.setJustifyContent("center");
        this.setPointerEvents("auto");
        this.setCursor("pointer");
        this.turnOffUserSelect();

        const tick = SvDomView.clone();
        tick.setElementClassName("SvEdgeHandleTick");
        tick.setPointerEvents("none");
        tick.setBorderRadius("1px");
        tick.setTransition(this.standardTickTransition());
        this.setTickView(tick);
        this.addSubview(tick);
        if (this.isCoarsePointer()) {
            this.setAttribute("data-coarse", "true");
        }

        this.addDefaultTapGesture();
        this.setIsRegisteredForMouse(true, false); // explicit useCapture: undefined trips the type warning
        this.setIsRegisteredForKeyboard(true); // Tab-reachable; Enter/Space toggle
        this.setAriaRole("button");

        this.applyAxis();
        this.applyState();
        return this;
    }

    // --- geometry ---

    /**
     * @description Whether this device has no hover — the resting tick then
     * holds a slightly higher opacity, since nothing can ever reveal it.
     * @returns {Boolean}
     * @category Layout
     */
    isCoarsePointer () {
        return SvTouchScreen.shared().isSupported();
    }

    applyHotAttribute () {
        this.setAttribute("data-hot", this.isHot() ? "true" : "false");
        return this;
    }

    applyGlintingAttribute () {
        this.setAttribute("data-glinting", this.isGlinting() ? "true" : "false");
        return this;
    }

    standardTickTransition () {
        const curve = "cubic-bezier(.2,.8,.2,1)";
        return "transform 0.3s " + curve + ", opacity 0.3s " + curve + ", background-color 0.3s " + curve;
    }

    settleTickTransition () {
        const curve = "cubic-bezier(.2,.8,.2,1)";
        return "transform 0.3s " + curve + ", opacity 1.6s " + curve + ", background-color 1.6s " + curve;
    }

    /**
     * @description Sizes the hit box and tick for the axis. The hit box is
     * 8.6em along the boundary; across it, the visual strip is 1em but the
     * touch target is a physical 44px (a fingertip does not grow with the
     * root font size — keep this px, it is the accessibility floor), extended
     * with a transparent overhang.
     * @returns {SvEdgeHandlePillView}
     * @category Layout
     */
    applyAxis () {
        const tick = this.tickView();
        const acrossPx = this.isCoarsePointer() ? "44px" : "1.25em";
        if (this.axis() === "horizontal") {
            this.setWidth("8.6em");
            this.setHeight(acrossPx);
            tick.setWidth("2.2em");
            tick.setHeight("2px");
        } else {
            this.setWidth(acrossPx);
            this.setHeight("8.6em");
            tick.setWidth("2px");
            tick.setHeight("2.2em");
        }
        return this;
    }

    // --- state ---

    restingTickColor () {
        return this.isInverted() ? "var(--sv-bg)" : "var(--sv-text)";
    }

    /**
     * @description Applies the current interaction state to the tick. Hot
     * grows via transform (no layout) and brightens; the glint holds the
     * attention color until its settle completes.
     * @returns {SvEdgeHandlePillView}
     * @category State
     */
    applyState () {
        const tick = this.tickView();
        const hot = this.isHot();
        const scale = (this.axis() === "horizontal") ? "scaleX" : "scaleY";
        tick.setTransform(hot ? (scale + "(3)") : (scale + "(1)"));
        this.applyHotAttribute();
        this.applyGlintingAttribute();
        if (!this.isGlinting()) {
            tick.setBackgroundColor(this.restingTickColor());
        }
        return this;
    }

    didUpdateSlotIsHot (/*oldValue, newValue*/) {
        this.applyState();
        return this;
    }

    didUpdateSlotIsInverted (/*oldValue, newValue*/) {
        this.applyState();
        return this;
    }

    didUpdateSlotAxis (/*oldValue, newValue*/) {
        this.applyAxis();
        this.applyState();
        return this;
    }

    // --- the glint ---

    /**
     * @description Entrance emphasis: the tick appears in the attention color
     * at hot opacity, holds ~0.8s, then eases to resting over ~1.6s. Fires on
     * EVERY appearance (no "seen it" persistence — deliberately the zero-state
     * version). Decorative by definition, so reduced motion skips it.
     * @returns {SvEdgeHandlePillView}
     * @category Glint
     */
    playGlint () {
        if (SvWebBrowserScreen.shared().prefersReducedMotion()) {
            return this;
        }
        const tick = this.tickView();
        this.setIsGlinting(true);
        this.applyGlintingAttribute();
        tick.setBackgroundColor("var(--sv-attention)");
        this.addTimeout(() => {
            tick.setTransition(this.settleTickTransition());
            tick.setBackgroundColor(this.restingTickColor());
            this.applyState();
            this.addTimeout(() => {
                tick.setTransition(this.standardTickTransition());
                this.setIsGlinting(false);
                this.applyState();
            }, 1600, "glintSettle");
        }, 800, "glintHold");
        return this;
    }

    // --- interaction ---

    onMouseOver (/*event*/) {
        this.setIsHot(true);
        return true;
    }

    onMouseLeave (/*event*/) {
        this.setIsHot(false);
        return true;
    }

    /**
     * @description Touch feedback replaces hover: the press runs the same
     * grow-and-brighten for the duration of the touch, so the tap is
     * acknowledged.
     * @category Gestures
     */
    onTapBegin (/*aGesture*/) {
        this.setIsHot(true);
        return this;
    }

    onTapCancelled (/*aGesture*/) {
        this.setIsHot(false);
        return this;
    }

    onTapComplete (/*aGesture*/) {
        if (this.isCoarsePointer()) {
            this.setIsHot(false); // nothing will send a mouse leave
        }
        this.toggle();
        return false;
    }

    onEnterKeyUp (/*event*/) {
        this.toggle();
        return false;
    }

    onSpaceKeyUp (/*event*/) {
        this.toggle();
        return false;
    }

    toggle () {
        const handle = this.handleView();
        if (handle) {
            handle.toggleRegion();
        }
        return this;
    }

}.initThisClass());
