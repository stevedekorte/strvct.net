"use strict";

/**
 * @module library.node.node_views.browser.stack.SvEdgeHandle
 */

/**
 * @class SvEdgeHandleView
 * @extends SvFlexDomView
 * @classdesc The boundary strip of an edge handle: a thin strip on the edge
 * between a persistent region and a collapsible one, carrying a centered
 * SvEdgeHandlePillView. The strip itself is INERT (pointer-events none) —
 * only the pill's box takes the pointer.
 *
 * The strip never takes layout space from the persistent region:
 *   - horizontal instances are in-flow siblings with a negative margin so
 *     they overlay the adjacent scroll content (configureHorizontal)
 *   - the vertical instance is an absolutely-positioned overlay riding its
 *     region's leading edge (configureVerticalOverlay), so it moves with the
 *     panel because it is INSIDE the panel — no offset arithmetic
 *
 * It talks to its region only through SvCollapsibleRegionProtocol
 * (isExpanded / toggleExpanded), plus the optional showsEdgeHandle() and
 * collapsibleRegionLabel() hints — it never knows what it toggles.
 *
 * A horizontal strip that overlays scrolling text may carry an eased
 * gradient in the page background color (setShowsGradient), so scrolled
 * narration dissolves into the page instead of clipping at a hard line.
 */

