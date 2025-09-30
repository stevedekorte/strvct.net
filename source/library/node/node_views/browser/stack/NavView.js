"use strict";

/**
 * @module library.node.node_views.browser.stack
 * @class NavView
 * @extends NodeView
 * @classdesc NavView is a component for navigation in a stack-based layout. It includes header, footer, and scrollable content areas.
 *
 *
 * Notes: NavView instances have their width set in several ways:
 *
 * 1. In makeOrientationRight(): Sets default width using minAndMaxWidth("17em")
 * 2. In targetWidth(): Calculates desired width starting from 400px, using the node's minimum tile width as a reference
 * 3. Through gesture handling: The onRightEdgePanMove() method allows users to resize by dragging the right edge
 * 4. Via StackView width management: The parent StackView can compact and expand NavViews based on available space
 * 5. The width can also be adapted using setWidth("-webkit-fill-available") when a NavView needs to fill remaining space
 */
(class NavView extends NodeView {

    initPrototypeSlots () {
        /**
         * @member {StackView} stackView - pointer to parent StackView
         * @category Layout
         */
        {
            const slot = this.newSlot("stackView", null);
            slot.setSlotType("StackView");
        }

        /**
         * @member {DomView} headerView - A subview placed in top of NavView, set to display:none if no node.headerNode(), contains a Tile?
         * @category Layout
         */
        {
            const slot = this.newSlot("headerView", null);
            slot.setSlotType("DomView");
        }

        /**
         * @member {ScrollView} scrollView - A subview which is a scrollView, fills the NavView (between headerView and footerView), and contains TilesView which may be larger.
         * @category Layout
         */
        {
            const slot = this.newSlot("scrollView", null);
            slot.setSlotType("ScrollView");
        }

        /**
         * @member {DomView} footerView - A subview laced in bottom of NavView, set to display:none if no node.footerNode().
         * @category Layout
         */
        {
            const slot = this.newSlot("footerView", null);
            slot.setSlotType("DomView");
        }

        /**
         * @member {TilesView} tilesView - Is inside scrollView, contains the tiles that are displayed in the NavView
         * @category Layout
         */
        {
            const slot = this.newSlot("tilesView", null);
            slot.setSlotType("TilesView");
        }

        /**
         * @member {Boolean} isCollapsed - Whether the NavView is collapsed
         * @category State
         */
        {
            const slot = this.newSlot("isCollapsed", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} animatesCollapse - Whether the NavView should animate when collapsing or uncollapsing
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
         * @member {DomView} clickToAddView - A view that is displayed when the NavView is empty and the user clicks to add an item. Only a subview when the NavView is empty.
         * @private
         * @category State
         */
        {
            const slot = this.newSlot("clickToAddView", null);
            slot.setSlotType("DomView");
        }
    }

    /**
     * @description Calculates the target width for the NavView
     * @returns {number} The calculated target width
     * @category Layout
     */
    targetWidth () {
        const defaultWidth = 270;
        if (this.node()) {
            const minWidth = this.node().nodeMinTileWidth();
            const maxWidth = WebBrowserWindow.shared().width() - 1;
            let w = defaultWidth;
            w = Math.max(defaultWidth, minWidth);
            w = Math.min(w, maxWidth);
            if (w) {
                return w;
            }
        }
        return defaultWidth;
    }

    /**
     * @description Calculates the target height for the NavView
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
     * @description Initializes the NavView
     * @returns {NavView} The initialized NavView instance
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
            const v = TileContainer.clone();
            v.setBorderBottom(borderStyle);
            v.setBackgroundColor(backgroundColor);
            this.setHeaderView(v);
            this.addSubview(v);
        }

        this.setScrollView(StackScrollView.clone());
        this.addSubview(this.scrollView());

        {
            const v = TileContainer.clone();
            v.setBorderTop(borderStyle);
            v.setBackgroundColor(backgroundColor);
            this.setFooterView(v);
            this.addSubview(v);
        }

        this.setTilesView(TilesView.clone());
        this.scrollView().addSubview(this.tilesView());

        this.addGestureRecognizer(RightEdgePanGestureRecognizer.clone()); // for adjusting width
        this.addGestureRecognizer(BottomEdgePanGestureRecognizer.clone()); // for adjusting height

        this.setupClickToAddViewIfNeeded();
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

        // - create a absolute positioned view that stays centered vertically and horizontally in the NavView
        //  - it should contain the text "click to add item" and have no borders or decorations
        // - it should have a transparent background

        const view = DomView.clone();

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

        // make sure all events pass through to the NavView
        view.setPointerEvents("none");

        this.setClickToAddView(view);
    }

    /**
     * @description Checks if the NavView is vertical
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
     * @description Synchronizes the orientation of the NavView
     * @returns {NavView} The NavView instance
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
     * @description Gets the border color for the NavView
     * @returns {string} The border color
     * @category Styling
     */
    borderColor () {
        return "rgba(255, 255, 255, 0.3)";
    }

    /**
     * @description Checks if the NavView should have a border
     * @returns {boolean} True if the NavView should have a border, false otherwise
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
     * @description Gets the border style for the NavView
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
     * @description Sets the orientation of the NavView to right (vertical)
     * @category Layout
     */
    makeOrientationRight () { // nav view is on left, other view is on right
        this.setFlexDirection("column");
        this.setFlexGrow(0);
        this.setFlexShrink(0);

        // On mobile, constrain width to viewport
        if (WebBrowserWindow.shared().isOnMobile()) {
            const targetW = this.targetWidth();
            // Use min() to ensure we never exceed viewport width
            this.setMinWidth(`min(${targetW}px, 100vw)`);
            this.setWidth(`min(${targetW}px, 100vw)`);
            this.setMaxWidth("100vw");
            this.setFlexGrow(0);
        } else {
            //this.setMinAndMaxWidth("17em");
            const targetW = this.targetWidth();
            const windowW = WebBrowserWindow.shared().width();

            // If our target width exceeds window width, constrain to window
            if (targetW >= windowW) {
                this.setMinWidth("17em");
                this.setWidth("100%");
                this.setMaxWidth("100%");
            } else {
                if (this.shouldCurrentlyFillAvailble()) {
                    this.setMinWidth("17em");
                    this.setWidth(null);
                    this.setMaxWidth("100%");

                    //this.setWidth("-webkit-fill-available");
                    //this.setMaxWidth("-webkit-fill-available");
                    //console.log(this.node().nodePathString() + " shouldCurrentlyFillAvailble");
                } else {
                    this.setMinAndMaxWidth(targetW);
                }
            }

        }

        this.setMinAndMaxHeight("100%");

        // Only show border when not on mobile
        if (!WebBrowserWindow.shared().isOnMobile()) {
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
     * @description Sets the orientation of the NavView to down (horizontal)
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
        if (!WebBrowserWindow.shared().isOnMobile()) {
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
     * @description Sets the node for the NavView
     * @param {Object} aNode - The node to set
     * @returns {NavView} The NavView instance
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
        if (WebBrowserWindow.shared().isOnMobile()) {
            this.scheduleSyncToNode();
        }

        return this;
    }

    /**
     * @description Checks if this NavView is the last one in the stack
     * @returns {boolean} True if this is the last NavView, false otherwise
     * @category Layout
     */
    isLastNavView () {
        return Type.isNullOrUndefined(this.stackView().nextStackView());
    }

    /**
     * @description Synchronizes the NavView with its node
     * @returns {NavView} The NavView instance
     * @category Node Management
     */
    syncFromNode () {
        this.syncOrientation();
        this.applyStyles();

        if (this.isVertical()) {
            const w = this.node().nodeMinTileWidth();
            if (w && !Type.isNullOrUndefined(w)) {
                if (WebBrowserWindow.shared().isOnMobile()) {
                    // On mobile, use calc to ensure we never exceed viewport width
                    // but still respect the node's minimum width if viewport is larger
                    const widthValue = Type.isNumber(w) ? `${w}px` : w;
                    this.setMinWidth(`min(${widthValue}, 100vw)`);
                    this.setWidth(`min(${widthValue}, 100vw)`);
                    this.setMaxWidth("100vw");
                } else {
                    this.setMinWidth(w);
                }
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
            return node.nodeCanAddSubnode() && node.subnodesCount() === 0;
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
     * @description Collapses the NavView
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
     * @description Uncollapses the NavView
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
     * @description Updates the width constraints based on window size
     * @category Layout
     */
    updateWidthForWindow () {
        if (!WebBrowserWindow.shared().isOnMobile() && this.isVertical()) {
            const targetW = this.targetWidth();
            const windowW = WebBrowserWindow.shared().width();
            const isLastNavView = this.stackView() && !this.stackView().nextStackView();

            // If our target width exceeds window width, constrain to window
            if (targetW >= windowW) {
                this.setMinWidth("17em");
                this.setWidth("100%");
                this.setMaxWidth("100%");
            } else if (isLastNavView && windowW < targetW * 2) {
                // Only for the last NavView: if window is between 1x and 2x the NavView width, make it fill 100%
                this.setMinWidth("17em");
                this.setWidth("100%");
                this.setMaxWidth("100%");
            } else {
                if (!this.shouldCurrentlyFillAvailble()) {
                    this.setMinAndMaxWidth(targetW);
                }
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
     * @returns {NavView} The NavView instance
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
     * @returns {NavView} The NavView instance
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
