"use strict";

/**
 * @module library.notification.notifications
 */

/**
 * @class SvObservation
 * @extends ProtoClass
 * @classdesc An abstraction for a NotificationCenter observation. 
 * Holds references to which notification message a given observer wants
 * notifications for.
 */
(class SvObservation extends ProtoClass {

    /**
     * @description Initializes the prototype slots for the SvObservation class.
     */
    initPrototypeSlots () {
    
        /**
         * @member {SvNotificationCenter} center - NotificationCenter that owns this
         * @category Configuration
         */
        {
            const slot = this.newSlot("center", null);
            slot.setSlotType("SvNotificationCenter");
        }
        /**
         * @member {String|null} name
         * @category Configuration
         */
        {
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {String} sendName
         * @category Configuration
         */
        {
            const slot = this.newSlot("sendName", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Boolean} isOneShot
         * @category Configuration
         */
        {
            const slot = this.newSlot("isOneShot", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Boolean} didFinalizeStop
         * @category State
         */
        {
            const slot = this.newSlot("didFinalizeStop", false); 
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Object|null} observer - WeakRef slot to observer
         * @category Configuration
         */
        {
            const slot = this.newWeakSlot("observer", null);
            slot.setSlotType("Object"); // TODO: add observer protocol
            slot.setAllowsNullValue(true);
        }

        {
            const slot = this.newSlot("observerDescription", ""); // description of the observer for debugging when observer is collected
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
        }
        /**
         * @member {Object|null} sender - WeakRef to sender
         * @category Configuration
         */
        {
            const slot = this.newWeakSlot("sender", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }

        {
            const slot = this.newSlot("senderDescription", ""); // description of the sender for debugging when sender is collected
            slot.setSlotType("String");
            slot.setAllowsNullValue(false);
        }
        /**
         * @member {String|null} obsHash
         * @category State
         */
        {
            const slot = this.newSlot("obsHash", null); 
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {String|null} noteHash
         * @category State
         */
        {
            const slot = this.newSlot("noteHash", null); 
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Initializes the SvObservation instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setSender(null);
        this.setObserver(null);
        this.setIsDebugging(false);
    }

    /**
     * @description Handles the finalization of the observer slot.
     * @category Lifecycle
     */
    onFinalizedSlotObserver () {
        this.stopFromCollectedRef();
    }

    /**
     * @description Handles the finalization of the sender slot.
     * @category Lifecycle
     */
    onFinalizedSlotSender () {
        this.stopFromCollectedRef();
    }

    /**
     * @description Stops watching when a reference is collected.
     * @category Lifecycle
     */
    stopFromCollectedRef () {
        if (!this.didFinalizeStop()) {
            // need this check because if observer and sender finalizations occur in the same event loop
            // both with try to schedule stopWatching, and the SvSyncScheduler will (mistakenly?) detect this is a loop
            this.setDidFinalizeStop(true);
            this.scheduleMethod("stopWatching");
        }
        return this;
    }

    /**
     * @description Updates the sender slot and clears hashes.
     * @category State Management
     */
    didUpdateSlotSender () {
        this.clearHashes();
        if (this.sender() === null) {
            this.setSenderDescription("null");
        } else {
            this.setSenderDescription(this.sender().svTypeId());
        }
    }

    /**
     * @description Updates the observer slot and clears hashes.
     * @category State Management
     */
    didUpdateSlotObserver () {
        this.clearHashes();
        if (this.observer() === null) {
            this.setObserverDescription("null");
        } else {
            this.setObserverDescription(this.observer().svTypeId());
        }
    }

    /**
     * @description Updates the name slot and clears hashes.
     * @category State Management
     */
    didUpdateSlotName () {
        this.clearHashes();
    }

    /**
     * @description Clears both note and observation hashes.
     * @returns {SvObservation} The current instance.
     * @category State Management
     */
    clearHashes () {
        this.clearNoteHash();
        this.clearObsHash();
        return this;
    }

    /**
     * @description Clears the observation hash.
     * @returns {SvObservation} The current instance.
     * @category State Management
     */
    clearObsHash () {
        this._obsHash = null;
        return this;
    }

    /**
     * @description Generates and returns the observation hash.
     * @returns {String} The observation hash.
     * @category State Management
     */
    obsHash () {
        if (!this._noteHash) {
            const id = Type.typeUniqueId(this.name()) + Type.typeUniqueId(this.observer()) + Type.typeUniqueId(this.sender()); // needs to be unique for each observation
            this._obsHash = id.hashCode64();
        }
        return this._obsHash;
    }

    /**
     * @description Clears the note hash.
     * @returns {SvObservation} The current instance.
     * @category State Management
     */
    clearNoteHash () {
        this._noteHash = null;
        return this;
    }

    /**
     * @description Generates and returns the note hash.
     * @returns {String} The note hash.
     * @category State Management
     */
    noteHash () {
        if (!this._noteHash) {
            const id = Type.typeUniqueId(this.name()) + " " + Type.typeUniqueId(this.sender()); // must be implemented the same by SvNotification
            this._noteHash = id.hashCode64();
        }
        return this._noteHash;
    }

    /**
     * @description Checks if this observation is equal to another.
     * @param {SvObservation} obs - The observation to compare with.
     * @returns {Boolean} True if equal, false otherwise.
     * @category Comparison
     */
    isEqual (obs) {
        if (!Type.isObject(obs)) {
            return false;
        }
        return this.obsHash() === obs.obsHash();
    }

    /**
     * @description Gets the value ID for a given value.
     * @private
     * @param {*} v - The value to get an ID for.
     * @returns {String} The value ID.
     * @category Utility
     */
    valueId (v) {
        return v ? v.svTypeId() : "undefined";
    }

    /**
     * @description Gets the sender ID.
     * @returns {String} The sender ID.
     * @category Utility
     */
    senderId () { 
        return this.valueId(this.sender());
    }

    /**
     * @description Gets the observer ID.
     * @returns {String} The observer ID.
     * @category Utility
     */
    observerId () { 
        return this.valueId(this.observer());
    }

    /**
     * @description Gets the match method for notifications.
     * @returns {Function} The match method.
     * @category Matching
     */
    getMatchMethod () {
        const sender = this.sender();
        const name = this.name();
        const senderNull = Type.isNull(sender);
        const nameNull = Type.isNull(name);

        if (senderNull) {
            if (nameNull) {
                return (/*note*/) => { return true; }
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
     * @param {SvNotification} note - The notification to check.
     * @returns {Boolean} True if the notification matches, false otherwise.
     * @category Matching
     */
    matchesNotification (note) {
        if (!this._matchMethod) {
            this._matchMethod = this.getMatchMethod();
        }

        return this._matchMethod.call(this, note);
    }

    /**
     * @description Attempts to send a notification, catching and logging any errors.
     * @param {SvNotification} note - The notification to send.
     * @returns {null}
     * @category Notification Handling
     */
    tryToSendNotification (note) {
        try {
            this.sendNotification(note);       
        } catch(error) {
            console.error(this.logPrefix(), "NOTIFICATION EXCEPTION: '" + error.message + "'");
            console.error(this.logPrefix(), "  OBSERVER (" + this.observer() + ") STACK: ", error.stack);
            if (note.senderStack()) {
                console.error(this.logPrefix(), "  SENDER (" + note.senderId() + ") STACK: ", note.senderStack());
            }

            // how to we propogate the exception so we can inspect it in the debugger
            // without causing an inconsistent state by not completing the other notifications?
            throw error;
        }
        return null;
    }

    /**
     * @description Sends a notification to the observer.
     * @param {SvNotification} note - The notification to send.
     * @category Notification Handling
     */
    sendNotification (note) {
        const obs = this.observer();
        if (obs === undefined) { // observer may have been collected
            console.log(this.logPrefix(), "OBSERVER COLLECTED ON: " + this.description());
            this.stopWatching();
            return;
        }

        if (this.center().isDebugging() || this.isDebugging()) {
            this.logDebug(note.sender().svDebugId() + " sending note " + note.name() + " to " + this.observer().svDebugId());
        }

        const method = this.sendName() ? obs[this.sendName()] : obs[note.name()];

        if (method) {
            method.call(obs, note);
        } else {
            if (this.isDebugging()) {
                this.logDebug(" no method found for note name " + note.name());
            }
        }

        if (this.isOneShot()) {
            this.stopWatching();
        }
    }

    /**
     * @description Starts watching for notifications.
     * @returns {SvObservation} The current instance.
     * @category Lifecycle
     */
    startWatching () {
        this.center().addObservation(this);

        /*
        if (this.sender() && this.sender().isKindOf(FirestoreDatabaseService)) {
            console.log(this.logPrefix(), "STARTING WATCHING FOR " + this.sender().svTypeId() + " " + this.name());
            
            this.sender().onDidMutateObject(this);
        }
        */
        return this;
    }

    /**
     * @description Checks if the observation is currently watching.
     * @returns {Boolean} True if watching, false otherwise.
     * @category State
     */
    isWatching () {
        return this.center().hasObservation(this);
    }

    /**
     * @description Stops watching for notifications.
     * @returns {SvObservation} The current instance.
     * @category Lifecycle
     */
    stopWatching () {
        this.center().removeObservation(this);
        return this;
    }

    /**
     * @description Returns a description of the observation.
     * @returns {String} The description.
     * @category Utility
     */
    description () {
        return "observer '" + this.observerDescription() + "' listening for sender '" + this.senderDescription() + "' note '" + this.name() + "' (warning: puuids may have changed on load)";
        //return this.observerId() + " listening to " + this.senderId() + " " + this.name();
    }

    /**
     * @description Tests weak references.
     * @static
     * @category Testing
     */
    static testWeakRefs () {
        const observer = new Object();
        const sender = new Object();
        //const observation = 
        SvNotificationCenter.shared().newObservation().setName("weakRefTest").setObserver(observer).setSender(sender).startWatching();
        // let's see if this onFinalizedSlotObserver or onFinalizedSlotSender get called and it auto stops watching 
    }

}.initThisClass());

//SvObservation.testWeakRefs()