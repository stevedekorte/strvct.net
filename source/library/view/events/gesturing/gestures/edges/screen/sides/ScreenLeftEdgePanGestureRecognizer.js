/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides.ScreenLeftEdgePanGestureRecognizer
 */

/**
 * @class ScreenLeftEdgePanGestureRecognizer
 * @extends ScreenEdgePanGestureRecognizer
 * @classdesc ScreenLeftEdgePanGestureRecognizer
 * 
 * Delegate messages:
 * 
 *     onScreenLeftEdgePanBegin
 *     onScreenLeftEdgePanMove
 *     onScreenLeftEdgePanComplete
 *     onScreenLeftEdgePanCancelled
 */
(class ScreenLeftEdgePanGestureRecognizer extends ScreenEdgePanGestureRecognizer {
    
    /**
     * @description Initializes prototype slots
     * @returns {void}
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the gesture recognizer
     * @returns {ScreenLeftEdgePanGestureRecognizer} The initialized instance
     */
    init () {
        super.init()
        this.setEdgeName("left")
        return this
    }

}.initThisClass());