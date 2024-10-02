/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
 */

/**
 * @class ScreenBottomEdgePanGestureRecognizer
 * @extends ScreenEdgePanGestureRecognizer
 * @classdesc ScreenBottomEdgePanGestureRecognizer
 * 
 * Delegate messages:
 * 
 *     onScreenBottomEdgePanBegin
 *     onScreenBottomEdgePanMove
 *     onScreenBottomEdgePanComplete
 *     onScreenBottomEdgePanCancelled
 */
(class ScreenBottomEdgePanGestureRecognizer extends ScreenEdgePanGestureRecognizer {
    
    /**
     * @description Initializes prototype slots
     * @private
     * @category Initialization
     */
    initPrototypeSlots() {

    }

    /**
     * @description Initializes the gesture recognizer
     * @returns {ScreenBottomEdgePanGestureRecognizer} The initialized instance
     * @category Initialization
     */
    init() {
        super.init()
        this.setEdgeName("bottom")
        return this
    }

}.initThisClass());