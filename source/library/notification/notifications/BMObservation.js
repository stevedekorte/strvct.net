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
        this.newSlot("name", null) // String 
        this.newSlot("isOneShot", false) // Boolean

        this.newWeakSlot("observer", null) // WeakRef slot to observer
        this.newWeakSlot("sender", null) // WeakRef to sender
    }

    init () {
        super.init()
        //this.setIsDebugging(true)
    }

    // --- weak slots --- TODO: move to Object or Prototype

    regNameForSlotName (slotName) {
        const regName = "_" + slotName + "FinalizationReg";
        return regName
    }

    onFinalizeWeakRefNamed (slotName, privateName, finalizedObj, regName) {
        const eventName = "onFinalize" + slotName.capitalized()
        if (this[eventName]) {
            this[eventName].apply(this, [finalizedObj])
            this[privateName] = null
            this[regName] = null
        }
    }

    newWeakSlot(slotName, initialValue) {
        // TODO: use a single finalization registery on Object class for all weak slots and pass heldValue of slot name?
        const privateName = "_" + slotName + "WeakRef";
        const regName = this.regNameForSlotName(slotName)
        const reg = new FinalizationRegistry(finalizedObj => this.onFinalizeWeakRefNamed(slotName, privateName, finalizedObj, regName))

        Object.defineSlot(this, privateName, initialValue)
        Object.defineSlot(this, regName, reg)
    
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
                    const reg = this[regName]
                    const ref = this[privateName]
                    const oldValue = ref ? ref.deref() : null

                    if (oldValue) {
                        reg.unregister(oldValue)
                    }

                    this[privateName] = new WeakRef(newValue);

                    if (newValue) {
                        reg.register(newValue)
                    }

                    return this;
                }
    
                Object.defineSlot(this, setterName, simpleSetter)
            }
    
            //this._slotNames.add(slotName)
            
            return this;
    }

    // --- sender ---

    senderId () { // TODO: remove if not needed
        const obj = this.sender()
        return obj ? obj.typeId() : null
    }


    observerId () { // TODO: remove if not needed
        const obj = this.observer()
        return obj ? obj.typeId() : null
    }

    onFinalizeSender (aSender) {
        debugger;
        this.stopWatching()
    }

    onFinalizeObserver (anObserver) {
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

    description () {
        return this.observer().typeId() + " listening to " + this.senderId() + " " + this.name()
    }

}.initThisClass());
