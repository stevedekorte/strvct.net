/**
 * @module library.view.events.devices
 */

/**
 * @class Mouse
 * @extends Device
 * @classdesc Global shared instance that tracks current mouse state in window coordinates.
 * Registers for capture mouse events on document.body.
 *
 * NOTES:
 * Doesn't deal with multi-button mouse input yet.
 * Not sure how multi-button mouse should be handled if we want code
 * to be Mac, touch pad, and touch screen compatible.
 */

"use strict";

(class Mouse extends Device {

    /**
     * @static
     * @description Initializes the class and sets it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots for the Mouse class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Boolean} isDown - Indicates whether the mouse button is down.
         * @category State
         */
        {
            const slot = this.newSlot("isDown", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {MouseEvent} downEvent - Stores the mouse down event.
         * @category State
         */
        {
            const slot = this.newSlot("downEvent", null);
            slot.setSlotType("MouseEvent");
        }
        /**
         * @member {MouseEvent} currentEvent - Stores the current mouse event.
         * @category State
         */
        {
            const slot = this.newSlot("currentEvent", null);
            slot.setSlotType("MouseEvent");
        }
        /**
         * @member {MouseEvent} upEvent - Stores the mouse up event.
         * @category State
         */
        {
            const slot = this.newSlot("upEvent", null);
            slot.setSlotType("MouseEvent");
        }
        /**
         * @member {MouseListener} mouseListener - The mouse listener instance.
         * @category Event Handling
         */
        {
            const slot = this.newSlot("mouseListener", null);
            slot.setSlotType("MouseListener");
        }
        /**
         * @member {MouseMoveListener} mouseMoveListener - The mouse move listener instance.
         * @category Event Handling
         */
        {
            const slot = this.newSlot("mouseMoveListener", null);
            slot.setSlotType("MouseMoveListener");
        }
    }

    /**
     * @description Initializes the Mouse instance and starts listening for events.
     * @returns {Mouse} The initialized Mouse instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.startListening();
        return this;
    }

    /*
    setCurrentEvent (event) {
        this._currentEvent = event;
        //Devices.shared().setCurrentEvent(event);
        return this;
    }
    */

    /**
     * @description Starts listening for mouse events.
     * @returns {Mouse} The Mouse instance.
     * @category Event Handling
     */
    startListening () {
        this.setMouseListener(MouseListener.clone().setUseCapture(true).setListenTarget(document.body).setDelegate(this));
        this.mouseListener().setIsListening(true);

        this.setMouseMoveListener(MouseMoveListener.clone().setUseCapture(true).setListenTarget(document.body).setDelegate(this));
        this.mouseMoveListener().setIsListening(true);
        return this;
    }

    /**
     * @description Gets the position of the mouse when the button was pressed down.
     * @returns {Point} The down position.
     * @category Position
     */
    downPos () {
        return this.pointForEvent(this.downEvent());
    }

    /**
     * @description Gets the current position of the mouse.
     * @returns {Point} The current position.
     * @category Position
     */
    currentPos () {
        return this.pointForEvent(this.currentEvent());
    }

    /**
     * @description Gets the position of the mouse when the button was released.
     * @returns {Point} The up position.
     * @category Position
     */
    upPos () {
        return this.pointForEvent(this.upEvent());
    }

    /**
     * @description Handles the mouse down event.
     * @param {MouseEvent} event - The mouse down event.
     * @returns {boolean} Always returns true.
     * @category Event Handling
     */
    onMouseDownCapture (event) {
        this.setDownEvent(event);
        this.setCurrentEvent(event);
        this.setIsDown(true);
        return true;
    }

    /**
     * @description Handles the mouse move event.
     * @param {MouseEvent} event - The mouse move event.
     * @returns {boolean} Always returns true.
     * @category Event Handling
     */
    onMouseMoveCapture (event) {
        this.setCurrentEvent(event);
        return true;
    }

    /**
     * @description Handles the mouse up event.
     * @param {MouseEvent} event - The mouse up event.
     * @returns {boolean} Always returns true.
     * @category Event Handling
     */
    onMouseUpCapture (event) {
        this.setCurrentEvent(event);
        this.setUpEvent(event);
        this.setIsDown(false);
        return true;
    }

    /**
     * @description Converts a mouse event to a point.
     * @param {MouseEvent} event - The mouse event.
     * @returns {EventPoint} The converted point.
     * @category Utilities
     */
    pointForEvent (event) {
        assert(event.__proto__.constructor === MouseEvent);

        const p = EventPoint.clone();
        p.set(event.pageX, event.pageY); // document position
        p.setTarget(event.target);
        p.setTimeToNow();
        p.setId("mouse");
        p.setState(event.buttons);
        p.setIsDown(event.buttons !== 0);
        p.setEvent(event);
        //p.findOverview();

        return p;
    }

    /**
     * @description Calculates the drag vector.
     * @param {MouseEvent} event - The mouse event.
     * @returns {Point} The drag vector.
     * @category Utilities
     */
    dragVector (event) {
        if (this.downPos()) {
            return this.currentPos().subtract(this.downPos());
        }
        /*
        if (this.isDown()) {
            return this.currentPos().subtract(this.downPos());
        }
        */
        return Point.clone();
    }

    /**
     * @description Gets the points for a given event.
     * @param {MouseEvent} event - The mouse event.
     * @returns {Array<EventPoint>} An array of points for the event.
     * @category Utilities
     */
    pointsForEvent (event) {
        if (!event.hasCachedPoints()) {
            const points = [this.pointForEvent(event)];
            event.setCachedPoints(points);
        }

        return event.cachedPoints();
    }

    /**
     * @description Gets the current points.
     * @returns {Array<EventPoint>} An array of current points.
     * @category Utilities
     */
    currentPoints () {
        if (this.currentEvent()) {
            return this.pointsForEvent(this.currentEvent());
        }
        return [];
    }

    /**
     * @description Gets the method name for the mouse down event.
     * @param {MouseEvent} event - The mouse event.
     * @returns {string} The method name for the mouse down event.
     * @category Utilities
     */
    downMethodNameForEvent (event) {
        const s = SvKeyboard.shared().modsAndKeyNameForEvent(event); // e.g. "Alternate", "Control", "MetaLeft", "MetaRight"
        return "on" + s + "MouseDown";
    }

    /**
     * @description Gets the method name for the mouse up event.
     * @param {MouseEvent} event - The mouse event.
     * @returns {string} The method name for the mouse up event.
     * @category Utilities
     */
    upMethodNameForEvent (event) {
        const s = SvKeyboard.shared().modsAndKeyNameForEvent(event);
        return "on" + s + "MouseUp";
    }

}.initThisClass());
