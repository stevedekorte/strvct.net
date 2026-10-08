"use strict";

/**
 * @module library.node.node_views.browser.stack.SvAnchoredTabs
 */

/**
 * @class SvAnchoredPinButton
 * @extends SvDomView
 * @classdesc The pin control on an anchored tab (Plans/Anchor Tabs §
 * Gestures: a visible control, because the shift-click and long-press
 * shortcuts alone are undiscoverable). A small diamond in the tab's leading
 * padding: solid while the tab is pinned, a faint outline when the pointer is
 * over an unpinned tab, otherwise invisible — as in the prototype, where a
 * pinned tab is marked ◆ and nothing else crowds the row. Tapping it on an
 * open tab pins or unpins it without opening or closing anything; on a
 * closed tab, it opens the tab pinned.
 *
 * Positioned absolutely inside the tab, so it never changes the tab's width
 * (the anchoring measures tab widths only when titles change). Its look is
 * the anchored tab stylesheet's (SvStackView_anchoredTabs), in currentColor.
 */
(class SvAnchoredPinButton extends SvDomView {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("host", null); // the anchored-tabs stack
            slot.setSlotType("SvStackView");
        }
        {
            const slot = this.newSlot("tabNode", null); // the tab this control pins
            slot.setSlotType("SvNode");
        }
        {
            const slot = this.newSlot("isPinned", false);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init();
        this.setElementClassName("SvAnchoredPinButton");
        this.setPosition("absolute");
        this.setLeft("4px");
        this.setTop("50%");
        this.setMarginTop("-10px");
        this.setWidth("20px");
        this.setHeight("20px");
        this.setCursor("pointer");
        this.setZIndex(3); // above the tile's content view
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
        this.element().classList.toggle("isPinned", pinned);
        const label = pinned ? "Unpin this tab" : "Pin this tab";
        this.element().setAttribute("title", label);
        this.element().setAttribute("aria-label", label);
        this.element().setAttribute("aria-pressed", pinned ? "true" : "false");
        return this;
    }

    onTapComplete (/*aGesture*/) {
        if (this.host() && this.tabNode()) {
            this.host().anchoredPinControlTapped(this.tabNode());
        }
        return this;
    }

}.initThisClass());
