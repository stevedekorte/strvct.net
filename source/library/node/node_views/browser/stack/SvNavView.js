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

        const borderStyle = "1px solid rgba(255, 255, 255, 0.1)";
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
            v.setBackgroundColor(backgroundColor);
            v.setFlexGrow(0);
            v.setFlexShrink(0);
            this.setFooterView(v);
            this.addSubview(v);
        }

        this.setTilesView(SvTilesView.clone());
        this.scrollView().addSubview(this.tilesView());

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

        // Only show border when not on mobile
        if (!SvWebBrowserWindow.shared().isOnMobile()) {
            this.setBorderRight("1px solid #333");
        } else {
            this.setBorderRight(null);
        }
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
        this.setMinAndMaxHeight("5em");

        if (this.node()) {
            if (this.node().nodeFillsRemainingWidth()) {
                // this.setMinAndMaxHeight("100%")
            }
        }

        this.setBorderRight(null);
        // Only show border when not on mobile
        if (!SvWebBrowserWindow.shared().isOnMobile()) {
            this.setBorderBottom("1px solid #333");
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

        this.headerView().syncFromNode();
        this.footerView().syncFromNode();
        this.syncClickToAddView();

        // Accessibility: label the region from its node
        if (this.node()) {
            this.setAriaLabel(this.ariaLabel());
        }

        //console.log(this.svTypeId(), " syncFromNode done");
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
