/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class RightEdgePanGestureRecognizer
 * @extends EdgePanGestureRecognizer
 * @classdesc Recognizes right edge pan gestures.
 * 
 * Delegate messages:
 * - onRightEdgePanBegin
 * - onRightEdgePanMove
 * - onRightEdgePanComplete
 * - onRightEdgePanCancelled
 */
(class RightEdgePanGestureRecognizer extends EdgePanGestureRecognizer {
    
    /**
     * @description Initializes prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the gesture recognizer.
     * @returns {RightEdgePanGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setEdgeName("right")
        return this
    }

}.initThisClass());