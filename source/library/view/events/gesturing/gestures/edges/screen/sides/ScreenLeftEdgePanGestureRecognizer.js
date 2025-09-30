/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
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
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the gesture recognizer
     * @returns {ScreenLeftEdgePanGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("left");
        return this;
    }

}.initThisClass());
