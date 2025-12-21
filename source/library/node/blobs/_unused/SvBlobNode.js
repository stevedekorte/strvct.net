"use strict";

/** * @module library.node.blobs
 */

/** * @class SvBlob
 * @extends BaseNode
 * @classdesc
 * SvBlobNode is a class that represents a binary blob in the system.
 * It extends the BaseNode class and provides functionality for managing and storing binary data.
 
 
 */

/**

 */
(class SvBlobNode extends BaseNode {

    /**
     * Initializes the prototype slots for the SvBlobNode class.
     */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("valueHash", null); // hex sha256 hash of raw blob data
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            /**
             * @member {string} valueHash - The hash value of the blob's data.
             * @category Data
             */
        }

        {
            const slot = this.newSlot("valueSize", null); // handy metadata for the blob
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Number");
            slot.setIsSubnodeField(true);
            /**
             * @member {number} valueSize - The size of the blob's data in bytes.
             * @category Data
             */
        }

        {
            const slot = this.newSlot("blobValue", null); // once set, we throw and exception if it's changed
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Blob");
            slot.setIsSubnodeField(true);
        }
    }

    /**
     * Initializes the prototype for the SvBlobNode class.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }


    /**
     * @description Returns the subtitle of the SvBlob, which is the size of its data in a human-readable format.
     * @returns {string|null} The size of the SvBlob's data in a human-readable format, or null if the size is not available.
     * @category Metadata
     */
    subtitle () {
        const size = this.valueSize();
        if (size) {
            return size.byteSizeDescription();
        }
        return null;
    }

    /**
     * @description Returns the hash value of the SvBlob, which is used as the key for subnode lookup.
     * @returns {string} The hash value of the SvBlobNode.
     * @category Data
     */
    hash () {
        return this.valueHash(); // for subnode lookup
    }

    /**
     * @description Performs any necessary actions when a slot value is updated.
     * @param {*} oldValue The old value of the slot.
     * @param {*} newValue The new value of the slot.
     * @returns {SvBlob} The current instance of SvBlobNode.
     * @category Data
     */
    didUpdateSlotBlobValue (oldBlobValue, newBlobValue) {
        if (oldBlobValue && newBlobValue) {
            this.setValueSize(newBlobValue.length);
            this.setValueHash(null);
        }
    }


    async asyncAsArrayBuffer () {
        const v = this.blobValue();
        assert(Type.isBlob(v), "blobValue is not a blob");
        return await v.asyncToArrayBuffer();
    }

    async asyncValueHash () {
        if (this.valueHash()) {
            return this.valueHash(); // assume it's already computed (as we null it when the blob value changes)
        }

        // compute and store the hash
        const hash = await this.asyncComputeValueHash();
        this.setValueHash(hash);
        return hash;
    }

    async asyncComputeValueHash () {
        const blob = this.blobValue();
        if (blob) {
            return await blob.asyncHexSha256();
        }
        return null;
    }


    /**
     * @description Returns the store associated with the SvBlob's parent node.
     * @returns {*} The store associated with the SvBlob's parent node.
     * @category Storage
     */
    store () {
        return SvBlobStore.shared();
    }

    /**
     * @async
     * @description Promises to write the value of the SvBlobNode to the store.
     * @category Storage
     */
    async asyncWriteValue () {
        const h = await this.asyncValueHash();
        const v = this.blobValue();

        assert(Type.isBlob(v), "blobValue is not a blob");

        await this.store().promiseOpen();

        try {
            await this.store().promiseAtPut(h, v);
            console.log(this.logPrefix(), "did write hash/value pair: " + this.description());
        } catch (error) {
            console.error(this.logPrefix(), error);
            console.log(this.logPrefix(), "error writing hash/value pair: " + this.description());
        }
    }

    /**
     * @description Promises to read the value of the SvBlobNode from the store.
     * @category Storage
     */
    async asyncReadValue () {
        if (this.value()) {
            return;
        }

        const h = this.valueHash();
        assert(h, "valueHash is not set");

        const value = await this.store().promiseAt(h);
        this.setBlobValue(value);
        this.didUpdateNodeIfInitialized();
    }

    /**
     * @description Returns a string description of the SvBlob, including its type ID and slot values.
     * @returns {string} A string description of the SvBlobNode.
     * @category Utility
     */
    description () {
        const slotNames = ["name", "valueHash", "valueSize"];
        const parts = [this.svTypeId()];
        slotNames.forEach(slotName => {
            parts.push(slotName + ":" + this[slotName]());
        });
        return parts.join(", ");
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
        const nodejsHash = "ungWv48Bz+pBQUDeXa4iI7ADYaOWF3qctBD/YfIAFa0=";
        const enc = new TextEncoder(); // always utf-8
        const uint8Array = enc.encode("abc");
        const arrayBuffer = uint8Array.buffer;
        const digestBuffer = await arrayBuffer.promiseSha256Digest();
        const h = digestBuffer.base64Encoded();
        assert(h === nodejsHash, "hashes do not match");
        console.log(this.logPrefix(), "hashes match!");
    }

}.initThisClass());

//SvBlobNode.testHash()
