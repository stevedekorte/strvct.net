"use strict";

/*

    ScreenTopEdgePanGestureRecognizer

    Delegate messages:

        onScreenTopEdgePanBegin
        onScreenTopEdgePanMove
        onScreenTopEdgePanComplete
        onScreenTopEdgePanCancelled

*/

(class ScreenTopEdgePanGestureRecognizer extends ScreenEdgePanGestureRecognizer {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setEdgeName("top")
        return this
    }

}.initThisClass());
