"use strict";

/**
 * @module library.view.dom.DomView.subclasses
 */

/**
 * @class DragBarView
 * @extends DomView
 * @classdesc Represents a draggable bar view that can be used for resizing or other drag operations.
 */
(class DragBarView extends DomView {

    /**
     * @description Initializes the prototype slots for the DragBarView.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {boolean} isEnabled - Determines if the drag bar is enabled.
         * @category State
         */
        {
            const slot = this.newSlot("isEnabled", true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {boolean} isHighlighted - Determines if the drag bar is highlighted.
         * @category State
         */
        {
            const slot = this.newSlot("isHighlighted", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {boolean} isDragging - Determines if the drag bar is currently being dragged.
         * @category State
         */
        {
            const slot = this.newSlot("isDragging", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {string} normalColor - The color of the drag bar in its normal state.
         * @category Appearance
         */
        {
            const slot = this.newSlot("normalColor", "#333");
            slot.setSlotType("String");
        }
        /**
         * @member {string} highlightColor - The color of the drag bar when highlighted.
         * @category Appearance
         */
        {
            const slot = this.newSlot("highlightColor", "#555");
            slot.setSlotType("String");
        }
        /**
         * @member {string} dragColor - The color of the drag bar when being dragged.
         * @category Appearance
         */
        {
            const slot = this.newSlot("dragColor", "#999");
            slot.setSlotType("String");
        }
        /**
         * @member {Object} delegate - The delegate object for the drag bar view.
         * @category Delegation
         */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object"); //<DragBarViewDelegate>
        }
        /**
         * @member {number} thickness - The thickness of the drag bar.
         * @category Appearance
         */
        {
            const slot = this.newSlot("thickness", 2);
            slot.setSlotType("Number");
        }
        /**
         * @member {boolean} isVerticalDrag - Determines if the drag bar is for vertical dragging.
         * @category Behavior
         */
        {
            const slot = this.newSlot("isVerticalDrag", true);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the DragBarView.
     * @returns {DragBarView} The initialized DragBarView instance.
     * @category Initialization
     */
    init () {
        super.init();

        this.turnOffUserSelect();

        this.setElementClassName("DragBarView");
        this.setDisplay("inline-block");

        this.setIsRegisteredForMouse(true);
        this.syncHighlighted();
        this.syncEnabled();

        this._mouseMoveTrackerFunc = (event) => {
            this.mouseMoveTracker(event);
            return true;
        };

        this._mouseUpTrackerFunc = (event) => {
            this.mouseUpTracker(event);
            return true;
        };

        this.setBackgroundColor(this.normalColor());
        return this;
    }

    /**
     * @description Returns the appropriate cursor type for hovering.
     * @returns {string} The cursor type.
     * @category Appearance
     */
    hoverCursorType () {
        if (this.isVerticalDrag()) {
            return "row-resize";
        }

        return "col-resize";
    }

    /**
     * @description Sets whether the drag bar is vertical or horizontal.
     * @param {boolean} aBool - True for vertical, false for horizontal.
     * @returns {DragBarView} The DragBarView instance.
     * @category Behavior
     */
    setIsVertical (aBool) {
        if (this._isVertical !== aBool) {
            this._isVertical = aBool;
            //console.log("this.hoverCursorType() = ", this.hoverCursorType())
            this.setCursor(this.hoverCursorType());
        }
        return this;
    }

    /**
     * @description Sets whether the drag bar is enabled.
     * @param {boolean} aBool - True to enable, false to disable.
     * @returns {DragBarView} The DragBarView instance.
     * @category State
     */
    setIsEnabled (aBool) {
        if (this._isEnabled !== aBool) {
            this._isEnabled = aBool;
            this.syncEnabled();
        }

        return this;
    }

    /**
     * @description Synchronizes the enabled state of the drag bar.
     * @returns {DragBarView} The DragBarView instance.
     * @category State
     */
    syncEnabled () {
        this.setIsDisplayHidden(!this.isEnabled());
        return this;
    }

    /**
     * @description Sets whether the drag bar is highlighted.
     * @param {boolean} aBool - True to highlight, false to unhighlight.
     * @returns {DragBarView} The DragBarView instance.
     * @category State
     */
    setIsHighlighted (aBool) {
        if (this._isHighlighted !== aBool) {
            this._isHighlighted = aBool;
            this.syncHighlighted();
        }

        return this;
    }

    /**
     * @description Synchronizes the highlighted state of the drag bar.
     * @returns {DragBarView} The DragBarView instance.
     * @category State
     */
    syncHighlighted () {
        if (this.isDragging()) {
            return this;
        }

        if (this.isHighlighted()) {
            this.setBackgroundColor(this.highlightColor());
        } else {
            this.setBackgroundColor(this.normalColor());
        }
        this.syncCursor();

        return this;
    }

    /**
     * @description Synchronizes the cursor style based on the highlighted state.
     * @returns {DragBarView} The DragBarView instance.
     * @category Appearance
     */
    syncCursor () {
        if (this.isHighlighted()) {
            this.setCursor(this.hoverCursorType());
        } else {
            this.setCursor(null);
        }
        return this;
    }

    /**
     * @description Handles mouse move events during dragging.
     * @param {MouseEvent} event - The mouse move event.
     * @category Event Handling
     */
    mouseMoveTracker (event) {
        //console.log("mouse pos: ", event.clientX, " x ", event.clientY)
        if (this.delegate()) {
            this.delegate().didDragDivider(Math.floor(event.clientX), Math.floor(event.clientY));
        }
    }

    /**
     * @description Handles mouse up events during dragging.
     * @param {MouseEvent} event - The mouse up event.
     * @category Event Handling
     */
    mouseUpTracker (event) {
        //console.log("mouse pos: ", event.clientX, " x ", event.clientY)
        this.onMouseUp(event);
    }

    /**
     * @description Sets the dragging state of the drag bar.
     * @param {boolean} b - True if dragging, false otherwise.
     * @returns {DragBarView} The DragBarView instance.
     * @category State
     */
    setIsDragging (b) {
        this._isDragging = b;
        if (b) {
            this.setBackgroundColor(this.dragColor());
            this.parentView().setBorder("1px dashed white");
        } else {
            this.setBackgroundColor(this.normalColor());
            this.parentView().setBorder("0px dashed white");
        }
        return this;
    }

    /**
     * @description Handles mouse down events.
     * @param {MouseEvent} event - The mouse down event.
     * @returns {boolean} False to prevent default behavior.
     * @category Event Handling
     */
    onMouseDown (event) {
        //this.logDebug(" onMouseDown")
        this.setIsDragging(true);

        this.removeParentTracking();
        return false;
    }

    /**
     * @description Adds event listeners for mouse tracking to the parent view.
     * @returns {DragBarView} The DragBarView instance.
     * @category Event Handling
     */
    addParentTracking () {
        const r = this.documentBodyView();
        r.element().removeEventListener("mousemove", this._mouseMoveTrackerFunc, false);
        r.element().removeEventListener("mouseup", this._mouseUpTrackerFunc, false);
        return this;
    }

    /**
     * @description Removes event listeners for mouse tracking from the parent view.
     * @returns {DragBarView} The DragBarView instance.
     * @category Event Handling
     */
    removeParentTracking () {
        const r = this.documentBodyView();
        r.element().addEventListener("mousemove", this._mouseMoveTrackerFunc, false);
        r.element().addEventListener("mouseup", this._mouseUpTrackerFunc, false);
        return this;
    }

    /**
     * @description Handles mouse move events.
     * @param {MouseEvent} event - The mouse move event.
     * @returns {boolean} False to prevent default behavior.
     * @category Event Handling
     */
    onMouseMove (event) {
        return false;
    }

    /**
     * @description Handles mouse over events.
     * @param {MouseEvent} event - The mouse over event.
     * @returns {boolean} False to prevent default behavior.
     * @category Event Handling
     */
    onMouseOver (event) {
        //this.logDebug(" onMouseOver")
        this.setIsHighlighted(true);
        return false;
    }

    /**
     * @description Handles mouse leave events.
     * @param {MouseEvent} event - The mouse leave event.
     * @returns {boolean} False to prevent default behavior.
     * @category Event Handling
     */
    onMouseLeave (event) {
        //this.logDebug(" onMouseLeave")
        this.setIsHighlighted(false);
        return false;
    }

    /**
     * @description Handles mouse up events.
     * @param {MouseEvent} event - The mouse up event.
     * @returns {boolean} False to prevent default behavior.
     * @category Event Handling
     */
    onMouseUp (event) {
        this.setIsDragging(false);
        this.addParentTracking();
        return false;
    }

}.initThisClass());
