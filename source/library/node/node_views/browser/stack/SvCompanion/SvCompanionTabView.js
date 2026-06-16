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
         * left/right edge (the label renders vertically); false for top/bottom edges
         * @category Layout
         */
        {
            const slot = this.newSlot("isVerticalTab", true);
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
        this.turnOffUserSelect();

        const label = SvTextView.clone();
        label.setFontSize("1em");
        label.setWhiteSpace("nowrap");
        label.setPointerEvents("none");
        this.setLabelView(label);
        this.addSubview(label);
        this.syncLabelOrientation(); // sets the chevron glyph for the current edge

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
        this.syncLabelOrientation();
        return this;
    }

    /**
     * @description Sets the chevron glyph to point the way the panel expands:
     * a right/left-edge (vertical) tab expands inward (◀), a bottom-edge
     * (horizontal) tab expands upward (▲). No writing-mode rotation — it's a
     * single glyph, not text.
     * @returns {SvCompanionTabView} The current instance.
     * @category Display
     */
    syncLabelOrientation () {
        const label = this.labelView();
        label.setCssProperty("writing-mode", null);
        label.setString(this.isVerticalTab() ? "◂" : "▴"); // ◂ / ▴
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
