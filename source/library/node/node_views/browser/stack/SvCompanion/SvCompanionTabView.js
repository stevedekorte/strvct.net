"use strict";

/** * @module library.node.node_views.browser.stack.SvCompanion
 */

/** * @class SvCompanionTabView
 * @extends SvFlexDomView
 * @classdesc The collapsed form of an SvCompanionView: a quiet strip hugging
 * the edge the companion collapsed toward, carrying ONLY the aggregate
 * attention badge. The caret glyph and the strip's own tap gesture were
 * retired for the edge-handle redesign (see SvEdgeHandleView): the pill on
 * the boundary is the one toggle affordance, and the boundary away from the
 * pill is deliberately inert. The badge stays — it is a notification, not an
 * affordance, and deleting it would remove the only signal that the companion
 * wants attention while collapsed.
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
        this.setColor("var(--SvCompanionTab-color, rgba(255, 255, 255, 0.5))");
        // A faint fill + hairline edge so the collapsed rail reads as a
        // control strip instead of an unexplained gap beside the content
        // (reported twice against a dark chat column / fullscreen image).
        // The border-color var was documented in the classdesc but never
        // applied; the border side follows the docked edge via syncCaret.
        this.setBackgroundColor("var(--SvCompanionTab-background-color, rgba(255, 255, 255, 0.035))");
        this.turnOffUserSelect();

        this.syncCaret(); // sets the boundary hairline for the current edge

        const badge = SvBadgeView.clone();
        badge.setPosition("absolute");
        badge.setTopPx(8);
        badge.setRightPx(4);
        badge.hideDisplay();
        this.setBadgeView(badge);
        this.addSubview(badge);

        this.setPosition("relative");

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
     * @description Applies the boundary hairline to the content-facing edge
     * (vertical tab = side dock → left edge; horizontal = bottom dock → top
     * edge). The caret glyph is retired — the edge pill is the affordance.
     * @returns {SvCompanionTabView} The current instance.
     * @category Display
     */
    syncCaret () {
        const edge = this.isVerticalTab() ? "border-left" : "border-top";
        const other = this.isVerticalTab() ? "border-top" : "border-left";
        this.setCssProperty(other, null);
        this.setCssProperty(edge, "1px solid var(--SvCompanionTab-border-color, rgba(255, 255, 255, 0.08))");
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

}.initThisClass());
