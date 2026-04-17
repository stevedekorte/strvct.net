/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class SvRightEdgePanGestureRecognizer
 * @extends SvEdgePanGestureRecognizer
 * @classdesc Recognizes right edge pan gestures.
 *
 * Delegate messages:
 * - onRightEdgePanBegin
 * - onRightEdgePanMove
 * - onRightEdgePanComplete
 * - onRightEdgePanCancelled
 */
(class SvRightEdgePanGestureRecognizer extends SvEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the gesture recognizer.
     * @returns {SvRightEdgePanGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("right");
        return this;
    }

}.initThisClass());
