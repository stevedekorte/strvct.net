/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
 */

/**
 * @class SvScreenTopEdgePanGestureRecognizer
 * @extends SvScreenEdgePanGestureRecognizer
 * @classdesc Recognizes pan gestures from the top edge of the screen.
 *
 * Delegate messages:
 *
 * onScreenTopEdgePanBegin
 * onScreenTopEdgePanMove
 * onScreenTopEdgePanComplete
 * onScreenTopEdgePanCancelled
 */
(class SvScreenTopEdgePanGestureRecognizer extends SvScreenEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots for the class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the gesture recognizer.
     * @returns {SvScreenTopEdgePanGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("top");
        return this;
    }

}.initThisClass());
