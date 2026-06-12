"use strict";

/** * @module library.node.node_views.browser.stack.SvCompanion
 */

/** * @class SvCompanionTabView
 * @extends SvFlexDomView
 * @classdesc The collapsed form of an SvCompanionView: a thin tab hugging the
 * edge the companion collapsed toward, showing the companion node's title and
 * an attention badge. Tapping it toggles the companion's overlay mode.
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
         * @member {SvTextView} labelView - shows the companion node's title
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
        label.setFontSize("0.8em");
        label.setWhiteSpace("nowrap");
        label.setPointerEvents("none");
        this.setLabelView(label);
        this.addSubview(label);

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

    syncLabelOrientation () {
        const label = this.labelView();
        if (this.isVerticalTab()) {
            label.setCssProperty("writing-mode", "vertical-rl");
        } else {
            label.setCssProperty("writing-mode", null);
        }
        return this;
    }

    setTitle (aString) {
        this.labelView().setString(aString ? aString : "");
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
            companion.toggleOverlay();
        }
        return this;
    }

}.initThisClass());
