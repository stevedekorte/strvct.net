"use strict";

/**
 * @module library.view.events.gesturing.gestures
 */

/**
 * @class RotationGestureRecognizer
 * @extends GestureRecognizer
 * @classdesc RotationGestureRecognizer overrides OrientGestureRecognizer's hasMovedEnough() method to
 * check for minRotationInDegreesToBegin.
 *
 * Delegate messages:
 * - onRotationBegin
 * - onRotationMove
 * - onRotationComplete
 * - onRotationCancelled
 *
 * Helper methods:
 * - rotation:
 *   - activeAngleInDegress // current angle between 1st two fingers down
 *   - rotationInDegrees // difference between initial angle between 1st two fingers down and their current angle
 */
(class RotationGestureRecognizer extends GestureRecognizer {

    /**
     * @description Initializes prototype slots
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the RotationGestureRecognizer
     * @returns {RotationGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setListenerClasses(this.defaultListenerClasses());
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Checks if the rotation has moved enough to begin recognition
     * @returns {boolean} True if the rotation has moved enough, false otherwise
     * @category Gesture Recognition
     */
    hasMovedEnough () {
        const ma = this.minRotatationInDegreesToBegin();
        const a = this.activeAngleInDegress();
        return a >= ma;
    }

}.initThisClass());
