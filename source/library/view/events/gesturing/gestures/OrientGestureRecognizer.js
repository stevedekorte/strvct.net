/**
 * @module library.view.events.gesturing.gestures
 */

"use strict";

/**
 * @class OrientGestureRecognizer
 * @extends GestureRecognizer
 * @classdesc
 * OrientGestureRecognizer
 *
 * - on down, note 1st and 2nd fingers
 * - on move, use noted 1st and 2nd finger for pinch info
 *     if either disappear, gesture ends
 *
 * - track center point of 1st & 2nd finger for translation info
 *
 * Delegate messages:
 *
 *     onOrientBegin
 *     onOrientMove
 *     onOrientComplete
 *     onOrientCancelled
 *
 * Helper methods:
 *
 *     points:
 *         downPoints // initial 1st two fingers down
 *         beginPoints // location (of 1st two fingers down) when gesture began
 *         activePoints // current locations of the 1st two fingers down
 *
 *     position:
 *         beginCenterPosition //  initial midpoint between 1st two fingers down
 *         currentCenterPosition // current midpoint between 1st two fingers down
 *         diffPosition // currentCenterPosition - beginCenterPosition
 *
 *     rotation:
 *         activeAngleInDegress // current angle between 1st two fingers down
 *         rotationInDegrees // difference between initial angle between 1st two fingers down and their current angle
 *
 *     scale:
 *         scale // current distance between 1st to fingers down divided by their intitial distance  
 */
