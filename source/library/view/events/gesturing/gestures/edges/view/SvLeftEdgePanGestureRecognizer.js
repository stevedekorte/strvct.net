/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class SvLeftEdgePanGestureRecognizer
 * @extends SvEdgePanGestureRecognizer
 * @classdesc SvLeftEdgePanGestureRecognizer
 *
 * Delegate messages:
 *
 *     onLeftEdgePanBegin
 *     onLeftEdgePanMove
 *     onLeftEdgePanComplete
 *     onLeftEdgePanCancelled
 */
(class SvLeftEdgePanGestureRecognizer extends SvEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvLeftEdgePanGestureRecognizer
     * @returns {SvLeftEdgePanGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("left");
        return this;
    }

}.initThisClass());
