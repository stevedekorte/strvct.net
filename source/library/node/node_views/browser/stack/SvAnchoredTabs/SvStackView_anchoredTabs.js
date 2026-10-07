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
            const slot = this.newSlot("anchoredTileWidths", null); // { titles, widths }: tab widths last measured, by titles
            slot.setSlotType("Object");
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
        const pinned = new Set(openNodes.filter(node => layout.isPinned(this.anchoredTabIdFor(node))));
        this.detailView().syncAnchoredPanes(openNodes, widths, pinned);
        this.syncAnchoredTileSelection(openNodes);
        this.syncAnchoredTabStates(openNodes);
        this.noteOpenTabsSeen(openNodes);
        this.anchorTabTiles(openNodes, widths);
        return this;
    }

    /**
     * @description Marks each tab tile with its state for the theme
     * (SvAnchoredTabOpen / Pinned / Evicted / Unseen classes) and draws the
     * unseen dot on a closed tab with unseen content. The tab row scrolls
     * sideways when the tabs don't fit (a phone), rather than collapsing them.
     * @param {Array<SvNode>} openNodes
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    syncAnchoredTabStates (openNodes) {
        const layout = this.anchoredLayout();
        this.navView().scrollView().setOverflowX("auto");
        this.navView().tilesView().tiles().forEach(tile => {
            const node = tile.node ? tile.node() : null;
            if (!node) {
                return;
            }
            const id = this.anchoredTabIdFor(node);
            const unseen = !openNodes.includes(node) && (node.nodeUnseenCount ? node.nodeUnseenCount() : 0) > 0;
            const classes = tile.element().classList;
            classes.toggle("SvAnchoredTabOpen", openNodes.includes(node));
            classes.toggle("SvAnchoredTabPinned", layout.isPinned(id));
            classes.toggle("SvAnchoredTabEvicted", layout.isEvicted(id));
            classes.toggle("SvAnchoredTabUnseen", unseen);
            tile.setCssProperty("background-image", unseen ? this.unseenDotImage() : null);
        });
        return this;
    }

    /**
     * @description The unseen dot: a small disc in the tab's top-right
     * corner in the theme's attention color — decoration, so drawn as a
     * background image rather than generated text.
     * @returns {String}
     * @category Anchored Tabs
     */
    unseenDotImage () {
        return "radial-gradient(circle at calc(100% - 10px) 14px, var(--sv-attention, #b0413e) 3.5px, transparent 4.5px)";
    }

    noteOpenTabsSeen (openNodes) {
        openNodes.forEach(node => {
            if (node.nodeUnseenCount && node.nodeUnseenCount() > 0 && node.noteContentSeen) {
                node.noteContentSeen();
            }
        });
        return this;
    }

    // --- pane controls ---

    /**
     * @description The pane's pin control: pins or unpins it, opening or
     * closing nothing.
     * @param {SvNode} node
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    anchoredTogglePin (node) {
        const id = this.anchoredTabIdFor(node);
        this.anchoredLayout().setTabPinned(id, !this.anchoredLayout().isPinned(id));
        return this.applyAnchoredLayout();
    }

    anchoredWidthLeftOf (rightNode) {
        const leftId = this.anchoredLayout().leftNeighborOf(this.anchoredTabIdFor(rightNode));
        return leftId ? (this.anchoredLayout().paneWidths().get(leftId) || 0) : 0;
    }

    /**
     * @description A divider was dragged: the pane left of `rightNode` wants
     * `leftWidth`. The layout clamps and remembers it; this re-renders.
     * @param {SvNode} rightNode
     * @param {Number} leftWidth
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    anchoredDragDivider (rightNode, leftWidth) {
        const rightId = this.anchoredTabIdFor(rightNode);
        const leftId = this.anchoredLayout().leftNeighborOf(rightId);
        if (leftId) {
            this.anchoredLayout().dragDivider(leftId, rightId, leftWidth);
            this.applyAnchoredLayout();
        }
        return this;
    }

    // --- anchoring: each open tab at the top-left of its pane ---

    /**
     * @description Places each open tab over its pane. The tab row is a flex
     * row of tiles; a segment is an open tab plus the closed tabs after it,
     * and the segment's last tile gets the right margin that makes the
     * segment exactly as wide as its pane (plus the divider). Tile widths are
     * measured only when the tab titles change (measuredTileWidths), all at
     * once, before any write; the margins are then written on every layout.
     * @param {Array<SvNode>} openNodes
     * @param {Map<SvNode, Number>} widths
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    anchorTabTiles (openNodes, widths) {
        const tiles = this.navView().tilesView().tiles();
        const tileWidths = this.measuredTileWidths(tiles);
        if (tiles.length === 0 || tileWidths.every(w => w === 0)) {
            this.addWeakTimeout(() => this.anchorTabTiles(openNodes, widths), 50); // not laid out yet
            return this;
        }
        // The gap rides a custom property, turned into the margin by one
        // stylesheet rule for tiles in an anchored row: tile style passes
        // (setMargin) reset the margin longhands and erased a plain
        // margin-right. Written every time — the tiles view can rebuild its
        // tiles — with same-value writes skipped and widths from the cache.
        this.ensureAnchoredTabCss();
        this.navView().tilesView().element().classList.add("SvAnchoredTabRow");
        const margins = this.segmentMargins(tiles, tileWidths, openNodes, widths);
        tiles.forEach((tile, i) => tile.setCssProperty("--sv-anchor-gap", (margins.get(i) || 0) + "px"));
        return this;
    }

    /**
     * @description The one stylesheet rule anchoring needs, added once.
     * @returns {SvStackView_anchoredTabs}
     * @category Anchored Tabs
     */
    ensureAnchoredTabCss () {
        if (!SvStackView._anchoredTabCssAdded) {
            SvStackView._anchoredTabCssAdded = true;
            SvWebDocument.shared().addStyleSheetString(`
                .SvAnchoredTabRow > * {
                    margin-right: var(--sv-anchor-gap, 0px) !important;
                }
            `);
        }
        return this;
    }

    /**
     * @description The tab tiles' widths, measured only when the tab titles
     * changed: a divider drag or a resize changes the pane widths every frame
     * and must not measure (a forced layout per frame). Measured all at once,
     * before anything is written.
     * @param {Array<SvTile>} tiles
     * @returns {Array<Number>}
     * @category Anchored Tabs
     */
    measuredTileWidths (tiles) {
        const titles = this.tabTitlesSignature(tiles);
        const cached = this.anchoredTileWidths();
        if (cached && cached.titles === titles && cached.widths.length === tiles.length) {
            return cached.widths;
        }
        const widths = tiles.map(tile => tile.element().offsetWidth);
        if (widths.some(w => w > 0)) {
            this.setAnchoredTileWidths({ titles: titles, widths: widths });
        }
        return widths;
    }

    tabTitlesSignature (tiles) {
        return tiles.map(tile => (tile.node() ? tile.node().title() + (tile.node().isVisible() ? "" : "-") : "")).join("|");
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
                // a pane's box is its width plus, after the first, its 1px left-border divider
                const box = (widths.get(openNodes[segment]) || 0) + (segment > 0 ? divider : 0);
                margins.set(lastTileOfSegment, Math.max(0, box - used));
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
        this.scrollTabIntoView(tile);
        return this.anchoredPathMayHaveChanged();
    }

    scrollTabIntoView (tile) {
        if (tile.element().scrollIntoView) {
            tile.element().scrollIntoView({ block: "nearest", inline: "nearest" }); // a phone's row scrolls sideways
        }
        return this;
    }

}.initThisCategory());
