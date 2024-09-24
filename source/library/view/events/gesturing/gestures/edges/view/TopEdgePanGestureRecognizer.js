/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class TopEdgePanGestureRecognizer
 * @extends EdgePanGestureRecognizer
 * @classdesc TopEdgePanGestureRecognizer

    Delegate messages:

        onTopEdgePanBegin
        onTopEdgePanMove
        onTopEdgePanComplete
        onTopEdgePanCancelled
 */
(class TopEdgePanGestureRecognizer extends EdgePanGestureRecognizer {
    
    /**
     * @description Initializes prototype slots
     * @private
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the TopEdgePanGestureRecognizer
     * @returns {TopEdgePanGestureRecognizer} The initialized instance
     */
    init () {
        super.init()
        this.setEdgeName("top")
        return this
    }

}.initThisClass());