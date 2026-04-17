/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
 */

/**
 * @class SvScreenBottomEdgePanGestureRecognizer
 * @extends SvScreenEdgePanGestureRecognizer
 * @classdesc SvScreenBottomEdgePanGestureRecognizer
 *
 * Delegate messages:
 *
 *     onScreenBottomEdgePanBegin
 *     onScreenBottomEdgePanMove
 *     onScreenBottomEdgePanComplete
 *     onScreenBottomEdgePanCancelled
 */
(class SvScreenBottomEdgePanGestureRecognizer extends SvScreenEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the gesture recognizer
     * @returns {SvScreenBottomEdgePanGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("bottom");
        return this;
    }

}.initThisClass());
