/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
 */

/**
 * @class ScreenTopEdgePanGestureRecognizer
 * @extends ScreenEdgePanGestureRecognizer
 * @classdesc Recognizes pan gestures from the top edge of the screen.
 *
 * Delegate messages:
 *
 * onScreenTopEdgePanBegin
 * onScreenTopEdgePanMove
 * onScreenTopEdgePanComplete
 * onScreenTopEdgePanCancelled
 */
(class ScreenTopEdgePanGestureRecognizer extends ScreenEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots for the class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the gesture recognizer.
     * @returns {ScreenTopEdgePanGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("top");
        return this;
    }

}.initThisClass());
