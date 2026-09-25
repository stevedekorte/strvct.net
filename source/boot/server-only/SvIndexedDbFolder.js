"use strict";

/**
 * @module boot/server-only
 */

// Load Level at module level - use the Node.js implementation directly
// We use classic-level directly to avoid browser/node detection issues
const { ClassicLevel } = require("classic-level");

// One LevelDB handle per database directory, shared by every folder that
// names it. IndexedDB lets many connections open one database; LevelDB allows
// only one handle per directory per process ("LOCK: already held by process"),
// so folders with the same path share a handle, reference-counted.
// dbPath -> { promise: Promise<ClassicLevel>, refCount }
const sharedLevelDbs = new Map();

async function asyncOpenLevelDb (dbPath) {
    const fs = require("fs").promises;
    const path = require("path");
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    // IMPORTANT: 'buffer' encoding to properly handle binary data
    const levelDb = new ClassicLevel(dbPath, { createIfMissing: true, errorIfExists: false, valueEncoding: "buffer" });
    await levelDb.open();
    return levelDb;
}

function acquireSharedLevelDb (dbPath) {
    let entry = sharedLevelDbs.get(dbPath);
    if (!entry) {
        entry = { refCount: 0, promise: asyncOpenLevelDb(dbPath) };
        sharedLevelDbs.set(dbPath, entry);
        entry.promise.catch(() => sharedLevelDbs.delete(dbPath));
    }
    entry.refCount++;
    return entry.promise;
}

