/**
 * @module library.view.events.gesturing.gestures.edges
 */

/**
 * @class EdgePanGestureRecognizer
 * @extends PanGestureRecognizer
 * @classdesc Subclass of PanGestureRecognizer that limits pan detection to gestures starting at the edge of the view. 
 * Don't use this class directly - instead use its subclass for the edge you're interested in.
 *
 * Delegate messages:
 *     onEdgePanBegin
 *     onEdgePanMove
 *     onEdgePanComplete
 *     onEdgePanCancelled
 */
(class EdgePanGestureRecognizer extends PanGestureRecognizer {

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {String} edgeName - The name of the edge.
         * @category Configuration
         */
        {
            const slot = this.newSlot("edgeName", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Number} maxStartDistance - The maximum distance from the edge to start the gesture.
         * @category Configuration
         */
        {
            const slot = this.newSlot("maxStartDistance", 15);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the gesture recognizer.
     * @returns {EdgePanGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setListenerClasses(this.defaultListenerClasses());
        this.setMinDistToBegin(5);
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Starts the gesture recognizer.
     * @returns {EdgePanGestureRecognizer} The instance.
     * @category Lifecycle
     */
    start () {
        return super.start();
    }

    /**
     * @description Checks if the gesture is ready to begin.
     * @returns {boolean} True if the gesture is ready to begin, false otherwise.
     * @category Gesture Recognition
     */
    isReadyToBegin () {
        return this.hasOkFingerCount() &&
            this.distanceFromEdge() <= this.maxStartDistance();
    }

    /**
     * @description Calculates the distance from the specified edge.
     * @returns {number} The distance from the edge.
     * @category Calculation
     */
    distanceFromEdge () {
        const name = this.edgeName()
        const d = this.currentEdgeDistances()[name]
        return d
    }

    /**
     * @description Gets the maximum edge distance.
     * @returns {number} The maximum edge distance.
     * @category Configuration
     */
    maxEdgeDistance () {
        return 100000
    }

    /**
     * @description Calculates the current distances from all edges.
     * @returns {Object} An object containing distances from all edges.
     * @category Calculation
     */
    currentEdgeDistances () {
        const max = this.maxEdgeDistance()
        const points = this.allPoints() // event points are in document coordinates
        const vt = this.viewTarget()

        if (!vt) {
            this.logDebug(" missing viewTarget")
            return max
        }

        const f = vt.frameInDocument()

        // use maxValue to make sure all fingers are close to the edge

        return {
            top: points.maxValue(p => Math.abs(f.top() - p.y()), max),
            bottom: points.maxValue(p => Math.abs(f.bottom() - p.y()), max),
            left: points.maxValue(p => Math.abs(f.left() - p.x()), max),
            right: points.maxValue(p => Math.abs(f.right() - p.x()), max)
        }
    }

}.initThisClass());