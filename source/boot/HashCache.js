/**
 * @module boot.HashCache
 */

"use strict";

/**
 * @class HashCache
 * @extends Base
 * @classdesc An key/value db where the keys are hashes of the values.
 * There are APIs to help with using as a url load cache.
 */
(class HashCache extends Base {
    /**
     * @description Initializes the prototype slots for the HashCache class.
     */
    initPrototypeSlots () {
        /**
         * @property {IndexedDBFolder|null} idb - The IndexedDBFolder instance used for storage.
         */
        this.newSlot("idb", null);
    }
  
    /**
     * @description Initializes the prototype for the HashCache class.
     */
    initPrototype () {
    }

    /**
     * @description Initializes the HashCache instance.
     */
    init () {
        super.init()
        this.setIdb(IndexedDBFolder.clone())
        this.setIsDebugging(false)
        this.idb().setIsDebugging(false)
        this.setPath("sharedHashCache")
    }

    /**
     * @description Sets the path for the HashCache.
     * @param {string} aString - The path to set.
     * @returns {HashCache} - The current HashCache instance.
     */
    setPath (aString) {
        this.idb().setPath(aString)
        return this
    }

    /**
     * @description Checks if a hash exists in the cache.
     * @param {string} hash - The hash to check.
     * @returns {Promise<boolean>} - A promise that resolves to true if the hash exists, false otherwise.
     */
    promiseHasHash (hash) {
        return this.idb().promiseHasKey(hash)
    }

    /**
     * @description Returns the count of items in the cache.
     * @returns {Promise<number>} - A promise that resolves to the number of items in the cache.
     */
    async promiseCount () {
        //debugger;
        return this.idb().promiseCount();
    }

    /**
     * @description Asserts that a value is valid.
     * @param {*} v - The value to check.
     * @throws {Error} Throws an error if the value is invalid.
     */
    assertValidValue (v) {
        if (typeof(v) !== "undefined") {
            if (typeof(v) === "string") {
                assert(v.length !== 0)
            } else {
                assert(v.byteLength !== 0)
            }
        }
    }

    /**
     * @description Checks if a key exists in the cache.
     * @param {string} key - The key to check.
     * @returns {Promise<boolean>} - A promise that resolves to true if the key exists, false otherwise.
     */
    promiseHasKey (key) {
        //console.log("promiseHasKey(" + key + ")");
        return this.idb().promiseHasKey(key)
    }

    /**
     * @description Retrieves content for a given hash or URL.
     * @param {string} hash - The hash to check.
     * @param {string} url - The URL to load from if the hash is not found.
     * @returns {Promise<*>} - A promise that resolves to the content.
     * @throws {Error} Throws an error if the hash is not provided or if the URL cannot be loaded.
     */
    async promiseContentForHashOrUrl (hash, url) {
        if (!hash) {
            throw new Error("this API requires a hash");
        }

        const dataFromDb = await this.idb().promiseAt(hash);
        if (typeof(v) !== "undefined") {
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
     */
    async promiseLoadUrlAndWriteToHash (url, hash) {
        const resource = await UrlResource.with(url).promiseLoad();
        const data = resource.data();
        if (data === undefined) {
            throw new Error("unable to load url: '" + url + "'");
        } else {
            console.log("HashCache loaded url: '" + url + "'");
            debugger;
            await this.promiseAtPut(hash, data);
            return data;
        }
    }

    /**
     * @description Retrieves the value for a given hash.
     * @param {string} hash - The hash to retrieve the value for.
     * @returns {Promise<*>} - A promise that resolves to the value associated with the hash.
     */
    promiseAt (hash) {
        return this.idb().promiseAt(hash);
    }

    /**
     * @description Stores a value in the cache with the given hash.
     * @param {string} hash - The hash to use as the key.
     * @param {*} data - The data to store.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     * @throws {Error} Throws an error if the hash key does not match the hash of the value.
     */
    async promiseAtPut (hash, data) {
        this.assertValidValue(data);

        const hasHash = await this.promiseHasHash(hash);

        if (hasHash) {
            // we have this key so no point in writing (as same key always means same value)
            return;
        }

        // verify key before writing
        const dataHash = await this.promiseHashKeyForData(data);

        if (hash !== dataHash) {
            throw new Error("hash key does not match hash of value");
        }

        this.debugLog("HashCache atPut ", hash);
        return this.idb().promiseAtPut(hash, data);
    }

    /**
     * @description Generates a hash key for the given data.
     * @param {string|Uint8Array} data - The data to hash.
     * @returns {Promise<string>} - A promise that resolves to the hash key.
     */
    async promiseHashKeyForData (data) {
        if (typeof(data) === "string") {
            data = new TextEncoder("utf-8").encode(data);    
        }

        const hashArrayBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashString = btoa(String.fromCharCode.apply(null, new Uint8Array(hashArrayBuffer)));
        return hashString;
    }

    /**
     * @description Clears all data from the cache.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     */
    promiseClear () {
        //debugger
        return this.idb().promiseClear()
    }

    /**
     * @description Removes all invalid records from the cache.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     */
    async removeInvalidRecords () {
        const keys = await this.idb().promiseAllKeys();
        let promise = null;
        keys.forEach(async (key) => {
            await this.promiseVerifyOrDeleteKey(key);
        });
    }

    /**
     * @async
     * @description Verifies a key and deletes it if invalid.
     * @param {string} key - The key to verify.
     * @returns {Promise<void>} - A promise that resolves when the operation is complete.
     */
    async promiseVerifyOrDeleteKey (key) {
        const value = this.idb().promiseAt(key);
        const hashKey = this.promiseHashKeyForData(value);
        if (key !== hashKey) {
            await this.idb().promiseRemoveAt(key);
        }
    }

}.initThisClass());