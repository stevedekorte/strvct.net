/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class SvTopEdgePanGestureRecognizer
 * @extends SvEdgePanGestureRecognizer
 * @classdesc SvTopEdgePanGestureRecognizer

    Delegate messages:

        onTopEdgePanBegin
        onTopEdgePanMove
        onTopEdgePanComplete
        onTopEdgePanCancelled
 */
(class SvTopEdgePanGestureRecognizer extends SvEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvTopEdgePanGestureRecognizer
     * @returns {SvTopEdgePanGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("top");
        return this;
    }

}.initThisClass());
