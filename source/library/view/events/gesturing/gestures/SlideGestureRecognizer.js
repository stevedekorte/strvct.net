/**
 * @module library.view.events.gesturing.gestures
 */

/**
 * @class SlideGestureRecognizer
 * @extends GestureRecognizer
 * @classdesc
 * This gets tricky as we need to follow movement outside the view.
 * To do this, we add special event move and up handlers to the document after getting
 * a down event and then remove them after the up event. 
 * 
 * We ignore the view's own move and up events.
 *
 * Delegate messages:
 *     onSlideBegin
 *     onSlideMove
 *     onSlideComplete
 *     onSlideCancelled
 * 
 * Gesture state info methods:
 *     direction()
 *     distance() 
 *     downPosInView()
 *
 * TODO:
 *     make multitouch
 *     optimization: floor the move event points and only send delegate messages if
 *     new position is different from last?
 */
"use strict";

(class SlideGestureRecognizer extends GestureRecognizer {
    
    initPrototypeSlots () {
        /**
         * @member {string} direction - The direction of the slide gesture
         */
        {
            const slot = this.newSlot("direction", "left");
            slot.setSlotType("String");
        }
        /**
         * @member {Map} validDirectionsMap - Map of valid directions
         */
        {
            const slot = this.newSlot("validDirectionsMap", new Map([
                ["left", 1], 
                ["right", 2], 
                ["up", 3], 
                ["down", 4]
            ]));
            slot.setSlotType("Map");
        }
        /**
         * @member {number} maxPerpendicularDistToBegin - Maximum perpendicular distance to begin the gesture
         */
        {
            const slot = this.newSlot("maxPerpendicularDistToBegin", 10) // will not begin if this is exceeded
            slot.setSlotType("Number")
        }
        //downPositionInTarget: null, Point
    }

    /**
     * @description Initializes the SlideGestureRecognizer
     * @returns {SlideGestureRecognizer} The initialized instance
     */
    init () {
        super.init()
        this.setListenerClasses(this.defaultListenerClasses())     
        this.setMinFingersRequired(1)
        this.setMaxFingersAllowed(1)
        this.setMinDistToBegin(10)
        //this.setIsDebugging(false)
        return this
    }

    /**
     * @description Sets the direction of the slide gesture
     * @param {string} directionName - The name of the direction
     * @returns {SlideGestureRecognizer} The instance
     */
    setDirection (directionName) {
        assert(this.validDirectionsMap().has(directionName));
        this._direction = directionName
        return this
    }

    /**
     * @description Sets the number of touches required for the gesture
     * @param {number} n - The number of touches
     * @returns {SlideGestureRecognizer} The instance
     */
    setNumberOfTouchesRequired (n) {
        assert(n === 1) // need to add multi-touch support
        this._numberOfTouchesRequired = n
        return this
    }

    /**
     * @description Handles the down event
     * @param {Event} event - The down event
     */
    onDown (event) {
        super.onDown(event)

        if (!this.isPressing()) {
            if (this.hasAcceptableFingerCount()) {
                this.setIsPressing(true)
                this.setBeginEvent(event)
                this.startDocListeners()
            }
        }
    }

    /**
     * @description Handles the move event
     * @param {Event} event - The move event
     * @returns {SlideGestureRecognizer} The instance
     */
    onMove (event) {
        super.onMove(event)

        if (this.isPressing()) {
            if (!this.isActive() && this.hasMovedTooMuchPerpendicular()) {
                this.cancel()
                return this
            }

            if (!this.isActive() && this.hasMovedEnough()) {
                if (this.requestActivationIfNeeded()) {
                    //this.setIsActive(true)
                    this.sendBeginMessage() // being
                }
            }
        
            if (this.isActive()) {
                this.sendMoveMessage() // move
            }
        }
    }

    /**
     * @description Handles the up event
     * @param {Event} event - The up event
     * @returns {boolean} True
     */
    onUp (event) {
        super.onUp(event)

        if (this.isPressing()) {
            this.setIsPressing(false)
            if (this.isActive()) {
                this.sendCompleteMessage() // complete
            }
            this.finish()
        }

        return true
    }

    /**
     * @description Cancels the gesture
     * @returns {SlideGestureRecognizer} The instance
     */
    cancel () {
        if (this.isActive()) {
            this.sendCancelledMessage()
        }
        this.finish()
        return this
    }

    /**
     * @description Finishes the gesture
     * @returns {SlideGestureRecognizer} The instance
     */
    finish () {
        //this.debugLog(".finish()")
        this.setIsPressing(false)
        this.deactivate()
        this.stopDocListeners()
        this.didFinish()
        return this
    }

    /**
     * @description Checks if the gesture has moved too much perpendicular to the intended direction
     * @returns {boolean} True if moved too much perpendicular
     */
    hasMovedTooMuchPerpendicular () {
        let m = this.maxPerpendicularDistToBegin()
        let dp = this.diffPos()

        let funcs = {
            left: (dx, dy) => dy,
            right: (dx, dy) => dy,
            up: (dx, dy) => dx,
            down: (dx, dy) => dx
        }

        let r = Math.abs(funcs[this.direction()](dp.x(), dp.y())) > m
        return r
    }

    /**
     * @description Checks if the gesture has moved enough to be recognized
     * @returns {boolean} True if moved enough
     */
    hasMovedEnough () {
        let m = this.minDistToBegin()
        let dp = this.diffPos()

        let funcs = {
            left: (dx, dy) => -dx,
            right: (dx, dy) =>  dx,
            up: (dx, dy) =>  dy,
            down: (dx, dy) => -dy
        }

        let r = funcs[this.direction()](dp.x(), dp.y()) > m
        return r
    }

    /**
     * @description Calculates the difference in position
     * @returns {Point} The difference in position
     */
    diffPos () {
        let cp = this.currentPosition()
        let bp = this.beginPosition()

        assert(cp)
        assert(bp)
        
        let p = cp.subtract(bp).floorInPlace() // floor here?
        let dx = p.x()
        let dy = p.y()
        let funcs = {
            left: (p) => p.setX(Math.min(dx, 0)),
            right: (p) => p.setX(Math.max(dx, 0)),
            up: (p) => p.setY(Math.max(dy, 0)),
            down: (p) => p.setY(Math.min(dy, 0))
        }

        funcs[this.direction()](p)
        return p
    }

    /**
     * @description Calculates the distance of the gesture
     * @returns {number} The distance of the gesture
     */
    distance () {
        let p = this.diffPos()
        let dx = p.x()
        let dy = p.y()
        let funcs = {
            left: (dx, dy) => dx,
            right: (dx, dy) => dx,
            up: (dx, dy) => dy,
            down: (dx, dy) => dy
        }
        return Math.abs(funcs[this.direction()](dx, dy))
    }

}.initThisClass());