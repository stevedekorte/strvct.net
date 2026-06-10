"use strict";

/** * @module library.node.node_views.browser.stack.SvAccordion
 */

/** * @class SvAccordionNavView
 * @extends SvNavView
 * @classdesc The navigation column used inside an SvAccordionStackView layer.
 *
 * Unlike a Miller-column SvNavView, an accordion nav view always fills its
 * layer (the layer geometry is set by the .SvAccordionLayer CSS class), so it
 * skips all window-width math, target-width clamps, column borders, and
 * edge-pan resize gestures. Header/scroll/tiles/footer structure is inherited
 * unchanged — tiles inside layers are ordinary SvTile subclasses, and
 * conversation nodes keep their chat-input footers.
 */

(class SvAccordionNavView extends SvNavView {

    /**
     * @description Accordion layers always lay tiles out vertically.
     * @returns {boolean}
     * @category Layout
     */
    isVertical () {
        return true;
    }

    /**
     * @description Fills the layer instead of computing a column width.
     * @returns {SvAccordionNavView} The nav view.
     * @category Layout
     */
    syncOrientation () {
        this.setFlexDirection("column");
        this.setFlexGrow(1);
        this.setFlexShrink(1);
        this.setMinWidth(null);
        this.setMaxWidth(null);
        this.setWidth("100%");
        this.setHeight("100%");
        this.setBorderRight(null);
        this.setBorderBottom(null);

        this.scrollView().setIsVertical(true);

        if (this.headerView()) {
            const v = this.headerView();
            v.setWidth("100%");
            v.setHeight("fit-content");
        }

        if (this.footerView()) {
            const v = this.footerView();
            v.setWidth("100%");
            v.setHeight("fit-content");
        }

        return this;
    }

    makeOrientationRight () {
        return this.syncOrientation();
    }

    makeOrientationDown () {
        return this.syncOrientation();
    }

    /**
     * @description No window-width clamping inside an accordion layer.
     * @returns {SvAccordionNavView} The nav view.
     * @category Layout
     */
    updateWidthForWindow () {
        return this;
    }

    /**
     * @description Width never adapts to nodeMinTileWidth inside a layer.
     * @returns {SvAccordionNavView} The nav view.
     * @category Node Management
     */
    syncFromNode () {
        super.syncFromNode();
        this.setMinWidth(null);
        this.setMaxWidth(null);
        this.setWidth("100%");
        return this;
    }

    // --- edge-pan column resizing is disabled inside accordion layers ---

    onRightEdgePanBegin (/*aGesture*/) {
        return this;
    }

    onRightEdgePanMove (/*aGesture*/) {
        return this;
    }

    onRightEdgePanComplete (/*aGesture*/) {
        return this;
    }

    onBottomEdgePanBegin (/*aGesture*/) {
        return this;
    }

    onBottomEdgePanMove (/*aGesture*/) {
        return this;
    }

    onBottomEdgePanComplete (/*aGesture*/) {
        return this;
    }

}.initThisClass());
