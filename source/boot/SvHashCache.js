/**
 * @module boot
 */

"use strict";

/**
 * @class SvHashCache
 * @extends Base
 * @classdesc An key/value db where the keys are hashes of the values.
 * There are APIs to help with using as a url load cache.
 */
(class SvHashCache extends SvBase {
    /**
     * @description Initializes the prototype slots for the SvHashCache class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {SvIndexedDbFolder|null} idb - The SvIndexedDbFolder instance used for storage.
         * @category Storage
         */
        this.newSlot("idb", null);
        this.newSlot("weakMap", null);
        //this.newSlot("keyValidatorFunc", null);
        this.newSlot("valueValidatorFunc", null);

        /**
         * @member {Map|null} warmMap - Boot-time in-memory copy of the whole store,
         * loaded with one getAll() transaction. While present, reads are served from
         * memory instead of one-IndexedDB-transaction-per-key (which is very slow in
         * Safari across ~1000 boot resources). Released after boot to free the memory.
         * @category Storage
         */
        this.newSlot("warmMap", null);

        /**
         * @member {Promise|null} warmLoadPromise - Memoizes the in-flight warm
         * load so concurrent callers share one getAll() transaction.
         * @category Storage
         */
        this.newSlot("warmLoadPromise", null);
    }

    /**
     * @description Initializes the prototype for the SvHashCache class.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Initializes the SvHashCache instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIdb(SvIndexedDbFolder.clone());
        this.setIsDebugging(false);
        this.idb().setIsDebugging(false);
        this.setPath("sharedSvHashCache");
        this.setValueValidatorFunc((data) => this.defaultValueValidatorFunc(data));
    }

    defaultValueValidatorFunc (data) {
        const isString = typeof(data) === "string";
        const isArrayBuffer = data instanceof ArrayBuffer;
        const isBuffer = (typeof Buffer !== "undefined" && Buffer.isBuffer(data));
        return isString || isArrayBuffer || isBuffer;
    }

    enableWeakMap () {
        //console.log(this.logPrefix(), "enabling weak map");
        this.setWeakMap(new SvEnumerableWeakMap());
        return this;
    }

    // --- boot warm map ---

    /**
     * @description Loads the entire store into an in-memory Map with a single
     * getAll() transaction. Boot-time reads then come from memory. Call
     * releaseWarmMap() when boot completes.
     * @returns {Promise<Map>} - The warm map (hash → data).
     * @category Data Retrieval
     */
    promiseWarmLoad () {
        if (!this.warmLoadPromise()) {
            this.setWarmLoadPromise(this.idb().promiseAsMap().then((map) => {
                this.setWarmMap(map);
                return map;
            }));
        }
        return this.warmLoadPromise();
    }

    /**
     * @description Releases the boot-time in-memory copy of the store.
     * Subsequent reads go back to per-key IndexedDB gets.
     * @category Data Management
     */
    releaseWarmMap () {
        this.setWarmMap(null);
        this.setWarmLoadPromise(null);
        return this;
    }

    /**
     * @description Sets the path for the SvHashCache.
     * @param {string} aString - The path to set.
     * @returns {SvHashCache} - The current SvHashCache instance.
     * @category Configuration
     */
    setPath (aString) {
        this.idb().setPath(aString);
        return this;
    }

    /**
     * @description Checks if a hash exists in the cache.
     * @param {string} hash - The hash to check.
     * @returns {Promise<boolean>} - A promise that resolves to true if the hash exists, false otherwise.
     * @category Query
     */
    promiseHasHash (hash) {
        if (this.warmMap()) {
            return Promise.resolve(this.warmMap().has(hash));
        }
        return this.idb().promiseHasKey(hash);
    }

    /**
     * @description Returns the count of items in the cache.
     * @returns {Promise<number>} - A promise that resolves to the number of items in the cache.
     * @category Query
     */
    async promiseCount () {
        return this.idb().promiseCount();
    }

    /**
     * @description Asserts that a value is valid.
     * @param {*} v - The value to check.
     * @throws {Error} Throws an error if the value is invalid.
     * @category Validation
     */
    assertValidValue (v) {
        if (typeof(v) !== "undefined") {
            if (typeof(v) === "string") {
                assert(v.length !== 0);
            } else {
                assert(v.byteLength !== 0);
            }
        }
    }

    /**
     * @description Checks if a key exists in the cache.
     * @param {string} key - The key to check.
     * @returns {Promise<boolean>} - A promise that resolves to true if the key exists, false otherwise.
     * @category Query
     */
    promiseHasKey (key) {
        //console.log(this.logPrefix(), "promiseHasKey(" + key + ")");
        if (this.warmMap()) {
            return Promise.resolve(this.warmMap().has(key));
        }
        return this.idb().promiseHasKey(key);
    }

    /**
     * @description Returns all keys in the cache.
     * @returns {Promise<Array<string>>} - A promise that resolves to an array of all keys.
     * @category Query
     */
    promiseAllKeys () {
        if (this.warmMap()) {
            return Promise.resolve(Array.from(this.warmMap().keys()));
        }
        return this.idb().promiseAllKeys();
    }

    weakMapGet (hash) {
        if (this.weakMap()) {
            return this.weakMap().get(hash);
        }
        return undefined;
    }

    checkValidValue (data) {
        const validatorFunc = this.valueValidatorFunc();
        if (validatorFunc === null) {
            return true;
        }
        return validatorFunc(data);
    }

    /**
     * @description Retrieves the value for a given hash.
     * @param {string} hash - The hash to retrieve the value for.
     * @returns {Promise<*>} - A promise that resolves to the value associated with the hash.
     * @category Data Retrieval
     */
    async promiseAt (hash, optionalPathForDebugging) {
        const idb = this.idb();

        if (this.warmMap()) {
            const warmValue = this.warmMap().get(hash);
            if (warmValue !== undefined) {
                return warmValue;
            }
            // The warm map is a full copy of the store, so a miss is a miss —
            // no need to fall through to a per-key IndexedDB get.
            return undefined;
        }

        const weakMapValue = this.weakMapGet(hash);
        if (weakMapValue !== undefined) {
            return weakMapValue;
        }

        const data = await idb.promiseAt(hash);
        if (data === undefined) {
            return undefined;
        }

        // In Node.js, check for Buffer as well as ArrayBuffer
        const typeIsOk = this.checkValidValue(data);

        if (!typeIsOk) {
            console.warn("data is a " + typeof(data) + ", but we except a string, ArrayBuffer, or Buffer. Path: " + optionalPathForDebugging);
            if (typeof(data) === "object") {
                console.warn("data is an object: " + JSON.stringify(data, null, 2));
            }
            return undefined;
        }

        // Convert Buffer to ArrayBuffer if needed
        let returnData = data;
        if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
            returnData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }

        // Values are content-addressed and verified when written, so re-hashing
        // every read buys nothing but CPU (it cost a full SHA-256 of every boot
        // resource, every launch). Kept as a debugging check only.
        if (this.isDebugging()) {
            const dataHash = await this.promiseHashKeyForData(returnData);
            if (dataHash !== hash) {
                throw new Error("hash key does not match hash of value");
            }
        }

        return returnData;
    }

    /**
     * @description Stores a value in the cache with the given hash.
     * @param {string} hash - The hash to use as the key.
     * @param {*} data - The data to store.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @throws {Error} Throws an error if the hash key does not match the hash of the value.
     * @category Data Storage
     */
    async promiseAtPut (hash, data) {
        this.assertValidValue(data);

        const hasHash = await this.promiseHasHash(hash);

        if (hasHash) {
            // Content-addressed: an existing key means the value is already
            // correct (verified when written), so no point in writing again.
            // The old read-back-and-re-hash corruption check cost a get + a
            // SHA-256 per entry; kept as a debugging check only.
            if (this.isDebugging()) {
                const existingData = await this.idb().promiseAt(hash);
                const existingHash = await this.promiseHashKeyForData(existingData);
                if (existingHash !== hash) {
                    console.warn(`Corrupted cache entry detected for key ${hash} - removing`);
                    await this.promiseRemoveAt(hash);
                    // Continue to re-add with correct hash
                } else {
                    return;
                }
            } else {
                return;
            }
        }

        // verify key before writing
        const dataHash = await this.promiseHashKeyForData(data);

        if (hash !== dataHash) {
            console.error(`Hash mismatch: expected ${hash}, got ${dataHash}`);
            console.warn("This typically happens when one of the following occurs:");
            console.warn("1. the hash algorithm has changed (e.g. package script hash is different than the hash algorithm used here)");
            console.warn("2. the package build script was not run or the package was notproperly deployed");
            console.warn("Please clear your browser cache: DevTools > Application > Storage > Clear site data");
            const error = new Error("hash key does not match hash of value - please clear browser cache");
            //debugger;
            let testHash = await this.promiseHashKeyForData(hash);
            console.log("testHash", testHash);
            error.shouldClearBrowserCache = true;
            throw error;
        }

        if (this.isDebugging()) {
            console.log(this.logPrefix(), "SvHashCache atPut ", hash);
        }

        const result = await this.idb().promiseAtPut(hash, data);
        if (this.warmMap()) {
            this.warmMap().set(hash, data);
        }
        if (this.weakMap()) {
            this.weakMap().set(hash, data);
        }
        return result;
    }

    /**
     * @description Writes many hash/value pairs in a single readwrite transaction,
     * skipping per-entry existence checks and hash verification. Callers pass
     * content whose keys were produced by the build's hasher (e.g. the CAM bundle),
     * so per-entry re-hashing here would just repeat the build's work. Existing
     * keys are overwritten with identical content (content-addressed), which is
     * cheaper than checking for them first.
     * @param {Map<string, string|ArrayBuffer>} entriesMap - hash → data.
     * @returns {Promise<void>}
     * @category Data Storage
     */
    async promiseBulkPut (entriesMap) {
        if (entriesMap.size === 0) {
            return;
        }

        await this.idb().promiseOpen();
        const tx = this.idb().newTransaction();
        tx.begin();
        entriesMap.forEach((data, hash) => {
            this.assertValidValue(data);
            tx.atUpdate(hash, data);
        });
        await tx.promiseCommit();

        if (this.warmMap()) {
            entriesMap.forEach((data, hash) => this.warmMap().set(hash, data));
        }
        if (this.weakMap()) {
            entriesMap.forEach((data, hash) => this.weakMap().set(hash, data));
        }
    }

    /**
     * @description Generates a hash key for the given data.
     * @param {string|Uint8Array} data - The data to hash.
     * @returns {Promise<string>} - A promise that resolves to the hash key.
     * @category Utility
     */
    async promiseHashKeyForData (data) {
        if (typeof(data) === "string") {
            data = new TextEncoder("utf-8").encode(data);
        }

        // Convert Buffer to ArrayBuffer for consistent hashing
        if (typeof Buffer !== "undefined" && Buffer.isBuffer(data)) {
            data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }

        // check if data is a valid type
        assert(data instanceof Uint8Array || data instanceof ArrayBuffer, "data is not a valid type");

        // Use the unified asyncHexSha256 method from ArrayBuffer_ideal
        return await data.asyncHexSha256();
    }

    /**
     * @description Clears all data from the cache.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @category Data Management
     */
    async promiseClear () {
        if (this.warmLoadPromise()) {
            // settle an in-flight warm load first so it can't populate the
            // warm map with pre-clear content after we wipe the store
            await this.warmLoadPromise();
        }
        const result = await this.idb().promiseClear();
        if (this.warmMap()) {
            this.warmMap().clear();
        }
        if (this.weakMap()) {
            this.weakMap().clear();
        }
        return result;
    }

    /**
     * @description Removes all invalid records from the cache.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @category Data Management
     */
    async removeInvalidRecords () {
        const keys = await this.idb().promiseAllKeys();
        await keys.promiseSerialForEach(async (key) => {
            await this.promiseVerifyOrDeleteKey(key);
        });
    }

    /**
     * @description Removes a key from the cache.
     * @param {string} key - The key to remove.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @category Data Management
     */
    async promiseRemoveAt (key) {
        const result = await this.idb().promiseRemoveAt(key);
        if (this.warmMap()) {
            this.warmMap().delete(key);
        }
        if (this.weakMap()) {
            this.weakMap().delete(key);
        }
        return result;
    }

    /**
     * @async
     * @description Verifies a key and deletes it if invalid.
     * @param {string} key - The key to verify.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @category Data Management
     */
    async promiseVerifyOrDeleteKey (key) {
        const value = this.idb().promiseAt(key);
        const hashKey = this.promiseHashKeyForData(value);
        if (key !== hashKey) {
            await this.promiseRemoveAt(key);
        }
    }

    async promiseRemoveKeysNotInSet (keepKeySet) {
        const currentKeys = await this.promiseAllKeys();
        const currentKeysSet = new Set(currentKeys);
        // Use a more compatible approach than Set.difference()
        const keysToRemove = new Set([...currentKeysSet].filter(x => !keepKeySet.has(x)));

        if (keysToRemove.size === 0) {
            return;
        }

        const tx = this.idb().newTransaction();
        tx.begin(); // Initialize the actual IndexedDB transaction
        keysToRemove.forEach((key) => {
            tx.removeAt(key);
        });
        await tx.promiseCommit();

        if (this.warmMap()) {
            keysToRemove.forEach((key) => this.warmMap().delete(key));
        }
        if (this.weakMap()) {
            keysToRemove.forEach((key) => this.weakMap().delete(key));
        }
    }

    // -- url support ---

    /**
     * @description Retrieves content for a given hash or URL.
     * @param {string} hash - The hash to check.
     * @param {string} url - The URL to load from if the hash is not found.
     * @returns {Promise<*>} - A promise that resolves to the content.
     * @throws {Error} Throws an error if the hash is not provided or if the URL cannot be loaded.
     * @category Data Retrieval
     */
    async promiseContentForHashOrUrl (hash, url) {
        if (!hash) {
            throw new Error("this API requires a hash");
        }

        const cachedData = await this.promiseAt(hash, url);
        if (typeof(cachedData) !== "undefined") {
            // if we have the value, return it
            this.assertValidValue(cachedData);
            return cachedData;
        }
        console.log(this.logPrefix(), "no hachcache key '" + hash + "' '" + url + "'");
        // otherwise load it from url, store it, and then return it
        return this.promiseLoadUrlAndWriteToHash(url, hash);
    }

    /**
     * @description Loads content from a URL and writes it to the cache with the given hash.
     * @param {string} url - The URL to load from.
     * @param {string} hash - The hash to use as the key.
     * @returns {Promise<*>} - A promise that resolves to the loaded data.
     * @throws {Error} Throws an error if the URL cannot be loaded.
     * @category Data Retrieval
     */
    async promiseLoadUrlAndWriteToHash (url, hash) {
        const resource = await SvUrlResource.with(url).promiseLoad();
        const data = resource.data();
        if (data === undefined) {
            throw new Error("unable to load url: '" + url + "'");
        } else {
            console.log(this.logPrefix(), "SvHashCache loaded url: '" + url + "'");
            await this.promiseAtPut(hash, data);
            return data;
        }
    }

}.initThisClass());
