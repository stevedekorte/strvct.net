"use strict";

/**
 * @module library.view.events.gesturing
 */

/**
 * @class GestureManager
 * @extends ProtoClass
 * @classdesc GestureManager coordinates which gesture has control globally.
 * 
 * We typically only want one gesture to be active globally.
 * GestureManager helps to coordinate which gesture has control.
 *
 * To pause all gestures:
 *
 *     GestureManager.shared().pause()
 *     GestureManager.shared().unpause()
 *
 * or:
 *
 *     GestureManager.shared().setIsPaused(aBool)
 *
 * NOTES:
 *
 * If a descendant view requests control, it can steal it.
 */
(class GestureManager extends ProtoClass {
    
    /**
     * @static
     * @description Initializes the class
     */
    static initClass () {
        this.setIsSingleton(true)
    }
    
    /**
     * @description Initializes the prototype slots
     */
    initPrototypeSlots () {
        /**
         * @member {Gesture} activeGesture
         */
        {
            const slot = this.newSlot("activeGesture", null);
            slot.setSlotType("Gesture");
        }
        /**
         * @member {Map} begunGesturesMap
         */
        {
            const slot = this.newSlot("begunGesturesMap", null) 
            slot.setSlotType("Map");
        }
        /**
         * @member {Boolean} isPaused - used to pause gestures while editing text fields
         */
        {
            const slot = this.newSlot("isPaused", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the instance
     * @returns {GestureManager} The instance
     */
    init () {
        super.init();
        this.setBegunGesturesMap(new Map());
        return this;
    }

    /**
     * @description Checks if there's an active gesture
     * @returns {Boolean} True if there's an active gesture, false otherwise
     */
    hasActiveGesture () {
        return this.activeGesture() && this.activeGesture().isActive();
    }

    /**
     * @description Pauses the gesture manager
     * @returns {GestureManager} The instance
     */
    pause () {
        this.setIsPaused(true);
        return this;
    }

    /**
     * @description Unpauses the gesture manager
     * @returns {GestureManager} The instance
     */
    unpause () {
        this.setIsPaused(false);
        return this;
    }

    /**
     * @description Sets the paused state of the gesture manager
     * @param {Boolean} aBool - The paused state
     * @returns {GestureManager} The instance
     */
    setIsPaused (aBool) {
        if (this._isPaused !== aBool) {
            this._isPaused = aBool;

            this.debugLog(this.type() + ".setIsPaused(" + aBool + ")");

            if (aBool) {
                this.cancelAllGestures();
            }
        }
        return this;
    }

    /**
     * @description Cancels all gestures
     */
    cancelAllGestures () {
        this.cancelAllBegunGestures();
        const ag = this.activeGesture();
        if (ag) {
            ag.cancel();
        }
    }

    /**
     * @description Requests to set the active gesture
     * @param {Gesture} aGesture - The gesture requesting to be active
     * @returns {Boolean} True if the request was accepted, false otherwise
     */
    requestActiveGesture (aGesture) {
        this.debugLog("requestActiveGesture(" + aGesture.description() + ")");

        if (this.isPaused()) {
            return false;
        }

        assert(aGesture)
        const ag = this.activeGesture();

        if (!ag) {
            this.acceptGesture(aGesture);
            return true;
        }

        if (aGesture === ag) {
            console.warn("request to activate an already active gesture ", aGesture.description());
            return false;
        }

        if (ag) {
            const childViewIsRequesting = ag.viewTarget().hasSubviewDescendant(aGesture.viewTarget());
            if (childViewIsRequesting) {
                this.acceptGesture(aGesture);
                return true;
            }
        }

        this.rejectGesture(aGesture);
        return false;
    }

    /**
     * @private
     * @description Accepts a gesture as the active gesture
     * @param {Gesture} aGesture - The gesture to accept
     * @returns {GestureManager} The instance
     */
    acceptGesture (aGesture) {
        aGesture.viewTarget().cancelAllGesturesExcept(aGesture);
        this.cancelBegunGesturesExcept(aGesture);
        this.setActiveGesture(aGesture);
        this.debugLog("acceptGesture(" + aGesture.description() + ")");
        return this;
    }

    /**
     * @private
     * @description Rejects a gesture from becoming the active gesture
     * @param {Gesture} aGesture - The gesture to reject
     * @returns {GestureManager} The instance
     */
    rejectGesture (aGesture) {
        this.debugLog("rejectGesture(" + aGesture.description() + ")");
        this.debugLog("already active " + this.activeGesture().description());
        return this;
    }

    /**
     * @description Deactivates a gesture
     * @param {Gesture} aGesture - The gesture to deactivate
     * @returns {GestureManager} The instance
     */
    deactivateGesture (aGesture) {
        if (this.activeGesture() === aGesture) {
            this.setActiveGesture(null);
        }
        return this;
    }

    /**
     * @description Adds a gesture to the begun gestures map
     * @param {Gesture} aGesture - The gesture to add
     * @returns {GestureManager} The instance
     */
    addBegunGesture (aGesture) {
        this.begunGesturesMap().set(aGesture.typeId(), aGesture);
        return this;
    }

    /**
     * @description Removes a gesture from the begun gestures map
     * @param {Gesture} aGesture - The gesture to remove
     * @returns {GestureManager} The instance
     */
    removeBegunGesture (aGesture) {
        this.begunGesturesMap().delete(aGesture.typeId());
        return this;
    }

    /**
     * @description Cancels all begun gestures
     * @returns {GestureManager} The instance
     */
    cancelAllBegunGestures () {
        this.begunGesturesMap().forEachV(g => g.requestCancel());
        return this;
    }

    /**
     * @description Cancels all begun gestures except the specified one
     * @param {Gesture} aGesture - The gesture to exclude from cancellation
     * @returns {GestureManager} The instance
     */
    cancelBegunGesturesExcept (aGesture) {
        this.begunGesturesMap().forEachV(g => {
            if (g !== aGesture) {
                g.requestCancel();
            }
        });
        return this;
    }

    /**
     * @description Returns a debug type ID
     * @returns {string} The debug type ID
     */
    debugTypeId () {
        const s = this.isPaused() ? "(paused)" : "(not paused)";
        return super.debugTypeId() + s;
    }
    
}.initThisClass());