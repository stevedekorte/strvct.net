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
        this.newSlot("senderId", null) // uniqueId string for sender
        //this.newSlot("senderWeakRef", null) // weakRef to sender
        this.newSlot("name", null)
        this.newSlot("observer", null)
        this.newSlot("isOneShot", false)

        //this.newSlot("senderWeakRef", null) // WeakRef to sender
        //this.newSlot("finalizationRegistry", null) // FinalizationRegistry
    }

    init () {
        super.init()
        //const reg = new FinalizationRegistry(aSender => this.onFinalizeSender(aSender))
        //this.setFinalizationRegistry(reg)
        //this.setIsDebugging(true)
    }

    /*
    onFinalizeSender (aSender) {
        this.stopWatching()
        this.setSender(null)
    }

    sender () {
        const ref = this.senderWeakRef()
        return ref ? ref.deref() : null //returns undefined if sender was collected
    }
    */

    setSenderId (aString) {
        assert(Type.isString(aString))
        this._senderId = aString
        return this
    }

    setSender (obj) {
        //assert(Type.isNull(this.sender()))
        if (obj) {
            this.setSenderId(obj.typeId())
        } else {
            this.setSenderId(null)
        }

        /*
        if (this.sender() !== obj) {

            if (this.sender()) {
                this.finalizationRegistry().unregister(this.sender())
            }

            if (Type.isNull(obj)) {
                this.setSenderId(null)
                this.setSenderWeakRef(null)
            } else {
                this.setSenderId(obj.typeId())
                this.setSenderWeakRef(new WeakRef(obj))
                this.finalizationRegistry().register(obj)
            }
        }
        */
        return this
    }

    matchesNotification (note) {
        const tid = this.senderId()
        //const t = this.sender()
        //const matchesSender = (t === null) || (note.sender() === t) 
        const matchesSender = (tid === null) || (note.senderId() === tid) 
        if (matchesSender) {
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
        const sameSenderId = this.senderId() === obs.senderId()
        return sameName && sameObserver && sameSenderId
    }

    startWatching () {
        this.center().addObservation(this)
        //this.sender().onStartObserving()
        return this
    }

    isWatching () {
        return this.center().hasObservation(this)
    }

    stopWatching () {
        this.center().removeObservation(this)
        //this.sender().onStopObserving()
        return this
    }

    description () {
        return this.observer().typeId() + " listening to " + this.senderId() + " " + this.name()
    }

}.initThisClass());
