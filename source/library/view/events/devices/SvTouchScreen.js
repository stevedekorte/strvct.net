/**
 * @module library.view.events.devices
 */

"use strict";

/**
 * @class SvTouchScreen
 * @extends SvDevice
 * @classdesc Global shared instance that tracks current touch state in window coordinates.
 * Registers for capture events on document.body.
 *
 * Example use:
 *
 *     const hasTouch = SvTouchScreen.shared().isSupported()
 */
(class SvTouchScreen extends SvDevice {

    /**
     * @static
     * @description Initializes the class by setting it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots for the SvTouchScreen class.
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
         * @member {SvTouchListener} touchListener - The touch listener object.
         * @category Event Handling
         */
        {
            const slot = this.newSlot("touchListener", null);
            slot.setSlotType("SvTouchListener");
        }
        /**
         * @member {Boolean} isSupported - Indicates if touch is supported.
         * @category SvDevice Capability
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
     * @category SvDevice Capability
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
     * @category SvDevice Capability
     */
    calcIsSupported () {
        // return SvWebBrowserWindow.isTouchDevice()
        let result = false;

        if ("ontouchstart" in window) {
            // works on most browsers
            result = true;
        }

        if (navigator.maxTouchPoints) {
            // works on IE10/11 and Surface
            result = true;
        }

        return result;
    }

    /**
     * @description Initializes the SvTouchScreen instance.
     * @returns {SvTouchScreen} The initialized SvTouchScreen instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.startListening();
        this.setIsDebugging(false);
        if (this.isDebugging()) {
            this.logDebug(".init()");
        }
        return this;
    }

    /**
     * @description Sets the current touch event.
     * @param {TouchEvent} event - The touch event to set as current.
     * @returns {SvTouchScreen} The SvTouchScreen instance.
     * @category Event Tracking
     */
    setCurrentEvent (event) {
        if (this._currentEvent !== event) {
            this.setLastEvent(this._currentEvent);
            this._currentEvent = event;
            if (this.isDebugging()) {
                console.log(this.svType() + " touch count: " + this.currentPoints().length);
            }
            //SvDevices.shared().setCurrentEvent(event)
        }
        return this;
    }

    /**
     * @description Starts listening for touch events.
     * @returns {SvTouchScreen} The SvTouchScreen instance.
     * @category Event Handling
     */
    startListening () {
        this.setTouchListener(SvTouchListener.clone().setUseCapture(true).setListenTarget(document.body).setDelegate(this));
        this.touchListener().setIsListening(true);
        return this;
    }

    /**
     * @description Handles the touch begin capture event.
     * @param {TouchEvent} event - The touch begin event.
     * @returns {Boolean} Always returns true.
     * @category Event Handling
     */
    onTouchBeginCapture (event) {
        if (this.isDebugging()) {
            console.log(this.svType() + ".onTouchBeginCapture()");
        }
        this.setCurrentEvent(event);
        //this.handleLeave(event)
        return true;
    }

    /**
     * @description Finds the last point for a given touch ID.
     * @param {Number} id - The touch ID.
     * @returns {SvEventPoint|undefined} The last point for the given ID, or undefined if not found.
     * @category Touch SvPoint Tracking
     */
    lastPointForId (id) {
        const lastPoints = this.pointsForEvent(this.lastEvent());
        return lastPoints.detect(p => p.id() === id);
    }

    /**
     * @description Finds the current point for a given touch ID.
     * @param {Number} id - The touch ID.
     * @returns {SvEventPoint|undefined} The current point for the given ID, or undefined if not found.
     * @category Touch SvPoint Tracking
     */
    currentPointForId (id) {
        const currentPoints = this.pointsForEvent(this.currentEvent());
        return currentPoints.detect(p => p.id() === id);
    }

    /**
     * @description Handles the touch move capture event.
     * @param {TouchEvent} event - The touch move event.
     * @returns {Boolean} Always returns true.
     * @category Event Handling
     */
    onTouchMoveCapture (event) {
        this.setCurrentEvent(event);
        //this.handleLeave(event)
        return true;
    }

    /**
     * @description Handles the touch end capture event.
     * @param {TouchEvent} event - The touch end event.
     * @returns {Boolean} Always returns true.
     * @category Event Handling
     */
    onTouchEndCapture (event) {
        this.setCurrentEvent(event);
        //this.handleLeave(event)
        return true;
    }

    /**
     * @description Creates an SvEventPoint from a Touch object.
     * @param {Touch} touch - The Touch object.
     * @returns {SvEventPoint} The created SvEventPoint.
     * @category Touch SvPoint Creation
     */
    pointForTouch (touch) {
        assert(event.__proto__.constructor === TouchEvent);
        const p = SvEventPoint.clone();
        p.setId(touch.identifier);
        p.setTarget(touch.target);
        p.set(touch.pageX, touch.pageY);  // document position
        p.setTimeToNow();
        p.setIsDown(true);
        p.setEvent(touch);
        //p.findOverview()
        return p;
    }

    /**
     * @description Creates EventPoints for all touches in a TouchEvent.
     * @param {TouchEvent} event - The TouchEvent.
     * @returns {Array<SvEventPoint>} An array of EventPoints.
     * @category Touch SvPoint Creation
     */
    justPointsForEvent (event) {
        const points = [];
        // event.touches isn't a proper array, so we can't enumerate it normally
        const touches = event.touches; // all current touches
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i];
            const p = this.pointForTouch(touch);
            points.append(p);
        }

        return points;
    }

    /**
     * @description Gets or creates EventPoints for a TouchEvent.
     * @param {TouchEvent} event - The TouchEvent.
     * @returns {Array<SvEventPoint>} An array of EventPoints.
     * @category Touch SvPoint Creation
     */
    pointsForEvent (event) {
        if (!event.hasCachedPoints()) {
            // CSS touch-action handles browser gesture prevention;
            // no need for preventDefault() here (and it would fail with passive listeners).
            const points = this.justPointsForEvent(event);
            event.setCachedPoints(points);
        }

        return event.cachedPoints(event);
    }

    /**
     * @description Gets the current touch points.
     * @returns {Array<SvEventPoint>} An array of current EventPoints.
     * @category Touch SvPoint Tracking
     */
    currentPoints () {
        if (this.currentEvent()) {
            return this.pointsForEvent(this.currentEvent());
        }
        return [];
    }

}.initThisClass());
