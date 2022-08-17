"use strict";

/*

    ScreenRightEdgePanGestureRecognizer

    Delegate messages:

        onScreenRightEdgePanBegin
        onScreenRightEdgePanMove
        onScreenRightEdgePanComplete
        onScreenRightEdgePanCancelled

*/

(class ScreenRightEdgePanGestureRecognizer extends ScreenEdgePanGestureRecognizer {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setEdgeName("right")
        return this
    }

}.initThisClass());