async function releaseSharedLevelDb (dbPath) {
    const entry = sharedLevelDbs.get(dbPath);
    if (!entry || --entry.refCount > 0) {
        return;
    }
    sharedLevelDbs.delete(dbPath);
    await (await entry.promise).close();
}

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
        this.newSlot("promiseForOpen", null);
        this.newSlot("lastTx", null);
        this.newSlot("version", 2);

        // Node.js specific slots
        /**
         * @member {object} levelDb - The LevelDB database instance.
         */
        this.newSlot("levelDb", null);

        /**
         * @member {string} dataDir - Base directory for database files
         * (SV_LEVELDB_DIR overrides, e.g. a per-process scratch directory).
         */
        this.newSlot("dataDir", process.env.SV_LEVELDB_DIR || "./data/leveldb/");
    }

    initPrototype () {
        this.setIsDebugging(false);
    }

    /**
     * Override to indicate IndexedDB availability (simulated via LevelDB).
     * @returns {boolean} - True if LevelDB can be loaded.
     */
    hasIndexedDB () {
        return true; // We simulate IndexedDB with LevelDB
    }

    /**
     * Convert the path to a filesystem-safe directory name.
     * @returns {string} - The sanitized path for filesystem use.
     */
    dbPath () {
        const path = require("path");
        // Store names are rooted ("/", "/blobs"); strip the leading slashes so
        // path.resolve keeps the database inside dataDir instead of treating
        // the name as an absolute path (the root store resolved to "/").
        const relativeName = this.path().replace(/^\/+/, "") || "root";
        const safePath = relativeName.replace(/[^a-zA-Z0-9-_/]/g, "_");
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
            await SvIndexedDbFolder.promisePersistence();
            this.setPromiseForOpen(this.newPromiseOpen());
        }
        return this.promiseForOpen();
    }

    /**
     * Returns a promise for persistence (always resolves in Node.js).
     * @returns {Promise} - A promise that resolves to true.
     */
    static promisePersistence () {
        return true;
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

        try {
            const levelDb = await acquireSharedLevelDb(dbPath);

            // Store the INSTANCE in slots, not the class
            this.setLevelDb(levelDb);  // This is fine - it's an instance
            this.setDb(levelDb);       // This is fine - it's an instance

            if (this.isDebugging()) console.log(this.logPrefix(), `Opened LevelDB at ${dbPath}`);
            return Promise.resolve();
        } catch (error) {
            console.error("**ERROR**:", this.logPrefix(), `Failed to open LevelDB at ${dbPath}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Closes the database.
     * @returns {SvIndexedDbFolder} - Returns this instance.
     */
    async close () {
        if (this.isOpen() && this.levelDb()) {
            this.setLevelDb(null); // drop our reference; the last folder on this path closes the handle
            await releaseSharedLevelDb(this.dbPath());
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
        return this.levelDb() !== null && this.levelDb().status === "open";
    }

    /**
     * Retrieves a value for a given key from the database.
     * @async
     * @param {string} key - The key to retrieve.
     * @returns {Promise<*>} - A promise that resolves to the value associated with the key.
     */
    /**
     * Decodes a stored LevelDB value back to its original form.
     * LevelDB with 'buffer' encoding always returns Buffers; strings were
     * written with a 4-byte marker prefix, binary data as raw bytes.
     * @param {*} value - The raw value from LevelDB.
     * @returns {string|ArrayBuffer|*} - The decoded value.
     */
    decodeStoredValue (value) {
        if (Buffer.isBuffer(value)) {
            // Check if it's a string (starts with our string marker)
            if (value.length >= 4 && value[0] === 0xFF && value[1] === 0xFE && value[2] === 0xFD && value[3] === 0xFC) {
                // It's a string - convert back
                return value.slice(4).toString("utf8");
            } else {
                // It's binary data - convert Buffer to ArrayBuffer
                return value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
            }
        }
        return value;
    }

    async promiseAt (key) {
        await this.promiseOpen();

        // ClassicLevel returns undefined for non-existent keys (no error thrown)
        const value = await this.levelDb().get(key);

        if (value === undefined) {
            return undefined;
        }

        return this.decodeStoredValue(value);
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
        while (await iterator.next()) {
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
            // decode like promiseAt does — without this, a reopened store hands
            // back raw marker-prefixed Buffers instead of the stored strings
            map.set(key, this.decodeStoredValue(value));
        }
        return map;
    }

    /**
     * Approximate stored size: the byte length of every key and value. The
     * browser folder reports its database's estimate; callers only log it.
     * @async
     * @returns {Promise<number>} - Total bytes.
     */
    async asyncTotalSize () {
        await this.promiseOpen();
        let total = 0;
        for await (const [key, value] of this.levelDb().iterator()) {
            total += Buffer.byteLength(String(key)) + (Buffer.isBuffer(value) ? value.length : Buffer.byteLength(String(value)));
        }
        return total;
    }

    /**
     * Clears all data from the database.
     * @async
     * @returns {Promise} - A promise that resolves when the database is cleared.
     */
    async promiseClear () {
        await this.promiseOpen();

        await this.levelDb().clear();
        if (this.isDebugging()) console.log(this.logPrefix(), "Database cleared");
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

        const fs = require("fs").promises;
        const dbPath = this.dbPath();

        try {
            await fs.rm(dbPath, { recursive: true, force: true });
            if (this.isDebugging()) console.log(this.logPrefix(), `Deleted database at ${dbPath}`);
        } catch (error) {
            console.error("**ERROR**:", this.logPrefix(), `Failed to delete database at ${dbPath}: ${error.message}`);
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

        if (this.isDebugging()) console.log(this.logPrefix(), this.path() + " promiseNewTx");

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
        if (typeof value === "string") {
            // Add a marker for strings so we can distinguish them from binary data
            const stringBuffer = Buffer.from(value, "utf8");
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
            const stringBuffer = Buffer.from(jsonStr, "utf8");
            storeValue = Buffer.concat([Buffer.from([0xFF, 0xFE, 0xFD, 0xFC]), stringBuffer]);
        }

        // For simple put operations, we can use LevelDB directly
        // For consistency with IndexedDB behavior, we'll use transactions for complex operations
        try {
            await this.levelDb().put(key, storeValue);
            return Promise.resolve();
        } catch (error) {
            console.error("**ERROR**:", this.logPrefix(), `Failed to put key ${key}: ${error.message}`);
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
            if (error.code !== "LEVEL_NOT_FOUND") {
                console.error("**ERROR**:", this.logPrefix(), `Failed to remove key ${key}: ${error.message}`);
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
