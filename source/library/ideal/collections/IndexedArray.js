"use strict";

/**
 * @module library.ideal.collections
 * @class IndexedArray
 * @extends HookedArray
 * @description A subclass of Array that maintains a dictionary index of the
 * elements of the list via an index closure. The index closure should return
 * a string. For this to work, you need to avoid using the Array
 * operations which can't be overridden:
 *
 *     a[i] -> instead use a.at(i)
 *     a[i] = b -> instead use a.atPut(i, b)
 *     delete a[i] -> instead use a.removeAt(i)
 *
 */
(class IndexedArray extends HookedArray {

    /**
     * Initialize prototype slots
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
        Object.defineSlot(this, "_index", null);
        Object.defineSlot(this, "_indexClosure", null);
        Object.defineSlot(this, "_needsReindex", false);
    }

    /**
     * Initialize the IndexedArray
     * @category Initialization
     */
    init () {
        super.init();
        this.setIndex(new Map());
    }

    /**
     * Set the index Map
     * @param {Map} aMap - The Map to use as the index
     * @returns {IndexedArray} - Returns this for chaining
     * @category Index Management
     */
    setIndex (aMap) {
        this._index = aMap;
        return this;
    }

    /**
     * Get the current index, reindexing if necessary
     * @returns {Map} - The current index
     * @category Index Management
     */
    index () {
        if (this._needsReindex) {
            this.reindex();
        }
        return this._index;
    }

    /**
     * Set the index closure function
     * @param {Function} aFunction - The function to use for indexing
     * @returns {IndexedArray} - Returns this for chaining
     * @category Index Management
     */
    setIndexClosure (aFunction) {
        if (aFunction !== this._indexClosure) {
            this._indexClosure = aFunction;
            this.setNeedsReindex(true);
        }
        return this;
    }

    /**
     * Get the current index closure function
     * @returns {Function|null} - The current index closure function
     * @category Index Management
     */
    indexClosure () {
        return this._indexClosure;
    }

    /**
     * Check if the array is indexed
     * @returns {boolean} - True if the array has an index closure function
     * @category Index Management
     */
    isIndexed () {
        return Type.isFunction(this._indexClosure);
    }

    /**
     * Set whether the array needs reindexing
     * @param {boolean} aBool - Whether reindexing is needed
     * @returns {IndexedArray} - Returns this for chaining
     * @category Index Management
     */
    setNeedsReindex (aBool) {
        this._needsReindex = aBool;
        return this;
    }

    /**
     * Check if the array needs reindexing
     * @returns {boolean} - True if reindexing is needed
     * @category Index Management
     */
    needsReindex () {
        return this._needsReindex;
    }

    /**
     * Reindex the array
     * @returns {IndexedArray} - Returns this for chaining
     * @category Index Management
     */
    reindex () {
        this.setNeedsReindex(false); // do this first to avoid infinite loop
        this._index.clear();
        this.forEach(v => this.addItemToIndex(v));
        return this;
    }

    /**
     * Check if an item is in the index
     * @param {*} anObject - The item to check
     * @returns {boolean} - True if the item is in the index
     * @category Index Query
     */
    hasIndexedItem (anObject) {
        const key = this.indexKeyForItem(anObject);
        return !Type.isUndefined(this.itemForIndexKey(key));
    }

    /**
     * Handle mutations to the array
     * @param {string} slotName - The name of the slot that was mutated
     * @param {*} optionalValue - The value involved in the mutation
     * @category Mutation Handling
     */
    didMutate (slotName, optionalValue) {
        super.didMutate(slotName, optionalValue);

        if (this._indexClosure && !this._needsReindex && optionalValue) {
            // If we don't already need to reindex,
            // check if we can avoid it.
            // These cover the common use cases.

            /*
            if (slotName === "push") {
                // need to add a way to handle multiple arguments first
                optionalArguments.forEach(v => this.addItemToIndex(v));
                return;
            }
            */

            if (slotName === "atPut") {
                // We can just add it, instead of doing a fill reindex.
                this.addItemToIndex(optionalValue);
                return;
            }

            if (slotName === "removeAt") {
                if (!this.contains(optionalValue)) {
                    // No copies of this value in the array,
                    // so we can just remove it from the index.
                    this.removeItemFromIndex(optionalValue);
                    return;
                }
            }
        }

        this.setNeedsReindex(true);
    }

    /**
     * Get an item from the index by its key
     * @param {string} key - The index key
     * @returns {*} - The item corresponding to the key
     * @category Index Query
     */
    itemForIndexKey (key) {
        return this.index().get(key);
    }

    /**
     * Check if an item is in the index
     * @param {*} v - The item to check
     * @returns {boolean} - True if the item is in the index
     * @category Index Query
     */
    indexHasItem (v) {
        assert(this.isIndexed());
        const key = this.indexClosure()(v);
        return this.hasIndexKey(key);
    }

    /**
     * Check if a key exists in the index
     * @private
     * @param {string} key - The key to check
     * @returns {boolean} - True if the key exists in the index
     * @category Index Query
     */
    hasIndexKey (key) {
        return this._index.has(key);
    }

    /**
     * Get the index key for an item
     * @private
     * @param {*} v - The item to get the key for
     * @returns {string} - The index key for the item
     * @category Index Management
     */
    indexKeyForItem (v) {
        const key = this.indexClosure()(v);
        return key;
    }

    /**
     * Add an item to the index
     * @private
     * @param {*} v - The item to add
     * @returns {IndexedArray} - Returns this for chaining
     * @category Index Management
     */
    addItemToIndex (v) {
        const key = this.indexKeyForItem(v);
        assert(Type.isString(key));
        this._index.set(key, v);
        return this;
    }

    /**
     * Remove an item from the index
     * @private
     * @param {*} v - The item to remove
     * @returns {IndexedArray} - Returns this for chaining
     * @category Index Management
     */
    removeItemFromIndex (v) {
        const key = this.indexKeyForItem(v);
        this._index.delete(key);
        return this;
    }

    /**
     * Run self-test for IndexedArray
     * @returns {IndexedArray} - Returns this for chaining
     * @category Testing
     */
    static selfTest () {
        let ia = IndexedArray.clone();
        ia.setIndexClosure(v => v.toString());
        ia.push(123);
        let result = ia.itemForIndexKey("123");
        assert(result === 123);
        return this;
    }

}.initThisClass());

//IndexedArray.selfTest()
