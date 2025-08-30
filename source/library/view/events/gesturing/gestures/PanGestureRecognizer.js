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
         * @member {Number} minNumberOfFingersRequired
         * @category Configuration
         */
        {
            const slot = this.newSlot("minNumberOfFingersRequired", 1);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} maxNumberOfFingersAllowed
         * @category Configuration
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
     * @category Initialization
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
     * @category Validation
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
     * @category Validation
     */
    isReadyToBegin () {
        return this.hasOkFingerCount();
    }

    /**
     * @description Handles the press event
     * @param {Event} event - The press event
     * @returns {PanGestureRecognizer}
     * @category Event Handling
     */
    doPress (event) { 
        this.logDebug("doPress");
        this.setIsPressing(true);
        this.setDownEvent(event);
        this.startDocListeners();
        return this;
    }

    /**
     * @description Handles the down event
     * @param {Event} event - The down event
     * @returns {PanGestureRecognizer}
     * @category Event Handling
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
     * @category Gesture Control
     */
    attemptBegin () {
        this.logDebug("attemptBegin")

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
     * @category Event Handling
     */
    onMouseMoveCapture (event) { // tmp for debugging dragview
        this.logDebug("onMouseMoveCapture")
        super.onMouseMoveCapture(event)
    }

    /**
     * @description Handles the move event
     * @param {Event} event - The move event
     * @returns {PanGestureRecognizer}
     * @category Event Handling
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
     * @category Event Handling
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
     * @category Gesture Control
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
     * @category Gesture Control
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
     * @category Validation
     */
    hasMovedEnough () {
        const m = this.minDistToBegin()
        const d = this.currentPosition().distanceFrom(this.downPosition())
        return d >= m
    }

    /**
     * @description Calculates the distance of the gesture
     * @returns {number}
     * @category Calculation
     */
    distance () {
        return this.currentPosition().distanceFrom(this.beginPosition())
    }

}.initThisClass());