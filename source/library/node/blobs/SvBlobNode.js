"use strict";

/**
 * @module library.node.blobs
 * @class SvBlob
 * @extends BaseNode
 * @classdesc
 * SvBlobNode is a class that represents a binary blob in the system.
 * It extends the BaseNode class and provides functionality for managing and storing binary data.
 */
(class SvBlobNode extends JsonGroup {

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

    storeBlobHashesSet () {
        return new Set([this.valueHash()]);
    }

    valueSize () {
        const blob = this.blobValue();
        if (blob) {
            return blob.size;
        }
        return 0;
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

    mimeType () {
        const blob = this.blobValue();
        if (blob) {
            return blob.type;
        }
        return null;
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
     * @description Returns a string description of the SvBlob, including its type ID and slot values.
     * @returns {string} A string description of the SvBlobNode.
     * @category Utility
     */
    description () {
        const slotNames = ["title", "valueHash", "valueSize"];
        const parts = [this.svTypeId()];
        slotNames.forEach(slotName => {
            parts.push(slotName + ":" + this[slotName]());
        });
        return parts.join(", ");
    }

}.initThisClass());

//SvBlobNode.testHash()
