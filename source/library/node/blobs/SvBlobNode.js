"use strict";

/** * @module library.node.blobs
 */

/**
 * @class SvBlobNode
 * @extends JsonGroup
 * @classdesc SvBlobNode is a class that represents a binary blob in the system.
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

/**

 */
(class SvBlobNode extends SvJsonGroup {

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
            slot.setIsInCloudJson(true); // CLOUD STORED
            slot.setSlotType("String");
            slot.setIsSubnodeField(true);
            slot.setDuplicateOp("duplicate");
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
            slot.setIsInCloudJson(false); // NOT CLOUD STORED
            slot.setSlotType("Blob");
            slot.setIsSubnodeField(false);
            slot.setDuplicateOp("duplicate");
        }


        // compute hash action
        {
            const slot = this.newSlot("computeValueHashAction", null);
            slot.setIsInJsonSchema(false);
            slot.setLabel("Compute Hash");
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncValueHash");
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("asyncReadFromLocalStoragePromise", null);
            slot.setIsInJsonSchema(false);
            slot.setLabel("Async Get Blob From Local Storage Promise");
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Promise");
            slot.setIsSubnodeField(true);
        }

        {
            const slot = this.newSlot("asyncWriteToLocalStoragePromise", null);
            slot.setIsInJsonSchema(false);
            slot.setLabel("Async Save To Local Storage Promise");
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Promise");
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

    clear () {
        this.setValueHash(null);
        this.setBlobValue(null);
        return this;
    }

    async asyncSetBlobValue (blob) {
        this.setBlobValue(blob);
        await this.asyncValueHash(); // compute the hash
        await this.asyncWriteToLocalStorage();
        return this;
    }

    async asyncPrepareForAsJson () {
        await this.asyncValueHash(); // make sure we have a hash if possible
        if (this.blobValue()) {
            assert(this.valueHash() !== null, "blob value hash is null");
        }
        return this;
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
        if (newBlobValue !== null) {
            // Clear hash when blob changes - it will be recomputed on next access
            this.asyncWriteToLocalStorage();

            //this.setValueHash(null); // need to be careful - we might already have the correct hash
            this.asyncComputeValueHash(); // can't await here
            // NOTE: we might run into race conditions here if the blob is updated before the hash is computed
        }
    }

    async asyncBlobValue () {
        const blob = this.blobValue();
        if (blob) {
            return blob;
        }

        // lazy load the blob from the BlobPool
        const hash = this.valueHash();
        if (hash) {
            const localBlob = await this.asyncReadFromLocalStorage();
            if (localBlob) {
                return localBlob;
            }
        }

        return null;
    }


    // --- read from and write to local storage ---

    async asyncWriteToLocalStorage () {
        console.log("writing blob to local storage");

        if (this.asyncWriteToLocalStoragePromise()) {
            return this.asyncWriteToLocalStoragePromise();
        }

        this.setAsyncWriteToLocalStoragePromise(Promise.clone());

        const blob = this.blobValue();
        if (blob) {
            await this.defaultStore().blobPool().asyncStoreBlob(blob);
            const hash = await this.valueHash();
            console.log("locally stored blob with hash:", hash);
            assert(hash !== null, "hash is null");

            const blobFromPool = await this.defaultStore().blobPool().asyncGetBlob(hash);
            assert(blobFromPool !== null, "blob from pool is null");
        }
        this.asyncWriteToLocalStoragePromise().callResolveFunc(null);
        this.setAsyncWriteToLocalStoragePromise(null);
        return this;
    }

    async asyncReadFromLocalStorage () {
        if (this.asyncWriteToLocalStoragePromise()) {
            await this.asyncWriteToLocalStoragePromise();
        }

        if (this.asyncReadFromLocalStoragePromise()) {
            return this.asyncReadFromLocalStoragePromise();
        }

        this.setAsyncReadFromLocalStoragePromise(Promise.clone());

        const hash = this.valueHash();
        if (hash) {
            const blob = await this.defaultStore().blobPool().asyncGetBlob(hash);
            if (blob) {
                this._blobValue = blob; // don't want to trigger saving the blob value
                this.asyncReadFromLocalStoragePromise().callResolveFunc(blob);
                this.setAsyncReadFromLocalStoragePromise(null);
                return blob;
            }
        }

        this.setAsyncReadFromLocalStoragePromise(null);
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
        console.log("computed blob value hash: ", hash);
        this.setValueHash(hash);
        return hash;
    }


    async asyncComputeValueHash () {
        if (this.valueHash()) {
            return this.valueHash(); // assume it's already computed (as we null it when the blob value changes)
        }

        const blob = this.blobValue();
        if (blob) {
            return await blob.asyncHexSha256();
        }
        return null;
    }

    computeValueHashActionInfo () {
        return {
            title: "Compute Hash",
            isEnabled: this.hasBlobValue(),
            subtitle: this.hasBlobValue() ? null : "No blob value"
        };
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

    // --- helpers ---

    /**
     * @description Converts the blob value to a data URL
     * @returns {Promise<string>} The data URL
     * @category Conversion
     */
    async asyncAsDataUrl () {
        const blob = await this.asyncBlobValue();
        if (!blob) {
            return null;
        }
        return await blob.asyncAsDataUrl();
    }

    async asyncSetDataURL (dataURL) {
        const blob = Blob.fromDataUrl(dataURL);
        await this.asyncSetBlobValue(blob);
        return this;
    }

}.initThisClass());

//SvBlobNode.testHash()
