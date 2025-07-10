/**
 * @module library.storage
 */

"use strict";

/**
 * @class PersistentAtomicMap 
 * @extends ideal.AtomicMap
 * @classdesc An persistent atomic Map implemented as 
 * a read & write cache on top of IndexedDB.
 * 
 * On open, it reads the entire db into a dictionary
 * so we can do synchronous reads and writes (avoiding IndexedDB's async API),
 * and then call the async commit at the end of the event loop.
 * 
 * Notes:
 * 
 * - keys and values are assumed to be strings
 * - any exception between begin and commit should halt the app and require a restart to ensure consistency
 * 
 * API:
 * 
 * - at(key) returns a value from the internal dict
 * - begin() shallow copies the current internal dict
 * - atPut(key, value) & removeAt(key)
 *     applies normal op and adds key to changedKeySet
 * - revert() reverts changes since begin
 * - commit() constructs a transaction using changedKeySet 
 * - at(key) first checks the writeCache beforing checking the readCache
 * 	
 * TODO: 
 * 
 * - auto sweep after a write if getting full? 
 */
(class PersistentAtomicMap extends ideal.AtomicMap {
    /**
     * @description Initializes prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {String} name
             * @category Data
             */
            const slot = this.newSlot("name", null);
            slot.setSlotType("String");
        }
        {
            /**
             * @member {IndexedDBFolder} idb
             * @category Storage
             */
            const slot = this.newSlot("idb", null);
            slot.setSlotType("IndexedDBFolder");
        }
        {
            /**
             * @member {Number} txCount
             * @category Transaction
             */
            const slot = this.newSlot("txCount", 0);
            slot.setSlotType("Number");
        }
        {
            /**
             * @member {Boolean} isApplying
             * @category State
             */
            const slot = this.newSlot("isApplying", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initializes the instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsOpen(false);
        this.setIdb(IndexedDBFolder.clone());
        this.setIsDebugging(false);
        this.setName("PersistentAtomicMap");
    }

    /**
     * @description Checks if the map is open.
     * @returns {boolean} - True if the map is open, false otherwise.
     * @category State
     */
    isOpen () {
        return this.idb().isOpen();
    }

    /**
     * @description Synchronous open is not supported.
     * @throws {Error} Always throws an error as synchronous open is not supported.
     * @category Operation
     */
    open () {
        throw new Error(this.type() + " synchronous open not supported");
    }

    /**
     * @description Sets the name of the map and updates the IDB path.
     * @param {string} aString - The new name for the map.
     * @returns {PersistentAtomicMap} - Returns this instance.
     * @category Configuration
     */
    setName (aString) {
        this._name = aString;
        this.idb().setPath(this.name());
        return this;
    }

    /**
     * @description Asynchronously opens the map.
     * @returns {Promise} A promise that resolves when the map is opened.
     * @category Operation
     */
    async promiseOpen () {
        this.debugLog(() => "promiseOnOpen() '" + this.name() + "'");
        await this.idb().promiseOpen();
        return this.promiseOnOpen(); // it can deal with multiple calls while it's opening
    }
	
    /**
     * @description Handles the opening of the map.
     * @returns {Promise} A promise that resolves when the map is loaded.
     * @category Operation
     */
    async promiseOnOpen () {
        /*
        if (false) {
            debugger;
            this.debugLog("onOpen() - CLEARING BEFORE OPEN");
             await this.promiseClear();
        } 
        */
        this.debugLog("onOpen() - loading cache");
        await this.promiseLoadMap();
    }

    /**
     * @description Loads the map from the IDB.
     * @returns {Promise} A promise that resolves when the map is loaded.
     * @category Data Loading
     */
    async promiseLoadMap () {
        const map = await this.idb().promiseAsMap();
        assert(!Type.isNull(map));
        this.setMap(map);
        this.setIsOpen(true);
    }

    /**
     * @description Closes the map.
     * @returns {PersistentAtomicMap} - Returns this instance.
     * @category Operation
     */
    close () {
        if (this.isOpen()) {
            this.idb().close();
        }
        super.close();
        return this;
    }
	
    /**
     * @description Clears the map.
     * @returns {Promise} A promise that resolves when the map is cleared.
     * @category Data Manipulation
     */
    async promiseClear () {
        await this.idb().promiseClear();
        this.map().clear();
    }
		
    /**
     * @description Generates a new transaction ID.
     * @returns {string} The new transaction ID.
     * @category Transaction
     */
    newTxId () {
        const count = this.txCount();
        const s = "TX_" + count;
        this.setTxCount(count + 1);
        return s;
    }

    /**
     * @description Applies changes to the map.
     * @returns {Promise} A promise that resolves when changes are applied.
     * @category Data Manipulation
     */
    async promiseApplyChanges () {
        //const count = this.changedKeySet().size;
        const tx = this.idb().privateNewTx();
        await this.applyChangesToTx(tx);
    }

    /**
     * @description Applies changes to a transaction.
     * @param {Object} tx - The transaction to apply changes to.
     * @returns {Promise} A promise that resolves when changes are applied.
     * @category Data Manipulation
     */
    async applyChangesToTx (tx) {
        assert(!this.isApplying());
        this.setIsApplying(true);

        tx.setTxId(this.newTxId());
        tx.setIsDebugging(this.isDebugging());
        tx.begin();
        this.changedKeySet().forEachK((k) => {
            const v = this.at(k);
            if (!this.has(k)) {
                tx.removeAt(k);
            } else {
                const isUpdate = this.snapshot().has(k);
                if (isUpdate) {
                    tx.atUpdate(k, v);
                } else {
                    tx.atAdd(k, v);
                }                
            }
        });
        
        super.applyChanges(); // do this last as it will clear the snapshot
        
        this.debugLog(() => "---- " + this.type() + " committed tx with " + count + " writes ----");

        await tx.promiseCommit();
        this.setIsApplying(false);
    }
	
    /**
     * @description Verifies that the map is in sync with the IDB.
     * @returns {Promise} A promise that resolves when verification is complete.
     * @category Verification
     */
    async promiseVerifySync () {
        const currentMap = this.map().shallowCopy();
        const map = await this.idb().promiseAsMap();

        const isSynced = map.isEqual(currentMap); // works if keys and values are strings
        if (isSynced) {
            this.debugLog(".verifySync() SUCCEEDED");
        } else {
            throw new Error(this.debugTypeId() + ".verifySync() FAILED");
        }
    }
    
}.initThisClass());