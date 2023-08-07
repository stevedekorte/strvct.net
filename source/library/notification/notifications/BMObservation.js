"use strict";

/*

    BMObservation

    An abstraction for a NotificationCenter observation. 
    Holds references to which notification message a given observer is wants
    notifications for. 

*/

(class BMObservation extends ProtoClass {
    initPrototypeSlots () {
        this.newSlot("center", null) // NotificationCenter that owns this
        this.newSlot("name", null) // String 
        this.newSlot("isOneShot", false) // Boolean
        this.newWeakSlot("observer", null) // WeakRef slot to observer
        this.newWeakSlot("sender", null) // WeakRef to sender
    }

    init () {
        super.init()
        this.setSender(null)
        this.setObserver(null)
        this.setIsDebugging(false)
    }

    onFinalizedSlotObserver () {
        //debugger;
        this.scheduleMethod("stopWatching")
    }

    onFinalizedSlotSender () {
        //debugger;
        this.scheduleMethod("stopWatching")
    }

    // --- private helpers ---

    valueId (v) { // private
        return v ? v.typeId() : "undefined"
    }

    // --- sender ---

    senderId () { 
        return this.valueId(this.sender())
    }

    /*
    senderOrObserverWasCollected () {
        return this.observer() === undefined || this.sender() === undefined
    }

    clean () {
        if (this.senderOrObserverWasCollected()) {
            debugger
            this.stopWatching()
        }
    }
    */

    // --- observer --- 

    observerId () { 
        return this.valueId(this.observer())
    }

    // ---

    matchesNotification (note) {
        const sender = this.sender()
        const matchesSender = (sender === null) || (sender === note.sender()) 
        if (matchesSender) {
            const name = this.name()
            const matchesName = (name === null) || (note.name() === name) 
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

        const obs = this.observer()
        if (obs === undefined) { // observer may have been collected
            console.log("OBSERVER COLLECTED ON: " + this.description())
            this.stopWatching()
            return
        }
        const method = obs[note.name()]
        if (method) {
            method.call(obs, note)
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
        const sameSenderId = this.sender() === obs.sender()
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

    /*
    stopWatchingIfSenderOrObserverCollected () {
        if (this.sender() === undefined || this.observer() === undefined) {
            this.stopWatching()
        }
    }
    */

    description () {
        return this.observerId() + " listening to " + this.senderId() + " " + this.name()
    }

    static testWeakRefs () {
        const observer = new Object()
        const sender = new Object()
        const observation = BMNotificationCenter.shared().newObservation().setName("weakRefTest").setObserver(observer).setSender(sender).startWatching()
        // let's see if this onFinalizedSlotObserver or onFinalizedSlotSender get called and it auto stops watching 
    }

}.initThisClass());

//BMObservation.testWeakRefs()
