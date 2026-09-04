"use strict";

/** * @module library.node.node_views.browser.stack
 */

/** * @class SvNavView
 * @extends SvNodeView
 * @classdesc SvNavView is a component for navigation in a stack-based layout. It includes header, footer, and scrollable content areas.
 *
 *
 * Notes: SvNavView instances have their width set in several ways:
 *
 * 1. In makeOrientationRight(): Sets default width using minAndMaxWidth("17em")
 * 2. In targetWidth(): Calculates desired width starting from 400px, using the node's minimum tile width as a reference
 * 3. Through gesture handling: The onRightEdgePanMove() method allows users to resize by dragging the right edge
 * 4. Via SvStackView width management: The parent SvStackView can compact and expand NavViews based on available space
 * 5. The width can also be adapted using setWidth("-webkit-fill-available") when a SvNavView needs to fill remaining space


 */

(class SvNavView extends SvNodeView {

    initPrototypeSlots () {
        /**
         * @member {SvStackView} stackView - pointer to parent SvStackView
         * @category Layout
         */
        {
            const slot = this.newSlot("stackView", null);
            slot.setSlotType("SvStackView");
        }

        /**
         * @member {SvDomView} headerView - A subview placed in top of SvNavView, set to display:none if no node.headerNode(), contains a SvTile?
         * @category Layout
         */
        {
            const slot = this.newSlot("headerView", null);
            slot.setSlotType("SvDomView");
        }

        /**
         * @member {SvScrollView} scrollView - A subview which is a scrollView, fills the SvNavView (between headerView and footerView), and contains SvTilesView which may be larger.
         * @category Layout
         */
        {
            const slot = this.newSlot("scrollView", null);
            slot.setSlotType("SvScrollView");
        }

        /**
         * @member {SvDomView} footerView - A subview laced in bottom of SvNavView, set to display:none if no node.footerNode().
         * @category Layout
         */
        {
            const slot = this.newSlot("footerView", null);
            slot.setSlotType("SvDomView");
        }

        /**
         * @member {SvTilesView} tilesView - Is inside scrollView, contains the tiles that are displayed in the SvNavView
         * @category Layout
         */
        {
            const slot = this.newSlot("tilesView", null);
            slot.setSlotType("SvTilesView");
        }

        /**
         * @member {SvEdgeHandleView} headerHandleView - edge pill on the
         * boundary between the header region and the scroll area; active only
         * when the node's headerNode() conforms to SvCollapsibleRegionProtocol
         * @category Layout
         */
        {
            const slot = this.newSlot("headerHandleView", null);
            slot.setSlotType("SvEdgeHandleView");
        }

        /**
         * @member {SvEdgeHandleView} footerHandleView - edge pill on the
         * boundary between the scroll area and the footer region; active only
         * when the node's footerNode() conforms to SvCollapsibleRegionProtocol
         * @category Layout
         */
        {
            const slot = this.newSlot("footerHandleView", null);
            slot.setSlotType("SvEdgeHandleView");
        }

        /**
         * @member {SvEdgeHandleView} companionHandleView - edge pill on this
         * column's right edge, shown only while this is the deepest column
         * and the adjacent companion is COLLAPSED. The collapsed companion is
         * zero-width (completely unseen — no gutter, no bar over the
         * theatre's dark field), so its pill must anchor in the column beside
         * it, exactly like the header/footer pills overlay the scroll area.
         * While docked, the companion's own inset pill takes over.
         * @category Layout
         */
        {
            const slot = this.newSlot("companionHandleView", null);
            slot.setSlotType("SvEdgeHandleView");
        }

        /**
         * @member {Boolean} isCollapsed - Whether the SvNavView is collapsed
         * @category State
         */
        {
            const slot = this.newSlot("isCollapsed", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} animatesCollapse - Whether the SvNavView should animate when collapsing or uncollapsing
         * @category Animation
         */
        {
            const slot = this.newSlot("animatesCollapse", true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {String} beforeEdgePanBorderBottom - The border style before a bottom edge pan gesture
         * @private
         * @category State
         */
        {
            const slot = this.newSlot("beforeEdgePanBorderBottom", null);
            slot.setSlotType("String");
        }

        /**
         * @member {String} beforeEdgePanBorderRight - The border style before a right edge pan gesture -
         * @private
         * @category State
         */
        {
            const slot = this.newSlot("beforeEdgePanBorderRight", null);
            slot.setSlotType("String");
        }

        /**
         * @member {SvDomView} clickToAddView - A view that is displayed when the SvNavView is empty and the user clicks to add an item. Only a subview when the SvNavView is empty.
         * @private
         * @category State
         */
        {
            const slot = this.newSlot("clickToAddView", null);
            slot.setSlotType("SvDomView");
        }
    }

    /**
     * @description Calculates the target width for the SvNavView
     * @returns {number} The calculated target width
     * @category Layout
     */
    /**
     * @description The width available to this nav view's stack chain — the
     * root stack's container width (so embedded browsers size to their
     * container, not the window). Falls back to the window width when the
     * view isn't laid out yet.
     * @returns {number} The available width in px.
     * @category Layout
     */
    availableNavWidth () {
        const stackView = this.stackView();
        if (stackView) {
            const w = stackView.topViewWidth();
            if (w > 0) {
                return w;
            }
        }
        return SvWebBrowserWindow.shared().width();
    }

    targetWidth () {
        const defaultWidth = 270;
        if (this.node()) {
            const minWidth = this.node().nodeMinTileWidth();
            const maxWidth = this.availableNavWidth() - 1;
            let w = Math.max(defaultWidth, minWidth);
            // Columns whose titled tiles reserve a leading thumbnail frame get
            // that width back, so the frame doesn't steal it from the
            // title/subtitle. The text area is flex:10, so the extra width
            // flows straight into it — no content measurement / reflow.
            w += this.thumbnailWidthAllowance();
            w = Math.min(w, maxWidth);
            if (w) {
                return w;
            }
        }
        return defaultWidth;
    }

    /**
     * @description The width this column claims when a companion's focused
     * node asks for width (its hint). A node may declare a yield floor —
     * nodeMinTileWidthWhenYielding() — smaller than its comfortable
     * nodeMinTileWidth claim (e.g. a narration column that likes 900 but
     * reads fine at 600); the companion hint may then compress this column
     * to that floor, never below. Without the declaration this equals
     * targetWidth(): undeclared columns concede nothing.
     * @returns {number}
     * @category Layout
     */
    yieldTargetWidth () {
        const node = this.node();
        const yieldMin = (node && node.nodeMinTileWidthWhenYielding)
            ? node.nodeMinTileWidthWhenYielding() : null;
        if (typeof yieldMin !== "number" || yieldMin <= 0) {
            return this.targetWidth();
        }
        const w = Math.max(270, yieldMin) + this.thumbnailWidthAllowance();
        return Math.min(w, this.targetWidth());
    }

    /**
     * @description Extra column width for a leading thumbnail frame when this
     * column's tiles reserve one (frame width + its trailing gap). Checks the
     * first subnode only — columns are effectively homogeneous — to avoid
     * scanning a possibly-lazy subnode list. Returns 0 when no thumbnail.
     * @returns {number}
     * @category Layout
     */
    thumbnailWidthAllowance () {
        const node = this.node();
        const first = node ? node.subnodes().first() : null;
        const expects = (first && first.nodeExpectsThumbnail) ? first.nodeExpectsThumbnail() : false;
        return expects ? 72 : 0; // 50px frame + 22px gap (see SvTitledTile)
    }

    /**
     * @description Calculates the target height for the SvNavView
     * @returns {number} The calculated target height
     * @category Layout
     */
    targetHeight () {
        if (this.node()) {
            const h = this.node().nodeMinTileHeight();
            if (h) {
                return h;
            }
        }
        return 64;
    }

    /**
     * @description Initializes the SvNavView
     * @returns {SvNavView} The initialized SvNavView instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setFlexDirection("column");
        this.setFlexGrow(1);
        this.setOverflow("hidden");
        this.setUserSelect("none");
        this.setTransition("opacity 0.5s ease-in-out, flex-basis 0s");

        const borderStyle = "1px solid var(--sv-hairline)";
        const backgroundColor = "rgba(255, 255, 255, 0.03)";

        {
            const v = SvTileContainer.clone();
            v.setBorderBottom(borderStyle);
            v.setBackgroundColor(backgroundColor);
            // hug content: never grow into the scroll area's free space
            // (otherwise an empty conversation renders a huge header/footer)
            v.setFlexGrow(0);
            v.setFlexShrink(0);
            this.setHeaderView(v);
            this.addSubview(v);
        }

        this.setScrollView(SvStackScrollView.clone());
        this.addSubview(this.scrollView());

        {
            const v = SvTileContainer.clone();
            v.setBorderTop(borderStyle);
            // A REAL page ground, not a translucent wash: the footer (chat
            // input) can sit over a theatre-dark column, and ink-colored text
            // needs the page behind it to stay readable there.
            v.setBackgroundColor("var(--sv-bg)");
            v.setFlexGrow(0);
            v.setFlexShrink(0);
            this.setFooterView(v);
            this.addSubview(v);
        }

        this.setTilesView(SvTilesView.clone());
        this.scrollView().addSubview(this.tilesView());

        // Collapsible-region edge handles (see SvEdgeHandleView). Appended
        // after the footer, so flex `order` — not DOM order — places every
        // column child; that is also what lets the header handle move to the
        // very top of the column in theatre mode without re-inserting nodes.
        {
            const handle = SvEdgeHandleView.clone();
            handle.configureHorizontal("below"); // overlays the scroll top
            handle.setShowsGradient(true); // narration dissolves under the strip
            this.setHeaderHandleView(handle);
            this.addSubview(handle);
        }
        {
            const handle = SvEdgeHandleView.clone();
            handle.configureHorizontal("above"); // overlays the scroll bottom
            this.setFooterHandleView(handle);
            this.addSubview(handle);
        }
        {
            const handle = SvEdgeHandleView.clone();
            handle.configureVerticalOverlay("right"); // overlays the column's right edge
            this.setCompanionHandleView(handle);
            this.addSubview(handle);
        }
        this.headerView().setOrder(1);
        this.headerHandleView().setOrder(2);
        this.scrollView().setOrder(3);
        this.footerHandleView().setOrder(4);
        this.footerView().setOrder(5);

        // In a column flex container the default min-height:auto stops the
        // scroll area shrinking below its content; the collapsible regions
        // need it to yield (down to zero in theatre mode).
        this.scrollView().setMinHeight("0px");

        // Prototype-parity motion (Plans/Edge Handles § Animations, revised
        // 2026-08-12: feel beats the strict no-layout-transition rule for
        // these rare, user-initiated ~400ms toggles): region toggles ANIMATE
        // their layout share — flex-grow for the theatre, max-height for the
        // footer — with content fades layered on. The no-MEASUREMENT rule
        // still holds absolutely: transitions relayout, nothing ever reads.
        {
            const curve = "cubic-bezier(.2,.8,.2,1)";
            this.headerView().setTransition("flex-grow 0.42s " + curve);
            this.scrollView().setTransition("flex-grow 0.42s " + curve);
            this.scrollView().setFlexBasis("0px"); // so grow interpolates proportions
            this.footerView().setTransition("max-height 0.34s " + curve + ", opacity 0.26s ease-out");
        }

        this.addGestureRecognizer(SvRightEdgePanGestureRecognizer.clone()); // for adjusting width
        this.addGestureRecognizer(SvBottomEdgePanGestureRecognizer.clone()); // for adjusting height

        this.setupClickToAddViewIfNeeded();

        // Accessibility: each nav column is a region with its own content
        this.setAriaRole("region");

        return this;
    }

    /**
     * @description Sets up the click to add view if it is not already set
     * @category Layout
     */
    setupClickToAddViewIfNeeded () {
        if (this.clickToAddView()) {
            return;
        }

        // - create a absolute positioned view that stays centered vertically and horizontally in the SvNavView
        //  - it should contain the text "click to add item" and have no borders or decorations
        // - it should have a transparent background

        const view = SvDomView.clone();

        view.setPosition("absolute");
        view.setTop("50%");
        view.setLeft("50%");
        view.setTransform("translate(-50%, -50%)");
        view.setBackgroundColor("transparent");
        view.setBorder("none");
        view.setPadding("0");

        view.setInnerText("add item");
        view.setFontSize("inherit");
        view.setColor("rgba(255, 255, 255, 0.3)");
        view.setFontFamily("inherit");
        view.setFontWeight("normal");
        view.setTextAlign("center");
        view.setLineHeight("1.5");
        view.setWidth("fit-content");
        view.setHeight("fit-content");
        //view.setFontStyle("italic");

        // make sure all events pass through to the SvNavView
        view.setPointerEvents("none");

        this.setClickToAddView(view);
    }

    /**
     * @description Checks if the SvNavView is vertical
     * @returns {boolean|null} True if vertical, false if horizontal, null if stackView is not set
     * @category Layout
     */
    isVertical () {
        const sv = this.stackView();
        if (!sv) {
            return null;
        }
        return sv.direction() === "right";
    }

    /**
     * @description Synchronizes the orientation of the SvNavView
     * @returns {SvNavView} The SvNavView instance
     * @category Layout
     */
    syncOrientation () {
        if (this.isVertical()) {
            this.makeOrientationRight();
        } else {
            this.makeOrientationDown();
        }
        this.updateWidthForWindow();
        // Orientation stamping writes generic values over the collapsible-
        // region layout (SvStackScrollView.makeVertical sets flexGrow 1
        // unconditionally), and it has many callers — stack compaction among
        // them — so the region pass always rides along to restore the
        // theatre swap. Idempotent; same-value writes restart nothing.
        this.syncCollapsibleRegions();
        return this;
    }

    /**
     * @description Gets the border color for the SvNavView
     * @returns {string} The border color
     * @category Styling
     */
    borderColor () {
        return "rgba(255, 255, 255, 0.3)";
    }

    /**
     * @description Checks if the SvNavView should have a border
     * @returns {boolean} True if the SvNavView should have a border, false otherwise
     * @category Styling
     */
    hasBorder () {
        const node = this.node();
        if (node) {
            const hint = node.nodeNavBorderHint();
            if (Type.isBoolean(hint)) {
                return hint;
            }
        }
        return true;
    }

    /**
     * @description Gets the border style for the SvNavView
     * @returns {string|null} The border style or null if no border
     * @category Styling
     */
    borderStyle () {
        if (this.hasBorder()) {
            return "0px solid " + this.borderColor() + " inset";
        }
        return null;
    }

    shouldCurrentlyFillAvailble () {
        if (this.node()) {
            return (this.node().nodeFillsRemainingWidth() && this.isLastNavView());
        }
        return false;
    }

    /**
     * @description Sets the orientation of the SvNavView to right (vertical)
     * @category Layout
     */
    makeOrientationRight () { // nav view is on left, other view is on right
        this.setFlexDirection("column");
        this.setFlexGrow(0);
        this.setFlexShrink(0);

        const targetW = this.targetWidth();
        const availableW = this.availableNavWidth();

        if (this.shouldCurrentlyFillAvailble()) {
            // Fill the leftover width by actually flexing: grow into the slack the
            // stack row leaves after its detail view (which may host a companion)
            // takes its share, and shrink rather than overflow when the row is
            // tight. width:null + flexGrow:0 would only size to content — leaving
            // dead space when wide and overrunning a docked companion when narrow.
            this.setFlexGrow(1);
            this.setFlexShrink(1);
            this.setMinWidth("0px");
            this.setWidth(null);
            this.setMaxWidth(null);
        } else if (targetW >= availableW) {
            this.setMinWidth("17em");
            this.setWidth("100%");
            this.setMaxWidth("100%");
        } else {
            this.setMinAndMaxWidth(targetW);
        }

        this.setMinAndMaxHeight("100%");

        // Only show border when not on mobile — and not when this column's
        // right edge is the boundary of a COLLAPSED companion: a closed
        // region draws no rule, so the user sees only the pill there.
        if (!SvWebBrowserWindow.shared().isOnMobile() && !this.companionBoundaryIsBare()) {
            this.setBorderRight("1px solid var(--sv-hairline)");
        } else {
            this.setBorderRight(null);
        }
        this.setBorderBottom(null);

        this.scrollView().setIsVertical(true);

        if (this.headerView()) {
            const v = this.headerView();
            v.setWidth("100%");
            if (this._appliedHeaderRegionExpanded !== true) {
                // theatre mode owns the header's height (flex 1 1 0); see
                // applyHeaderRegionExpanded — fit-content would zero the
                // region's 100%-height tile
                v.setHeight("fit-content");
            }
        }

        if (this.footerView()) {
            const v = this.footerView();
            v.setWidth("100%");
            v.setHeight("fit-content");
        }
    }

    /**
     * @description Sets the orientation of the SvNavView to down (horizontal)
     * @category Layout
     */
    makeOrientationDown () {
        this.setFlexDirection("row");
        this.setFlexGrow(0);
        this.setFlexShrink(0);

        this.setMinAndMaxWidth("100%");
        // A horizontal row's height follows the same node hint its TILES do
        // (SvTile.makeOrientationDown reads nodeMinTileHeight off this node),
        // so a node that wants a shorter row — a tab bar sized to match the
        // breadcrumbs above it — sets ONE hint and both agree. Falls back to
        // the historical 5em when the node carries no hint.
        const hintedHeight = this.node() ? (this.node().nodeMinTileHeight() || 0) : 0;
        this.setMinAndMaxHeight(hintedHeight > 0 ? hintedHeight : "5em");

        if (this.node()) {
            if (this.node().nodeFillsRemainingWidth()) {
                // this.setMinAndMaxHeight("100%")
            }
        }

        this.setBorderRight(null);
        // Only show border when not on mobile
        if (!SvWebBrowserWindow.shared().isOnMobile()) {
            this.setBorderBottom("1px solid var(--sv-hairline)");
        } else {
            this.setBorderBottom(null);
        }

        this.scrollView().setIsVertical(false);

        if (this.headerView()) {
            const v = this.headerView();
            v.setWidth("fit-content");
            v.setHeight("100%");
        }

        if (this.footerView()) {
            const v = this.footerView();
            v.setWidth("fit-content");
            v.setHeight("100%");
        }
    }

    /**
     * @description Whether this column's right border would double as the
     * boundary of a collapsed companion (found by adjacentCompanionView —
     * only the deepest column touches it, at any navigation depth). A closed
     * region draws no hairline: the user sees only the pill.
     * @returns {Boolean}
     * @category Styling
     */
    companionBoundaryIsBare () {
        const companion = this.adjacentCompanionView();
        return !!(companion && companion.isExpanded && !companion.isExpanded());
    }

    /**
     * @description Sets the node for the SvNavView
     * @param {Object} aNode - The node to set
     * @returns {SvNavView} The SvNavView instance
     * @category Node Management
     */
    setNode (aNode) {
        super.setNode(aNode);
        this.tilesView().setNode(aNode);

        if (aNode.headerNode) {
            this.headerView().setNode(aNode.headerNode());
        }

        if (aNode.footerNode) {
            this.footerView().setNode(aNode.footerNode());
        }

        // Force layout recalculation on mobile when node changes
        if (SvWebBrowserWindow.shared().isOnMobile()) {
            this.scheduleSyncToNode();
        }

        return this;
    }

    /**
     * @description Checks if this SvNavView is the last one in the stack
     * @returns {boolean} True if this is the last SvNavView, false otherwise
     * @category Layout
     */
    isLastNavView () {
        return Type.isNullOrUndefined(this.stackView().nextStackView());
    }

    /**
     * @description Synchronizes the SvNavView with its node
     * @returns {SvNavView} The SvNavView instance
     * @category Node Management
     */
    syncFromNode () {
        this.syncOrientation();
        this.applyStyles();

        if (this.isVertical()) {
            const w = this.node().nodeMinTileWidth();
            if (w && !Type.isNullOrUndefined(w)) {
                this.setMinWidth(w);
                this.setMinAndMaxHeight("100%");
            }
        } else {
            const h = this.node().nodeMinTileHeight();
            if (h && !Type.isNullOrUndefined(h)) {
                this.setMinAndMaxWidth("100%");
                this.setMinAndMaxHeight(h);
            }
        }

        this.syncHeaderFooterBindings();
        this.headerView().syncFromNode();
        this.footerView().syncFromNode();
        this.syncCollapsibleRegions();
        this.syncClickToAddView();
        this.syncContentMaxWidth();
        this.syncScrollbarVisibility();

        // Accessibility: label the region from its node
        if (this.node()) {
            this.setAriaLabel(this.ariaLabel());
        }

        //console.log(this.svTypeId(), " syncFromNode done");
        return this;
    }

    /**
     * @description Re-resolves the node's headerNode()/footerNode() and
     * rebinds the header/footer views when they changed. The bindings were
     * previously made only in setNode(), so a node that SWAPS its header
     * mid-life (UoAiChat: TV band ⇄ "Recover from Errors" action) left the
     * view showing the old node forever — the model swapped back after a
     * successful recovery but the button stayed on screen. Mirrors
     * headerRegion()/footerRegion(), which already re-resolve per sync for
     * the edge handles. Idempotent: setNode is called only on change.
     * @returns {SvNavView}
     * @category Node Management
     */
    syncHeaderFooterBindings () {
        const node = this.node();
        if (!node) {
            return this;
        }
        // headerView/footerView default to null and are guarded everywhere else in
        // this class; this method must do the same.
        const header = this.headerView();
        if (header && node.headerNode && header.node() !== node.headerNode()) {
            header.setNode(node.headerNode());
        }
        const footer = this.footerView();
        if (footer && node.footerNode && footer.node() !== node.footerNode()) {
            footer.setNode(node.footerNode());
        }
        return this;
    }

    // --- collapsible regions (SvCollapsibleRegionProtocol edge handles) ---

    /**
     * @description The node's headerNode() when it can drive an edge handle,
     * else null. The header node is swappable (e.g. a recovery button can
     * take the band's place), so this re-resolves on every sync.
     * @returns {Object|null}
     * @category Collapsible Regions
     */
    headerRegion () {
        const node = this.node();
        const header = (node && node.headerNode) ? node.headerNode() : null;
        return (header && this.headerHandleView().regionIsUsable(header)) ? header : null;
    }

    footerRegion () {
        const node = this.node();
        const footer = (node && node.footerNode) ? node.footerNode() : null;
        return (footer && this.footerHandleView().regionIsUsable(footer)) ? footer : null;
    }

    /**
     * @description Wires the edge handles to the current header/footer
     * regions and applies each region's expanded state to the column's flex
     * layout. Idempotent — guarded per region so repeated syncs never restart
     * a fade or re-commit a layout.
     * @returns {SvNavView}
     * @category Collapsible Regions
     */
    syncCollapsibleRegions () {
        const headerRegion = this.headerRegion();
        this.headerHandleView().setRegion(headerRegion);
        this.headerHandleView().syncToRegion();
        this.applyHeaderRegionExpanded(headerRegion ? headerRegion.isExpanded() === true : false);

        const footerRegion = this.footerRegion();
        this.footerHandleView().setRegion(footerRegion);
        this.footerHandleView().syncToRegion();
        this.applyFooterRegionExpanded(footerRegion ? footerRegion.isExpanded() !== false : true);

        this.syncCompanionHandle();
        return this;
    }

    /**
     * @description The companion whose boundary this column's right edge
     * touches: only when this is the deepest column (its own detail has no
     * child content), the NEAREST enclosing companion up the stack chain —
     * intermediate details hold only the descending chain, so nothing else
     * sits between. Null otherwise.
     * @returns {SvCompanionView|null}
     * @category Collapsible Regions
     */
    adjacentCompanionView () {
        const stack = this.stackView();
        if (!stack) {
            return null;
        }
        const detail = stack.detailView ? stack.detailView() : null;
        if (!detail || (detail.hasStackContent && detail.hasStackContent())) {
            return null; // deeper columns sit between us and any companion
        }
        let s = stack;
        while (s) {
            const d = s.detailView ? s.detailView() : null;
            const companion = (d && d.companionView) ? d.companionView() : null;
            if (companion) {
                return companion;
            }
            s = s.previousStackView ? s.previousStackView() : null;
        }
        return null;
    }

    /**
     * @description Shows this column's right-edge pill while the adjacent
     * companion is collapsed (zero-width, so the pill cannot anchor inside
     * it); the companion's own inset pill takes over while docked.
     * @returns {SvNavView}
     * @category Collapsible Regions
     */
    syncCompanionHandle () {
        const handle = this.companionHandleView();
        const companion = this.adjacentCompanionView();
        const collapsed = !!(companion && companion.mode && companion.mode() === "tab");
        handle.setRegion(collapsed ? companion : null);
        handle.syncToRegion();
        return this;
    }

    /**
     * @description Theatre-mode flex swap: expanded, the header region takes
     * the space remaining in the column (flex 1 1 0, sliding via the grow
     * transition) and the scroll area collapses to zero — never a fixed
     * height, never a measurement, so nothing can be pushed off-screen. The
     * header handle order-swaps to the very top of the column and all pills
     * invert for the dark field.
     *
     * RE-APPLIED IN FULL ON EVERY SYNC, deliberately unguarded: orientation
     * sync re-stamps generic values over these (SvStackScrollView.makeVertical
     * sets flexGrow 1 unconditionally), so a change-guard here left the
     * column half-stomped after any mid-theatre sync — the narration split
     * 50/50 under the open band. Same-value style writes are free and do not
     * restart transitions.
     * @param {Boolean} expanded
     * @returns {SvNavView}
     * @category Collapsible Regions
     */
    applyHeaderRegionExpanded (expanded) {
        this._appliedHeaderRegionExpanded = expanded; // consulted by makeOrientationRight

        const header = this.headerView();
        const scroll = this.scrollView();
        const region = this.headerRegion();
        const hasRegion = !!region;

        // Paint the whole column in the expanded region's surface color (a
        // theatre's near-black): fractional-scale rounding leaves sub-pixel
        // seams above/below the flexed header, and this is what stops the
        // page showing through them (the EdgeControls prototype's own fix).
        const surface = (expanded && region && typeof region.expandedRegionBackgroundCss === "function")
            ? region.expandedRegionBackgroundCss() : null;
        this.setBackgroundColor(surface); // null restores the column's normal (transparent) ground

        if (expanded) {
            header.setHeight("auto"); // clear fit-content so flex sizes it (definite, so the tile's 100% resolves)
            header.setFlexGrow(1);
            header.setFlexShrink(1);
            header.setFlexBasis("0px");
            header.setMinHeight("0px");
            header.setBorderBottom(null); // the region owns its surface; no doubled rule
            scroll.setFlexGrow(0);
            this.headerHandleView().setOrder(0); // ride the top of the column
        } else if (hasRegion) {
            // a collapsed REGION keeps flex-basis 0 (height comes from grow),
            // so open/close is a pure flex-grow transition both ways
            header.setHeight("auto");
            header.setFlexGrow(0);
            header.setFlexShrink(1);
            header.setFlexBasis("0px");
            header.setMinHeight("0px");
            header.setBorderBottom(null); // a closed region draws no rule
            scroll.setFlexGrow(1);
            this.headerHandleView().setOrder(2);
        } else {
            // no region: the legacy hug-content header (e.g. a recovery button)
            header.setHeight("fit-content");
            header.setFlexGrow(0);
            header.setFlexShrink(0);
            header.setFlexBasis(null);
            header.setMinHeight(null);
            header.setBorderBottom("1px solid var(--sv-hairline)");
            scroll.setFlexGrow(1);
            this.headerHandleView().setOrder(2);
        }
        this.headerHandleView().setIsInverted(expanded);
        this.footerHandleView().setIsInverted(expanded);
        this.companionHandleView().setIsInverted(expanded); // it floats over the dark field too
        return this;
    }

    /**
     * @description Footer (chat input) collapse: a max-height slide with the
     * content fading alongside, per the prototype. The cap is a definite
     * value only during the motion (max-height:none cannot animate), then
     * lifts so a multiline input can grow freely. Sequencing uses addTimeout
     * — never transitionend, never a bare rAF (background tabs).
     * @param {Boolean} expanded
     * @returns {SvNavView}
     * @category Collapsible Regions
     */
    applyFooterRegionExpanded (expanded) {
        if (this._appliedFooterRegionExpanded === undefined) {
            this._appliedFooterRegionExpanded = true; // columns start expanded
        }
        if (this._appliedFooterRegionExpanded === expanded) {
            return this;
        }
        this._appliedFooterRegionExpanded = expanded;

        const footer = this.footerView();
        if (expanded) {
            footer.setCssProperty("visibility", null);
            footer.setMaxHeight("12em"); // slides 0 -> cap
            footer.setOpacity(1);
            this.addTimeout(() => {
                if (this._appliedFooterRegionExpanded === true) {
                    footer.setMaxHeight(null); // lift the cap for multiline growth
                }
            }, 360, "footerRegionMotion");
            this.footerHandleView().setMarginBottom("0px");
        } else {
            footer.setMaxHeight("12em"); // a definite FROM value...
            this.addTimeout(() => {
                if (this._appliedFooterRegionExpanded === false) {
                    footer.setMaxHeight("0px"); // ...slides cap -> 0
                    footer.setOpacity(0);
                    this.addTimeout(() => {
                        if (this._appliedFooterRegionExpanded === false) {
                            footer.setCssProperty("visibility", "hidden"); // unfocusable while collapsed
                        }
                    }, 360, "footerRegionMotion");
                }
            }, 16, "footerRegionMotion");
            // the pill becomes the column's bottom edge: keep its touch
            // target clear of the home-indicator gesture zone
            this.footerHandleView().setMarginBottom("env(safe-area-inset-bottom)");
        }
        return this;
    }

    /**
     * @description Applies the node's reading-measure hint
     * (nodeContentMaxWidth): the column's tile stack and footer content
     * center inside a maximum measure, via symmetric padding — NOT by
     * narrowing the views — so hairline dividers and the scrollbar keep
     * spanning the full column while the content sits in a centered
     * reading column. The HEADER stays full-bleed on purpose: it hosts
     * media like the session's TV band, which should span the column.
     * A null hint leaves the column untouched.
     * @returns {SvNavView} The current instance.
     * @category Layout
     */
    syncContentMaxWidth () {
        const node = this.node();
        const w = (node && node.nodeContentMaxWidth) ? node.nodeContentMaxWidth() : null;
        const pad = w ? ("max(0px, calc((100% - " + w + ") / 2))") : null;
        [this.tilesView(), this.footerView()].forEach(v => {
            if (v) {
                v.setPaddingLeft(pad);
                v.setPaddingRight(pad);
            }
        });
        // a previously-applied header inset must clear if the hint changes
        if (this.headerView()) {
            this.headerView().setPaddingLeft(null);
            this.headerView().setPaddingRight(null);
        }
        return this;
    }

    /**
     * @description Applies the node's nodeShowsScrollbar() hint to this column's
     * scroll view.
     *
     * Uses the STANDARD scrollbar properties rather than ::-webkit-scrollbar, for two
     * reasons: they work in Firefox as well as Chrome, and scrollbar-color takes theme
     * tokens — so the thumb is ink on parchment and paper on ink, instead of the
     * hardcoded #aaa the webkit rules use, which would look wrong on a light ground.
     * --sv-text-dim rather than --sv-hairline: a hairline is meant to be barely
     * there, and a scroll affordance has to be findable.
     *
     * Cleared (not just skipped) when the hint is false, so a node that changes its
     * mind — or a recycled view bound to a different node — does not keep a scrollbar
     * it no longer wants.
     * @returns {SvNavView}
     * @category Layout
     */
    syncScrollbarVisibility () {
        const node = this.node();
        const shows = !!(node && node.nodeShowsScrollbar && node.nodeShowsScrollbar());
        const sv = this.scrollView();
        if (!sv) {
            return this;
        }
        sv.setCssProperty("scrollbar-width", shows ? "thin" : null);
        sv.setCssProperty("scrollbar-color", shows ? "var(--sv-text-dim) transparent" : null);
        return this;
    }

    /**
     * @description Checks if the click to add view should be shown
     * @returns {boolean} True if the click to add view should be shown, false otherwise
     * @category Node Management
     */
    shouldShowClickToAddView () {
        const node = this.node();
        if (node) {
            return node.offersUserEdit(node.nodeCanAddSubnode()) && node.subnodesCount() === 0; // folds in the editability cascade
        }
        return false;
    }

    /**
     * @description Synchronizes the click to add view
     * @category Node Management
     */
    syncClickToAddView () {
        const v = this.clickToAddView();
        if (this.shouldShowClickToAddView()) {
            this.addSubviewIfAbsent(v);
            //v.unhideDisplay();
        } else {
            this.removeSubviewIfPresent(v);
            //v.hideDisplay();
        }
    }

    /**
     * @description Collapses the SvNavView
     * @category State
     */
    collapse () {
        if (!this.isCollapsed()) {
            this.hideDisplay();
            this.setIsCollapsed(true);
        }
        assert(this.isDisplayHidden());
    }

    /**
     * @description Uncollapses the SvNavView
     * @category State
     */
    uncollapse () {
        if (this.isCollapsed()) {
            this.unhideDisplay();
            this.syncOrientation();
            this.setIsCollapsed(false);
        }
        assert(!this.isDisplayHidden());
    }

    /**
     * @description Updates the width constraints based on the available container width
     * @category Layout
     */
    updateWidthForWindow () {
        if (this.isVertical()) {
            if (this.shouldCurrentlyFillAvailble()) {
                // A fill nav always flexes (see makeOrientationRight): grow into
                // the slack after a sibling companion's share, shrink to fit.
                // Never width:100% here — that would overrun a docked companion.
                this.setFlexGrow(1);
                this.setFlexShrink(1);
                this.setMinWidth("0px");
                this.setWidth(null);
                this.setMaxWidth(null);
                return this;
            }

            const targetW = this.targetWidth();
            const availableW = this.availableNavWidth();
            const isLastNavView = this.stackView() && !this.stackView().nextStackView();

            if (targetW >= availableW) {
                this.setMinWidth("17em");
                this.setWidth("100%");
                this.setMaxWidth("100%");
            } else if (isLastNavView && availableW < targetW * 2) {
                // Last visible nav view + viewport between 1x and 2x targetWidth: fill the slack
                this.setMinWidth("17em");
                this.setWidth("100%");
                this.setMaxWidth("100%");
            } else {
                this.setMinAndMaxWidth(targetW);
            }
        }
        return this;
    }

    /**
     * @description Gets the border style for edge movement
     * @returns {string} The border style for edge movement
     * @category Styling
     */
    edgeMoveBorderStyle () {
        return "1px rgba(255, 255, 255, 0.5) inset";
    }

    /**
     * @description Handles the beginning of a right edge pan gesture
     * @param {Object} aGesture - The gesture object
     * @category Gesture Handling
     */
    onRightEdgePanBegin (/*aGesture*/) {
        this.setBeforeEdgePanBorderRight(this.borderRight());
        this.setBorderRight(this.edgeMoveBorderStyle());
    }

    /**
     * @description Handles the movement of a right edge pan gesture
     * @param {Object} aGesture - The gesture object
     * @returns {SvNavView} The SvNavView instance
     * @category Gesture Handling
     */
    onRightEdgePanMove (aGesture) {
        const p = aGesture.currentPosition();
        const f = this.frameInDocument();
        const nw = Math.max(10, p.x() - f.x());
        this.node().setNodeMinTileWidth(nw);
        this.scheduleSyncToNode();
        return this;
    }

    /**
     * @description Handles the completion of a right edge pan gesture
     * @param {Object} aGesture - The gesture object
     * @category Gesture Handling
     */
    onRightEdgePanComplete (aGesture) {
        this.onRightEdgePanMove(aGesture);
        this.setBorderRight(this.beforeEdgePanBorderRight());
        this.setBeforeEdgePanBorderBottom(null);
        this.unhideTransition();
    }

    /**
     * @description Handles the beginning of a bottom edge pan gesture
     * @param {Object} aGesture - The gesture object
     * @category Gesture Handling
     */
    onBottomEdgePanBegin (/*aGesture*/) {
        this.setBeforeEdgePanBorderBottom(this.borderBottom());
        this.setBorderBottom(this.edgeMoveBorderStyle());
        this.hideTransition();
    }

    /**
     * @description Handles the movement of a bottom edge pan gesture
     * @param {Object} aGesture - The gesture object
     * @returns {SvNavView} The SvNavView instance
     * @category Gesture Handling
     */
    onBottomEdgePanMove (aGesture) {
        const p = aGesture.currentPosition();
        const f = this.frameInDocument();
        const newHeight = Math.max(10, p.y() - f.y());
        this.node().setNodeMinTileHeight(newHeight);
        this.scheduleSyncToNode();
        return this;
    }

    /**
     * @description Handles the completion of a bottom edge pan gesture
     * @param {Object} aGesture - The gesture object
     * @category Gesture Handling
     */
    onBottomEdgePanComplete (aGesture) {
        this.onBottomEdgePanMove(aGesture);
        this.setBorderBottom(this.beforeEdgePanBorderBottom());
        this.setBeforeEdgePanBorderBottom(null);
        this.unhideTransition();
    }

}.initThisClass());
