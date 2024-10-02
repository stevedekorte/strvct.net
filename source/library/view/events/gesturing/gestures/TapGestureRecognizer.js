/**
 * @module library.view.events.gesturing.gestures
 */

"use strict";

/**
 * @class TapGestureRecognizer
 * @extends GestureRecognizer
 * @classdesc
 * TapGestureRecognizer
 *
 * Recognize a number of taps inside a viewTarget and within a maxHoldPeriod.
 *     
 * On first tap for finger count, start timer. 
 * If second tap for finger count occurs before it's expired, it's recognized. 
 * Otherwise, restart timer.
 *
 * Delegate messages:
 *
 *     onTapBegin
 *     onTapComplete
 *     onTapCancelled
 *
 *     Typically, delegate will ignore onTapBegin & onTapCancelled.
 *
 * The names of the delegate messages can be specified. Example:
 *
 *     const tg = TapGestureRecognizer.clone()
 *     tg.setNumberOfTapsRequired(2)
 *     tg.setNumberOfFingersRequired(2)
 *     tg.setGestureName("DoubleFingerDoubleTap") // on recognize, will send a onDoubleFingerDoubleTapComplete() message
 *     this.addGestureRecognizer(tg)
 */
(class TapGestureRecognizer extends GestureRecognizer {
    
    /**
     * @description Initializes the prototype slots for the TapGestureRecognizer.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} maxHoldPeriod - milliseconds per tap down hold
         * @category Configuration
         */
        {
            const slot = this.newSlot("maxHoldPeriod", 1000);
            slot.setComment("milliseconds per tap down hold");
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} timeoutId - private
         * @category Internal
         */
        {
            const slot = this.newSlot("timeoutId", null);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} numberOfTapsRequired
         * @category Configuration
         */
        {
            const slot = this.newSlot("numberOfTapsRequired", 1);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} numberOfFingersRequired
         * @category Configuration
         */
        {
            const slot = this.newSlot("numberOfFingersRequired", 1);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} tapCount
         * @category State
         */
        {
            const slot = this.newSlot("tapCount", 0);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the TapGestureRecognizer.
     * @returns {TapGestureRecognizer} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setListenerClasses(this.defaultListenerClasses())
        this.setIsDebugging(false) 
        this.resetTapCount()
        this.setShouldRequestActivation(false) // allow multiple tap targets?
        this.setIsDebugging(false)
        return this
    }

    /**
     * @description Resets the tap count to zero.
     * @returns {TapGestureRecognizer} The instance.
     * @category State Management
     */
    resetTapCount () {
        this.setTapCount(0)
        return this
    }

    /**
     * @description Starts the timer for the tap gesture.
     * @param {Event} event - The event that triggered the timer start.
     * @returns {TapGestureRecognizer} The instance.
     * @category Timer Management
     */
    startTimer (event) {
        if (this.timeoutId()) {
            this.stopTimer()
        }

        const tid = this.addTimeout(() => this.cancel(), this.maxHoldPeriod());
        this.setTimeoutId(tid)
        return this
    }

    /**
     * @description Stops the timer for the tap gesture.
     * @returns {TapGestureRecognizer} The instance.
     * @category Timer Management
     */
    stopTimer () {
        if (this.hasTimer()) {
            this.clearTimeout(this.timeoutId());
            this.setTimeoutId(null)
            this.resetTapCount()
        }
        return this
    }

    /**
     * @description Checks if the timer is currently running.
     * @returns {boolean} True if the timer is running, false otherwise.
     * @category Timer Management
     */
    hasTimer () {
        return this.timeoutId() !== null
    }

    /**
     * @description Handles the down event for the tap gesture.
     * @param {Event} event - The down event.
     * @returns {boolean} True if the event was handled, false otherwise.
     * @category Event Handling
     */
    onDown (event) {
        super.onDown(event)
        
        if (this.numberOfFingersDown() < this.numberOfFingersRequired()) {
            return this
        }

        if (!this.hasTimer()) {
            this.setTapCount(1)
            this.startTimer()
            this.sendBeginMessage() // begin
        } else {
            this.setTapCount(this.tapCount() + 1)
        }

        return true
    }

    /**
     * @description Handles the up event for the tap gesture.
     * @param {Event} event - The up event.
     * @category Event Handling
     */
    onUp (event) {
        super.onUp(event)
 
        if (true || this.isDebugging()) {
            this.debugLog(".onUp()  tapCount:" + this.tapCount() + " viewTarget:" + this.viewTarget().typeId())
        }

        if (this.hasTimer()) {
            if (this.tapCount() === this.numberOfTapsRequired()) {
                this.stopTimer()
                this.complete()
            }
        } else {
            //this.cancel()
        }
    }

    /**
     * @description Completes the tap gesture.
     * @category Gesture State
     */
    complete () {
        this.stopTimer()
        if (this.requestActivationIfNeeded()) {
            this.sendCompleteMessage() // complete
        }
    }

    /**
     * @description Cancels the tap gesture.
     * @returns {TapGestureRecognizer} The instance.
     * @category Gesture State
     */
    cancel () {
        if (this.hasTimer()) {
            this.stopTimer()
            this.sendCancelledMessage() // cancelled
        }
        return this
    }

}.initThisClass());