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
        super.init()
        this.setIdb(SvIndexedDbFolder.clone());
        this.setIsDebugging(false);
        this.idb().setIsDebugging(false);
        this.setPath("sharedSvHashCache");
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
        return this.idb().promiseHasKey(hash)
    }

    /**
     * @description Returns the count of items in the cache.
     * @returns {Promise<number>} - A promise that resolves to the number of items in the cache.
     * @category Query
     */
    async promiseCount () {
        //debugger;
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
        //console.log("promiseHasKey(" + key + ")");
        return this.idb().promiseHasKey(key);
    }

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

        const dataFromDb = await this.idb().promiseAt(hash);
        if (typeof(dataFromDb) !== "undefined") {
            // if we have the value, return it
            this.assertValidValue(dataFromDb);
            return dataFromDb;
        }
        console.log("no hachcache key '" + hash + "' '" + url + "'");
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
            console.log("SvHashCache loaded url: '" + url + "'");
            debugger;
            await this.promiseAtPut(hash, data);
            return data;
        }
    }

    /**
     * @description Retrieves the value for a given hash.
     * @param {string} hash - The hash to retrieve the value for.
     * @returns {Promise<*>} - A promise that resolves to the value associated with the hash.
     * @category Data Retrieval
     */
    async promiseAt (hash, optionalPathForDebugging) {
        const idb = this.idb();
        const data = await idb.promiseAt(hash);
        if (data === undefined) {
            return undefined;
        }
        
        // In Node.js, check for Buffer as well as ArrayBuffer
        const typeIsOk = typeof(data) === "string" || 
                        data instanceof ArrayBuffer || 
                        (typeof Buffer !== 'undefined' && Buffer.isBuffer(data));

        if (!typeIsOk) {
            console.warn("data is a " + typeof(data) + ", but we except a string, ArrayBuffer, or Buffer. Path: " + optionalPathForDebugging);
            if (typeof(data) === "object") {
                console.warn("data is an object: " + JSON.stringify(data, null, 2));
            }
            debugger;

            return undefined;
        }
        
        // Convert Buffer to ArrayBuffer if needed
        let returnData = data;
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
            returnData = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }

        const dataHash = await this.promiseHashKeyForData(returnData);
        if (dataHash !== hash) {
            debugger;
            throw new Error("hash key does not match hash of value");
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
            // Check if the existing data actually matches
            const existingData = await this.idb().promiseAt(hash);
            const existingHash = await this.promiseHashKeyForData(existingData);
            if (existingHash !== hash) {
                console.warn(`Corrupted cache entry detected for key ${hash} - removing`);
                await this.idb().promiseRemoveAt(hash);
                // Continue to re-add with correct hash
            } else {
                // we have this key and it's valid, so no point in writing
                return;
            }
        }

        // verify key before writing
        const dataHash = await this.promiseHashKeyForData(data);

        if (hash !== dataHash) {
            console.error(`Hash mismatch: expected ${hash}, got ${dataHash}`);
            console.warn("This typically happens when the hash algorithm has changed.");
            console.warn("Please clear your browser cache: DevTools > Application > Storage > Clear site data");
            throw new Error("hash key does not match hash of value - please clear browser cache");
        }

        this.debugLog("SvHashCache atPut ", hash);
        return this.idb().promiseAtPut(hash, data);
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
        if (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)) {
            data = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        }

        // check if data is a valid type 
        assert(data.constructor.name === "Uint8Array" || data.constructor.name === "ArrayBuffer", "data is not a valid type");
        
        // Use the unified sha256 method from ArrayBuffer_ideal
        if (data.constructor.name === "Uint8Array") {
            return await data.sha256();
        } else {
            // ArrayBuffer
            return await data.sha256();
        }
    }

    /**
     * @description Clears all data from the cache.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @category Data Management
     */
    async promiseClear () {
        //debugger
        return await this.idb().promiseClear();
    }

    /**
     * @description Removes all invalid records from the cache.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @category Data Management
     */
    async removeInvalidRecords () {
        const keys = await this.idb().promiseAllKeys();
        //let promise = null;
        keys.forEach(async (key) => {
            await this.promiseVerifyOrDeleteKey(key);
        });
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
            await this.idb().promiseRemoveAt(key);
        }
    }

    async promiseRemoveKeysNotInSet (keepKeySet) {
        const currentKeys = await this.idb().promiseAllKeys();
        const currentKeysSet = new Set(currentKeys);
        // Use a more compatible approach than Set.difference()
        const keysToRemove = new Set([...currentKeysSet].filter(x => !keepKeySet.has(x)));

        const tx = this.idb().newTransaction();
        tx.begin(); // Initialize the actual IndexedDB transaction
        keysToRemove.forEach(async (key) => {
            tx.removeAt(key);
        });
        await tx.promiseCommit();
    }

}.initThisClass());