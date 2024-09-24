/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
 */

/**
 * @class ScreenRightEdgePanGestureRecognizer
 * @extends ScreenEdgePanGestureRecognizer
 * @classdesc
 * ScreenRightEdgePanGestureRecognizer for recognizing right edge pan gestures on the screen.
 *
 * Delegate messages:
 * - onScreenRightEdgePanBegin
 * - onScreenRightEdgePanMove
 * - onScreenRightEdgePanComplete
 * - onScreenRightEdgePanCancelled
 */
(class ScreenRightEdgePanGestureRecognizer extends ScreenEdgePanGestureRecognizer {
    
    /**
     * @description Initializes the prototype slots for the class.
     * @returns {void}
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the ScreenRightEdgePanGestureRecognizer.
     * @returns {ScreenRightEdgePanGestureRecognizer} The initialized instance.
     */
    init () {
        super.init()
        this.setEdgeName("right")
        return this
    }

}.initThisClass());