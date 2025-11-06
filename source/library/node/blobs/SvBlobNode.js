"use strict";

/**
 * @module library.node.blobs
 * @class SvBlob
 * @extends JsonGroup
 * @classdesc
 * SvBlobNode is a class that represents a binary blob in the system.
 *
 * Lazy loading:
 * Instances keep a hash of the blob data which acts as a reference to the blob which can be lazy loaded from a BlobPool when needed.
 * So we store SvBlobNode (and the blob's hash) in the ObjectPool where it's sync loaded,
 * and the blob data in SvBlobPool where it's lazy async loaded.
 *
 * Further notes:
 * This class is intended to be used as a parent class for media classes like SvImageNode, SvVideoNode, SvAudioNode, etc.
 * A subclass of this one will add support for mirroring in a cloud storage system.
 * Issues: how do we garbage collect blobs that we might share with other user's clients?
 *
 */
(class SvBlobNode extends JsonGroup {

    /**
     * Initializes the prototype slots for the SvBlobNode class.
     */
    initPrototypeSlots () {

        {
            const slot = this.newSlot("valueHash", null); // hex sha256 hash of raw blob data
            slot.setIsInJsonSchema(true); // so json patches will copy it
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
            const slot = this.newSlot("blobValue", null); // transient - loaded from BlobPool via hash
            slot.setIsInJsonSchema(false);
            slot.setAllowsNullValue(true);
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(false); // Don't persist - only hash is stored
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

    // --- ObjectPool ---

    /**
     * @description Returns a Set of Blob objects referenced by this node (for storing)
     * Called by ObjectPool.storeBlobsReferencedByObject() when saving objects
     * @returns {Set<Blob>}
     * @category ObjectPool
     */

    /*
    we don't need this atm as we store the blob when it's set
    referencedBlobsSet () {
        const blobsSet = new Set();
        const blob = this.blobValue();
        if (blob) {
            blobsSet.add(blob);
        }
        return blobsSet;
    }
    */

    /**
     * @description Returns a Set of blob hashes referenced by this node (for GC)
     * @returns {Set<string>}
     * @category ObjectPool
     */
    referencedBlobHashesSet () { // called by ObjectPool.allBlobHashesSet()
        const hashesSet = new Set();
        const hash = this.valueHash();
        if (hash) {
            hashesSet.add(hash);
        }
        return hashesSet;
    }

    didUpdateSlotBlobValue (oldBlobValue, newBlobValue) {
        if (oldBlobValue === null && newBlobValue !== null) {
            // Clear hash when blob changes - it will be recomputed on next access
            this.defaultStore().blobPool().asyncStoreBlob(newBlobValue);
            this.setValueHash(null);
            this.asyncComputeValueHash(); // can't await here
            // NOTE: we might run into race conditions here if the blob is updated before the hash is computed
        }
    }

    async asyncBlobValue () {
        const currentBlobValue = this.blobValue();
        if (currentBlobValue) {
            return currentBlobValue;
        }

        // lazy load the blob from the BlobPool
        const hash = this.valueHash();
        if (hash) {
            const blob = await this.defaultStore().blobPool().asyncGetBlob(hash);
            if (blob) {
                this._blobValue = blob; // don't want to trigger saving the blob value
                return blob;
            }
        }

        return null;
    }

    // -------------------------

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
    async asyncAsArrayBuffer () {
        const v = this.blobValue();
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
