"use strict";

/*

    RotationGestureRecognizer

    Overrides OrientGestureRecognizer's hasMovedEnough() method to 
    check for minRotationInDegreesToBegin.
    
    Delegate messages:

        onRotationBegin
        onRotationMove
        onRotationComplete
        onRotationCancelled

    Helper methods:
    
        rotation:
            activeAngleInDegress // current angle between 1st two fingers down
            rotationInDegrees // difference between initial angle between 1st two fingers down and their current angle

*/

(class RotationGestureRecognizer extends GestureRecognizer {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setListenerClasses(this.defaultListenerClasses()) 
        this.setIsDebugging(false)
        return this
    }

    hasMovedEnough () {
        const ma = this.minRotatationInDegreesToBegin()
        const a = this.activeAngleInDegress()
        return a >= ma
    }
    
}.initThisClass());
