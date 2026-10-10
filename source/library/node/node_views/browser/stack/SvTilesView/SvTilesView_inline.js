"use strict";

/**
 * @module library.node.node_views.browser.stack.SvTilesView
 */

/**
 * @class SvTilesView_inline
 * @extends SvTilesView
 * @classdesc Inline navigation (Plans/Inline Navigation): a tiles view whose
 * node answers nodeChildrenLayout() "inline" shows the next levels of the
 * tree in place, as a document, instead of one level per column.
 *
 * - The document's subnodes that have subnodes of their own become sections
 *   (SvInlineSectionTile): a heading, then a nested tiles view of their
 *   subnodes. Leaves stay their ordinary tiles, as rows.
 * - Sections flow in CSS columns as wide as the node's nodeMinTileWidth, so
 *   one, two or three columns follow from the width available — no
 *   measuring, so nothing here forces layout.
 * - Tapping inside a document does not navigate (version 1: rows are read
 *   and edited in place; navigating past the inlined levels comes later).
 *
 * A nested tiles view (inside a section) knows it is nested and how many
 * more levels it may inline; a root one reads both from its node.
 */
(class SvTilesView_inline extends SvTilesView {

    initPrototypeSlots_inline () {
        {
            const slot = this.newSlot("isInlineNested", false); // inside a section of an inline document
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("nestedInlineDepth", 0); // a nested view's remaining levels to inline
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Whether this tiles view is the top of an inline document.
     * @returns {Boolean}
     * @category Inline
     */
    isInlineDocument () {
        const node = this.node();
        return !this.isInlineNested() && !!(node && node.nodeChildrenLayout && node.nodeChildrenLayout() === "inline");
    }

    /**
     * @description Whether this view is part of an inline document, at its
     * top or inside a section.
     * @returns {Boolean}
     * @category Inline
     */
    isInlineLayout () {
        return this.isInlineNested() || this.isInlineDocument();
    }

    /**
     * @description How many more levels below this view are shown in place.
     * @returns {Number}
     * @category Inline
     */
    inlineDepth () {
        if (this.isInlineNested()) {
            return this.nestedInlineDepth();
        }
        return this.isInlineDocument() ? this.node().nodeInlineDepth() : 0;
    }

    /**
     * @description The tile class for a subnode shown in place as a section,
     * or null when it is an ordinary tile (a leaf, a node that opts out, or
     * past the inlined depth).
     * @param {SvNode} aSubnode
     * @returns {Function|null}
     * @category Inline
     */
    inlineSectionProtoFor (aSubnode) {
        if (this.inlineDepth() <= 0 || !aSubnode.nodeIsInlined || !aSubnode.nodeIsInlined()) {
            return null;
        }
        const target = SvInlineSectionTile.inlineTargetOf(aSubnode);
        return (target.nodeIsInlined() && target.subnodeCount() > 0) ? SvInlineSectionTile : null;
    }

    /**
     * @description Applies the document look to the top of an inline
     * document: the sections flow in columns as wide as the node asks. Runs
     * on every sync; the writes are same-value skipped.
     * @returns {SvTilesView_inline}
     * @category Inline
     */
    syncInlineLayout () {
        const isDocument = this.isInlineDocument();
        SvInlineSectionTile.ensureInlineCss();
        this.element().classList.toggle("SvInlineDocument", isDocument);
        this.element().classList.toggle("SvInlineNested", this.isInlineNested());
        this.element().classList.toggle("SvInlineRows", isDocument && this.node().nodeInlineFlow() === "rows");
        if (isDocument) {
            this.setCssProperty("--inline-column-width", Math.max(200, this.node().nodeMinTileWidth() || 0) + "px");
            this.setCssProperty("--inline-max-columns", String(Math.max(1, this.node().nodeInlineMaxColumns())));
            this.setAllowsCursorNavigation(false);
        }
        return this;
    }

    /**
     * @description A tap inside an inline document. Rows are read and edited
     * where they are: the tapped row takes focus, as in a column (so its
     * value then edits on a double tap), and a row with a description opens
     * or closes; nothing is selected and nothing navigates.
     * @param {SvTile} anItem
     * @returns {SvTilesView_inline}
     * @category Inline
     */
    didTapInlineItem (anItem) {
        if (!anItem) {
            return this;
        }
        if (!anItem.hasFocusedDecendantView()) {
            anItem.focus();
        }
        if (this.isOpenableInlineRow(anItem)) {
            return this.toggleInlineRow(anItem);
        }
        return this.navigatePastInline(anItem);
    }

    isOpenableInlineRow (tile) {
        return tile.element().classList.contains("SvTileLongSubtitle") && !tile.isKindOf(SvInlineSectionTile); // a class, not a measurement
    }

    /**
     * @description A tile past the inlined levels — one with a subtree of its
     * own that is not shown in place — opens in the normal navigation, from
     * the browser this document sits in. Rows without a subtree stay put.
     * @param {SvTile} tile
     * @returns {SvTilesView_inline}
     * @category Inline
     */
    navigatePastInline (tile) {
        const node = tile.node ? tile.node() : null;
        const target = node ? SvInlineSectionTile.inlineTargetOf(node) : null;
        const browser = this.firstParentViewWithAncestorClass(SvBrowserView);
        if (target && target.subnodeCount() > 0 && !tile.isKindOf(SvInlineSectionTile) && browser) {
            browser.navigateToNode(target);
        }
        return this;
    }

    /**
     * @description Opens or closes a row that has a description. Which rows
     * are open is view state, like which tab is open: kept on the row's
     * element, never on its node. Whether a row has a description is read
     * from its node, not the page.
     * @param {SvTile} tile
     * @returns {SvTilesView_inline}
     * @category Inline
     */
    toggleInlineRow (tile) {
        tile.element().classList.toggle("SvInlineOpen");
        tile.setAttribute("aria-expanded", tile.element().classList.contains("SvInlineOpen") ? "true" : "false");
        return this;
    }

}.initThisCategory());
