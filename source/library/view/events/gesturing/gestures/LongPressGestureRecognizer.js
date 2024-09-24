/**
 * @module library.view.events.gesturing.gestures
 */

/**
 * @class LongPressGestureRecognizer
 * @extends GestureRecognizer
 * @classdesc Recognize a long press and hold in (roughly) one location.
 * 
 * Notes:
 * 
 * Should gesture cancel if press moves?:
 * 
 * 1. outside of a distance from start point or
 * 2. outside of the view
 * 
 * Delegate messages:
 * 
 * onLongPressBegin
 * onLongPressComplete
 * onLongPressCancelled
 */
"use strict";

(class LongPressGestureRecognizer extends GestureRecognizer {
    
    initPrototypeSlots () {
        /**
         * @property {Number} timePeriod - milliseconds
         */
        {
            const slot = this.newSlot("timePeriod", 500);
            slot.setComment("milliseconds");
            slot.setSlotType("Number");
        }
        /**
         * @property {Number} timeoutId
         * @private
         */
        {
            const slot = this.newSlot("timeoutId", null);
            slot.setIsPrivate(true);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the LongPressGestureRecognizer
     * @returns {LongPressGestureRecognizer}
     */
    init () {
        super.init();
        this.setListenerClasses(this.defaultListenerClasses());
        this.setIsDebugging(false);

        this.setMinFingersRequired(1);
        this.setMaxFingersAllowed(1);
        this.setMinDistToBegin(null);
        return this;
    }

    // --- timer ---

    /**
     * @description Starts the timer for long press recognition
     * @returns {LongPressGestureRecognizer}
     */
    startTimer () {
        if (this.hasTimer()) {
            this.stopTimer();
        }

        const tid = this.addTimeout(() => { this.onLongPress() }, this.timePeriod());
        this.setTimeoutId(tid);
        this.startDocListeners(); // didFinish will stop listening
        return this;
    }

    /**
     * @description Stops the timer for long press recognition
     * @returns {LongPressGestureRecognizer}
     */
    stopTimer () {
        if (this.hasTimer()) {
            this.clearTimeout(this.timeoutId());
            this.setTimeoutId(null)
        }
        return this
    }

    /**
     * @description Checks if the timer is active
     * @returns {boolean}
     */
    hasTimer () {
        return this.timeoutId() !== null
    }

    // -- the completed gesture ---
    
    /**
     * @description Handles the long press event
     */
    onLongPress () {
        this.setTimeoutId(null)

        if (this.currentEventIsOnTargetView()) {
            if (this.requestActivationIfNeeded()) {
                this.sendCompleteMessage()
                this.didFinish()
            }
        } else {
            this.cancel()
        }
    }

    // -- single action for mouse and touch up/down ---

    /**
     * @description Handles the down event
     * @param {Event} event - The down event
     */
    onDown (event) {
        super.onDown(event)
        
        const isWithin = this.currentEventIsOnTargetView();

        if (isWithin && 
            this.hasAcceptableFingerCount() && 
            !GestureManager.shared().hasActiveGesture()) {
            this.startTimer()
            this.sendBeginMessage()
        }
    }

    /**
     * @description Handles the move event
     * @param {Event} event - The move event
     */
    onMove (event) {
        super.onMove(event)
    
        if (this.hasTimer()) { // TODO: also check move distance?
            if (this.currentEventIsOnTargetView()) {
                this.setCurrentEvent(event)
            } else {
                this.cancel()
            }
        }

    }

    /**
     * @description Handles the up event
     * @param {Event} event - The up event
     */
    onUp (event) {
        super.onUp(event)

        if (this.hasTimer()) {
            this.cancel()
        }
    }

    /**
     * @description Cancels the long press gesture
     * @returns {LongPressGestureRecognizer}
     */
    cancel () {
        if (this.hasTimer()) {
            this.stopTimer()
            this.sendCancelledMessage()
            this.didFinish()
        }
        return this
    }

    /*

    shouldCancel () {
        return this.hasTimer()
    }

    willCancel () {
        this.stopTimer()
    }

    didCancel () {
        this.didFinish()
    }
    */
    
}.initThisClass());