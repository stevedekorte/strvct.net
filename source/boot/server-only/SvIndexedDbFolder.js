"use strict";

/**
 * @module boot/server-only
 */

// Load Level at module level - use the Node.js implementation directly
// We use classic-level directly to avoid browser/node detection issues
const { ClassicLevel } = require('classic-level');

/**
 * @class SvIndexedDbFolder
 * @extends SvIndexedDbFolder
 * @classdesc Node.js implementation of SvIndexedDbFolder using LevelDB as the backend storage.
 * This category provides server-side compatibility for the IndexedDB abstraction.
 */
(class SvIndexedDbFolder extends SvBase {
    
    /**
     * Initializes the prototype slots for the Node.js implementation.
     */
    init () {
        super.init();
        return this;
    }
    
    initPrototypeSlots () {
        // Base slots from original implementation
        this.newSlot("path", "/");
        this.newSlot("pathSeparator", "/");
        this.newSlot("db", null);
        this.newSlot("hasPermission", true); // Always true in Node.js
        this.newSlot("promiseForPersistence", null);
        this.newSlot("promiseForOpen", null);
        this.newSlot("lastTx", null);
        this.newSlot("version", 2);
        
        // Node.js specific slots
        /**
         * @member {object} levelDb - The LevelDB database instance.
         */
        this.newSlot("levelDb", null);
        
        /**
         * @member {string} dataDir - Base directory for database files.
         */
        this.newSlot("dataDir", "./data/leveldb/");
        
        /**
         * @member {boolean} isNodeEnvironment - Flag to identify Node.js environment.
         */
        this.newSlot("isNodeEnvironment", true);
    }
    
    initPrototype () {
        this.setIsDebugging(false);
    }
    
    /**
     * Override to detect Node.js environment.
     * @returns {boolean} - Always true for this implementation.
     */
    isOnNodeJs () {
        return true;
    }
    
    /**
     * Override to indicate IndexedDB availability (simulated via LevelDB).
     * @returns {boolean} - True if LevelDB can be loaded.
     */
    hasIndexedDB () {
        return true; // We simulate IndexedDB with LevelDB
    }
    
    /**
     * Override to indicate Storage API availability.
     * @returns {boolean} - Always true in Node.js (no storage pressure).
     */
    hasStorageApi () {
        return true; // No storage pressure in Node.js
    }
    
    
    /**
     * Convert the path to a filesystem-safe directory name.
     * @returns {string} - The sanitized path for filesystem use.
     */
    dbPath () {
        const path = require('path');
        const safePath = this.path().replace(/[^a-zA-Z0-9-_/]/g, '_');
        // Always use absolute paths to avoid ambiguity
        const absolutePath = path.resolve(this.dataDir(), safePath);
        return absolutePath;
    }
    
    /**
     * Returns a promise to open the database.
     * @async
     * @returns {Promise} - A promise that resolves when the database is opened.
     */
    async promiseOpen () {
        if (!this.promiseForOpen()) {
            await this.promisePersistence();
            this.setPromiseForOpen(this.newPromiseOpen());
        }
        return this.promiseForOpen();
    }
    
    /**
     * Returns a promise for persistence (always resolves in Node.js).
     * @returns {Promise} - A promise that resolves to true.
     */
    promisePersistence () {
        if (!this.promiseForPersistence()) {
            this.setPromiseForPersistence(Promise.resolve(true));
        }
        return this.promiseForPersistence();
    }
    
    /**
     * Gets the store name.
     * @returns {string} - The store name (same as path).
     */
    storeName () {
        return this.path();
    }
    
    /**
     * Sets the path of the folder.
     * @param {string} aString - The new path to set.
     * @returns {SvIndexedDbFolder} - Returns this instance.
     */
    setPath (aString) {
        if (this._path !== aString) {
            assert(!this.isOpen(), "can't change the path on an open SvIndexedDbFolder instance");
            this._path = aString;
        }
        return this;
    }
    
    /**
     * Creates a new promise to open the database.
     * @returns {Promise} - A promise that resolves when the database is opened.
     */
    async newPromiseOpen () {
        const dbPath = this.dbPath();
        if (this.isOpen()) {
            return Promise.resolve();
        }
        
        // Ensure the data directory exists
        const fs = require('fs').promises;
        const path = require('path');
        const dirPath = path.dirname(dbPath);
        await fs.mkdir(dirPath, { recursive: true });
        
        try {
            // Create the ClassicLevel instance - this is what we'll store
            // Use createIfMissing and errorIfExists options for clean database creation
            // IMPORTANT: Use 'buffer' encoding to properly handle binary data
            const levelDb = new ClassicLevel(dbPath, {
                createIfMissing: true,
                errorIfExists: false,
                valueEncoding: 'buffer'  // Store all values as buffers for proper binary support
            });
            
            // Open is automatic in ClassicLevel v10+, but we'll explicitly open anyway
            await levelDb.open();
            
            // Store the INSTANCE in slots, not the class
            this.setLevelDb(levelDb);  // This is fine - it's an instance
            this.setDb(levelDb);       // This is fine - it's an instance
            
            this.logDebug(`Opened LevelDB at ${dbPath}`);
            return Promise.resolve();
        } catch (error) {
            this.logError(`Failed to open LevelDB at ${dbPath}: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Closes the database.
     * @returns {SvIndexedDbFolder} - Returns this instance.
     */
    async close () {
        if (this.isOpen() && this.levelDb()) {
            await this.levelDb().close();
            this.setLevelDb(null);
            this.setDb(null);
            this.setPromiseForOpen(null);
        }
        return this;
    }
    
    /**
     * Checks if the database is open.
     * @returns {boolean} - True if the database is open, false otherwise.
     */
    isOpen () {
        return this.levelDb() !== null && this.levelDb().status === 'open';
    }
    
    /**
     * Retrieves a value for a given key from the database.
     * @async
     * @param {string} key - The key to retrieve.
     * @returns {Promise<*>} - A promise that resolves to the value associated with the key.
     */
    async promiseAt (key) {
        await this.promiseOpen();
        
        // ClassicLevel returns undefined for non-existent keys (no error thrown)
        const value = await this.levelDb().get(key);
        
        if (value === undefined) {
            return undefined;
        }
        
        // LevelDB with 'buffer' encoding always returns Buffers
        if (Buffer.isBuffer(value)) {
            // Check if it's a string (starts with our string marker)
            if (value.length >= 4 && value[0] === 0xFF && value[1] === 0xFE && value[2] === 0xFD && value[3] === 0xFC) {
                // It's a string - convert back
                return value.slice(4).toString('utf8');
            } else {
                // It's binary data - convert Buffer to ArrayBuffer
                return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
            }
        }
        
        return value;
    }
    
    /**
     * Checks if a key exists in the database.
     * @async
     * @param {string} key - The key to check.
     * @returns {Promise<boolean>} - A promise that resolves to true if the key exists, false otherwise.
     */
    async promiseHasKey (key) {
        await this.promiseOpen();
        
        // ClassicLevel returns undefined for non-existent keys (no error thrown)
        const value = await this.levelDb().get(key);
        return value !== undefined;
    }
    
    /**
     * Counts the number of entries in the database or for a specific key.
     * @async
     * @param {string} [optionalKey] - Optional key to count.
     * @returns {Promise<number>} - A promise that resolves to the count.
     */
    async promiseCount (optionalKey) {
        await this.promiseOpen();
        
        if (optionalKey) {
            const hasKey = await this.promiseHasKey(optionalKey);
            return hasKey ? 1 : 0;
        }
        
        // Count all keys
        let count = 0;
        const iterator = this.levelDb().keys();
        for await (const key of iterator) {
            count++;
        }
        return count;
    }
    
    /**
     * Retrieves all keys from the database.
     * @async
     * @returns {Promise<Array>} - A promise that resolves to an array of all keys.
     */
    async promiseAllKeys () {
        await this.promiseOpen();
        
        const keys = [];
        const iterator = this.levelDb().keys();
        for await (const key of iterator) {
            keys.push(key);
        }
        return keys;
    }
    
    /**
     * Retrieves all key-value pairs from the database as a Map.
     * @async
     * @returns {Promise<Map>} - A promise that resolves to a Map of all key-value pairs.
     */
    async promiseAsMap () {
        await this.promiseOpen();
        
        const map = new Map();
        const iterator = this.levelDb().iterator();
        for await (const [key, value] of iterator) {
            map.set(key, value);
        }
        return map;
    }
    
    /**
     * Clears all data from the database.
     * @async
     * @returns {Promise} - A promise that resolves when the database is cleared.
     */
    async promiseClear () {
        await this.promiseOpen();
        
        await this.levelDb().clear();
        this.logDebug("Database cleared");
        return Promise.resolve();
    }
    
    /**
     * Deletes the entire database.
     * @async
     * @returns {Promise} - A promise that resolves when the database is deleted.
     */
    async promiseDelete () {
        // Close the database first
        await this.close();
        
        const fs = require('fs').promises;
        const dbPath = this.dbPath();
        
        try {
            await fs.rm(dbPath, { recursive: true, force: true });
            this.logDebug(`Deleted database at ${dbPath}`);
        } catch (error) {
            this.logError(`Failed to delete database at ${dbPath}: ${error.message}`);
            throw error;
        }
        
        return Promise.resolve();
    }
    
    /**
     * Creates a new transaction object.
     * @async
     * @returns {Promise<SvIndexedDbTx>} - A promise that resolves to a new transaction object.
     */
    async promiseNewTx () {
        await this.promiseOpen();
        
        this.logDebug(this.path() + " promiseNewTx");
        
        // Note: Need to ensure SvIndexedDbTx_node is loaded
        const newTx = SvIndexedDbTx.clone().setDbFolder(this);
        this.setLastTx(newTx);
        return Promise.resolve(newTx);
    }
    
    /**
     * Private method to create a new transaction.
     * @private
     * @returns {SvIndexedDbTx} - A new transaction object.
     */
    privateNewTx () {
        const newTx = SvIndexedDbTx.clone().setDbFolder(this);
        this.setLastTx(newTx);
        return newTx;
    }
    
    /**
     * Puts a value at a specified key in the database.
     * @async
     * @param {string} key - The key to put the value at.
     * @param {*} value - The value to put.
     * @returns {Promise} - A promise that resolves when the value is put.
     */
    async promiseAtPut (key, value) {
        await this.promiseOpen();
        
        if (typeof(value) === "undefined") {
            return this.promiseRemoveAt(key);
        }
        
        // Convert values to Buffer for LevelDB storage
        let storeValue;
        if (typeof value === 'string') {
            // Add a marker for strings so we can distinguish them from binary data
            const stringBuffer = Buffer.from(value, 'utf8');
            storeValue = Buffer.concat([Buffer.from([0xFF, 0xFE, 0xFD, 0xFC]), stringBuffer]);
        } else if (value instanceof ArrayBuffer) {
            storeValue = Buffer.from(value);
        } else if (ArrayBuffer.isView(value)) {
            // Handle typed arrays (Uint8Array, etc.)
            storeValue = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
        } else if (Buffer.isBuffer(value)) {
            storeValue = value;
        } else {
            // Fallback - convert to JSON string
            const jsonStr = JSON.stringify(value);
            const stringBuffer = Buffer.from(jsonStr, 'utf8');
            storeValue = Buffer.concat([Buffer.from([0xFF, 0xFE, 0xFD, 0xFC]), stringBuffer]);
        }
        
        // For simple put operations, we can use LevelDB directly
        // For consistency with IndexedDB behavior, we'll use transactions for complex operations
        try {
            await this.levelDb().put(key, storeValue);
            return Promise.resolve();
        } catch (error) {
            this.logError(`Failed to put key ${key}: ${error.message}`);
            throw error;
        }
    }
    
    /**
     * Removes a value at a specified key in the database.
     * @async
     * @param {string} key - The key to remove the value at.
     * @returns {Promise} - A promise that resolves when the removal is complete.
     */
    async promiseRemoveAt (key) {
        await this.promiseOpen();
        
        try {
            await this.levelDb().del(key);
            return Promise.resolve();
        } catch (error) {
            // LevelDB doesn't error on deleting non-existent keys
            if (error.code !== 'LEVEL_NOT_FOUND') {
                this.logError(`Failed to remove key ${key}: ${error.message}`);
                throw error;
            }
            return Promise.resolve();
        }
    }
    
    /**
     * Creates a new transaction for batch operations.
     * @returns {SvIndexedDbTx} - A new transaction instance.
     */
    newTransaction () {
        // Make sure we load the transaction class if needed
        if (!SvGlobals.globals().SvIndexedDbTx) {
            console.error("SvIndexedDbTx not loaded!");
            throw new Error("SvIndexedDbTx class not available");
        }
        const tx = SvIndexedDbTx.clone();
        tx.setDbFolder(this);
        return tx;
    }
    
}.initThisClass());