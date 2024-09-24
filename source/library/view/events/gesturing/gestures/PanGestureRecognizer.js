"use strict";

/**
 * @module library.view.events.gesturing.gestures
 */

/**
 * @class PanGestureRecognizer
 * @extends GestureRecognizer
 * @classdesc PanGestureRecognizer
 * 
 * Gesture begins when the minimal number of fingers have moved the minimal distance.
 * Will requestActive before beginning.
 * 
 * Delegate messages:
 * 
 *     onPanBegin
 *     onPanMove
 *     onPanComplete
 *     onPanCancelled
 */
(class PanGestureRecognizer extends GestureRecognizer {
    
    initPrototypeSlots () {
        /**
         * @property {Number} minNumberOfFingersRequired
         */
        {
            const slot = this.newSlot("minNumberOfFingersRequired", 1);
            slot.setSlotType("Number");
        }
        /**
         * @property {Number} maxNumberOfFingersAllowed
         */
        {
            const slot = this.newSlot("maxNumberOfFingersAllowed", 1);
            slot.setSlotType("Number");
        }
        //downPositionInTarget: null, Point
    }

    /**
     * @description Initializes the PanGestureRecognizer
     * @returns {PanGestureRecognizer}
     */
    init () {
        super.init();
        this.setListenerClasses(this.defaultListenerClasses());
        //this.setIsDebugging(false);
        return this;
    }

    // --- events --------------------------------------------------------------------

    // tap events

    /**
     * @description Checks if the number of fingers down is within the allowed range
     * @returns {boolean}
     */
    hasOkFingerCount () {
        const n = this.numberOfFingersDown();
        const min = this.minNumberOfFingersRequired();
        const max = this.maxNumberOfFingersAllowed();
        return (n >= min && n <= max);
    }

    /**
     * @description Checks if the gesture is ready to begin
     * @returns {boolean}
     */
    isReadyToBegin () {
        return this.hasOkFingerCount();
    }

    /**
     * @description Handles the press event
     * @param {Event} event - The press event
     * @returns {PanGestureRecognizer}
     */
    doPress (event) { 
        this.debugLog("doPress");
        this.setIsPressing(true);
        this.setDownEvent(event);
        this.startDocListeners();
        return this;
    }

    /**
     * @description Handles the down event
     * @param {Event} event - The down event
     * @returns {PanGestureRecognizer}
     */
    onDown (event) {
        super.onDown(event);

        if (!this.isPressing()) {
            if (this.isReadyToBegin()) {
                this.doPress(event);
            }
        }
        
        return this;
    }

    /**
     * @description Attempts to begin the gesture
     */
    attemptBegin () {
        this.debugLog("attemptBegin")

        if (!this.doesTargetAccept()) {
            return;
        }

        if (this.requestActivationIfNeeded()) {
            this.sendBeginMessage() // begin
        } else {
            if (this.isDebugging()) {
                console.log(this.shortTypeId() + ".attemptBegin() FAILED")
            }
        }
    }

    /**
     * @description Handles the mouse move capture event
     * @param {Event} event - The mouse move capture event
     */
    onMouseMoveCapture (event) { // tmp for debugging dragview
        this.debugLog("onMouseMoveCapture")
        super.onMouseMoveCapture(event)
    }

    /**
     * @description Handles the move event
     * @param {Event} event - The move event
     * @returns {PanGestureRecognizer}
     */
    onMove (event) {
        super.onMove(event)

        if (this.isPressing()) {
            if (this.isActive()) {
                this.sendMoveMessage() // move
            } else {
                if (this.hasMovedEnough()) {
                    this.attemptBegin()
                }
            }
        }
        return this
    }

    /**
     * @description Handles the up event
     * @param {Event} event - The up event
     * @returns {PanGestureRecognizer}
     */
    onUp (event) {
        super.onUp(event)

        if (this.isPressing()) {
            if (this.isActive()) {
                this.sendCompleteMessage() // complete
            }
            this.didFinish() // will set isPressing to false
        }
        return this
    }

    // ----------------------------------

    /**
     * @description Cancels the gesture
     * @returns {PanGestureRecognizer}
     */
    cancel () {
        if (this.isActive()) {
            this.sendCancelledMessage()
        }
        this.didFinish()
        return this
    }

    /**
     * @description Finishes the gesture
     * @returns {PanGestureRecognizer}
     */
    didFinish () {
        super.didFinish()
        this.setIsPressing(false)
        this.stopDocListeners()
        return this
    }

    // ----------------------------------

    /**
     * @description Checks if the gesture has moved enough to begin
     * @returns {boolean}
     */
    hasMovedEnough () {
        const m = this.minDistToBegin()
        const d = this.currentPosition().distanceFrom(this.downPosition())
        return d >= m
    }

    /**
     * @description Calculates the distance of the gesture
     * @returns {number}
     */
    distance () {
        return this.currentPosition().distanceFrom(this.beginPosition())
    }

}.initThisClass());