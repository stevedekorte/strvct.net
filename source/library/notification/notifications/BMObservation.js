"use strict";

/*

    BMObservation

    An abstraction for a NotificationCenter observation. 
    Holds references to which notification message a given observer is wants
    notifications for. 

*/

getGlobalThis().globalFinReg = new FinalizationRegistry(aClosure => { 
    debugger;
    aClosure() 
});

(class BMObservation extends ProtoClass {
    initPrototype () {
        this.newSlot("center", null) // NotificationCenter that owns this
        this.newSlot("name", null) // String 
        this.newSlot("isOneShot", false) // Boolean

        this.newSimpleWeakSlot("observer", null) // WeakRef slot to observer
        this.newSimpleWeakSlot("sender", null) // WeakRef to sender
    }

    init () {
        super.init()
        //this.setIsDebugging(true)
    }

    // --- weak slots --- TODO: move to Object or Prototype

    onFinalizeWeakRefNamed (slotName, privateName) {
        debugger;
        const eventName = "onFinalize" + slotName.capitalized()
        if (this[eventName]) {
            this[eventName].apply(this, [])
            this[privateName] = null
        }
    }

    newSimpleWeakSlot(slotName, initialValue) {
        // TODO: use a single finalization registery on Object class for all weak slots and pass heldValue of slot name?
        const privateName = "_" + slotName + "WeakRef";

        Object.defineSlot(this, privateName, initialValue)

        if (!this[slotName]) {
            const simpleGetter = function () {
                const ref = this[privateName]
                return ref ? ref.deref() : null //returns undefined if sender was collected
            }

            Object.defineSlot(this, slotName, simpleGetter)
        }

        const setterName = "set" + slotName.capitalized()

        if (!this[setterName]) {
            const simpleSetter = function (newValue) {
                const ref = this[privateName]
                const oldValue = ref ? ref.deref() : null

                if (oldValue) {
                    globalFinReg.unregister(oldValue)
                }

                this[privateName] = new WeakRef(newValue);

                if (newValue) {
                    globalFinReg.register(newValue, () => { debugger; this.onFinalizeWeakRefNamed(slotName, privateName) }, newValue)
                }

                return this;
            }

            Object.defineSlot(this, setterName, simpleSetter)
        }

        //this._slotNames.add(slotName)
        
        return this;
    }

    // --- private helpers ---

    valueId (v) { // private
        return v ? v.typeId() : "undefined"
    }

    // --- sender ---

    senderId () { 
        return this.valueId(this.sender())
    }

    onFinalizeSender () {
        debugger;
        this.stopWatching()
    }

    // --- observer --- 

    observerId () { 
        return this.valueId(this.observer())
    }

    onFinalizeObserver () {
        debugger;
        this.stopWatching()
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
            method.apply(obs, [note])
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

}.initThisClass());
