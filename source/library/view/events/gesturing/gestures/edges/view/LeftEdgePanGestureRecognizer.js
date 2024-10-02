/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class LeftEdgePanGestureRecognizer
 * @extends EdgePanGestureRecognizer
 * @classdesc LeftEdgePanGestureRecognizer
 *
 * Delegate messages:
 *
 *     onLeftEdgePanBegin
 *     onLeftEdgePanMove
 *     onLeftEdgePanComplete
 *     onLeftEdgePanCancelled
 */
(class LeftEdgePanGestureRecognizer extends EdgePanGestureRecognizer {
    
    /**
     * @description Initializes prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the LeftEdgePanGestureRecognizer
     * @returns {LeftEdgePanGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init () {
        super.init()
        this.setEdgeName("left")
        return this
    }

}.initThisClass());