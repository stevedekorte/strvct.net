/**
 * @module library.view.events.gesturing.gestures.edges.screen.sides
 */

/**
 * @class SvScreenRightEdgePanGestureRecognizer
 * @extends SvScreenEdgePanGestureRecognizer
 * @classdesc
 * SvScreenRightEdgePanGestureRecognizer for recognizing right edge pan gestures on the screen.
 *
 * Delegate messages:
 * - onScreenRightEdgePanBegin
 * - onScreenRightEdgePanMove
 * - onScreenRightEdgePanComplete
 * - onScreenRightEdgePanCancelled
 */
(class SvScreenRightEdgePanGestureRecognizer extends SvScreenEdgePanGestureRecognizer {

    /**
     * @description Initializes the prototype slots for the class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvScreenRightEdgePanGestureRecognizer.
     * @returns {SvScreenRightEdgePanGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("right");
        return this;
    }

}.initThisClass());
