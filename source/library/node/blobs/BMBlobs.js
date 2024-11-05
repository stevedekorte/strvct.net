/* eslint-disable */
"use strict";

/**
 * @module library.node.blobs
 * @class BMBlobs
 * @classdesc Async storage for larger values.
 *
 * Motivation:
 * Due to indexeddb only having an async API, we have to load the app's store
 * entirely into memory in order to be able to synchronously read it.
 * This works as long as the amount of data isn't too big.
 * To help keep the store small, we put large objects, and objects which are ok to load asynchronously
 * (eg app resources like fonts, images) in blobs.
 *
 * blobs -> blob subnode (name, valueHash, date, etc)
 *
 * A container for existing blobs.
 * A blob is an object that refs an entry in a PersistentAsyncMap (separate from the app's store).
 * The data hash is used as a pointer to a CamRecord
 *
 * store a blob:
 *
 * const blob = blobs.blobWithName(k)
 * // returns existing blob if there's a match
 *
 * NOTES:
 *
 * The Blobs object and it's subnodes should be stored in the app's
 * store, so there will need to be a path from the app's root node to
 * the BMBlobs singleton instance. It may be tricky to get this right as
 * creating a BMBlobs before reading it out of the store would create a
 * conflicting instance.
 *
 * @extends BMStorableNode
 */
(class BMBlobs extends BMStorableNode {
    /**
     * @static
     * @description Initializes the class by setting it as a singleton.
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member
             * @type {PersistentObjectPool}
             * @description The store for the blobs.
             * @category Storage
             */
            const slot = this.newSlot("store", null);
            slot.setSlotType("PersistentObjectPool");
        }
    }

    /**
     * @description Initializes the prototype properties for the class.
     * @category Initialization
     */
    initPrototype () {
        this.setTitle("Blobs");
        this.setNoteIsSubnodeCount(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
        this.setNodeCanReorderSubnodes(true);
    }

    /**
     * @description Initializes the instance by setting the store.
     * @returns {BMBlobs} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setStore(PersistentAsyncMap.clone().setName("BlobHashStore"));
        return this;
    }

    /**
     * @description Promises to open the store.
     * @returns {Promise} A promise that resolves when the store is open.
     * @category Storage
     */
    promiseOpen () {
        debugger;
        return this.store().promiseOpen();
    }

    // --- lookup blob by name ---

    /**
     * @description Retrieves a blob subnode with the given name.
     * @param {string} aName The name of the blob to retrieve.
     * @returns {BMBlob|undefined} The blob subnode with the given name, or undefined if not found.
     * @category Lookup
     */
    blobWithName (aName) {
        return this.subnodes().detect(sn => sn.title() === aName)
        //return this.firstSubnodeWithTitle(aName)
    }

    /**
     * @description Checks if a blob subnode with the given name exists.
     * @param {string} aName The name of the blob to check for.
     * @returns {boolean} True if a blob subnode with the given name exists, false otherwise.
     * @category Lookup
     */
    hasBlobWithName (aName) {
        return !Type.isNullOrUndefined(this.blobWithName(aName))
    }

    // --- lookup blob by hash ---

    /**
     * @description Checks if a blob subnode with the given value hash exists.
     * @param {string} h The value hash of the blob to check for.
     * @returns {boolean} True if a blob subnode with the given value hash exists, false otherwise.
     * @category Lookup
     */
    hasBlobWithValueHash (h) {
        return !Type.isNullOrUndefined(this.blobWithValueHash(h))
    }

    /**
     * @description Retrieves a blob subnode with the given value hash.
     * @param {string} h The value hash of the blob to retrieve.
     * @returns {BMBlob|undefined} The blob subnode with the given value hash, or undefined if not found.
     * @category Lookup
     */
    blobWithValueHash (h) {
        //debugger
        return this.subnodes().detect(sn => sn.valueHash() === h) /// <------------------------------ TEMPORARY
        //return this.subnodeWithHash(h)
    }

    // create blob

    /**
     * @description Creates a new blob subnode with the given name and value, or updates an existing blob with the same name.
     * @param {string} aName The name of the blob to create or update.
     * @param {*} aValue The value of the blob to create or update.
     * @returns {BMBlob} The created or updated blob subnode.
     * @category Creation
     */
    createBlobWithNameAndValue (aName, aValue) {
        //debugger
        const oldBlob = this.blobWithName(aName);
        if (oldBlob) {
            oldBlob.setValue(aValue);
            return oldBlob;
        }

        assert(!this.hasBlobWithName(aName));
        const blob = BMBlob.clone();
        blob.setName(aName);
        blob.setValue(aValue); // this will trigger an async compute of valueHash and store of value
        this.addSubnode(blob);
        return blob;
    }

    /**
     * @async
     * @description Collects garbage by removing invalid blob subnodes and unreferenced store entries.
     * @returns {Promise} A promise that resolves when the garbage collection is complete.
     * @category Maintenance
     */
    async collectGarbage () {
        // remove invalid Blob subnodes (thbose with null meta data)
        this.subnodes().shallowCopy().forEach((blob) => {
            if (!blob.isValid()) {
                this.debugLog(" collecting inValid blob:", blob.description());
                blob.delete();
            }
        })

        // remove store entries which are not referenced by a Blob subnode valueHash
        const subnodeHashes = this.subnodes().map(sn => sn.valueHash()).asSet();
        const store = this.store();

        //store.promiseClear()
        const storedHashes = await store.promiseAllKeys();
        storedHashes.forEach(async (h) => {
            if (!subnodeHashes.has(h)) {
                this.debugLog("collecting unreferenced blob hash:", h);
                await store.promiseRemoveKey(h);
            }
        })
    }

    /**
     * @static
     * @async
     * @description Performs a self-test by creating and storing a test blob.
     * @returns {Promise} A promise that resolves when the self-test is complete.
     * @category Testing
     */
    static async selfTest () {
        this.addTimeout(async () => {
            const blob = BMBlobs.shared().blobForKey("http://test.com/");
            blob.setValue("test content");
            await blob.promiseWrite();
        })
    }

}.initThisClass());