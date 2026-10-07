"use strict";

/**
 * @module library.node.node_views.browser.stack.SvAnchoredTabs
 */

/**
 * @class SvAnchoredDividerHandle
 * @extends SvDomView
 * @classdesc The draggable divider on an anchored-tabs pane's left edge
 * (every pane but the first): a narrow invisible hit area over the 1px
 * divider line. Dragging tracks the pointer 1:1; the layout keeps both sides
 * at or above their minimums and remembers the split for that pair until the
 * set of open panes changes (SvAnchoredTabsLayout.dragDivider).
 */
(class SvAnchoredDividerHandle extends SvDomView {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("host", null); // the anchored-tabs stack
            slot.setSlotType("SvStackView");
        }
        {
            const slot = this.newSlot("rightNode", null); // the pane to the right of this divider
            slot.setSlotType("SvNode");
        }
        {
            const slot = this.newSlot("startLeftWidth", 0); // the left pane's width when the drag began
            slot.setSlotType("Number");
        }
    }

    init () {
        super.init();
        this.setElementClassName("SvAnchoredDividerHandle");
        this.setPosition("absolute");
        this.setTop("0px");
        this.setBottom("0px");
        this.setLeft("-4px");
        this.setWidth("8px");
        this.setCursor("col-resize");
        this.setUserSelect("none");
        this.setZIndex(10);
        this.element().setAttribute("aria-hidden", "true");
        this.addDefaultPanGesture();
        return this;
    }

    onPanBegin (/*aGesture*/) {
        this.setStartLeftWidth(this.host().anchoredWidthLeftOf(this.rightNode()));
        this.clearTextSelection();
        return this;
    }

    onPanMove (aGesture) {
        this.host().anchoredDragDivider(this.rightNode(), this.startLeftWidth() + aGesture.diffPos().x());
        this.clearTextSelection(); // a drag across the panes would otherwise select their text
        return this;
    }

    clearTextSelection () {
        const selection = window.getSelection ? window.getSelection() : null;
        if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
        return this;
    }

    onPanComplete (aGesture) {
        return this.onPanMove(aGesture);
    }

}.initThisClass());
