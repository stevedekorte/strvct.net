"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class SvScrimView
 * @extends DomView
 * @classdesc SvScrimView creates a blurred, blocking background overlay for modal dialogs.
 *
 * Features:
 * - Full viewport coverage with fixed positioning
 * - Backdrop blur effect (with WebKit support)
 * - Customizable background color and opacity
 * - Smooth fade-in/fade-out transitions
 * - Optional click-to-dismiss functionality
 *
 * Example:
 * ```
 * const scrim = SvScrimView.clone();
 * scrim.setBackgroundColor("rgba(255, 255, 255, 0.01)");
 * scrim.setBlurAmount("5px");
 * scrim.setOnClickDismiss(true);
 * scrim.showInWindow();
 * ```
 */
(class SvScrimView extends DomView {

    /**
     * Initialize prototype slots for the SvScrimView.
     * @private
     */
    initPrototypeSlots () {
        /**
         * @member {String} blurAmount - The amount of blur to apply (e.g., "5px")
         * @category Style
         */
        {
            const slot = this.newSlot("blurAmount", "3px");
            slot.setSlotType("String");
        }

        /**
         * @member {Boolean} onClickDismiss - Whether clicking the scrim dismisses it
         * @category Behavior
         */
        {
            const slot = this.newSlot("onClickDismiss", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} transitionDuration - Duration of fade transitions in seconds
         * @category Animation
         */
        {
            const slot = this.newSlot("transitionDuration", 0.5);
            slot.setSlotType("Number");
        }

        /**
         * @member {Boolean} isShown - Whether the scrim is currently visible
         * @category State
         */
        {
            const slot = this.newSlot("isShown", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * Initialize the SvScrimView.
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Initialization
     */
    init () {
        super.init();

        // Fixed positioning to cover entire viewport
        this.setPosition("fixed");
        this.setTop("0");
        this.setLeft("0");
        this.setWidth("100vw");
        this.setHeight("100vh");

        // Default styling
        this.setBackgroundColor("rgba(255, 255, 255, 0.01)");
        this.setZIndex(9999);

        // Flexbox centering for child content
        this.setDisplay("flex");
        this.setJustifyContent("center");
        this.setAlignItems("center");

        // Apply blur effect
        this.updateBlur();

        // Set up transitions
        this.updateTransitions();

        // Register click handler if enabled
        this.setupClickHandler();

        return this;
    }

    /**
     * Update the backdrop blur effect.
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Style
     */
    updateBlur () {
        const blur = this.blurAmount();
        this.setBackdropFilter(`blur(${blur})`);
        return this;
    }

    /**
     * Set the blur amount and update the effect.
     * @param {String} amount - The blur amount (e.g., "5px", "10px")
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Style
     */
    setBlurAmount (amount) {
        this._blurAmount = amount;
        if (this.element()) {
            this.updateBlur();
        }
        return this;
    }

    /**
     * Update the CSS transitions for smooth fade effects.
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Animation
     */
    updateTransitions () {
        const duration = this.transitionDuration();
        const transition = `opacity ${duration}s ease-out, backdrop-filter ${duration}s ease-out, -webkit-backdrop-filter ${duration}s ease-out`;
        this.setTransition(transition);
        return this;
    }

    /**
     * Set the transition duration and update transitions.
     * @param {Number} duration - Duration in seconds
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Animation
     */
    setTransitionDuration (duration) {
        this._transitionDuration = duration;
        if (this.element()) {
            this.updateTransitions();
        }
        return this;
    }

    /**
     * Set up the click handler for dismissing the scrim.
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Event Handling
     */
    setupClickHandler () {
        if (this.onClickDismiss()) {
            this.element().addEventListener("click", (event) => {
                // Only dismiss if clicking the scrim itself, not child content
                if (event.target === this.element()) {
                    this.hide();
                }
            });
        }
        return this;
    }

    /**
     * Show the scrim in the document body.
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Lifecycle
     */
    showInWindow () {
        if (!this.isShown()) {
            DocumentBody.shared().addSubview(this);
            this.setIsShown(true);

            // Force a reflow before setting opacity to ensure transition works
            this.element().offsetHeight;
            this.setOpacity(1);
        }
        return this;
    }

    /**
     * Hide the scrim with a fade-out animation.
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Lifecycle
     */
    hide () {
        if (this.isShown()) {
            this.setOpacity(0);
            this.setBackdropFilter("blur(0px)");

            // Remove from DOM after transition completes
            setTimeout(() => {
                this.removeFromParentView();
                this.setIsShown(false);
            }, this.transitionDuration() * 1000);
        }
        return this;
    }

    /**
     * Toggle the scrim visibility.
     * @returns {SvScrimView} - Returns this for chaining.
     * @category Lifecycle
     */
    toggle () {
        if (this.isShown()) {
            this.hide();
        } else {
            this.showInWindow();
        }
        return this;
    }

}.initThisClass());
