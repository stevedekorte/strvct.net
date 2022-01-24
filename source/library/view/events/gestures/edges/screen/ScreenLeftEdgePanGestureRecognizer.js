"use strict";

/*

    ScreenLeftEdgePanGestureRecognizer

    Delegate messages:

        onScreenLeftEdgePanBegin
        onScreenLeftEdgePanMove
        onScreenLeftEdgePanComplete
        onScreenLeftEdgePanCancelled

*/

(class ScreenLeftEdgePanGestureRecognizer extends ScreenEdgePanGestureRecognizer {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setEdgeName("left")
        return this
    }

}.initThisClass())
