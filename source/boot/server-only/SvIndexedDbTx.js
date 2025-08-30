"use strict";

/**
 * @module boot/server-only
 */

/**
 * @class SvIndexedDbTx
 * @extends SvIndexedDbTx
 * @classdesc Node.js implementation of SvIndexedDbTx using LevelDB batch operations.
 * This category provides server-side transaction semantics matching IndexedDB.
 */
(class SvIndexedDbTx extends SvBase {
    
    /**
     * Initializes the prototype slots for the Node.js implementation.
     */
    initPrototypeSlots () {
        // Base slots from original implementation
        this.newSlot("dbFolder", null);
        this.newSlot("objectStore", null);
        this.newSlot("tx", null);
        this.newSlot("requests", []);
        this.newSlot("isCommitted", false);
        this.newSlot("isAborted", false);
        this.newSlot("isCompleted", false);
        this.newSlot("txRequestStack", null);
        this.newSlot("options", { "durability": "strict" });
        this.newSlot("txId", null);
        this.newSlot("promiseForCommit", null);
        this.newSlot("promiseForFinished", null);
        this.newSlot("timeoutInMs", 1000);
        
        // Node.js specific slots
        /**
         * @member {object} batch - The LevelDB batch operation object.
         */
        this.newSlot("batch", null);
        
        /**
         * @member {Map} operations - Map to track operations for consistency checking.
         */
        this.newSlot("operations", null);
        
        /**
         * @member {Set} addedKeys - Set to track keys added in this transaction.
         */
        this.newSlot("addedKeys", null);
        
        /**
         * @member {Set} deletedKeys - Set to track keys deleted in this transaction.
         */
        this.newSlot("deletedKeys", null);
    }
    
    initPrototype () {
    }
    
    /**
     * Initialize the instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setPromiseForFinished(Promise.clone());
        this.setOperations(new Map());
        this.setAddedKeys(new Set());
        this.setDeletedKeys(new Set());
        this.setBatch(null);  // Will be created on first operation
    }
    
    /**
     * Ensures a batch operation exists, creating one if needed.
     * @private
     * @returns {Object} The batch operation
     */
    ensureBatch () {
        if (!this.batch()) {
            const db = this.dbFolder().levelDb();
            assert(db, "Database not available");
            this.setBatch(db.batch());
        }
        return this.batch();
    }
    
    // Helper methods from base class
    
    assertNotCommitted () {
        assert(this.isCommitted() === false, "Transaction already committed");
    }
    
    assertValidKeyValue (key, value) {
        assert(typeof(key) === "string", "Key must be a string");
        assert(typeof(value) === "string" || (typeof(value) === "object" && value instanceof ArrayBuffer) || Buffer.isBuffer(value), 
            "Value must be string, ArrayBuffer or Buffer");
    }
    
    isFinished () {
        return this.isAborted() || this.isCompleted();
    }
    
    markCompleted () {
        assert(!this.isCompleted(), "Already completed");
        this.setIsCompleted(true);
        this.markResolved();
        return this;
    }
    
    markResolved () {
        this.promiseForFinished().callResolveFunc();
        return this;
    }
    
    markRejected (error) {
        this.promiseForFinished().callRejectFunc(error);
        return this;
    }
    
    /**
     * Get the LevelDB instance from the database folder.
     * @returns {object} - The LevelDB instance.
     */
    levelDb () {
        return this.dbFolder().levelDb();
    }
    
    /**
     * Begin the transaction.
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    begin () {
        this.logDebug(this.dbFolder().path() + " TX BEGIN");
        this.assertNotCommitted();
        this.setTxRequestStack(new Error().stack);
        
        // Create a new batch operation
        const batch = this.levelDb().batch();
        this.setBatch(batch);
        
        // Clear tracking sets
        this.operations().clear();
        this.addedKeys().clear();
        this.deletedKeys().clear();
        
        return this;
    }
    
    /**
     * Abort the transaction.
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    abort () {
        this.assertNotCommitted();
        
        // Clear the batch without writing
        this.setBatch(null);
        this.setIsAborted(true);
        this.markResolved();
        
        this.logDebug("Transaction aborted");
        return this;
    }
    
    /**
     * Promise to commit the transaction.
     * @returns {Promise}
     * @category Transaction
     */
    /**
     * Remove a key from the batch operation.
     * @param {string} key - The key to remove
     * @returns {SvIndexedDbTx}
     * @category Database Operations
     */
    removeAt (key) {
        assert(typeof(key) === "string", "Key must be a string");
        this.assertNotCommitted();
        
        this.logDebug(() => "REMOVE " + key);
        
        // Track the operation
        if (this.operations().has(key)) {
            throw new Error(`Duplicate operation on key: ${key}`);
        }
        
        this.operations().set(key, { action: 'delete' });
        this.deletedKeys().add(key);
        
        // Add to batch (creates batch if needed)
        this.ensureBatch().del(key);
        
        // Create a mock request object for compatibility
        const request = {
            _action: "remove",
            _key: key,
            onerror: null,
            onsuccess: null
        };
        this.pushRequest(request);
        
        return this;
    }
    
    async promiseCommit () {
        assert(!this.isFinished(), "Transaction already finished");
        
        // If no operations were added, just resolve
        if (!this.batch()) {
            this.logDebug(" NO-OP COMMIT (no operations)");
            this.markCompleted();
            return this.promiseForFinished();
        }
        
        this.logDebug(" COMMITTING");
        
        try {
            // Check for consistency before committing
            await this.validateOperations();
            
            // Write the batch
            await this.batch().write();
            
            this.logDebug(" COMMIT COMPLETE");
            this.markCompleted();
            return this.promiseForFinished();
            
        } catch (error) {
            this.logDebug(" COMMIT ERROR: " + error.message);
            this.markRejected(error);
            throw error;
        }
    }
    
    /**
     * Validate operations for consistency with IndexedDB semantics.
     * @private
     * @async
     * @returns {Promise<void>}
     */
    async validateOperations () {
        // Check for duplicate adds (IndexedDB would fail on duplicate key in add)
        for (const key of this.addedKeys()) {
            const exists = await this.dbFolder().promiseHasKey(key);
            if (exists) {
                throw new Error(`Key already exists: ${key}`);
            }
        }
    }
    
    /**
     * Add an entry to the batch operation.
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {SvIndexedDbTx}
     * @category Database Operations
     */
    atAdd (key, value) {
        this.assertValidKeyValue(key, value);
        this.assertNotCommitted();
        
        this.logDebug(() => "ADD " + key + " '...'");
        
        // Track the operation
        if (this.operations().has(key)) {
            throw new Error(`Duplicate operation on key: ${key}`);
        }
        
        this.operations().set(key, { action: 'add', value: value });
        this.addedKeys().add(key);
        
        // Convert ArrayBuffer to Buffer if necessary
        const valueToStore = this.prepareValue(value);
        
        // Add to batch (creates batch if needed)
        this.ensureBatch().put(key, valueToStore);
        
        // Create a mock request object for compatibility
        const request = {
            _action: "add",
            _key: key,
            _value: value,
            onerror: null,
            onsuccess: null
        };
        this.pushRequest(request);
        
        return this;
    }
    
    /**
     * Update an entry in the batch operation.
     * @param {string} key - The key
     * @param {string|ArrayBuffer} value - The value
     * @returns {SvIndexedDbTx}
     * @category Database Operations
     */
    atUpdate (key, value) {
        this.assertValidKeyValue(key, value);
        this.assertNotCommitted();
        
        this.logDebug(() => "UPDATE " + key);
        
        // Track the operation
        this.operations().set(key, { action: 'update', value: value });
        
        // Convert ArrayBuffer to Buffer if necessary
        const valueToStore = this.prepareValue(value);
        
        // Add to batch (put in LevelDB is upsert)
        this.batch().put(key, valueToStore);
        
        // Create a mock request object for compatibility
        const request = {
            _action: "put",
            _key: key,
            _value: value,
            onerror: null,
            onsuccess: null
        };
        this.pushRequest(request);
        
        return this;
    }
    
    /**
     * Remove an entry from the batch operation.
     * @param {string} key - The key
     * @returns {SvIndexedDbTx}
     * @category Database Operations
     */
    removeAt (key) {
        this.assertNotCommitted();
        assert(this.batch(), "Transaction not started");
        
        this.logDebug(() => "REMOVE " + key);
        
        // Track the operation
        this.operations().set(key, { action: 'delete' });
        this.deletedKeys().add(key);
        
        // Add to batch
        this.batch().del(key);
        
        // Create a mock request object for compatibility
        const request = {
            _action: "remove",
            _key: key,
            _value: undefined,
            onerror: null,
            onsuccess: null
        };
        this.pushRequest(request);
        
        return this;
    }
    
    /**
     * Prepare value for storage (handle ArrayBuffer conversion).
     * @private
     * @param {string|ArrayBuffer} value - The value to prepare
     * @returns {string|Buffer} - The prepared value
     */
    prepareValue (value) {
        if (typeof value === "string") {
            return value;
        } else if (value instanceof ArrayBuffer) {
            // Convert ArrayBuffer to Buffer for LevelDB
            return Buffer.from(value);
        } else if (Buffer.isBuffer(value)) {
            return value;
        } else {
            // Fallback to JSON stringification for other types
            return JSON.stringify(value);
        }
    }
    
    /**
     * Override pushRequest to handle Node.js environment.
     * @param {object} aRequest - The request to push
     * @returns {SvIndexedDbTx}
     * @category Transaction
     */
    pushRequest (aRequest) {
        this.assertNotCommitted();
        
        // In Node.js, we don't have real request objects
        // But we maintain the array for compatibility
        this.requests().push(aRequest);
        
        return this;
    }
    
    /**
     * Get a mock object store for compatibility.
     * @returns {object} - A mock object store
     */
    objectStore () {
        // Return a mock object store that delegates to this transaction
        return {
            add: (entry) => {
                this.atAdd(entry.key, entry.value);
                return { _action: "add", _key: entry.key };
            },
            put: (entry) => {
                this.atUpdate(entry.key, entry.value);
                return { _action: "put", _key: entry.key };
            },
            delete: (key) => {
                this.removeAt(key);
                return { _action: "remove", _key: key };
            },
            count: async (key) => {
                if (key) {
                    const hasKey = await this.dbFolder().promiseHasKey(key);
                    return { 
                        result: hasKey ? 1 : 0,
                        onsuccess: null,
                        onerror: null
                    };
                }
                const count = await this.dbFolder().promiseCount();
                return { 
                    result: count,
                    onsuccess: null,
                    onerror: null
                };
            }
        };
    }
    
}.initThisClass());