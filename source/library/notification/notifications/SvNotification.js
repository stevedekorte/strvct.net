/**
 * @module library.notification.notifications
 */

/**
 * @class SvNotification
 * @extends ProtoClass
 * @classdesc Represents a notification in the system.
 */
(class SvNotification extends ProtoClass {

    /**
     * Initializes the prototype slots for the SvNotification class.
     */
    initPrototypeSlots () {
        /**
         * @member {String|null} name - The name of the notification.
         * @category Identification
         */
        {
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {Object|null} sender - The sender of the notification.
         * @category Identification
         */
        {
            const slot = this.newSlot("sender", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {Object|null} info - Additional information for the notification.
         * @category Data
         */
        {
            const slot = this.newSlot("info", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {SvNotificationCenter|null} center - The NotificationCenter that owns this notification.
         * @category Management
         */
        {
            const slot = this.newSlot("center", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("SvNotificationCenter");
        }
        /**
         * @member {Object|null} senderStack - The stack trace of the sender.
         * @category Debugging
         */
        {
            const slot = this.newSlot("senderStack", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Object");
        }
        /**
         * @member {String|null} noteHash - A unique hash for the notification.
         * @category Identification
         */
        {
            const slot = this.newSlot("noteHash", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * Initializes the prototype.
     */
    initPrototype () {
    }

    /**
     * Gets the sender's debug type ID.
     * @returns {string} The sender's debug type ID.
     * @category Identification
     */
    senderId () {
        return this.sender().debugTypeId();
    }

    /**
     * Sets the sender of the notification.
     * @param {Object} obj - The sender object.
     * @returns {SvNotification} The current instance.
     * @category Identification
     */
    setSender (obj) {
        assert(Type.isObject(obj));
        this._sender = obj;
        this.clearNoteHash();
        return this;
    }

    /**
     * Sets the name of the notification.
     * @param {string} aName - The name to set.
     * @returns {SvNotification} The current instance.
     * @category Identification
     */
    setName (aName) {
        this._name = aName;
        this.clearNoteHash();
        return this;
    }
    
    /**
     * Checks if this notification is equal to another.
     * @param {SvNotification} obs - The notification to compare with.
     * @returns {boolean} True if equal, false otherwise.
     * @category Comparison
     */
    isEqual (obs) {
        if (this === obs) { 
            return true;
        }

        return this.noteHash() === obs.noteHash();
    }

    /**
     * Clears the note hash.
     * @returns {SvNotification} The current instance.
     * @category Identification
     */
    clearNoteHash () {
        this._noteHash = null;
        return this
    }

    /**
     * Gets or generates the note hash.
     * @returns {string} The note hash.
     * @category Identification
     */
    noteHash () {
        if (!this._noteHash) {
            const id = Type.typeUniqueId(this.name()) + " " + Type.typeUniqueId(this.sender());
            this._noteHash = id.hashCode64();
        }
        return this._noteHash;
    }

    /**
     * Checks if the notification is posted.
     * @returns {boolean} True if posted, false otherwise.
     * @category Status
     */
    isPosted () {
        return this.center().hasNotification(this);
    }
    
    /**
     * Posts the notification.
     * @returns {SvNotification} The current instance.
     * @category Management
     */
    post () {
        if (this.center().isDebugging()) {
            const e = new Error();
            e.name = "";
            e.message = this.senderId() + " posting note '" + this.name() + "'";
            this.setSenderStack(e.stack);
        }
       
        this.center().addNotification(this);
        return this;
    }
    
    /**
     * Gets a description of the notification.
     * @returns {string} The description.
     * @category Utility
     */
    description () {
        const s = this.senderId() ? this.senderId() : "null";
        const n = this.name() ? this.name() : "null";
        return s + " " + n;
    }

    /**
     * Creates a new observation for this notification.
     * @returns {SvObservation} A new observation instance.
     * @category Management
     */
    newObservation () {
        return SvNotificationCenter.shared().newObservation().setName(this.name()).setSender(this.sender());
    }

}.initThisClass());