(class SvEdgeHandleView extends SvFlexDomView {

    initPrototypeSlots () {
        /**
         * @member {Object} region - the collapsible region (a node or a view
         * conforming to SvCollapsibleRegionProtocol), or null for no region
         * @category Data
         */
        {
            const slot = this.newSlot("region", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }

        /**
         * @member {SvEdgeHandlePillView} pillView - the interactive pill
         * @category UI
         */
        {
            const slot = this.newSlot("pillView", null);
            slot.setSlotType("SvEdgeHandlePillView");
        }

        /**
         * @member {Boolean} showsGradient - eased page-background fade under
         * the strip while the region is collapsed (for strips overlaying
         * scrolling text)
         * @category Appearance
         */
        {
            const slot = this.newSlot("showsGradient", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} regionWasAvailable - tracks appearance so a pill
         * ENTERING the UI enters via the glint (every entrance, one rule)
         * @category State
         */
        {
            const slot = this.newSlot("regionWasAvailable", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setElementClassName("SvEdgeHandleView");
        this.setDisplay("flex");
        this.setAlignItems("center");
        this.setJustifyContent("center");
        this.setPointerEvents("none"); // only the pill takes the pointer
        this.setPosition("relative");
        this.setZIndex(2);
        this.setFlexGrow(0);
        this.setFlexShrink(0);

        const pill = SvEdgeHandlePillView.clone();
        pill.setHandleView(this);
        this.setPillView(pill);
        this.addSubview(pill);

        this.hideDisplay(); // shown when a region becomes available
        return this;
    }

    // --- placement ---

    /**
     * @description In-flow horizontal strip overlaying the adjacent content:
     * 1em tall, with a negative margin toward the side it overlays so it
     * occupies zero net height in the column.
     * @param {String} overlapSide - "below" (a header boundary overlaying the
     * scroll top) or "above" (a footer boundary overlaying the scroll bottom).
     * @returns {SvEdgeHandleView}
     * @category Layout
     */
    configureHorizontal (overlapSide) {
        this.setWidth("100%");
        this.setHeight("1em");
        if (overlapSide === "below") {
            this.setMarginBottom("-1em");
        } else {
            this.setMarginTop("-1em");
        }
        this.pillView().setAxis("horizontal");
        return this;
    }

    /**
     * @description Absolutely-positioned vertical overlay riding a side
     * panel's leading edge: 1em wide, full height, taking no layout space.
     * @param {String} side - which edge of the parent to ride ("left"/"right").
     * @returns {SvEdgeHandleView}
     * @category Layout
     */
    configureVerticalOverlay (side) {
        this.setPosition("absolute");
        this.setTop("0px");
        this.setBottom("0px");
        this.setRight(null);
        this.setLeft(null);
        if (side === "right") {
            this.setRight("0px");
        } else {
            this.setLeft("0px");
        }
        this.setWidth("1em");
        this.setHeight(null);
        this.setZIndex(6);
        this.pillView().setAxis("vertical");
        return this;
    }

    /**
     * @description Absolutely-positioned horizontal overlay riding a
     * bottom-docked panel's top edge: 1em tall, full width, no layout space.
     * @param {String} side - which edge of the parent to ride ("top"/"bottom").
     * @returns {SvEdgeHandleView}
     * @category Layout
     */
    configureHorizontalOverlay (side) {
        this.setPosition("absolute");
        this.setLeft("0px");
        this.setRight("0px");
        this.setBottom(null);
        this.setTop(null);
        if (side === "bottom") {
            this.setBottom("0px");
        } else {
            this.setTop("0px");
        }
        this.setHeight("1em");
        this.setWidth(null);
        this.setZIndex(6);
        this.pillView().setAxis("horizontal");
        return this;
    }

    // --- region ---

    /**
     * @description Whether an object can drive this handle. Duck-typed rather
     * than protocol-registered so view-side regions and node-side regions are
     * equally acceptable.
     * @param {Object} region
     * @returns {Boolean}
     * @category Data
     */
    regionIsUsable (region) {
        return !!(region
            && typeof region.isExpanded === "function"
            && typeof region.toggleExpanded === "function");
    }

    regionIsAvailable () {
        const region = this.region();
        if (!this.regionIsUsable(region)) {
            return false;
        }
        if (typeof region.showsEdgeHandle === "function") {
            return region.showsEdgeHandle() !== false;
        }
        return true;
    }

    regionLabel () {
        const region = this.region();
        if (region && typeof region.collapsibleRegionLabel === "function") {
            return region.collapsibleRegionLabel();
        }
        return "Toggle panel";
    }

    /**
     * @description Re-reads the region and applies visibility, ARIA state,
     * the entrance glint, and the collapsed-state gradient. Idempotent —
     * called from the owner's sync path on every node update.
     * @returns {SvEdgeHandleView}
     * @category Synchronization
     */
    syncToRegion () {
        const available = this.regionIsAvailable();
        if (!available) {
            this.hideDisplay();
            this.setRegionWasAvailable(false);
            return this;
        }

        this.unhideDisplay();
        if (!this.regionWasAvailable()) {
            this.setRegionWasAvailable(true);
            this.pillView().playGlint(); // a pill entering the UI enters via the glint
        }

        const expanded = this.region().isExpanded() === true;
        const pill = this.pillView();
        pill.setAriaLabel(this.regionLabel());
        pill.setAttribute("aria-expanded", expanded ? "true" : "false");
        pill.setAttribute("title", this.regionLabel()); // desktop tooltip
        this.applyGradient(expanded);
        return this;
    }

    /**
     * @description The eased opaque-to-transparent ramp in the page background
     * color (a linear alpha ramp bands visibly). Only while collapsed — an
     * expanded region supplies its own surface.
     * @param {Boolean} expanded
     * @returns {SvEdgeHandleView}
     * @category Appearance
     */
    applyGradient (expanded) {
        if (!this.showsGradient() || expanded) {
            this.setBackgroundImage(null);
            return this;
        }
        const stops = [
            [100, 0], [97, 19], [88, 34], [73, 47],
            [54, 60], [34, 73], [15, 87], [0, 100]
        ].map(([alpha, at]) => {
            return "color-mix(in srgb, var(--sv-bg) " + alpha + "%, transparent) " + at + "%";
        }).join(", ");
        this.setBackgroundImage("linear-gradient(to bottom, " + stops + ")");
        return this;
    }

    setIsInverted (aBool) {
        this.pillView().setIsInverted(aBool);
        return this;
    }

    toggleRegion () {
        const region = this.region();
        if (this.regionIsUsable(region)) {
            region.toggleExpanded();
            this.syncToRegion();
        }
        return this;
    }

}.initThisClass());
