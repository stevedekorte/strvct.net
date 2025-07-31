/**
 * @module library.view.dom.DomView.subclasses
 */

"use strict";

/**
 * @class SvCoachMarkView
 * @extends DomView
 * @classdesc A coach mark view that displays instructional content positioned above a target view.
 * Automatically closes when tapped and includes open/close animations.
 */
(class SvCoachMarkView extends DomView {
    
    /**
     * @description Initializes the prototype slots for the SvCoachMarkView
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {String} label - The text label to display in the coach mark
             * @category Content
             */
            const slot = this.newSlot("label", "");
            slot.setSlotType("String");
        }
        
        {
            /**
             * @member {DomView} targetView - The view that this coach mark points to
             * @category Positioning
             */
            const slot = this.newSlot("targetView", null);
            slot.setSlotType("DomView");
        }
        
        {
            /**
             * @member {DomView} labelView - The view containing the label text
             * @category View
             */
            const slot = this.newSlot("labelView", null);
            slot.setSlotType("DomView");
        }
        
        {
            /**
             * @member {Boolean} isOpen - Whether the coach mark is currently open
             * @category State
             */
            const slot = this.newSlot("isOpen", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the SvCoachMarkView instance
     * @returns {SvCoachMarkView} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        
        // Style the container
        this.setPosition("absolute");
        this.setDisplay("flex");
        this.setFlexDirection("column");
        this.setAlignItems("center");
        this.setPointerEvents("auto");
        this.setZIndex(10000); // Ensure it appears above other content
        this.setOpacity(0);
        this.setTransform("translateY(10px)");
        this.setTransition("opacity 0.3s ease-out, transform 0.3s ease-out");
        
        // Create the label view
        const labelView = DomView.clone();
        labelView.setBackgroundColor("rgba(0, 0, 0, 0.9)");
        labelView.setColor("white");
        labelView.setPadding("12px 20px");
        labelView.setBorderRadius("8px");
        labelView.setFontSize("14px");
        labelView.setFontFamily("sans-serif");
        labelView.setBoxShadow("0 4px 12px rgba(0, 0, 0, 0.3)");
        labelView.setMaxWidth("300px");
        labelView.setTextAlign("center");
        labelView.setLineHeight("1.4");
        
        this.setLabelView(labelView);
        this.addSubview(labelView);
        
        // Add arrow pointing down
        const arrow = DomView.clone();
        arrow.setWidth("0");
        arrow.setHeight("0");
        arrow.setBorderLeft("8px solid transparent");
        arrow.setBorderRight("8px solid transparent");
        arrow.setBorderTop("8px solid rgba(0, 0, 0, 0.9)");
        arrow.setMarginTop("-1px");
        this.addSubview(arrow);
        
        // Add tap gesture to close
        this.addDefaultTapGesture();
        
        return this;
    }

    /**
     * @description Sets the label text and updates the label view
     * @param {String} aString - The label text to display
     * @returns {SvCoachMarkView} The instance for chaining
     * @category Content
     */
    setLabel (aString) {
        this._label = aString;
        if (this.labelView()) {
            this.labelView().setInnerHTML(aString);
        }
        return this;
    }

    /**
     * @description Checks if the coach mark can be opened (target view is in viewport)
     * @returns {Boolean} True if the target view is visible in the viewport
     * @category State
     */
    canOpen () {
        const targetView = this.targetView();
        if (!targetView) {
            return false;
        }
        
        return targetView.isInViewport();
    }

    /**
     * @description Opens the coach mark above the target view
     * @returns {SvCoachMarkView} The instance for chaining
     * @category Display
     */
    open () {
        if (!this.canOpen() || this.isOpen()) {
            return this;
        }
        
        this.setIsOpen(true);
        
        // Position above the target view
        const targetView = this.targetView();
        const targetElement = targetView.element();
        const targetRect = targetElement.getBoundingClientRect();
        
        // Add to document body if not already added
        if (!this.parentView()) {
            document.body.appendChild(this.element());
        }
        
        // Position the coach mark
        const coachMarkHeight = this.element().offsetHeight;
        const left = targetRect.left + (targetRect.width / 2);
        const top = targetRect.top - coachMarkHeight - 10; // 10px gap above target
        
        this.setLeftPx(left);
        this.setTopPx(top);
        
        // Center horizontally by offsetting half width
        requestAnimationFrame(() => {
            const coachMarkWidth = this.element().offsetWidth;
            this.setTransform(`translateX(-${coachMarkWidth / 2}px) translateY(0)`);
            this.setOpacity(1);
        });
        
        return this;
    }

    /**
     * @description Closes the coach mark with animation
     * @returns {SvCoachMarkView} The instance for chaining
     * @category Display
     */
    close () {
        if (!this.isOpen()) {
            return this;
        }
        
        this.setIsOpen(false);
        
        // Animate out
        this.setOpacity(0);
        this.setTransform("translateX(-50%) translateY(10px)");
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            if (this.element() && this.element().parentNode) {
                this.element().parentNode.removeChild(this.element());
            }
        }, 300);
        
        return this;
    }

    /**
     * @description Handles tap complete event to close the coach mark
     * @param {Object} aGesture - The gesture object
     * @returns {Boolean} False to indicate the event has been handled
     * @category Event
     */
    onTapComplete (/*aGesture*/) {
        this.close();
        return false;
    }
    
}.initThisClass());