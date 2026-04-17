"use strict";

/**
 * @module library.view.events.gesturing.gestures.edges.view
 */

/**
 * @class SvBottomEdgePanGestureRecognizer
 * @extends SvEdgePanGestureRecognizer
 * @classdesc SvBottomEdgePanGestureRecognizer
 *
 * Delegate messages:
 *
 *     onBottomEdgePanBegin
 *     onBottomEdgePanMove
 *     onBottomEdgePanComplete
 *     onBottomEdgePanCancelled
 */
(class SvBottomEdgePanGestureRecognizer extends SvEdgePanGestureRecognizer {

    /**
     * @description Initializes prototype slots for the class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the instance.
     * @returns {SvBottomEdgePanGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setEdgeName("bottom");
        this.setIsDebugging(false);
        return this;
    }


}.initThisClass());
