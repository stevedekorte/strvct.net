"use strict";

/**
 * @module library.node.blobs
 * @class SvBlob
 * @extends BaseNode
 * @classdesc
 * SvBlob is a class that represents a binary blob in the system.
 * It extends the BaseNode class and provides functionality for managing and storing binary data.
 */
(class SvBlob extends BaseNode {

    /**
     * Initializes the prototype slots for the SvBlob class.
     */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("name", null);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("String");
            /**
             * @member {string} name - The name of the blob.
             * @category Metadata
             */
        }

        {
            const slot = this.newSlot("valueHash", null);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("String");
            /**
             * @member {string} valueHash - The hash value of the blob's data.
             * @category Data
             */
        }

        {
            const slot = this.newSlot("valueSize", null);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Number");
            /**
             * @member {number} valueSize - The size of the blob's data in bytes.
             * @category Data
             */
        }

        {
            const slot = this.newSlot("lastModifiedTime", null);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Number");
            /**
             * @member {number} lastModifiedTime - The timestamp of the last modification to the blob's data.
             * @category Metadata
             */
        }

        {
            const slot = this.newSlot("expirationDate", null);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Date");
            /**
             * @member {Date} expirationDate - The date when the blob's data expires.
             * @category Metadata
             */
        }

        {
            const slot = this.newSlot("value", null);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(false);
            slot.setDoesHookSetter(true);
            slot.setSlotType("ArrayBuffer");
            /**
             * @member {ArrayBuffer} value - The binary data of the blob.
             * @category Data
             */
        }
    }

    /**
     * Initializes the prototype for the SvBlob class.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }

    /**
     * @description Calculates the age of the blob in milliseconds based on its last modified time.
     * @returns {number} The age of the blob in milliseconds.
     * @category Utility
     */
    age () {
        return new Date().getTime() - this.lastModifiedTime()
    }

    /**
     * @async
     * @description Prepares the SvBlob for first access by setting up the value field.
     * @category Initialization
     */
    prepareForFirstAccess () {
        super.prepareForFirstAccess()
        this.setupValueField()
    }

    /**
     * @description Initializes the prototype slots for the SvBlob.
     * @category Initialization
     */
    async setupValueField () {
        const field = SvTextAreaField.clone().setKey("value");
        field.setValueMethod("value");
        field.setValueIsEditable(false);
        field.setIsMono(true);
        field.setTarget(this);
        field.getValueFromTarget(); // this doesn't do anything with the returned value?
        this.addSubnode(field);

        await this.promiseReadValue();
        this.didReadValue();
        this.scheduleSyncToView();
    }

    /**
     * @description Performs any necessary actions after reading the value of the SvBlob.
     * @category Data
     */
    didReadValue () {
    }

    /**
     * @description Returns the title of the SvBlob, which is its name.
     * @returns {string} The name of the SvBlob.
     * @category Metadata
     */
    title () {
        return this.name()
    }

    /**
     * @description Returns the subtitle of the SvBlob, which is the size of its data in a human-readable format.
     * @returns {string|null} The size of the SvBlob's data in a human-readable format, or null if the size is not available.
     * @category Metadata
     */
    subtitle () {
        const size = this.valueSize()
        if (size) {
            return size.byteSizeDescription()
        }
        return null
    }

    /**
     * @description Returns the hash value of the SvBlob, which is used as the key for subnode lookup.
     * @returns {string} The hash value of the SvBlob.
     * @category Data
     */
    hash () {
        return this.valueHash() // for subnode lookup
    }

    /**
     * @description Performs any necessary actions when a slot value is updated.
     * @param {*} oldValue The old value of the slot.
     * @param {*} newValue The new value of the slot.
     * @returns {SvBlob} The current instance of SvBlob.
     * @category Data
     */
    didUpdateSlotValue (oldValue, newValue) {
        if (newValue) {
            this.setValueSize(newValue.length)
            this.setLastModifiedTime(new Date().getTime())
            this.promiseWriteValue()
        }
        return this
    }

    /**
     * @description Returns the store associated with the SvBlob's parent node.
     * @returns {*} The store associated with the SvBlob's parent node.
     * @category Storage
     */
    store () {
        return this.parentNode().store()
    }

    /**
     * @async
     * @description Promises to write the value of the SvBlob to the store.
     * @category Storage
     */
    async promiseWriteValue () {
        // what about number or null values?
        const v = this.value()
        assert(Type.isArrayBuffer(v) || Type.isString(v))

        const digestBuffer = await v.promiseSha256Digest();
        const h = digestBuffer.base64Encoded();
        await this.promiseWriteValueWithHash(v, h);
    }

    /**
     * @async
     * @description Promises to write the value and hash of the SvBlob to the store.
     * @param {ArrayBuffer|string} v The value to be written.
     * @param {string} h The hash value of the value.
     * @category Storage
     */
    async promiseWriteValueWithHash (v, h) {
        this.setValueHash(h);

        if (Type.isArrayBuffer(v)) {
            assert(v.byteLength);
        }

        assert(this.isValid());

        await this.store().promiseOpen();

        try {
            await this.store().promiseAtPut(h, v);
            console.log(this.logPrefix(), "did write hash/value pair: " + this.description())
        } catch (error) {
            console.error(this.logPrefix(), error);
            console.log(this.logPrefix(), "error writing hash/value pair: " + this.description())
            debugger
        }
    }

    /**
     * @description Promises to read the value of the SvBlob from the store.
     * @category Storage
     */
    async promiseReadValue () {
        if (this.value()) {
            return
        }

        assert(this.isValid());

        const value = await this.store().promiseAt(this.valueHash());
        this._value = value;
        this.didUpdateNodeIfInitialized();
    }

    /**
     * @async
     * @description Checks if the SvBlob is valid based on its properties.
     * @returns {boolean} True if the SvBlob is valid, false otherwise.
     * @category Validation
     */
    isValid () {
        if (Type.isNull(this.name())) {
            return false
        }

        if (Type.isNull(this.valueHash())) {
            return false
        }

        if (Type.isNull(this.valueSize())) {
            return false
        }

        if (Type.isNull(this.lastModifiedTime()) || this.lastModifiedTime() === 0) {
            return false
        }

        return true
    }

    /**
     * @description Returns a string description of the SvBlob, including its type ID and slot values.
     * @returns {string} A string description of the SvBlob.
     * @category Utility
     */
    description () {
        const slotNames = ["name", "valueHash", "valueSize", "lastModifiedTime"]
        const parts = [this.svTypeId()]
        slotNames.forEach(slotName => {
            parts.push(slotName + ":" + this[slotName]())
        })
        return parts.join(", ")
    }

    /**
     * @static
     * @async
     * @description Tests the hash function by comparing the calculated hash of a string with a known hash value.
     * @category Testing
     */
    static async testHash () {
        // This is a test to make sure browser JS and node JS hashes match.
        //  Here's the code from nodejs:
        // crypto.createHash('sha256').update(Buffer.from("abc", "utf8")).digest("base64");
        const nodejsHash = 'ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0='
        const enc = new TextEncoder(); // always utf-8
        const uint8Array = enc.encode("abc");
        const arrayBuffer = uint8Array.buffer
        const digestBuffer = await arrayBuffer.promiseSha256Digest();
        const h = digestBuffer.base64Encoded()
        assert(h === nodejsHash, "hashes do not match");
        console.log(this.logPrefix(), "hashes match!");
    }

}.initThisClass());

//SvBlob.testHash()