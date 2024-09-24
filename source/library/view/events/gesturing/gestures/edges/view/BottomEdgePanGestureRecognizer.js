"use strict";

/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class BottomEdgePanGestureRecognizer
 * @extends EdgePanGestureRecognizer
 * @classdesc BottomEdgePanGestureRecognizer
 *
 * Delegate messages:
 *
 *     onBottomEdgePanBegin
 *     onBottomEdgePanMove
 *     onBottomEdgePanComplete
 *     onBottomEdgePanCancelled
 */
(class BottomEdgePanGestureRecognizer extends EdgePanGestureRecognizer {
    
    /**
     * @description Initializes prototype slots for the class.
     * @returns {void}
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the instance.
     * @returns {BottomEdgePanGestureRecognizer} The initialized instance.
     */
    init () {
        super.init()
        this.setEdgeName("bottom")
        this.setIsDebugging(false)
        return this
    }
    
    
}.initThisClass());