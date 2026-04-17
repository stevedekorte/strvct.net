/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
 */

/**
 * @class SvScreenLeftEdgePanGestureRecognizer
 * @extends SvScreenEdgePanGestureRecognizer
 * @classdesc SvScreenLeftEdgePanGestureRecognizer
 *
 * Delegate messages:
 *
 *     onScreenLeftEdgePanBegin
 *     onScreenLeftEdgePanMove
 *     onScreenLeftEdgePanComplete
 *     onScreenLeftEdgePanCancelled
 */
(class SvScreenLeftEdgePanGestureRecognizer extends SvScreenEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the gesture recognizer
     * @returns {SvScreenLeftEdgePanGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("left");
        return this;
    }

}.initThisClass());
