"use strict";

/*
    GestureManager

    We typically only want one gesture to be active globally.
    GestureManager helps to coordinate which gesture has control.

    To pause all gestures:
    
        GestureManager.shared().setIsPaused(true)

    To unpause:

        GestureManager.shared().setIsPaused(true)

    NOTES:

    If a decendant view requests control, it can steal it.

*/

(class GestureManager extends ProtoClass {
    
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

    setIsPaused (aBool) {
        if (this._isPaused !== aBool) {
            this._isPaused = aBool
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
            console.warn("request to activate an already active gesture ", aGesture.typeId())
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
        if (this.isDebugging()) {
            console.log(this.type() + " activating " + aGesture.description())
        }
        return this
    }

    rejectGesture (aGesture) { // private method
        if (this.isDebugging()) {
            console.log(this.type() + " rejecting " + aGesture.description())
            console.log(this.type() + " already active " + this.activeGesture().description())
        }
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
    
}.initThisClass());
