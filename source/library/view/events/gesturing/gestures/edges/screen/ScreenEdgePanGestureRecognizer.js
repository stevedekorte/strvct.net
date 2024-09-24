/**
 * @module library.view.events.gesturing.gestures.edges.screen
 */

/**
 * @class ScreenEdgePanGestureRecognizer
 * @extends PanGestureRecognizer
 * @classdesc Subclass of PanGestureRecognizer that limits pan detection to gestures starting at the edge. 
 * Don't use this class directly - instead use its subclass for the edge you're interested in.
 * 
 * Delegate messages:
 * 
 *     onScreenEdgePanBegin
 *     onScreenEdgePanMove
 *     onScreenEdgePanComplete
 *     onScreenEdgePanCancelled
 * 
 * For distance, ask the target for its frameInViewport and compare with
 * event's posInWindow:
 * 
 *     const frame = target.frameInDocument()
 *     frame.top()
 *     frame.bottom()
 *     frame.left()
 *     frame.right()
 */
"use strict";

(class ScreenEdgePanGestureRecognizer extends PanGestureRecognizer { // TODO abstract PanEdgeGestureRecognizer
    
    /**
     * @description Initializes the prototype slots for the class.
     */
    initPrototypeSlots () {
        {
            /**
             * @property {String} edgeName - The name of the edge.
             */
            const slot = this.newSlot("edgeName", null);
            slot.setSlotType("String");
        }
        {
            /**
             * @property {Number} maxStartDistance - The maximum distance from the edge to start the gesture.
             */
            const slot = this.newSlot("maxStartDistance", 15);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the gesture recognizer.
     * @returns {ScreenEdgePanGestureRecognizer} The initialized instance.
     */
    init () {
        super.init()
        this.setListenerClasses(this.defaultListenerClasses()) 
        this.setMinDistToBegin(5)
        this.setIsDebugging(false)
        return this
    }

    /**
     * @description Starts the gesture recognizer.
     * @returns {ScreenEdgePanGestureRecognizer} The instance.
     */
    start () {
        this.startDocListeners() // only want to listen to the document
        return this
    }

    /**
     * @description Handles the finish of the gesture.
     * @returns {ScreenEdgePanGestureRecognizer} The instance.
     */
    didFinish () {
        super.didFinish()
        this.setIsPressing(false)
        return this
    }

    /**
     * @description Checks if the gesture is ready to begin.
     * @returns {boolean} True if the gesture is ready to begin, false otherwise.
     */
    isReadyToBegin () {
        return this.hasOkFingerCount() &&
                this.distanceFromEdge() <= this.maxStartDistance();
    }

    /**
     * @description Calculates the distance from the specified edge.
     * @returns {number} The distance from the edge.
     */
    distanceFromEdge () {
        const name = this.edgeName()
        assert(name)
        const d = this.currentEdgeDistances()[name]
        assertDefined(d)
        return d
    }

    /**
     * @description Returns the maximum edge distance.
     * @returns {number} The maximum edge distance.
     */
    maxEdgeDistance () {
        return 100000
    }

    /**
     * @description Calculates the current distances from all edges.
     * @returns {Object} An object containing distances from all edges.
     */
    currentEdgeDistances () {
        const max = this.maxEdgeDistance()
        const points = this.allPoints()
        return {
            top:    points.minValue(p => p.distFromTopOfViewport(),    max),
            bottom: points.minValue(p => p.distFromBottomOfViewport(), max),
            left:   points.minValue(p => p.distFromLeftOfViewport(),   max),
            right:  points.minValue(p => p.distFromRightOfViewport(),  max)
        }
    }
    
}.initThisClass());