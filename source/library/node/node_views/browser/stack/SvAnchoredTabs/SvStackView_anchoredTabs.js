"use strict";

/**
 * @module library.node.node_views.browser.stack.SvAnchoredTabs
 */

/**
 * @class SvStackView_anchoredTabs
 * @extends SvStackView
 * @classdesc A stack whose node answers nodeSubnodesAreAnchoredTabs()
 * (Plans/Anchor Tabs, milestone 2a): its nav is the tab row (the stack runs
 * "down", so the nav lays its tiles out horizontally), several tiles are
 * selected at once — the open tabs — and the detail view shows one pane per
 * open tab. Which tabs are open, pinned and evicted, and how wide each pane
 * is, is decided by an SvAnchoredTabsLayout; this category feeds it the tabs
 * (from the subnodes and their hints), the container width and the player's
 * taps, and renders its answer.
 *
 * Tab hints read from each subnode: isVisible (available), nodeMinTileWidth
 * (comfortable width), nodeMinTileWidthWhenYielding (minimum, else the
 * comfortable width), nodeTabPinPreference.
 *
 * Entry points live on SvStackView itself (a category cannot override what
 * the class defines): syncFromNode picks the "down" direction and
 * syncFromNavSelection hands an anchored stack to syncAnchoredPanes.
 */
(class SvStackView_anchoredTabs extends SvStackView {

    initPrototypeSlots_anchoredTabs () {
        {
            const slot = this.newSlot("anchoredTabsLayout", null);
            slot.setSlotType("SvAnchoredTabsLayout");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("anchoredContainerWidth", null); // from the detail view's ResizeObserver
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Whether this stack presents its node's subnodes as
     * anchored tabs.
     * @returns {Boolean}
     * @category Anchored Tabs
     */
    isAnchoredTabs () {
        const node = this.node();
        return !!(node && node.nodeSubnodesAreAnchoredTabs && node.nodeSubnodesAreAnchoredTabs());
    }

    anchoredLayout () {
        if (!this.anchoredTabsLayout()) {
            this.setAnchoredTabsLayout(SvAnchoredTabsLayout.clone());
        }
        return this.anchoredTabsLayout();
    }

    anchoredTabNodes () {
        return this.node().subnodes().slice();
    }

    anchoredTabIdFor (node) {
        return node.svTypeId();
    }

    /**
     * @description A subnode as a tab spec for the layout object.
     * @param {SvNode} node
     * @returns {Object}
     * @category Anchored Tabs
     */
    anchoredTabSpecFor (node) {
        const comfortable = (node.nodeMinTileWidth && node.nodeMinTileWidth()) || 320;
        const yielding = node.nodeMinTileWidthWhenYielding ? node.nodeMinTileWidthWhenYielding() : null;
        return {
            id: this.anchoredTabIdFor(node),
            minWidth: yielding || comfortable,
            comfortableWidth: comfortable,
            isAvailable: node.isVisible ? node.isVisible() !== false : true,
            pinPreference: node.nodeTabPinPreference ? node.nodeTabPinPreference() : null
        };
    }

    /**
     * @description Re-reads the tabs from the subnodes and re-lays the panes
     * out. Runs on every sync of this stack, so it reads no geometry: the
     * width is the cached one.
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    syncAnchoredPanes () {
        const layout = this.anchoredLayout();
        layout.updateTabs(this.anchoredTabNodes().map(node => this.anchoredTabSpecFor(node)));
        layout.updateContainerWidth(this.anchoredWidth());
        return this.applyAnchoredLayout();
    }

    /**
     * @description The width the panes share: the detail view's observed
     * width once known, else the cached top width (no measurement here).
     * @returns {Number}
     * @category Anchored Tabs
     */
    anchoredWidth () {
        const observed = this.anchoredContainerWidth();
        return observed || this.topViewWidth() || 0;
    }

    /**
     * @description The width this stack's panes claim in its browser's
     * compaction: the smallest minimum among the open panes (one pane must
     * fit), or 0 when this is not an anchored stack. Without it, the columns
     * to the left never collapsed and a phone left the panes 120px.
     * @returns {Number}
     * @category Anchored Tabs
     */
    anchoredClaimWidth () {
        if (!this.isAnchoredTabs() || !this.anchoredTabsLayout()) {
            return 0;
        }
        const layout = this.anchoredTabsLayout();
        const minimums = layout.openIdsInOrder().map(id => layout.tabWithId(id).minWidth);
        return minimums.length > 0 ? Math.min(...minimums) : 0;
    }

    onAnchoredContainerWidth (width) {
        if (width === this.anchoredContainerWidth()) {
            return this;
        }
        this.setAnchoredContainerWidth(width);
        this.anchoredLayout().updateContainerWidth(width);
        return this.applyAnchoredLayout();
    }

    /**
     * @description Renders the layout's answer: the panes, and the tab row's
     * selection (the open tabs are the selected tiles).
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    applyAnchoredLayout () {
        const layout = this.anchoredLayout();
        const byId = new Map(this.anchoredTabNodes().map(node => [this.anchoredTabIdFor(node), node]));
        const openNodes = layout.openIdsInOrder().map(id => byId.get(id)).filter(node => !!node);
        const widthsById = layout.paneWidths();
        const widths = new Map(openNodes.map(node => [node, widthsById.get(this.anchoredTabIdFor(node))]));
        this.detailView().syncAnchoredPanes(openNodes, widths);
        this.syncAnchoredTileSelection(openNodes);
        return this;
    }

    syncAnchoredTileSelection (openNodes) {
        const tilesView = this.navView().tilesView();
        const openTiles = tilesView.tiles().filter(tile => tile.node && openNodes.includes(tile.node()));
        tilesView.unselectAllTilesExceptTiles(openTiles);
        return this;
    }

    /**
     * @description A tab tile was tapped (pin: shift/option-click, and the
     * pin control in milestone 2c). The layout decides; this renders it.
     * @param {SvTile} tile
     * @param {Boolean} isPin
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    anchoredTapTile (tile, isPin) {
        const node = tile && tile.node ? tile.node() : null;
        if (!node) {
            return this;
        }
        const id = this.anchoredTabIdFor(node);
        if (isPin) {
            this.anchoredLayout().pinTab(id);
        } else {
            this.anchoredLayout().tapTab(id);
        }
        return this.applyAnchoredLayout();
    }

}.initThisCategory());
