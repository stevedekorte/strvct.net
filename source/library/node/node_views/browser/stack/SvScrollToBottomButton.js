/**
 * @module library.node.node_views.browser.stack
 */

"use strict";

/**
 * @class SvScrollToBottomButton
 * @extends SvFlexDomView
 * @classdesc A floating button that appears at the bottom-center of a SvScrollView
 * when content extends below the viewport. Clicking it smooth-scrolls to the bottom.
 */
(class SvScrollToBottomButton extends SvFlexDomView {

    /**
     * @description Initializes the prototype slots for the SvScrollToBottomButton.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {SvgIconView} iconView - The icon view for the down-arrow chevron.
         * @category View
         */
        {
            const slot = this.newSlot("iconView", null);
            slot.setSlotType("SvgIconView");
        }

        /**
         * @member {SvScrollView} scrollView - Reference to the owning SvScrollView.
         * @category View
         */
        {
            const slot = this.newSlot("scrollView", null);
            slot.setSlotType("SvScrollView");
        }
    }

    /**
     * @description Initializes the SvScrollToBottomButton.
     * @returns {SvScrollToBottomButton} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();

        this.makeFlexAndCenterContent();
        this.turnOffUserSelect();

        // Sticky positioning inside the SvScrollView:
        // stays fixed at the bottom of the visible scroll area
        this.setPosition("sticky");
        this.setBottomPx(16);
        // Center horizontally using auto margins (works for block-level elements with a fixed width)
        this.setCssProperty("margin-left", "auto");
        this.setCssProperty("margin-right", "auto");
        this.setZIndex(100);

        // Styling: circular button
        this.setMinAndMaxWidth(44);
        this.setMinAndMaxHeight(44);
        this.setBorderRadius("50%");
        this.setBackgroundColor("rgba(255, 255, 255, 0.15)");
        this.setBoxShadow("0 2px 8px rgba(0, 0, 0, 0.3)");
        this.setCssProperty("backdrop-filter", "blur(8px)");
        this.setCursor("pointer");
        this.setOpacity(0);
        this.setTransition("opacity 0.2s ease");

        // Icon
        const iv = SvgIconView.clone().setIconName("down");
        iv.setMinAndMaxWidth(18);
        iv.setMinAndMaxHeight(18);
        iv.setFillColor("white");
        iv.setStrokeColor("white");
        iv.setOpacity(0.9);
        iv.makeFlexAndCenterContent();
        this.setIconView(iv);
        this.addSubview(iv);

        this.addDefaultTapGesture();

        // Start hidden
        this.hideButton();

        return this;
    }

    /**
     * @description Shows the button with a fade-in.
     * @returns {SvScrollToBottomButton} The instance.
     * @category Visibility
     */
    showButton () {
        this.setOpacity(1);
        this.setPointerEvents("auto");
        return this;
    }

    /**
     * @description Hides the button with a fade-out.
     * @returns {SvScrollToBottomButton} The instance.
     * @category Visibility
     */
    hideButton () {
        this.setOpacity(0);
        this.setPointerEvents("none");
        return this;
    }

    /**
     * @description Returns whether the button is currently visible.
     * @returns {Boolean} True if visible.
     * @category Visibility
     */
    isButtonVisible () {
        return this.opacity() !== 0;
    }

    /**
     * @description Handles tap complete — scrolls parent SvScrollView to bottom.
     * @param {Object} aGesture - The gesture object.
     * @returns {Boolean} False to prevent default behavior.
     * @category Event Handling
     */
    onTapComplete (aGesture) {
        const sv = this.scrollView();
        if (sv) {
            sv.scrollToBottomSmooth();
        }
        return false;
    }

}.initThisClass());
