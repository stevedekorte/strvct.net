"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class SvOverlayBannerView
 * @extends DomView
 * @classdesc SvOverlayBannerView creates a full-width banner at the top of the window for displaying
 * temporary messages, notifications, or information overlays.
 *
 * Features:
 * - Full-width positioning at top of viewport
 * - Smooth fade-in/fade-out animations
 * - Responsive font sizing based on window width
 * - Title and subtitle text views
 * - Configurable animation durations
 * - Auto-scales text for different screen sizes
 *
 * Example:
 * ```
 * const banner = SvOverlayBannerView.clone();
 * banner.setTitle("Critical Success!");
 * banner.setSubtitle("Natural 20");
 * banner.show();
 * setTimeout(() => banner.hide(), 3000);
 * ```
 */
(class SvOverlayBannerView extends DomView {

    /**
     * Initialize prototype slots for the SvOverlayBannerView.
     * @private
     */
    initPrototypeSlots () {
        /**
         * @member {SvTextView} titleView - The title text view
         * @category UI Components
         */
        {
            const slot = this.newSlot("titleView", null);
            slot.setSlotType("SvTextView");
        }

        /**
         * @member {SvTextView} subtitleView - The subtitle text view
         * @category UI Components
         */
        {
            const slot = this.newSlot("subtitleView", null);
            slot.setSlotType("SvTextView");
        }

        /**
         * @member {Number} fadeInDuration - Duration of fade-in animation in seconds
         * @category Animation
         */
        {
            const slot = this.newSlot("fadeInDuration", 0.3);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} fadeOutDuration - Duration of fade-out animation in seconds
         * @category Animation
         */
        {
            const slot = this.newSlot("fadeOutDuration", 0.3);
            slot.setSlotType("Number");
        }

        /**
         * @member {Boolean} isShown - Whether the banner is currently visible
         * @category State
         */
        {
            const slot = this.newSlot("isShown", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} baseTitleFontSize - Base font size for title in vw units
         * @category Style
         */
        {
            const slot = this.newSlot("baseTitleFontSize", 4);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} baseSubtitleFontSize - Base font size for subtitle in vw units
         * @category Style
         */
        {
            const slot = this.newSlot("baseSubtitleFontSize", 2.5);
            slot.setSlotType("Number");
        }
    }

    /**
     * Initialize the SvOverlayBannerView.
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Initialization
     */
    init () {
        super.init();

        // Fixed positioning at top of viewport
        this.setPosition("fixed");
        this.setTop("0");
        this.setLeft("0");
        this.setWidth("100%");
        this.setZIndex(10001); // Above panels and scrims

        // Flexbox layout for centering content
        this.setDisplay("flex");
        this.setFlexDirection("column");
        this.setJustifyContent("center");
        this.setAlignItems("center");

        // Styling with gradient background (transparent at bottom)
        this.setBackground("linear-gradient(to bottom, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0))");
        this.setBackdropFilter("blur(10px)");
        //this.setPaddingTop("2em");
        //this.setPaddingBottom("2em");
        this.setOpacity(0);

        // Create a mask for the blur effect to fade at the bottom
        this.setMaskImage("linear-gradient(to bottom, rgba(0, 0, 0, 1) 0%, rgba(0, 0, 0, 0.5) 70%, rgba(0, 0, 0, 0) 100%)");

        // Set up transitions
        this.updateTransitions();

        // Create title view
        {
            const v = SvTextView.clone().setElementClassName("OverlayBannerTitleView");
            v.setDisplay("block");
            v.setWidth("100%");
            v.setTextAlign("center");
            v.setColor("white");
            v.setFontWeight("bold");
            v.setPaddingLeft("2em");
            v.setPaddingRight("2em");
            v.setWhiteSpace("normal");
            v.setWordBreak("break-word");
            this.updateTitleFontSize(v);
            this.setTitleView(v);
            this.addSubview(v);
        }

        // Create subtitle view
        {
            const v = SvTextView.clone().setElementClassName("OverlayBannerSubtitleView");
            v.setDisplay("block");
            v.setWidth("100%");
            v.setTextAlign("center");
            v.setColor("rgba(255, 255, 255, 0.8)");
            v.setPaddingLeft("2em");
            v.setPaddingRight("2em");
            //v.setPaddingTop("0.5em");
            v.setWhiteSpace("normal");
            v.setWordBreak("break-word");
            this.updateSubtitleFontSize(v);
            this.setSubtitleView(v);
            this.addSubview(v);
        }

        this.setIsRegisteredForWindowResize(true);
        return this;
    }


    /**
     * Update the CSS transitions for smooth fade effects.
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Animation
     */
    updateTransitions () {
        const fadeIn = this.fadeInDuration();
        const fadeOut = this.fadeOutDuration();
        // Use max duration for the transition property
        const duration = Math.max(fadeIn, fadeOut);
        this.setTransition(`opacity ${duration}s ease-in-out`);
        return this;
    }

    /**
     * Update title font size based on viewport width.
     * @param {SvTextView} view - The title view (optional, uses this.titleView() if not provided)
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Style
     */
    updateTitleFontSize (view = this.titleView()) {
        if (view) {
            view.setFontSize(`${this.baseTitleFontSize()}vw`);
        }
        return this;
    }

    /**
     * Update subtitle font size based on viewport width.
     * @param {SvTextView} view - The subtitle view (optional, uses this.subtitleView() if not provided)
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Style
     */
    updateSubtitleFontSize (view = this.subtitleView()) {
        if (view) {
            view.setFontSize(`${this.baseSubtitleFontSize()}vw`);
        }
        return this;
    }

    /**
     * Handle window resize events.
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Event Handling
     */
    onWindowResize () {
        this.updateTitleFontSize();
        this.updateSubtitleFontSize();
        return this;
    }

    /**
     * Set the title text.
     * @param {string} text - The title text.
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Content
     */
    setTitle (text) {
        this.titleView().setValue(text);
        return this;
    }

    /**
     * Set the subtitle text.
     * @param {string} text - The subtitle text.
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Content
     */
    setSubtitle (text) {
        this.subtitleView().setValue(text);
        return this;
    }

    /**
     * Show the banner with a fade-in animation.
     * @returns {SvOverlayBannerView} - Returns this for chaining.
     * @category Lifecycle
     */
    show () {
        if (!this.isShown()) {
            // Add to document body
            DocumentBody.shared().addSubview(this);

            // Update transition for fade-in
            this.setTransition(`opacity ${this.fadeInDuration()}s ease-in-out`);

            // Force a reflow before setting opacity to ensure transition works
            this.element().offsetHeight;

            this.setOpacity(1);
            this.setIsShown(true);
        }
        return this;
    }

    async asyncHide () {
        if (this._hidePromise) {
            return this._hidePromise;
        }

        this._hidePromise = Promise.clone();

        if (this.isShown()) {
            // Update transition for fade-out
            this.setTransition(`opacity ${this.fadeOutDuration()}s ease-in-out`);

            this.setOpacity(0);

            // Remove from DOM after transition completes
            setTimeout(() => {
                this.removeFromParentView();
                this.setIsShown(false);
                this._hidePromise.callResolveFunc();
            }, this.fadeOutDuration() * 1000);
        }

        return this._hidePromise;
    }

}.initThisClass());
