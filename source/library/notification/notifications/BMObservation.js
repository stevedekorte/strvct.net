"use strict";

/**
 * @module library.notification.notifications
 */

/**
 * @class BMObservation
 * @extends ProtoClass
 * @classdesc An abstraction for a NotificationCenter observation. 
 * Holds references to which notification message a given observer wants
 * notifications for.
 */
(class BMObservation extends ProtoClass {

    /**
     * @description Initializes the prototype slots for the BMObservation class.
     */
    initPrototypeSlots () {
    
        /**
         * @property {BMNotificationCenter} center - NotificationCenter that owns this
         */
        {
            const slot = this.newSlot("center", null);
            slot.setSlotType("BMNotificationCenter");
        }
        /**
         * @property {String|null} name
         */
        {
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        /**
         * @property {String} sendName
         */
        {
            const slot = this.newSlot("sendName", null);
            slot.setSlotType("String");
        }
        /**
         * @property {Boolean} isOneShot
         */
        {
            const slot = this.newSlot("isOneShot", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @property {Boolean} didFinalizeStop
         */
        {
            const slot = this.newSlot("didFinalizeStop", false); 
            slot.setSlotType("Boolean");
        }
        /**
         * @property {Object|null} observer - WeakRef slot to observer
         */
        {
            const slot = this.newWeakSlot("observer", null);
            slot.setSlotType("Object"); // TODO: add observer protocol
        }
        /**
         * @property {Object|null} sender - WeakRef to sender
         */
        {
            const slot = this.newWeakSlot("sender", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @property {String|null} obsHash
         */
        {
            const slot = this.newSlot("obsHash", null); 
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        /**
         * @property {String|null} noteHash
         */
        {
            const slot = this.newSlot("noteHash", null); 
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Initializes the BMObservation instance.
     */
    init () {
        super.init()
        this.setSender(null)
        this.setObserver(null)
        this.setIsDebugging(false)
    }

    /**
     * @description Handles the finalization of the observer slot.
     */
    onFinalizedSlotObserver () {
        this.stopFromCollectedRef()
    }

    /**
     * @description Handles the finalization of the sender slot.
     */
    onFinalizedSlotSender () {
        this.stopFromCollectedRef()
    }

    /**
     * @description Stops watching when a reference is collected.
     */
    stopFromCollectedRef () {
        if (!this.didFinalizeStop()) {
            // need this check because if observer and sender finalizations occur in the same event loop
            // both with try to schedule stopWatching, and the SyncScheduler will (mistakenly?) detect this is a loop
            this.setDidFinalizeStop(true)
            this.scheduleMethod("stopWatching")
        }
        return this
    }

    /**
     * @description Updates the sender slot and clears hashes.
     */
    didUpdateSlotSender () {
        this.clearHashes();
    }

    /**
     * @description Updates the observer slot and clears hashes.
     */
    didUpdateSlotObserver () {
        this.clearHashes();
    }

    /**
     * @description Updates the name slot and clears hashes.
     */
    didUpdateSlotName () {
        this.clearHashes();
    }

    /**
     * @description Clears both note and observation hashes.
     * @returns {BMObservation} The current instance.
     */
    clearHashes () {
        this.clearNoteHash();
        this.clearObsHash();
        return this;
    }

    /**
     * @description Clears the observation hash.
     * @returns {BMObservation} The current instance.
     */
    clearObsHash () {
        this._obsHash = null;
        return this
    }

    /**
     * @description Generates and returns the observation hash.
     * @returns {String} The observation hash.
     */
    obsHash () {
        if (!this._noteHash) {
            const id = Type.typeUniqueId(this.name()) + Type.typeUniqueId(this.observer()) + Type.typeUniqueId(this.sender()); // needs to be unique for each observation
            this._obsHash = id.hashCode64();
        }
        return this._obsHash
    }

    /**
     * @description Clears the note hash.
     * @returns {BMObservation} The current instance.
     */
    clearNoteHash () {
        this._noteHash = null;
        return this
    }

    /**
     * @description Generates and returns the note hash.
     * @returns {String} The note hash.
     */
    noteHash () {
        if (!this._noteHash) {
            const id = Type.typeUniqueId(this.name()) + " " + Type.typeUniqueId(this.sender()); // must be implemented the same by BMNotification
            this._noteHash = id.hashCode64();
        }
        return this._noteHash
    }

    /**
     * @description Checks if this observation is equal to another.
     * @param {BMObservation} obs - The observation to compare with.
     * @returns {Boolean} True if equal, false otherwise.
     */
    isEqual (obs) {
        return this.obsHash() === obs.obsHash();
    }

    /**
     * @description Gets the value ID for a given value.
     * @private
     * @param {*} v - The value to get an ID for.
     * @returns {String} The value ID.
     */
    valueId (v) {
        return v ? v.typeId() : "undefined"
    }

    /**
     * @description Gets the sender ID.
     * @returns {String} The sender ID.
     */
    senderId () { 
        return this.valueId(this.sender())
    }

    /**
     * @description Gets the observer ID.
     * @returns {String} The observer ID.
     */
    observerId () { 
        return this.valueId(this.observer())
    }

    /**
     * @description Gets the match method for notifications.
     * @returns {Function} The match method.
     */
    getMatchMethod () {
        const sender = this.sender();
        const name = this.name();
        const senderNull = Type.isNull(sender);
        const nameNull = Type.isNull(name);

        if (senderNull) {
            if (nameNull) {
                return (note) => { return true; }
            }
            return (note) => { return note.name() === name; }
        }
        if (nameNull) {
            return (note) => { return note.sender() === sender; }
        }
        return (note) => { return note.noteHash() === this.noteHash(); }
    }

    /**
     * @description Checks if a notification matches this observation.
     * @param {BMNotification} note - The notification to check.
     * @returns {Boolean} True if the notification matches, false otherwise.
     */
    matchesNotification (note) {
        if (!this._matchMethod) {
            this._matchMethod = this.getMatchMethod();
        }

        return this._matchMethod.call(this, note);
    }

    /**
     * @description Attempts to send a notification, catching and logging any errors.
     * @param {BMNotification} note - The notification to send.
     * @returns {null}
     */
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

    /**
     * @description Sends a notification to the observer.
     * @param {BMNotification} note - The notification to send.
     */
    sendNotification (note) {
        const obs = this.observer()
        if (obs === undefined) { // observer may have been collected
            console.log("OBSERVER COLLECTED ON: " + this.description())
            this.stopWatching()
            return
        }

        if (this.center().isDebugging() || this.isDebugging()) {
            console.log(note.sender().debugTypeId() + " sending note " + note.name() + " to " + this.observer().debugTypeId());
        }

        const method = this.sendName() ? obs[this.sendName()] : obs[note.name()];

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

    /**
     * @description Starts watching for notifications.
     * @returns {BMObservation} The current instance.
     */
    startWatching () {
        this.center().addObservation(this)
        return this
    }

    /**
     * @description Checks if the observation is currently watching.
     * @returns {Boolean} True if watching, false otherwise.
     */
    isWatching () {
        return this.center().hasObservation(this)
    }

    /**
     * @description Stops watching for notifications.
     * @returns {BMObservation} The current instance.
     */
    stopWatching () {
        this.center().removeObservation(this)
        return this
    }

    /**
     * @description Returns a description of the observation.
     * @returns {String} The description.
     */
    description () {
        return this.observerId() + " listening to " + this.senderId() + " " + this.name()
    }

    /**
     * @description Tests weak references.
     * @static
     */
    static testWeakRefs () {
        const observer = new Object()
        const sender = new Object()
        const observation = BMNotificationCenter.shared().newObservation().setName("weakRefTest").setObserver(observer).setSender(sender).startWatching()
        // let's see if this onFinalizedSlotObserver or onFinalizedSlotSender get called and it auto stops watching 
    }

}.initThisClass());

//BMObservation.testWeakRefs()