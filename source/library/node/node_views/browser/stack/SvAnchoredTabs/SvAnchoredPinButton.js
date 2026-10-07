"use strict";

/**
 * @module library.node.node_views.browser.stack.SvAnchoredTabs
 */

/**
 * @class SvAnchoredPinButton
 * @extends SvDomView
 * @classdesc The pin control in an anchored-tabs pane's top-right corner
 * (Plans/Anchor Tabs § Gestures: the visible pin control, because the
 * shift-click and long-press shortcuts alone are undiscoverable). Toggles
 * the pane's pin without opening or closing anything. Drawn in currentColor,
 * so it follows the theme; a pinned pane's pin is solid, an unpinned one's
 * faint.
 */
(class SvAnchoredPinButton extends SvDomView {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("host", null); // the anchored-tabs stack
            slot.setSlotType("SvStackView");
        }
        {
            const slot = this.newSlot("paneNode", null); // the tab this pane shows
            slot.setSlotType("SvNode");
        }
        {
            const slot = this.newSlot("isPinned", false);
            slot.setSlotType("Boolean");
        }
    }

    static pinSvg () {
        return "<svg viewBox='0 0 24 24' width='16' height='16' aria-hidden='true'><path fill='currentColor' d='M16 3l5 5-2 1-3.5 3.5.5 4-1.5 1.5-4-4L5 19.5 4.5 19 9 14.5l-4-4L6.5 9l4 .5L14 5z'/></svg>";
    }

    init () {
        super.init();
        this.setElementClassName("SvAnchoredPinButton");
        this.setPosition("absolute");
        this.setTop("10px");
        this.setRight("12px");
        this.setWidth("24px");
        this.setHeight("24px");
        this.setDisplay("flex");
        this.setAlignItems("center");
        this.setJustifyContent("center");
        this.setCursor("pointer");
        this.setZIndex(10);
        this.element().innerHTML = SvAnchoredPinButton.pinSvg(); // a fixed icon, no user text
        this.element().setAttribute("role", "button");
        this.addDefaultTapGesture();
        this.syncPinnedLook();
        return this;
    }

    didUpdateSlotIsPinned () {
        this.syncPinnedLook();
    }

    syncPinnedLook () {
        const pinned = this.isPinned();
        this.setOpacity(pinned ? 0.9 : 0.3);
        const label = pinned ? "Unpin this pane" : "Pin this pane";
        this.element().setAttribute("title", label);
        this.element().setAttribute("aria-label", label);
        this.element().setAttribute("aria-pressed", pinned ? "true" : "false");
        return this;
    }

    onTapComplete (/*aGesture*/) {
        if (this.host() && this.paneNode()) {
            this.host().anchoredTogglePin(this.paneNode());
        }
        return this;
    }

}.initThisClass());
