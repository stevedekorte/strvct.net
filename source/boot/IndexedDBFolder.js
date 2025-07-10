"use strict";

/**
 * @module boot
 */

/**
 * @class IndexedDBFolder
 * @extends Base
 * @classdesc Represents a folder in IndexedDB for storing and managing data.
 */
(class IndexedDBFolder extends Base {
    /**
     * Initializes the prototype slots for the IndexedDBFolder.
     */
    initPrototypeSlots () {
        /**
         * @member {string} path - The path of the folder.
         */
        this.newSlot("path", "/");

        /**
         * @member {string} pathSeparator - The separator used in the path. Path should end with pathSeparator.
         */
        this.newSlot("pathSeparator", "/");

        /**
         * @member {IDBDatabase} db - The IndexedDB database instance.
         */
        this.newSlot("db", null);

        /**
         * @member {boolean} hasPermission - Indicates if the application has permission for persistence.
         */
        this.newSlot("hasPermission", false);

        /**
         * @member {Promise} promiseForPersistence - Promise for requesting persistence.
         */
        this.newSlot("promiseForPersistence", null);

        /**
         * @member {Promise} promiseForOpen - Promise for opening the database. Has a value while opening.
         */
        this.newSlot("promiseForOpen", null);

        /**
         * @member {IndexedDBTx} lastTx - The last transaction performed.
         */
        this.newSlot("lastTx", null) ;

        /**
         * @member {number} version - The version of the database.
         */
        this.newSlot("version", 2); 
    }
  
    /**
     * Initializes the prototype.
     */
    initPrototype () {
        this.setIsDebugging(true)
    }

    indexedDB () {
        const idb = SvGlobals.globals()["indexedDB"];
        assert(idb, "indexedDB is not available");
        return idb;
    }

    navigator () {
        return SvGlobals.globals()["navigator"];
    }

    /**
     * Checks if IndexedDB is available.
     * @returns {boolean} - True if IndexedDB is available, false otherwise.
     */
        hasIndexedDB () {
            return this.indexedDB() !== undefined;
        }
    
        /**
         * Checks if the Storage API is available.
         * @returns {boolean} - True if the Storage API is available, false otherwise.
         */
        hasStorageApi () {
            const nav = this.navigator()
            if (nav) {
                return nav.storage && nav.storage.persist;
            }
            return false;
        }

    /**
     * Sets the path of the folder.
     * @param {string} aString - The new path to set.
     * @returns {IndexedDBFolder} - Returns this instance.
     */
    setPath (aString) {
        assert(!this.isOpen(), "IndexedDBFolder is open")
        this._path = aString
        return this
    }


    /**
     * Returns a promise for persistence.
     * @returns {Promise} - A promise for persistence.
     */
    promisePersistence () {
        if (!this.promiseForPersistence()) {
            this.setPromiseForPersistence(this.newPromisePersistence())
        }
        return this.promiseForPersistence()
    }

    isOnNodeJs () {
        return typeof process !== 'undefined';
    }

    /**
     * Creates a new promise for persistence.
     * @async
     * @returns {Promise<boolean>} - A promise that resolves to true if persistence is granted, false otherwise.
     */
    async newPromisePersistence () {
        if (this.isOnNodeJs()) {
            return true;
        }

        if (!this.hasStorageApi()) {
            throw new Error("Missing navigator.storage API.");
        }

        const granted = await navigator.storage.persist();
        
        this.setHasPermission(granted);

        if (granted) {
            console.log("IndexedDBFolder: Storage will not be cleared except by explicit user action.");
        } else {
            console.warn("WARNING: IndexedDBFolder: Storage may be cleared by the browser under storage pressure.");
        }

        return granted;
    }

    /**
     * Gets the store name.
     * @returns {string} - The store name.
     */
    storeName () {
        return this.path()
    }

    /**
     * Checks if the database is open.
     * @returns {boolean} - True if the database is open, false otherwise.
     */
    isOpen () {
        return (this.db() !== null)
    }

    /**
     * Returns a promise to open the database.
     * @async
     * @returns {Promise} - A promise that resolves when the database is opened.
     */
    async promiseOpen () {
        if (!this.promiseForOpen()) {
            await this.promisePersistence();
            this.setPromiseForOpen(this.newPromiseOpen())
        }
        return this.promiseForOpen()
    }

    /**
     * Creates a new promise to open the database.
     * @returns {Promise} - A promise that resolves when the database is opened.
     */
    newPromiseOpen () {
        assert(this.hasIndexedDB(), "IndexedDB is not available");

        if (this.isOpen()) {
            throw new Error("this should not happen as we should only have a single openPromise instance");
        }

        const openPromise = Promise.clone();

        const request = this.indexedDB().open(this.path(), this.version());

        request.onsuccess = (event) => {
            this.setDb(event.target.result)
            openPromise.callResolveFunc();
        }

        request.onupgradeneeded = (event) => {
            this.onOpenUpgradeNeeded(event)
        }

        request.onerror = (error) => {
            this.debugLog(" open db error: ", event);
            this.onOpenError(event)
            openPromise.callRejectFunc(error);
        }

        return openPromise;
    }

    /**
     * Handles open error.
     * @param {Event} event - The error event.
     */
    onOpenError (event) {
        let message = event.message
        if (!message) {
            message = "Unable to open IndexedDB.<br>May not work on Brave Browser."
            this.debugLog(" open db error: ", event);
        }
    }

    /**
     * Handles database upgrade needed event.
     * @param {Event} event - The upgrade needed event.
     */
    onOpenUpgradeNeeded (event) {
        this.debugLog(" onupgradeneeded - likely setting up local database for the first time");

        const db = event.target.result;

        db.onerror = (event) => {
            console.log(this.type() + ".onOpenUpgradeNeeded() db error ", event);
        };

        this.setDb(db);

        const objectStore = db.createObjectStore(this.storeName(), { keyPath: "key" }, false);
        
        // Check if index already exists before creating it (node-indexeddb compatibility)
        if (!objectStore.indexNames.contains("key")) {
            objectStore.createIndex("key", "key", { unique: true });
        }
    }

    /**
     * Closes the database.
     * @returns {IndexedDBFolder} - Returns this instance.
     */
    close () {
        if (this.isOpen()) {
            this.db().close();
            this.setDb(null);
            this.setPromiseForOpen(null);
        }
        return this
    }

    /**
     * Gets a folder at the specified path component.
     * @param {string} pathComponent - The path component.
     * @returns {IndexedDBFolder} - A new IndexedDBFolder instance.
     */
    folderAt (pathComponent) {
        assert(!pathComponent.contains(this.pathSeparator()), "pathComponent contains pathSeparator");
        const db = IndexedDBFolder.clone().setPath(this.path() + pathComponent + this.pathSeparator());
        return db;
    }

    /**
     * Gets the full path for a key.
     * @param {string} key - The key.
     * @returns {string} - The full path for the key.
     */
    pathForKey (key) {
        return this.path() + key;
    }

    /**
     * Gets a read-only object store.
     * @private
     * @returns {IDBObjectStore} - A read-only object store.
     */
    readOnlyObjectStore () {
        const tx = this.db().transaction([this.storeName()], "readonly");

        tx.onerror = (/*event*/) => {
            const m = "readOnlyObjectStore tx error"
            console.error(m)
            throw new Error(m)
        };

        tx.oncomplete = (/*event*/) => {
        }

        const objectStore = tx.objectStore(this.storeName());
        return objectStore;
    }

    /**
     * Gets a read-write object store.
     * @private
     * @returns {IDBObjectStore} - A read-write object store.
     */
    readWriteObjectStore () {
        const tx = this.db().transaction([this.storeName()], "readwrite");
        
        tx.onerror = (/*event*/) => {
            const m = "readWriteObjectStore tx error"
            console.error(m)
            throw new Error(m)
        };

        tx.oncomplete = (/*event*/) => {
            console.log("readWriteObjectStore tx oncomplete ", tx._note)
        }

        const objectStore = tx.objectStore(this.storeName())
        objectStore._tx = tx
        return objectStore
    }

    /**
     * Checks if a key exists in the database.
     * @async
     * @param {string} key - The key to check.
     * @returns {Promise<boolean>} - A promise that resolves to true if the key exists, false otherwise.
     */
    async promiseHasKey (key) {
        await this.promiseOpen();
        const count = await this.promiseCount(key);
        const hasKey = count !== 0;
        return hasKey;
    }

    /**
     * Gets the current stack trace.
     * @returns {string} - The current stack trace.
     */
    currentStack () {
        const stack = this.isDebugging() ? new Error().stack : "(call IndexedDBFolder.setIsDebugging(true) to get a stack recording)" 
        return stack
    }
    
    /**
     * Retrieves a value for a given key from the database.
     * @async
     * @param {string} key - The key to retrieve.
     * @returns {Promise<*>} - A promise that resolves to the value associated with the key.
     */
    async promiseAt (key) {
        await this.promiseOpen();
        const atPromise = Promise.clone();

        const objectStore = this.readOnlyObjectStore()
        const request = objectStore.get(key);
        const stack = this.currentStack()

        request.onsuccess = (/*event*/) => {
            try {
                if (typeof(request.result) !== "undefined") {
                    const entry = request.result
                    const value = entry.value
                    atPromise.callResolveFunc(value);
                } else {
                    atPromise.callResolveFunc(undefined);
                }
            } catch (e) {
                this.debugLog(" promiseAt('" +  key + "') caught stack ", stack);
                throw e;
            }
        }
        
        request.onerror = (/*event*/) => {
            console.log("promiseAt('" + key + "') onerror", event.target.error);
            atPromise.callResolveFunc(undefined);
        }
        
        return atPromise;
    }

    /**
     * Counts the number of entries in the database or for a specific key.
     * @async
     * @param {string} [optionalKey] - Optional key to count.
     * @returns {Promise<number>} - A promise that resolves to the count.
     */
    async promiseCount (optionalKey) {
        await this.promiseOpen();
        const countPromise = Promise.clone();
        const objectStore = this.readOnlyObjectStore();
        const request = objectStore.count(optionalKey);
        const stack = this.currentStack();

        request.onsuccess = (/*event*/) => {
            const count = request.result;
            let a = false; 
            if (a) {
                countPromise.callRejectFunc(new Error("TESTING PROMISE COUNT ERROR"));
                return;
            }

            countPromise.callResolveFunc(count);
        }
        
        request.onerror = (/*event*/) => {
            console.error("promiseCount() onerror: ", event.target.error, " stack: ", stack);
            countPromise.callRejectFunc(event);
        }

        return countPromise;
    }

    /**
     * Retrieves all keys from the database.
     * @async
     * @returns {Promise<Array>} - A promise that resolves to an array of all keys.
     */
    async promiseAllKeys () {
        await this.promiseOpen();
        const promise = Promise.clone();

        const objectStore = this.readOnlyObjectStore();
        const request = objectStore.getAllKeys();
        const stack = this.currentStack();

        request.onsuccess = (/*event*/) => {
            const keysArray = request.result;
            promise.callResolveFunc(keysArray);
        }
        
        request.onerror = (/*event*/) => {
            console.error("promiseCount() onerror: ", event.target.error, " stack: ", stack);
            promise.callRejectFunc(event);
        }

        return promise;
    }

    /**
     * Retrieves all key-value pairs from the database as a Map.
     * @async
     * @returns {Promise<Map>} - A promise that resolves to a Map of all key-value pairs.
     */
    async promiseAsMap () {
        await this.promiseOpen();
        const promise = Promise.clone();

        const objectStore = this.readOnlyObjectStore();
        const request = objectStore.getAll();
        //const stack = this.currentStack();

        request.onsuccess = (event) => {
            const results = event.target.result;
            const map = new Map();
            results.forEach(result => {
                map.set(result.key, result.value);
            })
            promise.callResolveFunc(map);
        }

        request.onerror = (event) => {
            promise.callRejectFunc(event);
        }

        return promise;
    }

    /**
     * Displays the contents of the database.
     * @async
     */
    async show () {
        const map = await this.promiseAsMap();
        this.debugLog(" " + this.path() + " = " + map.description());
    }

    /**
     * Clears all data from the database.
     * @async
     * @returns {Promise} - A promise that resolves when the database is cleared.
     */
    async promiseClear () {
        await this.promiseOpen();
        const clearPromise = Promise.clone();

        const objectStore = this.readWriteObjectStore();
        objectStore._tx._note = "promiseClear";
        
        const request = objectStore.clear();
        //const stack = this.currentStack();

        objectStore._tx.oncomplete = (event) => {
            console.log("db promiseClear tx oncomplete");
            clearPromise.callResolveFunc(event);
        };

        request.onsuccess = (/*event*/) => {
            console.log("db promiseClear request onsuccess");
        };

        request.onerror = (event) => {
            console.log("db promiseClear request error");
            clearPromise.callRejectFunc(event);
        };

        return clearPromise;
    }

    /**
     * Deletes the entire database.
     * @async
     * @returns {Promise} - A promise that resolves when the database is deleted.
     */
    async promiseDelete () {
        assert(!this.isOpen(), "IndexedDBFolder is open");
        const deletePromise = Promise.clone();

        const request = this.indexedDB().deleteDatabase(this.storeName());

        request.onerror = (error) => {
            this.debugLog("Error deleting '" + this.storeName() + "'");
            deletePromise.callRejectFunc(error);
        }

        request.onsuccess = (event) => {
            this.debugLog(" deleted successfully '" + this.storeName() + "'");
            deletePromise.callResolveFunc(event);
        }

        this.setDb(null);
        return deletePromise;
    }

    /**
     * Asserts that the last transaction is committed or aborted.
     * @async
     * @returns {Promise<void>} - A promise that resolves when the assertion is made.
     */
    async assertLastTxCommitedOrAborted () {
        const tx = this.lastTx()
        assert(tx, "lastTx is null")
        const isOk = tx.isAborted() || tx.isCommitted();
        if (!isOk) {
            tx.show()
        }
        assert(isOk, "lastTx is not committed or aborted")
    }

    /**
     * Creates a new transaction object.
     * @async
     * @returns {Promise<IndexedDBTx>} - A promise that resolves to a new transaction object.
     */
    async promiseNewTx () {
        assert(this.isOpen(), "IndexedDBFolder is not open")
        //debugger;
        this.debugLog(this.path() + " promiseNewTx")
        //debugger;
        /*
        const lastTx = this.lastTx()
        if (lastTx) {
            // technically, it's ok to have multiple unfinished txs, 
            // but AFAIK I don't use them at the moment, 
            // so this is a sanity check for now 

            if (!lastTx.isFinished()) {
                if (!lastTx.isCommitted()) {
                    console.warn("WARNING: last tx was not committed yet!")
                    console.log("last tx:")
                    lastTx.show()
                } 

                await lastTx.promiseForFinished();
                return this.privateNewTx();
            }
        }
        */
        return Promise.resolve(this.privateNewTx())
    }

    /**
     * Creates a new transaction object.
     * @private
     * @returns {IndexedDBTx} - A new transaction object.
     */
    privateNewTx () {
        //debugger;
        //SyncScheduler.shared().scheduleTargetAndMethod(this, "assertLastTxCommitedOrAborted")
        if (this.lastTx()) {
            //assert(this.lastTx().isCommitted() || this.lastTx().isAborted())
        }
        const newTx = IndexedDBTx.clone().setDbFolder(this)
        this.setLastTx(newTx)
        return newTx
    }

    /**
     * Returns a debug type ID for the database folder.
     * @returns {string} - The debug type ID.
     */
    debugTypeId () {
        return super.debugTypeId() + " '" + this.path() + "'"
    }

    // -------------------------------------------------------------------

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
            return this.promiseRemoveAt(key)
        }

        const hasKey = await this.promiseHasKey(key);

        if (hasKey) {
            //console.log("idb YES hasKey promiseUpdate", key)
            return this.promiseUpdate(key, value)
        } 

        //console.log("idb NO hasKey promiseAdd", key)
        return this.promiseAdd(key, value)
    }

    /**
     * Asserts that a key exists in the database.
     * @async
     * @param {string} key - The key to assert.
     * @returns {Promise<void>} - A promise that resolves when the assertion is made.
     */
    async promiseAssertHasKey (key) {
        const hasKey = await this.promiseHasKey(key);

        if (!hasKey) {
            debugger;
            throw new Error("failed assert");
        }
    }

    /**
     * Updates a value at a specified key in the database.
     * @async
     * @param {string} key - The key to update.
     * @param {*} value - The value to update.
     * @returns {Promise} - A promise that resolves when the update is complete.
     */
    async promiseUpdate (key, value) { // private
        const tx = await this.promiseNewTx();
        tx.begin();
        tx.setIsDebugging(this.isDebugging());
        tx.atUpdate(key, value);
        return tx.promiseCommit();
    }

    /**
     * Adds a value to the database at a specified key.
     * @async
     * @param {string} key - The key to add the value at.
     * @param {*} value - The value to add.
     * @returns {Promise} - A promise that resolves when the addition is complete.
     */
    async promiseAdd (key, value) { // private
        const tx = await this.promiseNewTx();
        this.debugLog("idb tx atAdd ", key);
        tx.begin();
        //tx.setIsDebugging(this.isDebugging());
        tx.atAdd(key, value);
        return tx.promiseCommit();
    }

    /**
     * Removes a value at a specified key in the database.
     * @async
     * @param {string} key - The key to remove the value at.
     * @returns {Promise} - A promise that resolves when the removal is complete.
     */
    async promiseRemoveAt (key) {
        await this.promiseOpen();
        const tx = await this.promiseNewTx();
        tx.begin();
        tx.setIsDebugging(this.isDebugging());
        tx.removeAt(key);
        return tx.promiseCommit();
    }

    // -----------------------------------------------------------------

    /**
     * Tests the IndexedDBFolder class.
     * @static
     * @async
     * @returns {Promise<void>} - A promise that resolves when the test is complete.
     */

    static async promiseSelfTest () {
        const folder = IndexedDBFolder.clone()
        await folder.promiseAtPut("test", "x");
        const map = await folder.promiseAsMap();
        console.log("db map = ", map);
        const v = await folder.promiseAt("test");
        console.log("read ", v);
    }

    static async usage () {
        return estimateAllIndexedDBUsage(); // TODO inline this
    }

}.initThisClass());