(class OrientGestureRecognizer extends GestureRecognizer {

    /**
     * @description Initializes prototype slots
     * @private
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the OrientGestureRecognizer
     * @returns {OrientGestureRecognizer} The initialized instance
     */
    init () {
        super.init()
        this.setListenerClasses(this.defaultListenerClasses())

        this.setMinFingersRequired(2)
        this.setMaxFingersAllowed(4)
        this.setMinDistToBegin(10)

        this.setIsDebugging(false)
        return this
    }

    /**
     * @description Handles the down event
     * @param {Event} event - The down event
     */
    onDown (event) {
        super.onDown(event)
        //console.log(this.shortTypeId() + ".onDown() this.isPressing() = ", this.isPressing())

        if (!this.isPressing()) {
            const downCount = this.numberOfFingersDown()
            if (downCount >= this.minFingersRequired() &&
                downCount <= this.maxFingersAllowed()
            ) {
                this.setIsPressing(true)
                //this.setBeginEvent(event)
                this.startDocListeners()
            }
        }
    }

    /**
     * @description Handles the move event
     * @param {Event} event - The move event
     */
    onMove (event) {
        super.onMove(event)

        if (this.isPressing()) {
            if (this.canBegin()) {
                if (this.requestActivationIfNeeded()) {
                    this.sendBeginMessage()
                }
            }

            if (this.activePoints().length < this.minFingersRequired()) {
                this.onUp(event)
                return
            }

            if (this.isActive()) {
                if (this.activePoints().length >= this.minFingersRequired()) {
                    this.sendMoveMessage()
                } else {
                    this.onUp(event)
                }
            }
        }
    }

    /**
     * @description Handles the up event
     * @param {Event} event - The up event
     */
    onUp (event) {
        super.onUp(event)

        if (this.isPressing()) {
            this.setIsPressing(false)
            if (this.isActive()) {
                this.sendCompleteMessage()
            }
            this.didFinish()
        }
    }

    /**
     * @description Cancels the gesture
     * @returns {OrientGestureRecognizer} The instance
     */
    cancel () {
        if (this.isActive()) {
            this.sendCancelledMessage()
        }
        this.didFinish()
        return this
    }

    /**
     * @description Finishes the gesture
     * @returns {OrientGestureRecognizer} The instance
     */
    didFinish () {
        super.didFinish()
        this.setIsPressing(false)
        this.deactivate()
        this.stopDocListeners()
        return this
    }

    /**
     * @description Gets the down points
     * @returns {Array} The down points
     */
    downPoints () {
        const p = this.pointsForEvent(this.downEvent())
        return [p[0], p[1]]
    }

    /**
     * @description Gets the active points for an event
     * @param {Event} event - The event
     * @returns {Array} The active points
     */
    activeForEvent (event) {
        // looks for two points whose id matchs those of the two down points
        const points = this.pointsForEvent(event)
        const ids = this.downPoints().map(p => p.id())
        return points.select(p => ids.contains(p.id()))
    }

    /**
     * @description Gets the begin points
     * @returns {Array} The begin points
     */
    beginPoints () {
        return this.activeForEvent(this.beginEvent())
    }

    /**
     * @description Gets the last points
     * @returns {Array} The last points
     */
    lastPoints () {
        return this.activeForEvent(this.lastEvent())
    }

    /**
     * @description Gets the active points
     * @returns {Array} The active points
     */
    activePoints () { // current points that were in down points
        return this.activeForEvent(this.currentEvent())
    }

    /**
     * @description Gets the center for points
     * @param {Array} p - The points
     * @returns {Point} The center point
     */
    centerForPoints (p) {
        return p[0].midpointTo(p[1])
    }

    /**
     * @description Gets the down center position
     * @returns {Point} The down center position
     */
    downCenterPosition () {
        return this.centerForPoints(this.downPoints())
    }

    /**
     * @description Gets the begin center position
     * @returns {Point} The begin center position
     */
    beginCenterPosition () {
        return this.centerForPoints(this.beginPoints())
    }

    /**
     * @description Gets the current center position
     * @returns {Point} The current center position
     */
    currentCenterPosition () {
        return this.centerForPoints(this.activePoints())
    }

    /**
     * @description Gets the difference position
     * @returns {Point} The difference position
     */
    diffPosition () {
        return this.currentCenterPosition().subtract(this.beginCenterPosition())
    }

    /**
     * @description Gets the angle in degrees for points
     * @param {Array} p - The points
     * @returns {number} The angle in degrees
     */
    angleInDegreesForPoints (p) {
        return p[0].angleInDegreesTo(p[1])
    }

    /**
     * @description Gets the down angle in degrees
     * @returns {number} The down angle in degrees
     */
    downAngleInDegress () {
        return this.angleInDegreesForPoints(this.downPoints())
    }

    /**
     * @description Gets the begin angle in degrees
     * @returns {number} The begin angle in degrees
     */
    beginAngleInDegress () {
        return this.angleInDegreesForPoints(this.beginPoints())
    }

    /**
     * @description Gets the active angle in degrees
     * @returns {number} The active angle in degrees
     */
    activeAngleInDegress () {
        return this.angleInDegreesForPoints(this.activePoints())
    }

    /**
     * @description Gets the rotation in degrees
     * @returns {number} The rotation in degrees
     */
    rotationInDegrees () {
        // difference between initial angle between 1st two fingers down and their current angle
        const a1 = this.beginAngleInDegress();
        const a2 = this.activeAngleInDegress();
        return a2 - a2;
    }

    /**
     * @description Gets the spread for points
     * @param {Array} p - The points
     * @returns {number} The spread
     */
    spreadForPoints (p) {
        return p[0].distanceFrom(p[1])
    }

    /**
     * @description Gets the down spread
     * @returns {number} The down spread
     */
    downSpread () {
        // initial distance between first two fingers down
        return this.spreadForPoints(this.downPoints())
    }

    /**
     * @description Gets the begin spread
     * @returns {number} The begin spread
     */
    beginSpread () {
        // initial distance between first two fingers down
        return this.spreadForPoints(this.beginPoints())
    }

    /**
     * @description Gets the current spread
     * @returns {number} The current spread
     */
    currentSpread () {
        // current distance between first two fingers down
        return this.spreadForPoints(this.activePoints())
    }

    /**
     * @description Gets the spread
     * @returns {number} The spread
     */
    spread () {
        const s = this.currentSpread() - this.beginSpread();
        //console.log("spread = " + s + " = " + this.currentSpread() + " - " + this.beginSpread() )
        return s
    }

    /**
     * @description Gets the down spread X
     * @returns {number} The down spread X
     */
    downSpreadX () {
        const p = this.downPoints()
        return Math.abs(p[0].x() - p[1].x())
    }

    /**
     * @description Gets the down spread Y
     * @returns {number} The down spread Y
     */
    downSpreadY () {
        const p = this.downPoints()
        return Math.abs(p[0].y() - p[1].y())
    }

    /**
     * @description Gets the current spread X
     * @returns {number} The current spread X
     */
    currentSpreadX () {
        const p = this.activePoints()
        return Math.abs(p[0].x() - p[1].x())
    }

    /**
     * @description Gets the current spread Y
     * @returns {number} The current spread Y
     */
    currentSpreadY () {
        const p = this.activePoints()
        return Math.abs(p[0].y() - p[1].y())
    }

    /**
     * @description Gets the spread X
     * @returns {number} The spread X
     */
    spreadX () {
        return this.currentSpreadX() - this.downSpreadX()
    }

    /**
     * @description Gets the spread Y
     * @returns {number} The spread Y
     */
    spreadY () {
        return this.currentSpreadY() - this.downSpreadY()
    }

    /**
     * @description Gets the scale
     * @returns {number} The scale
     */
    scale () {
        const s = this.currentSpread() / this.beginSpread();
        //console.log("scale = " + s + " = " + this.currentSpread() + "/" + this.beginSpread() )
        return s
    }

    /**
     * @description Gets the debug JSON
     * @returns {Object} The debug JSON
     */
    debugJson () {
        const dp = this.diffPosition()
        return {
            id: this.typeId(),
            dx: dp.x(),
            dy: dp.y(),
            scale: this.scale(),
            rotation: this.rotationInDegrees()
        }
    }

    /**
     * @description Shows the debug information
     */
    show () {
        console.log(this.debugJson())
    }

}.initThisClass());