/**
 * @module library.node.node_views.browser.stack
 */

"use strict";

/**
 * @class SvScrollToBottomButton
 * @extends SvFlexDomView
 * @classdesc The "continue reading" affordance shown when scroll content
 * extends below the viewport: a full-width gradient that dissolves the
 * content into the page background (via --sv-bg, so it follows the theme)
 * with a centered italic link — "Continue to the latest ⌄" — that
 * smooth-scrolls to the bottom. Both fade in/out together, driven by the
 * owning SvScrollView through showButton()/hideButton().
 *
 * Themeable via:
 *     --sv-bg          gradient dissolve color (page background)
 *     --sv-text-muted  link color (opaque muted gray, like placeholder text)
 */
(class SvScrollToBottomButton extends SvFlexDomView {

    /**
     * @description Initializes the prototype slots for the SvScrollToBottomButton.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {SvDomView} labelRowView - the tappable centered link row
         * (label + chevron); the only part of the strip that takes pointer
         * events, so the gradient never blocks interaction with content.
         * @category View
         */
        {
            const slot = this.newSlot("labelRowView", null);
            slot.setSlotType("SvDomView");
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

        this.turnOffUserSelect();

        // A full-width strip stuck to the bottom of the visible scroll area.
        // The strip itself never takes pointer events (it overlays ~6em of
        // content); only the label row inside it is tappable.
        this.setPosition("sticky");
        this.setBottomPx(0);
        this.setWidth("100%");
        this.setMinAndMaxHeight(104);
        this.setZIndex(100);
        this.setDisplay("flex");
        this.setFlexDirection("column");
        this.setJustifyContent("flex-end");
        this.setAlignItems("center");
        this.setPointerEvents("none");

        // Content dissolves into the page background as it approaches the
        // input — same curve as the reference mock (transparent → 94% at
        // 55% → solid). color-mix keeps it theme-correct from one token.
        this.setBackgroundImage(
            "linear-gradient(to bottom, transparent 0%, "
            + "color-mix(in srgb, var(--sv-bg) 94%, transparent) 55%, "
            + "var(--sv-bg) 100%)");

        this.setOpacity(0);
        this.setTransition("opacity 180ms ease");

        // The centered link: italic label + the reference mock's thin
        // stemmed down-arrow (stroke follows the link color via currentColor).
        const row = SvDomView.clone();
        row.setDisplay("flex");
        row.setAlignItems("center");
        row.setCssProperty("gap", "9px");
        // muted-text treatment, OPAQUE: translucent ink composites with the
        // warm paper behind it and picks up a greenish-olive cast, so use the
        // theme's muted token (the placeholder/subtitle gray) at full opacity.
        // The rgba fallback reproduces the classic theme's previous rendering
        // (#bbb at 0.6 over near-black).
        row.setColor("var(--sv-text-dim)");
        row.setCursor("pointer");
        row.setPaddingBottom("10px");
        row.turnOffUserSelect();
        row.setInnerHtml(
            "<span style=\"font-style: italic; pointer-events: none;\">Continue to the latest</span>"
            + "<svg width=\"13\" height=\"13\" viewBox=\"0 0 13 13\" fill=\"none\" style=\"pointer-events: none;\">"
            + "<path d=\"M6.5 2 v8 M3 7 l3.5 3.5 L10 7\" stroke=\"currentColor\" stroke-width=\"1.4\""
            + " stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>");
        this.setLabelRowView(row);
        this.addSubview(row);

        this.addDefaultTapGesture();

        // Start hidden
        this.hideButton();

        return this;
    }

    /**
     * @description Shows the strip with a fade-in.
     * @returns {SvScrollToBottomButton} The instance.
     * @category Visibility
     */
    showButton () {
        this.setOpacity(1);
        this.labelRowView().setPointerEvents("auto");
        return this;
    }

    /**
     * @description Hides the strip with a fade-out.
     * @returns {SvScrollToBottomButton} The instance.
     * @category Visibility
     */
    hideButton () {
        this.setOpacity(0);
        this.labelRowView().setPointerEvents("none");
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
