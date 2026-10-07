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
            const slot = this.newSlot("anchoredTabsSignature", null); // what the tab row was last anchored to
            slot.setSlotType("String");
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
        this.anchorTabTiles(openNodes, widths);
        return this;
    }

    // --- anchoring: each open tab at the top-left of its pane ---

    /**
     * @description Places each open tab over its pane. The tab row is a flex
     * row of tiles; a segment is an open tab plus the closed tabs after it,
     * and the segment's last tile gets the right margin that makes the
     * segment exactly as wide as its pane (plus the divider). Tile widths are
     * measured once, all of them, then the margins are written — and only
     * when the open set, the pane widths or the tab titles changed, never on
     * an ordinary sync.
     * @param {Array<SvNode>} openNodes
     * @param {Map<SvNode, Number>} widths
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    anchorTabTiles (openNodes, widths) {
        const tiles = this.navView().tilesView().tiles();
        const signature = this.anchoringSignature(tiles, openNodes, widths);
        if (signature === this.anchoredTabsSignature()) {
            return this;
        }
        const tileWidths = tiles.map(tile => tile.element().offsetWidth); // the one read, before any write
        if (tiles.length === 0 || tileWidths.every(w => w === 0)) {
            this.addWeakTimeout(() => this.anchorTabTiles(openNodes, widths), 50); // not laid out yet
            return this;
        }
        const margins = this.segmentMargins(tiles, tileWidths, openNodes, widths);
        tiles.forEach((tile, i) => tile.setMarginRight((margins.get(i) || 0) + "px"));
        this.setAnchoredTabsSignature(signature);
        return this;
    }

    anchoringSignature (tiles, openNodes, widths) {
        const titles = tiles.map(tile => (tile.node() ? tile.node().title() + (tile.node().isVisible() ? "" : "-") : "")).join("|");
        return titles + "#" + openNodes.map(node => this.anchoredTabIdFor(node) + ":" + widths.get(node)).join(",");
    }

    /**
     * @description The right margin for the last tile of each segment, by
     * tile index. Closed tabs before the first open tab sit at its left (the
     * first pane's segment starts with them).
     * @param {Array<SvTile>} tiles
     * @param {Array<Number>} tileWidths
     * @param {Array<SvNode>} openNodes
     * @param {Map<SvNode, Number>} widths
     * @returns {Map<Number, Number>}
     * @category Anchored Tabs
     */
    segmentMargins (tiles, tileWidths, openNodes, widths) {
        const margins = new Map();
        const divider = this.anchoredLayout().dividerWidth();
        let used = 0;
        let lastTileOfSegment = -1;
        let segment = -1;
        tiles.forEach((tile, i) => {
            const opensSegment = segment + 1 < openNodes.length && tile.node() === openNodes[segment + 1];
            if (opensSegment && segment >= 0) {
                margins.set(lastTileOfSegment, this.segmentRemainder(openNodes[segment], widths, used, divider));
                used = 0;
            }
            if (opensSegment) {
                segment++;
            }
            used += tileWidths[i];
            lastTileOfSegment = i;
        });
        return margins; // the last segment needs no margin
    }

    segmentRemainder (node, widths, used, divider) {
        return Math.max(0, (widths.get(node) || 0) + divider - used);
    }

    syncAnchoredTileSelection (openNodes) {
        const tilesView = this.navView().tilesView();
        const openTiles = tilesView.tiles().filter(tile => tile.node && openNodes.includes(tile.node()));
        tilesView.unselectAllTilesExceptTiles(openTiles);
        return this;
    }

    // --- the current path (Plans/Anchor Tabs § The current path) ---

    /**
     * @description The node path inside the current pane — the pane holding
     * focus most recently (else the first open pane) — beginning with its
     * tab's node. The outer chain's selectedNodePathArray ends at this stack
     * and continues with this, so the breadcrumbs and the URL follow the
     * current pane.
     * @returns {Array<SvNode>}
     * @category Anchored Tabs
     */
    anchoredCurrentPanePath () {
        const node = this.anchoredCurrentTabNode();
        const pane = node ? this.detailView().anchoredPaneForNode(node) : null;
        return pane ? pane.selectedNodePathArray() : (node ? [node] : []);
    }

    anchoredCurrentTabNode () {
        const layout = this.anchoredLayout();
        const open = layout.openIdsInOrder();
        const id = open.includes(layout.currentTabId()) ? layout.currentTabId() : open.first();
        return this.anchoredTabNodes().find(node => this.anchoredTabIdFor(node) === id) || null;
    }

    /**
     * @description Selects a path through this stack: the first node after
     * this stack's own is a tab — opened as a click would open it (if it is
     * not open) and made current — and the rest is selected inside its pane.
     * URL restores, breadcrumb clicks and navigation requests all come here.
     * @param {Array<SvNode>} nodePathArray - begins with the node to select
     * in this stack's own tiles (the tab), as SvStackView.selectNodePathArray
     * receives it
     * @returns {Boolean} whether the whole path resolved
     * @category Anchored Tabs
     */
    anchoredSelectNodePathArray (nodePathArray) {
        if (this.anchoredLayout().tabSpecs().length === 0) {
            this.syncAnchoredPanes(); // a path can arrive (a URL on load) before the first sync
        }
        const tabNode = nodePathArray.first();
        const rest = nodePathArray.slice(1);
        if (!tabNode) {
            return true; // nothing below this stack to select: the panes stay as they are
        }
        if (!this.anchoredTabNodes().includes(tabNode)) {
            return false;
        }
        const id = this.anchoredTabIdFor(tabNode);
        if (!this.anchoredLayout().isOpen(id)) {
            this.anchoredLayout().tapTab(id);
        }
        this.anchoredLayout().setCurrentTabId(id);
        this.applyAnchoredLayout();
        const pane = this.detailView().anchoredPaneForNode(tabNode);
        if (!pane) {
            return false;
        }
        if (rest.length > 0) {
            // the pane may have been created by this call, its columns not yet
            // materialized: the pane's own bounded retry finishes the selection
            // (a URL change has no retry of its own; a nav request's would
            // re-open the tab each time)
            pane.selectPathWithRetry(rest);
        }
        return true;
    }

    /**
     * @description A pane was navigated in or took focus: it is the current
     * pane, and the outer path (breadcrumbs, URL) follows it.
     * @param {SvBrowserView} pane
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    onAnchoredPaneActivated (pane) {
        const node = this.detailView().anchoredNodeForPane(pane);
        if (node) {
            this.anchoredLayout().setCurrentTabId(this.anchoredTabIdFor(node));
        }
        return this.anchoredPathMayHaveChanged();
    }

    anchoredPathMayHaveChanged () {
        const root = this.rootStackView();
        if (root && root.topDidChangeNavSelection) {
            root.topDidChangeNavSelection();
        }
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
        this.applyAnchoredLayout();
        return this.anchoredPathMayHaveChanged();
    }

}.initThisCategory());
