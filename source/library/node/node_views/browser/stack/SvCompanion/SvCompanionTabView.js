"use strict";

/** * @module library.node.node_views.browser.stack.SvCompanion
 */

/** * @class SvCompanionTabView
 * @extends SvFlexDomView
 * @classdesc The collapsed form of an SvCompanionView: a thin tab hugging the
 * edge the companion collapsed toward. It shows only a chevron affordance
 * (pointing the way the panel expands) plus an attention badge — deliberately
 * no title, since the strip is too narrow to render one legibly. Tapping it
 * toggles the companion open.
 *
 * Colors can be themed via CSS variables:
 *
 *     --SvCompanionTab-color
 *     --SvCompanionTab-border-color
 */

(class SvCompanionTabView extends SvFlexDomView {

    initPrototypeSlots () {
        /**
         * @member {SvCompanionView} companionView - the companion this tab opens
         * @category Data
         */
        {
            const slot = this.newSlot("companionView", null);
            slot.setSlotType("SvCompanionView");
        }

        /**
         * @member {SvTextView} labelView - shows a chevron affordance (no title)
         * @category UI
         */
        {
            const slot = this.newSlot("labelView", null);
            slot.setSlotType("SvTextView");
        }

        /**
         * @member {SvBadgeView} badgeView - aggregate attention badge
         * @category UI
         */
        {
            const slot = this.newSlot("badgeView", null);
            slot.setSlotType("SvBadgeView");
        }

        /**
         * @member {Boolean} isVerticalTab - true when the companion docks at a
         * left/right edge (the caret points left/right); false for top/bottom
         * edges (the caret points up/down)
         * @category Layout
         */
        {
            const slot = this.newSlot("isVerticalTab", true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} companionIsDocked - true when the companion is open
         * (the caret offers to collapse it); false when collapsed (the caret
         * offers to expand it)
         * @category Layout
         */
        {
            const slot = this.newSlot("companionIsDocked", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setElementClassName("SvCompanionTabView");
        this.setDisplay("flex");
        this.setAlignItems("center");
        this.setJustifyContent("center");
        this.setWidth("100%");
        this.setHeight("100%");
        this.setCursor("pointer");
        this.setColor("var(--SvCompanionTab-color, rgba(255, 255, 255, 0.5))");
        // A faint fill + hairline edge so the collapsed rail reads as a
        // control strip instead of an unexplained gap beside the content
        // (reported twice against a dark chat column / fullscreen image).
        // The border-color var was documented in the classdesc but never
        // applied; the border side follows the docked edge via syncCaret.
        this.setBackgroundColor("var(--SvCompanionTab-background-color, rgba(255, 255, 255, 0.035))");
        this.turnOffUserSelect();

        const label = SvTextView.clone();
        label.setFontSize("1em");
        label.setWhiteSpace("nowrap");
        label.setPointerEvents("none");
        // SvTextView.init plants inline 0.5em side paddings — inside a 16px
        // rail that pushes the caret glyph visibly off-center. Zero them all;
        // flex on this tab does the centering.
        label.setPaddingLeft("0em");
        label.setPaddingRight("0em");
        label.setPaddingTop("0em");
        label.setPaddingBottom("0em");
        label.setMinWidth("0px"); // SvTextView also sets a 10px min-width
        this.setLabelView(label);
        this.addSubview(label);
        this.syncCaret(); // sets the caret glyph for the current edge/state

        const badge = SvBadgeView.clone();
        badge.setPosition("absolute");
        badge.setTopPx(8);
        badge.setRightPx(4);
        badge.hideDisplay();
        this.setBadgeView(badge);
        this.addSubview(badge);

        this.setPosition("relative");
        this.addDefaultTapGesture();

        this.setAriaRole("button");
        this.setAriaLabel("Toggle companion panel");

        return this;
    }

    didUpdateSlotIsVerticalTab (/*oldValue, newValue*/) {
        this.syncCaret();
        return this;
    }

    didUpdateSlotCompanionIsDocked (/*oldValue, newValue*/) {
        this.syncCaret();
        return this;
    }

    /**
     * @description Sets the caret glyph to point the way a tap moves the panel:
     * when docked it offers to collapse (push toward the edge: › for a side
     * dock, ⌄ for a bottom dock); when collapsed it offers to expand (pull away
     * from the edge: ‹ / ⌃). Thin single-stroke carets matching the breadcrumb
     * separators. A single glyph, no writing-mode rotation.
     * @returns {SvCompanionTabView} The current instance.
     * @category Display
     */
    syncCaret () {
        const label = this.labelView();
        label.setCssProperty("writing-mode", null);
        // Hairline on the content-facing edge (vertical tab = side dock →
        // left edge; horizontal = bottom dock → top edge).
        const edge = this.isVerticalTab() ? "border-left" : "border-top";
        const other = this.isVerticalTab() ? "border-top" : "border-left";
        this.setCssProperty(other, null);
        this.setCssProperty(edge, "1px solid var(--SvCompanionTab-border-color, rgba(255, 255, 255, 0.08))");
        let glyph;
        if (this.isVerticalTab()) {
            glyph = this.companionIsDocked() ? "›" : "‹";
            // same optical nudge the breadcrumb separator uses: these glyphs
            // sit low in their line box, and flex centers the box, not the ink
            label.setCssProperty("transform", "translateY(-0.08em)");
        } else {
            glyph = this.companionIsDocked() ? "⌄" : "⌃";
            label.setCssProperty("transform", "translateY(-0.15em)");
        }
        label.setString(glyph);
        return this;
    }

    /**
     * @description Updates the badge. Null/false hides it; a string shows a chip;
     * an empty string shows a dot.
     * @param {boolean} shouldBadge Whether to show the badge.
     * @param {string|null} badgeTitle The badge text, or null for a dot.
     * @returns {SvCompanionTabView} The current instance.
     * @category Display
     */
    setBadge (shouldBadge, badgeTitle) {
        const badge = this.badgeView();
        if (shouldBadge) {
            badge.setBadgeString(badgeTitle);
            badge.unhideDisplay();
        } else {
            badge.hideDisplay();
        }
        return this;
    }

    onTapComplete (/*aGesture*/) {
        const companion = this.companionView();
        if (companion) {
            companion.toggleExpanded();
        }
        return this;
    }

}.initThisClass());
