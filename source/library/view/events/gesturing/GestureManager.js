"use strict";

/*
    GestureManager

    We typically only want one gesture to be active globally.
    GestureManager helps to coordinate which gesture has control.

    To pause all gestures:
    
        GestureManager.shared().pause()
        GestureManager.shared().unpause()
    
    or:

        GestureManager.shared().setIsPaused(aBool)

    NOTES:

    If a decendant view requests control, it can steal it.

*/

(class GestureManager extends ProtoClass {
    
    static initClass () {
        this.setIsSingleton(true)
        return this
    }
    
    initPrototypeSlots () {
        this.newSlot("activeGesture", null) // aGesture
        this.newSlot("begunGestures", null) // dict
        this.newSlot("isPaused", false) // used to pause gestures while editing text fields
    }

    init () {
        super.init()
        this.setBegunGestures({})
        return this
    }

    hasActiveGesture () {
        return this.activeGesture() && this.activeGesture().isActive()
    }

    pause () {
        this.setIsPaused(true)
        return this
    }

    unpause () {
        this.setIsPaused(false)
        return this
    }

    setIsPaused (aBool) {
        if (this._isPaused !== aBool) {
            this._isPaused = aBool

            this.debugLog(this.type() + ".setIsPaused(" + aBool + ")")

            if (aBool) {
                this.cancelAllGestures()
            }
        }
        return this
    }

    cancelAllGestures () {
        this.cancelAllBegunGestures()
        const ag = this.activeGesture()
        if (ag) {
            ag.cancel()
        }
    }

    requestActiveGesture (aGesture) { // sent by gestures themselves
        this.debugLog("requestActiveGesture(" + aGesture.description() + ")")

        if (this.isPaused()) {
            return false
        }

        assert(aGesture)
        const ag = this.activeGesture()

        if (!ag) {
            this.acceptGesture(aGesture)
            return true
        }

        //this.releaseActiveGestureIfInactive()
        if (aGesture === ag) { // error
            console.warn("request to activate an already active gesture ", aGesture.description())
            return false
        }

        // see if active gesture has lower priority
        if (ag) {
            // allow child views to steal the active gesture
            const childViewIsRequesting = ag.viewTarget().hasSubviewDescendant(aGesture.viewTarget())
            if (childViewIsRequesting) {
                this.acceptGesture(aGesture)
                return true
            }
        }


        // already have active gesture, so reject this request
        this.rejectGesture(aGesture)
        return false
    }

    acceptGesture (aGesture) { // private method
        aGesture.viewTarget().cancelAllGesturesExcept(aGesture)
        this.cancelBegunGesturesExcept(aGesture)
        this.setActiveGesture(aGesture)
        this.debugLog("acceptGesture(" + aGesture.description() + ")")
        return this
    }

    rejectGesture (aGesture) { // private method
        this.debugLog("rejectGesture(" + aGesture.description() + ")")
        this.debugLog("already active " + this.activeGesture().description())
        return this
    }

    deactivateGesture (aGesture) {
        if (this.activeGesture() === aGesture) {
            this.setActiveGesture(null)
        }
        return this
    }

    addBegunGesture (aGesture) {
        this.begunGestures().atSlotPut(aGesture.typeId(), aGesture)
        return this
    }

    removeBegunGesture (aGesture) {
        this.begunGestures().removeSlotAt(aGesture.typeId())
        return this
    }

    cancelAllBegunGestures () {
        Object.values(this.begunGestures()).forEach(g => g.requestCancel() );
        return this
    }

    cancelBegunGesturesExcept (aGesture) {
        Object.values(this.begunGestures()).forEach((g) => {
            if (g !== aGesture) {
                g.requestCancel()
            }
        });
        return this
    }

    debugTypeId () {
        const s = this.isPaused() ? "(paused)" : "(not paused)"
        return super.debugTypeId() + s
    }
    
}.initThisClass());
