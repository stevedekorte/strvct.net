"use strict";

/**
 * @module library.storage
 */

/**
 * An async Map wrapper for IndexedDB.
 *
 * @class PersistentAsyncMap
 * @extends ProtoClass
 * @classdesc Provides a persistent asynchronous map implementation using IndexedDB.
 */
(class PersistentAsyncMap extends ProtoClass {

    /**
     * Initialize prototype slots for the PersistentAsyncMap.
     * @returns {undefined}
     */
    initPrototypeSlots () {
        /**
         * @member {string} name - The name of the persistent async dictionary.
         * @category Configuration
         */
        {
            const slot = this.newSlot("name", "PersistentAsyncDictionary");
            slot.setSlotType("String");
        }

        /**
         * @member {SvIndexedDbFolder} idb - The SvIndexedDbFolder instance.
         * @category Storage
         */
        {
            const slot = this.newSlot("idb", null);
            slot.setSlotType("SvIndexedDbFolder");
        }
    }

    /**
     * Initialize the PersistentAsyncMap instance.
     * @returns {undefined}
     * @category Initialization
     */
    init () {
        super.init();
        this.setIdb(SvIndexedDbFolder.clone());
        this.setIsDebugging(false);
    }

    /**
     * Assert that the map is accessible and open.
     * @throws {Error} If the map is not open.
     * @returns {undefined}
     * @category Validation
     */
    assertAccessible () {
        super.assertAccessible();
        this.assertOpen();
    }

    /**
     * Check if the map is open.
     * @returns {boolean} True if the map is open, false otherwise.
     * @category State
     */
    isOpen () {
        return this.idb().isOpen();
    }

    /**
     * Synchronous open method (not supported).
     * @throws {Error} Always throws an error as synchronous open is not supported.
     * @category Operations
     */
    open () {
        throw new Error(this.svType() + " synchronous open not supported");
    }

    /**
     * Close the map if it's open.
     * @returns {PersistentAsyncMap} The instance for method chaining.
     * @category Operations
     */
    close () {
        if (this.isOpen()) {
            this.idb().close();
            this.setIsOpen(false);
        }
        return this;
    }

    /**
     * Asynchronously open the map.
     * @returns {Promise<void>}
     * @category Operations
     */
    async promiseOpen () {
        if (!this.isOpen()) {
            this.idb().setPath(this.name());
        }
        await this.idb().promiseOpen();
        await this.promiseOnOpen() ;
    }

    /**
     * Perform actions after opening the map (can be overridden).
     * @returns {Promise<void>}
     * @category Lifecycle
     */
    promiseOnOpen () {
        //return this.promiseClear()
    }

    /**
     * Assert that the map is open.
     * @throws {Error} If the map is not open.
     * @returns {PersistentAsyncMap} The instance for method chaining.
     * @category Validation
     */
    assertOpen () {
        assert(this.isOpen());
        return this;
    }

    /**
     * Clear all data in the map.
     * @returns {Promise<void>}
     * @category Data Manipulation
     */
    async promiseClear () {
        await this.promiseOpen();
        await this.idb().promiseClear();
    }

    /**
     * Get all keys in the map.
     * @returns {Promise<Array>} A promise that resolves with an array of all keys.
     * @category Data Retrieval
     */
    async promiseAllKeys () {
        await this.promiseOpen();
        return this.idb().promiseAllKeys();
    }

    /**
     * Check if a key exists in the map.
     * @param {*} key - The key to check.
     * @returns {Promise<boolean>} A promise that resolves with true if the key exists, false otherwise.
     * @category Data Retrieval
     */
    async promiseHasKey (key) {
        await this.promiseOpen();
        return this.idb().promiseHasKey(key);
    }

    /**
     * Get the value associated with a key.
     * @param {*} key - The key to retrieve the value for.
     * @returns {Promise<*>} A promise that resolves with the value, or undefined if the key doesn't exist.
     * @category Data Retrieval
     */
    async promiseAt (key) {
        await this.promiseOpen();
        return this.idb().promiseAt(key);
    }

    /**
     * Set a value for a key in the map.
     * @param {*} key - The key to set.
     * @param {*} value - The value to set. If undefined, the key will be deleted.
     * @returns {Promise<void>}
     * @category Data Manipulation
     */
    async promiseAtPut (key, value) {
        await this.promiseOpen();
        return this.idb().promiseAtPut(key, value);
    }

    /**
     * Remove a key from the map.
     * @param {*} key - The key to remove.
     * @returns {Promise<void>}
     * @category Data Manipulation
     */
    async promiseRemoveAt (key) {
        await this.promiseOpen();
        return this.idb().promiseRemoveAt(key);
    }

}.initThisClass());
