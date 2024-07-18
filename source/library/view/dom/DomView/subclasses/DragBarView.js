"use strict";

/* 

    DragBarView

*/


(class DragBarView extends DomView {
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("isEnabled", true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isHighlighted", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isDragging", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("normalColor", "#333");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("highlightColor", "#555");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("dragColor", "#999");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object"); //<DragBarViewDelegate>
        }
        {
            const slot = this.newSlot("thickness", 2);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("isVerticalDrag", true);
            slot.setSlotType("Boolean");
        }
    }

    init () {
        super.init()

        this.turnOffUserSelect()

        this.setElementClassName("DragBarView")
        this.setDisplay("inline-block")

        this.setIsRegisteredForMouse(true)
        this.syncHighlighted()
        this.syncEnabled()

        this._mouseMoveTrackerFunc = (event) => {
            this.mouseMoveTracker(event)
            return true
        }

        this._mouseUpTrackerFunc = (event) => {
            this.mouseUpTracker(event)
            return true
        }

        this.setBackgroundColor(this.normalColor())
        return this
    }

    hoverCursorType () {
        if (this.isVerticalDrag()) {
            return "row-resize"
        }

        return "col-resize"
    }

    setIsVertical (aBool) {
        if (this._isVertical !== aBool) {
            this._isVertical = aBool
            //console.log("this.hoverCursorType() = ", this.hoverCursorType())
            this.setCursor(this.hoverCursorType())
        }
        return this
    }

    // --- editable ---
    
    setIsEnabled (aBool) {
        if (this._isEnabled !== aBool) {
            this._isEnabled = aBool
            this.syncEnabled()
        }

        return this
    }

    syncEnabled () {
        this.setIsDisplayHidden(!this.isEnabled())
        return this
    }

    // --- highlighted ---
    
    setIsHighlighted (aBool) {
        if (this._isHighlighted !== aBool) {
            this._isHighlighted = aBool
            this.syncHighlighted()
        }

        return this
    }

    syncHighlighted () {
        if (this.isDragging()) {
            return this
        }

        if (this.isHighlighted()) {
            this.setBackgroundColor(this.highlightColor())
        } else {
            this.setBackgroundColor(this.normalColor())
        }
        this.syncCursor()

        return this
    }

    syncCursor () {
        if (this.isHighlighted()) {
            this.setCursor(this.hoverCursorType())
        } else {
            this.setCursor(null)
        }
        return this
    }

    // --- mouse ---

    mouseMoveTracker (event) {
        //console.log("mouse pos: ", event.clientX, " x ", event.clientY)
        if (this.delegate()) {
            this.delegate().didDragDivider(Math.floor(event.clientX), Math.floor(event.clientY))
        }
    }

    mouseUpTracker (event) {
        //console.log("mouse pos: ", event.clientX, " x ", event.clientY)
        this.onMouseUp(event)
    }

    setIsDragging (b) {
        this._isDragging = b;
        if (b) {
            this.setBackgroundColor(this.dragColor())
            this.parentView().setBorder("1px dashed white")
        } else {
            this.setBackgroundColor(this.normalColor())
            this.parentView().setBorder("0px dashed white")
        }
        return this
    }

    onMouseDown (event) {
        //this.debugLog(" onMouseDown")
        this.setIsDragging(true)

        this.removeParentTracking()
        return false
    }

    addParentTracking () {
        const r = this.documentBodyView()
        r.element().removeEventListener("mousemove", this._mouseMoveTrackerFunc, false);
        r.element().removeEventListener("mouseup", this._mouseUpTrackerFunc, false);
        return this
    }

    removeParentTracking () {
        const r = this.documentBodyView()
        r.element().addEventListener("mousemove", this._mouseMoveTrackerFunc, false);
        r.element().addEventListener("mouseup", this._mouseUpTrackerFunc, false);
        return this
    }

    onMouseMove (event) {
        return false
    }

    onMouseOver (event) {
        //this.debugLog(" onMouseOver")
        this.setIsHighlighted(true)
        return false
    }

    onMouseLeave (event) {
        //this.debugLog(" onMouseLeave")
        this.setIsHighlighted(false)
        return false
    }

    onMouseUp (event) {
        this.setIsDragging(false)
        this.addParentTracking()
        return false
    }
    
}.initThisClass());