// -----------------------------------------------------------------

/**
 * Estimates the total usage of all IndexedDB databases.
 * @function
 * @async
 * @returns {Promise<number>} - A promise that resolves to the total usage in bytes.
 */
async function estimateAllIndexedDBUsage () {
    const databases = await this.indexedDB().databases();
    let totalUsage = 0;
  
    for (const database of databases) {
      const databaseName = database.name;
      const usage = await estimateIndexedDBUsage(databaseName);
      console.log(`Database "${databaseName}" usage: ${usage} bytes (${(usage / 1024).toFixed(2)} KB)`);
      totalUsage += usage;
    }
  
    console.log(`Total IndexedDB usage: ${totalUsage} bytes (${(totalUsage / 1024).toFixed(2)} KB)`);
    return totalUsage;
  }
  
  // Function to estimate the usage of a single IndexedDB database
async function estimateIndexedDBUsage (databaseName) {
    return new Promise((resolve, reject) => {
      const request = this.indexedDB().open(databaseName);
      request.onerror = () => {
        reject(request.error);
      };
      request.onsuccess = () => {
        const db = request.result;
        const storeNames = db.objectStoreNames;
        let totalSize = 0;
  
        const transaction = db.transaction(storeNames, 'readonly');
        transaction.onerror = () => {
          reject(transaction.error);
        };
        transaction.oncomplete = () => {
          db.close();
          resolve(totalSize);
        };
  
        for (let i = 0; i < storeNames.length; i++) {
          const storeName = storeNames[i];
          const objectStore = transaction.objectStore(storeName);
          const cursorRequest = objectStore.openCursor();
  
          cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              const value = cursor.value;
              const size = estimateObjectSize(value);
              totalSize += size;
              cursor.continue();
            }
          };
        }
      };
    });
  }
  
  // Function to estimate the size of an object
function estimateObjectSize (object) {
    const jsonString = JSON.stringify(object);
    const bytes = new TextEncoder().encode(jsonString).length;
    return bytes;
}
