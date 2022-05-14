"use strict";

/*

    BMObservation

    An abstraction for a NotificationCenter observation. 
    Holds references to which notification message a given observer is wants
    notifications for. 

*/

(class BMObservation extends ProtoClass {
    initPrototype () {
        this.newSlot("center", null) // NotificationCenter that owns this
        this.newSlot("targetId", null) // uniqueId string for target
        this.newSlot("name", null)
        this.newSlot("observer", null)
        this.newSlot("isOneShot", false)
    }

    init () {
        super.init()
        //this.setIsDebugging(true)
    }

    setTargetId (aString) {
        assert(Type.isString(aString))
        this._targetId = aString
        return this
    }

    setTarget (obj) {
        this.setTargetId(obj ? obj.typeId() : null)
        return this
    }

    matchesNotification (note) {
        const tid = this.targetId()
        const matchesTarget = (tid === null) || (note.senderId() === tid) 
        if (matchesTarget) {
            const name = this.name()
            const matchesName = (note.name() === name) || (name === null)
            return matchesName
        }
        return false
    }

    tryToSendNotification (note) {
        try {
            this.sendNotification(note)       
        } catch(error) {
            console.log("NOTIFICATION EXCEPTION: '" + error.message + "'");
            console.log("  OBSERVER (" + this.observer() + ") STACK: ", error.stack)
            if (note.senderStack()) {
                console.log("  SENDER (" + note.senderId() + ") STACK: ", note.senderStack())
            }

            // how to we propogate the exception so we can inspect it in the debugger
            // without causing an inconsistent state by not completing the other notifications?
            throw error
        }
        return null
    }

    sendNotification (note) {
        if (this.center().isDebugging()) {
            //console.log(this._observer + " received note " + note.name() + " from " + note.sender() )
        }

        const method = this._observer[note.name()]
        if (method) {
            method.apply(this._observer, [note])
        } else {
            if (this.isDebugging()) {
                this.debugLog(" no method found for note name " + note.name())
            }
        }

        if (this.isOneShot()) {
            this.stopWatching()
        }
    }

    isEqual (obs) {
        const sameName = this.name() === obs.name()
        const sameObserver = this.observer() === obs.observer()
        const sameTargetId = this.targetId() === obs.targetId()
        return sameName && sameObserver && sameTargetId
    }

    watch () {
        this.center().addObservation(this)
        //this.target().onStartObserving()
        return this
    }

    isWatching () {
        return this.center().hasObservation(this)
    }

    stopWatching () {
        this.center().removeObservation(this)
        //this.target().onStopObserving()
        return this
    }

    description () {
        return this.observer().typeId() + " listening to " + this.targetId() + " " + this.name()
    }

}.initThisClass());
