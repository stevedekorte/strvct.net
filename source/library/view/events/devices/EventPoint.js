"use strict";

/**
 * @module library.view.events.devices
 */

/**
 * @class EventPoint
 * @extends Point
 * @classdesc Class to represent a 2d or 3d point, optionally with a time.
 * 
 * NOTES:
 * 
 * Event's positions are set to the document (event.pageX, event.pageY) coordinates.
 * To get the viewport coordinates (event.clientX, event.clientY), 
 * use the viewportPosition() method.
 */
(class EventPoint extends Point {
    /**
     * @description Initializes the prototype slots for the EventPoint class.
     */
    initPrototypeSlots () {
        /**
         * @member {String} id - The id of the event point.
         * @category Identification
         */
        {
            const slot = this.newSlot("id", null);
            slot.setSlotType("String");
        }
        /**
         * @member {String} state - The state of the event point.
         * @category State
         */
        {
            const slot = this.newSlot("state", null);
            slot.setSlotType("Number");
        }
        /**
         * @member {Element} target - The target element of the event point.
         * @category DOM
         */
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Element");
        }
        /**
         * @member {Boolean} isDown - Indicates if the event point is in a down state.
         * @category State
         */
        {
            const slot = this.newSlot("isDown", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {DomView} overView - The view the event point is over.
         * @category DOM
         */
        {
            const slot = this.newSlot("overView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {Event} event - The associated event object.
         * @category Event
         */
        {
            const slot = this.newSlot("event", null);
            slot.setSlotType("Event");
        }
    }
   
    /*
    init () {
        super.init()
        return this
    }
    */

    /**
     * @description Copies properties from another EventPoint instance.
     * @param {EventPoint} p - The EventPoint to copy from.
     * @param {Object} copyDict - The dictionary used for copying.
     * @returns {EventPoint} This instance.
     * @category Data Manipulation
     */
    copyFrom (p, copyDict) {
        super.copyFrom(p, copyDict)
        this._id = p._id
        this._state = p._state
        this._target = p._target
        return this
    }

    /**
     * @description Gets the view the event point is over.
     * @returns {DomView|null} The view or null if not found.
     * @category DOM
     */
    overView () {
        if (this._overView === null) {
            this._overView = this.findOverview()
        }
        return this._overView
    }

    /**
     * @description Finds the view the event point is over by traversing the DOM.
     * @returns {DomView|null} The found view or null if not found.
     * @category DOM
     */
    findOverview () {
        debugger;
        // search up the dom elements until we find one 
        // associated with a DomView instance 

        let e = document.elementFromPoint(this.x(), this.y());


        while (e) {
            const view = e.domView()
            if (view) {
                return view
            }
            e = e.parentElement
        }
        return null
    }

    /**
     * @description Gets the viewport position of the event point.
     * @returns {Point} The viewport position.
     * @category Viewport
     */
    viewportPosition () {
        const e = this.event()
        const p = Point.clone().set(e.clientX, e.clientY)
        return p
    }

    /**
     * @description Gets the viewport height.
     * @returns {number} The viewport height.
     * @category Viewport
     */
    viewportHeight () {
        return window.innerHeight
    }

    /**
     * @description Gets the viewport width.
     * @returns {number} The viewport width.
     * @category Viewport
     */
    viewportWidth () {
        return window.innerWidth
    }

    /**
     * @description Gets the distance from the top of the viewport.
     * @returns {number} The distance from the top of the viewport.
     * @category Viewport
     */
    distFromTopOfViewport () {
        return this.event().clientY
    }

    /**
     * @description Gets the distance from the bottom of the viewport.
     * @returns {number} The distance from the bottom of the viewport.
     * @category Viewport
     */
    distFromBottomOfViewport () {
        return this.viewportHeight() - this.distFromTopOfViewport()
    }

    /**
     * @description Gets the distance from the left of the viewport.
     * @returns {number} The distance from the left of the viewport.
     * @category Viewport
     */
    distFromLeftOfViewport () {
        return this.event().clientX
    }

    /**
     * @description Gets the distance from the right of the viewport.
     * @returns {number} The distance from the right of the viewport.
     * @category Viewport
     */
    distFromRightOfViewport () {
        return this.viewportWidth() - this.distFromLeftOfViewport()
    }
    
}.initThisClass());