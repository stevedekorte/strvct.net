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
     * @method
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the LeftEdgePanGestureRecognizer
     * @method
     * @returns {LeftEdgePanGestureRecognizer} The initialized instance
     */
    init () {
        super.init()
        this.setEdgeName("left")
        return this
    }

}.initThisClass());