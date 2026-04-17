/**
 * @module library.view.events.gesturing.gestures
 */

/**
 * @class SvLongPressGestureRecognizer
 * @extends SvGestureRecognizer
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

(class SvLongPressGestureRecognizer extends SvGestureRecognizer {

    initPrototypeSlots () {
        /**
         * @member {Number} timePeriod - milliseconds
         * @category Configuration
         */
        {
            const slot = this.newSlot("timePeriod", 500);
            slot.setComment("milliseconds");
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} timeoutId
         * @private
         * @category Internal
         */
        {
            const slot = this.newSlot("timeoutId", null);
            slot.setIsPrivate(true);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the SvLongPressGestureRecognizer
     * @returns {SvLongPressGestureRecognizer}
     * @category Initialization
     */
    init () {
        super.init();
        this.setListenerClasses(this.defaultListenerClasses());
        this.setIsDebugging(false);

        this.setMinFingersRequired(1);
        this.setMaxFingersAllowed(1);
        this.setMinDistToBegin(0);
        return this;
    }

    // --- timer ---

    /**
     * @description Starts the timer for long press recognition
     * @returns {SvLongPressGestureRecognizer}
     * @category Timer Management
     */
    startTimer () {
        if (this.hasTimer()) {
            this.stopTimer();
        }

        const tid = this.addWeakTimeout(() => { this.onLongPress(); }, this.timePeriod());
        this.setTimeoutId(tid);
        this.startDocListeners(); // didFinish will stop listening
        return this;
    }

    /**
     * @description Stops the timer for long press recognition
     * @returns {SvLongPressGestureRecognizer}
     * @category Timer Management
     */
    stopTimer () {
        if (this.hasTimer()) {
            this.clearTimeout(this.timeoutId());
            this.setTimeoutId(null);
        }
        return this;
    }

    /**
     * @description Checks if the timer is active
     * @returns {boolean}
     * @category Timer Management
     */
    hasTimer () {
        return this.timeoutId() !== null;
    }

    // -- the completed gesture ---

    /**
     * @description Handles the long press event
     * @category Gesture Recognition
     */
    onLongPress () {
        this.setTimeoutId(null);

        if (this.currentEventIsOnTargetView()) {
            if (this.requestActivationIfNeeded()) {
                this.sendCompleteMessage();
                this.didFinish();
            }
        } else {
            this.cancel();
        }
    }

    // -- single action for mouse and touch up/down ---

    /**
     * @description Handles the down event
     * @param {Event} event - The down event
     * @category Event Handling
     */
    onDown (event) {
        super.onDown(event);

        const isWithin = this.currentEventIsOnTargetView();

        if (isWithin &&
            this.hasAcceptableFingerCount() &&
            !SvGestureManager.shared().hasActiveGesture()) {
            this.startTimer();
            this.sendBeginMessage();
        }
    }

    /**
     * @description Handles the move event
     * @param {Event} event - The move event
     * @category Event Handling
     */
    onMove (event) {
        super.onMove(event);

        if (this.hasTimer()) { // TODO: also check move distance?
            if (this.currentEventIsOnTargetView()) {
                this.setCurrentEvent(event);
            } else {
                this.cancel();
            }
        }

    }

    /**
     * @description Handles the up event
     * @param {Event} event - The up event
     * @category Event Handling
     */
    onUp (event) {
        super.onUp(event);

        if (this.hasTimer()) {
            this.cancel();
        }
    }

    /**
     * @description Cancels the long press gesture
     * @returns {SvLongPressGestureRecognizer}
     * @category Gesture Control
     */
    cancel () {
        if (this.hasTimer()) {
            this.stopTimer();
            this.sendCancelledMessage();
            this.didFinish();
        }
        return this;
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
