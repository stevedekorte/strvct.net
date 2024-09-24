"use strict";

/**
 * @module library.view.events.gesturing.gestures
 */

/**
 * @class PinchGestureRecognizer
 * @extends GestureRecognizer
 * @classdesc Subclass of OrientGestureRecognizer that overrides hasMovedEnough() to 
 * check for minDistToBegin.
 *
 * Delegate messages:
 *     onPinchBegin
 *     onPinchMove
 *     onPinchComplete
 *     onPinchCancelled
 *
 * Helper methods:
 *     scale:
 *         scale // current distance between 1st to fingers down divided by their initial distance
 */
(class PinchGestureRecognizer extends GestureRecognizer {
    
    /**
     * @description Initializes prototype slots
     * @private
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the PinchGestureRecognizer
     * @returns {PinchGestureRecognizer} The initialized instance
     */
    init () {
        super.init()
        this.setListenerClasses(this.defaultListenerClasses()) 
        //this.setIsDebugging(false)
        //this.setIsVisualDebugging(true)
        this.setMinFingersRequired(2)
        this.setMaxFingersAllowed(2)
        return this
    }

    /**
     * @description Checks if the gesture has moved enough to be recognized
     * @returns {boolean} True if the gesture has moved enough, false otherwise
     */
    hasMovedEnough () {
        const m = this.minDistToBegin()
        const d = this.currentPosition().distanceFrom(this.downPosition())
        //console.log(this.shortTypeId() + ".hasMovedEnough() " + d + ">= min " + m)
        return d >= m
    }
    
}.initThisClass());