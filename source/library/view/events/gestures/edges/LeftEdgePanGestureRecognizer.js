"use strict";

/*

    LeftEdgePanGestureRecognizer

    Delegate messages:

        onLeftEdgePanBegin
        onLeftEdgePanMove
        onLeftEdgePanComplete
        onLeftEdgePanCancelled

*/

(class LeftEdgePanGestureRecognizer extends EdgePanGestureRecognizer {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setEdgeName("left")
        return this
    }

}.initThisClass())
