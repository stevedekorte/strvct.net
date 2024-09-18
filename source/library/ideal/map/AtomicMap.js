"use strict";

/**
 * @module library.ideal.map
 * @class AtomicMap
 * @extends ProtoClass
 * @classdesc The AtomicMap class provides a way to manage a Map object with atomic transactions. It allows you to begin a transaction, make changes to the Map, and then either commit or revert the changes. This ensures data consistency and prevents partial updates in case of errors or exceptions.
 */
getGlobalThis().ideal.AtomicMap = class AtomicMap extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("isInTx", false);
            /**
             * @description Public read, private write. Boolean, true during a transaction.
             * @type {Boolean}
             */
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("map", null);
            /**
             * @description Public read, private write - Map, contains current state of map
             * @type {Map}
             */
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("snapshot", null);
            /**
             * @description Private - Map, contains shallow copy of map before transaction which we can revert to if transaction is cancelled
             * @type {Map}
             * @private
             */
            slot.setSlotType("Map");
        }
        {
            const slot = this.newSlot("isOpen", true);
            /**
             * @description Public read, private write
             * @type {Boolean}
             */
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("changedKeySet", null);
            /**
             * @description Private method
             * @type {Set}
             * @private
             */
            slot.setSlotType("Set");
        }
        {
            const slot = this.newSlot("keysAndValuesAreStrings", true);
            /**
             * @description Private method - Bool, if true, runs assertString on all input keys and values
             * @type {Boolean}
             * @private
             */
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("totalBytesCache", null);
            /**
             * @description Private
             * @type {Number|null}
             * @private
             */
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
        }
        {
            const slot = this.newSlot("beginPromiseFifoQueue", null);
            /**
             * @description First-in-first-out queue of promises, last in queue is was the earliest promise added
             * @type {Array}
             * @private
             */
            slot.setSlotType("Array");
        }
    }
  
    initPrototype () {
    }

    init () {
        super.init();
        this.setMap(new Map());
        this.setSnapshot(null);
        this.setChangedKeySet(new Set());
        this.setBeginPromiseFifoQueue([]);
        this.setIsDebugging(false);
    }

    /**
     * @description Opens the AtomicMap for operations.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    open () {
        this.setIsOpen(true);
        return this;
    }

    assertAccessible () {
        this.assertOpen();
    }

    /**
     * @description Asserts that the AtomicMap is open for operations.
     * @throws {Error} If the AtomicMap is not open.
     */
    assertOpen () {
        assert(this.isOpen());
    }

    /**
     * @description Promises to open the AtomicMap for operations.
     * @returns {Promise} A Promise that resolves when the AtomicMap is open.
     */
    async promiseOpen () {
        this.open();
    }

    /**
     * @description Closes the AtomicMap for operations.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    close () {
        this.setIsOpen(false);
        return this;
    }

    /**
     * @description Throws an error because the method is deprecated. Use promiseBegin instead.
     * @throws {Error} An error indicating that the method is deprecated.
     */
    begin () {
        throw new Error("deprecated - use promiseBegin");
    }
    
    /**
     * @description Begins a transaction on the AtomicMap.
     * @returns {Promise} A Promise that resolves when the transaction has begun.
     */
    async promiseBegin () {
        const lastPromise = this.beginPromiseFifoQueue().last();

        this.beginPromiseFifoQueue().push(Promise.clone());

        if (lastPromise) {
            await lastPromise;
        }

        this.debugLog(() => " begin --- (queue size is " + this.beginPromiseFifoQueue().length + ")");
        this.assertAccessible();
        this.assertNotInTx();
        this.setSnapshot(this.map().shallowCopy());
        this.changedKeySet().clear();
        this.setIsInTx(true);
    }

    /**
     * @description Reverts the changes made during the current transaction.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    revert () {
        this.debugLog(() => " revert ---");
        this.assertInTx();
        this.setMap(this.snapshot());
        this.setSnapshot(null);
        this.changedKeySet().clear();
        this.setIsInTx(false);
        this.onCompleteTx();
        return this
    }

    /**
     * @description Applies the changes made during the current transaction.
     * @returns {Promise} A Promise that resolves when the changes have been applied.
     */
    async promiseApplyChanges () {
        await this.applyChanges();
    }

    /**
     * @description Commits the changes made during the current transaction.
     * @returns {Promise} A Promise that resolves when the changes have been committed.
     */
    async promiseCommit () {
        this.debugLog(() => " prepare commit ---");
        this.assertInTx();
        if (this.hasChanges()) {
            await this.promiseApplyChanges();
            this.changedKeySet().clear();
            this.clearTotalBytesCache();
        }
        this.onCompleteTx();
    }

    /**
     * @description Handles the completion of a transaction.
     * @private
     */
    onCompleteTx () {
        this.setIsInTx(false);
        const currentPromise = this.beginPromiseFifoQueue().shift();
        currentPromise.callResolveFunc();
    }

    /**
     * @description Checks if there are any changes made during the current transaction.
     * @returns {boolean} True if there are changes, false otherwise.
     */
    hasChanges () {
        return this.changedKeySet().size > 0;
    }

    /**
     * @description Applies the changes made during the current transaction to the snapshot.
     * @private
     */
    applyChanges () {
        this.setSnapshot(null);
        return this;
    }

    /**
     * @description Asserts that the AtomicMap is in a transaction.
     * @throws {Error} If the AtomicMap is not in a transaction.
     * @private
     */
    assertInTx () {
	    assert(this.isInTx());
    }

    /**
     * @description Asserts that the AtomicMap is not in a transaction.
     * @throws {Error} If the AtomicMap is in a transaction.
     * @private
     */
    assertNotInTx () {
	    assert(!this.isInTx());
    }

    /**
     * @description Returns an array of keys in the map.
     * @returns {Array} An array of keys.
     */
    keysArray () {
        return this.map().keysArray();
    }

    /**
     * @description Returns a set of keys in the map.
     * @returns {Set} A set of keys.
     */
    keysSet () {
        return this.map().keysSet();
    }

    /**
     * @description Returns an array of values in the map.
     * @returns {Array} An array of values.
     */
    valuesArray () {
        return this.map().valuesArray();
    }

    /**
     * @description Returns a set of values in the map.
     * @returns {Set} A set of values.
     */
    valuesSet () {
        return this.map().valuesSet();
    }

    /**
     * @description Checks if the map contains the given key.
     * @param {*} k The key to check.
     * @returns {boolean} True if the map contains the key, false otherwise.
     */
    has (k) {
        return this.map().has(k);
    }

    /**
     * @description Checks if the map contains the given key.
     * @param {*} k The key to check.
     * @returns {boolean} True if the map contains the key, false otherwise.
     */
    hasKey (k) {
        return this.map().hasKey(k);
    }

    /**
     * @description Returns the value associated with the given key.
     * @param {*} k The key to retrieve the value for.
     * @returns {*} The value associated with the key, or undefined if the key is not found.
     */
    at (k) {
        return this.map().at(k);
    }

    /**
     * @description Clears all key-value pairs from the map.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    clear () {
        this.keysArray().forEach(k => this.removeKey(k));
        return this;
    }

    /**
     * @description Sets the value associated with the given key in the map.
     * @param {*} k The key to set the value for.
     * @param {*} v The value to set.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    set (k, v) {
        return this.atPut(k, v);
    }

    /**
     * @description Sets the value associated with the given key in the map.
     * @param {*} k The key to set the value for.
     * @param {*} v The value to set.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    atPut (k, v) {
        this.assertInTx();
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k));
            assert(Type.isString(v));
        }

        this.assertAccessible();
        this.assertInTx();
        this.changedKeySet().add(k);
        this.map().set(k, v);
        return this;
    }

    /**
     * @description Removes the key-value pair associated with the given key from the map.
     * @param {*} k The key to remove.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    removeKey (k) {
        this.assertInTx();
        this.changedKeySet().add(k);
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k));
        }

        this.assertAccessible();
        this.assertInTx();
        this.map().delete(k);
        return this;
    }

    /**
     * @description Iterates over the key-value pairs in the map and calls the provided function for each pair.
     * @param {Function} fn The function to call for each key-value pair. The function takes three arguments: key, value, and the map instance.
     */
    forEachKV (fn) {
        this.assertNotInTx() ;
        this.assertAccessible();
        this.map().forEach((v, k, self) => fn(k, v, self));
    }

    /**
     * @description Iterates over the keys in the map and calls the provided function for each key.
     * @param {Function} fn The function to call for each key. The function takes one argument: key.
     */
    forEachK (fn) {
        this.assertAccessible();
        this.map().forEach((v, k) => fn(k));
    }

    /**
     * @description Iterates over the values in the map and calls the provided function for each value.
     * @param {Function} fn The function to call for each value. The function takes one argument: value.
     */
    forEachV (fn) {
        this.assertNotInTx();
        this.assertAccessible();
        this.map().forEach(v => fn(v));
    }

    /**
     * @description Returns an array of keys in the map.
     * @returns {Array} An array of keys.
     */
    keysArray () {
        return this.map().keysArray();
    }
	
    /**
     * @description Returns an array of values in the map.
     * @returns {Array} An array of values.
     */
    valuesArray () {
        return this.map().valuesArray();
    }

    /**
     * @description Returns the number of key-value pairs in the map.
     * @returns {number} The number of key-value pairs.
     */
    count () { 
        return this.map().size;
    }	

    /**
     * @description Clears the total bytes cache.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    clearTotalBytesCache () {
        this.setTotalBytesCache(null);
        return this;
    }

    /**
     * @description Returns the total number of bytes used by the keys and values in the map.
     * @returns {number} The total number of bytes used by the keys and values.
     */
    totalBytes () {
        const cachedResult = this.totalBytesCache();
        if (!Type.isNull(cachedResult)) {
            return cachedResult;
        }

        this.assertNotInTx();
        this.assertAccessible();
        assert(this.keysAndValuesAreStrings());
        let byteCount = 0;
        this.map().forEachKV((k, v) => {
            byteCount += k.length + v.length
        })
        this.setTotalBytesCache(byteCount);
        return byteCount;
    }

    /**
     * @description Returns the map as a JSON object.
     * @returns {Object} The map as a JSON object.
     */
    asJson () {
        return this.map().asDict();
    }

    /**
     * @description Populates the map from a JSON object.
     * @param {Object} json The JSON object to populate the map from.
     * @returns {AtomicMap} This instance of AtomicMap.
     */
    fromJson (json) {
        this.map().clear();
        this.map().fromDict(json);
        return this
    }

    /**
     * @description Runs a self-test on the AtomicMap class.
     * @returns {Promise<boolean>} A Promise that resolves to true if the self-test passes, false otherwise.
     * @static
     */
    static async selfTest () {
        const m = this.clone()

        await m.promiseBegin();
        m.atPut("foo", "bar");
        await m.promiseCommit(); 
        assert(m.count() === 1)
        assert(m.Array()[0] === "foo")

        await m.promiseBegin();
        m.removeAt("foo");
        await m.promiseCommit();
        assert(m.count() === 0);

        return true;
    }

}.initThisClass();