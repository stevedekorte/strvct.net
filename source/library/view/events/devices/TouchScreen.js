/**
 * @module library.view.events.devices
 */

"use strict";

/**
 * @class TouchScreen
 * @extends Device
 * @classdesc Global shared instance that tracks current touch state in window coordinates.
 * Registers for capture events on document.body.
 * 
 * Example use:
 * 
 *     const hasTouch = TouchScreen.shared().isSupported()
 */
(class TouchScreen extends Device {

    /**
     * @static
     * @description Initializes the class by setting it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true)
    }
    
    /**
     * @description Initializes the prototype slots for the TouchScreen class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {TouchEvent} currentEvent - The current touch event.
         * @category Event Tracking
         */
        {
            const slot = this.newSlot("currentEvent", null);
            slot.setSlotType("TouchEvent");
        }
        /**
         * @member {TouchEvent} lastEvent - The last touch event.
         * @category Event Tracking
         */
        {
            const slot = this.newSlot("lastEvent", null);
            slot.setSlotType("TouchEvent");
        }
        /**
         * @member {TouchListener} touchListener - The touch listener object.
         * @category Event Handling
         */
        {
            const slot = this.newSlot("touchListener", null);
            slot.setSlotType("TouchListener");
        }
        /**
         * @member {Boolean} isSupported - Indicates if touch is supported.
         * @category Device Capability
         */
        {
            const slot = this.newSlot("isSupported", null);
            slot.setSlotType("Boolean");
        }
        /*
        {
            const slot = this.newSlot("isVisualDebugging", false);
            slot.setSlotType("Boolean");
        }
        */
    }

    /**
     * @description Checks if touch is supported.
     * @returns {Boolean} True if touch is supported, false otherwise.
     * @category Device Capability
     */
    isSupported () {
        if (this._isSupported === null) {
            this._isSupported = this.calcIsSupported();
        }
        return this._isSupported;
    }

    /**
     * @description Calculates if touch is supported.
     * @returns {Boolean} True if touch is supported, false otherwise.
     * @category Device Capability
     */
    calcIsSupported () {
        // return WebBrowserWindow.isTouchDevice()
        let result = false;
        
        if ("ontouchstart" in window) { 
            // works on most browsers 
            result = true; 
        }

        if (navigator.maxTouchPoints) {
            // works on IE10/11 and Surface	
            result = true; 
        } 

        return result
    }

    /**
     * @description Initializes the TouchScreen instance.
     * @returns {TouchScreen} The initialized TouchScreen instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.startListening()
        this.setIsDebugging(false)
        if (this.isDebugging()) {
            this.debugLog(".init()")
        }
        return this
    }

    /**
     * @description Sets the current touch event.
     * @param {TouchEvent} event - The touch event to set as current.
     * @returns {TouchScreen} The TouchScreen instance.
     * @category Event Tracking
     */
    setCurrentEvent (event) {
        if (this._currentEvent !== event) {
            this.setLastEvent(this._currentEvent)
            this._currentEvent = event
            if (this.isDebugging()) {
                console.log(this.type() + " touch count: " + this.currentPoints().length)
            }
            //Devices.shared().setCurrentEvent(event)
        }
        return this
    }

    /**
     * @description Starts listening for touch events.
     * @returns {TouchScreen} The TouchScreen instance.
     * @category Event Handling
     */
    startListening () {
        this.setTouchListener(TouchListener.clone().setUseCapture(true).setListenTarget(document.body).setDelegate(this))
        this.touchListener().setIsListening(true)
        return this
    }

    /**
     * @description Handles the touch begin capture event.
     * @param {TouchEvent} event - The touch begin event.
     * @returns {Boolean} Always returns true.
     * @category Event Handling
     */
    onTouchBeginCapture (event) {
        if (this.isDebugging()) {
            console.log(this.type() + ".onTouchBeginCapture()")
        }
        this.setCurrentEvent(event)
        //this.handleLeave(event)
        return true
    }

    /**
     * @description Finds the last point for a given touch ID.
     * @param {Number} id - The touch ID.
     * @returns {EventPoint|undefined} The last point for the given ID, or undefined if not found.
     * @category Touch Point Tracking
     */
    lastPointForId (id) {
        const lastPoints = this.pointsForEvent(this.lastEvent())
        return lastPoints.detect(p => p.id() === id)
    }

    /**
     * @description Finds the current point for a given touch ID.
     * @param {Number} id - The touch ID.
     * @returns {EventPoint|undefined} The current point for the given ID, or undefined if not found.
     * @category Touch Point Tracking
     */
    currentPointForId (id) {
        const currentPoints = this.pointsForEvent(this.currentEvent())
        return currentPoints.detect(p => p.id() === id)
    }

    /**
     * @description Handles the touch move capture event.
     * @param {TouchEvent} event - The touch move event.
     * @returns {Boolean} Always returns true.
     * @category Event Handling
     */
    onTouchMoveCapture (event) {
        this.setCurrentEvent(event)
        //this.handleLeave(event)
        return true
    }

    /**
     * @description Handles the touch end capture event.
     * @param {TouchEvent} event - The touch end event.
     * @returns {Boolean} Always returns true.
     * @category Event Handling
     */
    onTouchEndCapture (event) {
        this.setCurrentEvent(event)
        //this.handleLeave(event)
        return true
    }

    /**
     * @description Creates an EventPoint from a Touch object.
     * @param {Touch} touch - The Touch object.
     * @returns {EventPoint} The created EventPoint.
     * @category Touch Point Creation
     */
    pointForTouch (touch) {
        assert(event.__proto__.constructor === TouchEvent)
        const p = EventPoint.clone()
        p.setId(touch.identifier)
        p.setTarget(touch.target)
        p.set(touch.pageX, touch.pageY)  // document position
        p.setTimeToNow()
        p.setIsDown(true)
        p.setEvent(touch)
        //p.findOverview()
        return p
    }

    /**
     * @description Creates EventPoints for all touches in a TouchEvent.
     * @param {TouchEvent} event - The TouchEvent.
     * @returns {Array<EventPoint>} An array of EventPoints.
     * @category Touch Point Creation
     */
    justPointsForEvent (event) {
        const points = []
        // event.touches isn't a proper array, so we can't enumerate it normally
        const touches = event.touches // all current touches
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i]
            const p = this.pointForTouch(touch)
            points.append(p)
        }

        return points
    }

    /**
     * @description Gets or creates EventPoints for a TouchEvent.
     * @param {TouchEvent} event - The TouchEvent.
     * @returns {Array<EventPoint>} An array of EventPoints.
     * @category Touch Point Creation
     */
    pointsForEvent (event) {
        if (!event.hasCachedPoints()) {
            event.preventDefault() // needed to prevent browser from handling touches?

            const points = this.justPointsForEvent(event)
            event.setCachedPoints(points)
        }

        return event.cachedPoints(event)
    }

    /**
     * @description Gets the current touch points.
     * @returns {Array<EventPoint>} An array of current EventPoints.
     * @category Touch Point Tracking
     */
    currentPoints () {
        if (this.currentEvent()) {
            return this.pointsForEvent(this.currentEvent())
        }
        return []
    }

}.initThisClass());