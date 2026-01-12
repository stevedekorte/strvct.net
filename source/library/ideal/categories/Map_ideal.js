"use strict";

/** * @module library.ideal
 */

/** * @class Map_ideal
 * @extends Map
 * @description Extended Map class with additional utility methods.
 */

/**

 */
(class Map_ideal extends Map {

    /**
     * Creates a deep copy of the map
     * @param {Map} [refMap=new Map()] - A map to handle circular references
     * @returns {Map_ideal} A new Map_ideal instance with deeply copied entries
     * @category Copying
     */
    deepCopy (refMap = new Map()) {
        const m = new this.constructor();

        this.forEachKV((k, v) => {
            m.set(k, Type.deepCopyForValue(v, refMap));
        });

        return m;
    }

    /**
     * Creates a shallow copy of the map
     * @returns {Map_ideal} A new Map_ideal instance with the same entries
     * @category Copying
     */
    shallowCopy () {
        return new Map(this);
    }

    /**
     * Returns the number of entries in the map
     * @returns {number} The number of entries
     * @category Information
     */
    count () {
        return this.size;
    }

    /**
     * Gets the value associated with the specified key
     * @param {*} k - The key to look up
     * @returns {*} The value associated with the key, or undefined if the key doesn't exist
     * @category Access
     */
    at (k) {
        return this.get(k);
    }

    /**
     * Sets a value for a key if it doesn't already exist
     * @param {*} k - The key to set
     * @param {*} v - The value to set
     * @returns {Map_ideal} This map instance
     * @category Modification
     */
    atIfAbsentPut (k, v) {
        if (!this.has(k)) {
            this.set(k, v);
        }
        return this;
    }

    /**
     * Checks if the map has a specific key
     * @param {*} k - The key to check
     * @returns {boolean} True if the key exists, false otherwise
     * @category Information
     */
    hasKey (k) {
        return this.has(k);
    }

    /**
     * Sets a value for a key
     * @param {*} k - The key to set
     * @param {*} v - The value to set
     * @returns {Map_ideal} This map instance
     * @category Modification
     */
    atPut (k, v) {
        this.set(k, v);
        return this;
    }

    /**
     * Removes a key-value pair from the map
     * @param {*} k - The key to remove
     * @returns {Map_ideal} This map instance
     * @category Modification
     */
    removeKey (k) {
        this.delete(k);
        return this;
    }

    /**
     * Iterates over the map, calling a function for each key-value pair
     * @param {function(*, *, Map_ideal): void} fn - The function to call for each entry
     * @category Iteration
     */
    forEachKV (fn) {
        this.forEach((v, k, self) => fn(k, v, self));
    }

    /**
     * Iterates over the map, calling a function for each key
     * @param {function(*): void} fn - The function to call for each key
     * @category Iteration
     */
    forEachK (fn) {
        this.forEach((v, k) => fn(k));
    }

    /**
     * Iterates over the map, calling a function for each value
     * @param {function(*): void} fn - The function to call for each value
     * @category Iteration
     */
    forEachV (fn) {
        this.forEach((v/*, k*/) => fn(v));
    }

    /**
     * Returns an array of all keys in the map
     * @returns {Array} An array containing all keys
     * @category Conversion
     */
    keysArray () {
        return Array.fromIterator(this.keys());
    }

    /**
     * Returns an array of all keys in the map, sorted
     * @returns {Array} An array containing all keys
     * @category Conversion
     */
    sortedKeysArray () {
        // TODO: implement caching?
        return this.keysArray().sort();
    }

    /**
     * Returns a set of all keys in the map
     * @returns {Set} A set containing all keys
     * @category Conversion
     */
    keysSet () {
        return Set.fromIterator(this.keys());
    }

    /**
     * Returns an array of all values in the map
     * @returns {Array} An array containing all values
     * @category Conversion
     */
    valuesArray () {
        return Array.fromIterator(this.values());
    }

    /**
     * Returns a set of all values in the map
     * @returns {Set} A set containing all values
     * @category Conversion
     */
    valuesSet () {
        return Set.fromIterator(this.values());
    }

    /**
     * Merges this map's entries into another map
     * @param {Map} aMap - The map to merge into
     * @category Modification
     */
    mergeInto (aMap) {
        this.forEachKV((k, v) => aMap.set(k, v));
    }

    /**
     * Merges another map's entries into this map
     * @param {Map} aMap - The map to merge from
     * @category Modification
     */
    merge (aMap) {
        aMap.forEachKV((k, v) => this.set(k, v));
    }

    /**
     * Filters the map in-place, keeping only entries that satisfy the given predicate
     * @param {function(*, *): boolean} fn - The predicate function
     * @returns {Map_ideal} This map instance
     * @category Filtering
     */
    selectInPlaceKV (fn) {
        const keys = this.keysArray();
        keys.forEach(k => {
            const v = this.get(k);
            if (!fn(k, v)) {
                this.delete(k);
            }
        });
        return this;
    }

    /**
     * Creates a new map with entries that satisfy the given predicate
     * @param {function(*, *): boolean} fn - The predicate function
     * @returns {Map_ideal} A new filtered map
     * @category Filtering
     */
    select (fn) {
        const m = new this.constructor();
        this.forEach((v, k) => {
            if (fn(k, v)) {
                m.set(k, v);
            }
        });
        return m;
    }

    /**
     * Checks if this map is equal to another map
     * @param {Map} aMap - The map to compare with
     * @returns {boolean} True if the maps are equal, false otherwise
     * @category Comparison
     */
    isEqual (otherMap) {
        if (Type.isNullOrUndefined(otherMap)) {
            return false;
        }

        if (otherMap.count === undefined || otherMap.get === undefined) {
            return false;
        }

        if (this.count() !== otherMap.count()) {
            return false;
        }

        for (let k of this.keys()) {
            const v1 = this.get(k);
            const v2 = otherMap.get(k);
            if (v1 !== v2) {
                if (v1.isEqual && v2.isEqual) {
                    if (!v1.isEqual(v2)) {
                        return false;
                    }
                } else {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Checks if the map is empty
     * @returns {boolean} True if the map is empty, false otherwise
     * @category Information
     */
    isEmpty () {
        return this.size === 0;
    }

    /**
     * Converts the map to a plain object
     * @returns {Object} A plain object representation of the map
     * @category Conversion
     */
    asDict () {
        const dict = {};
        this.forEachKV((k, v) => dict[k] = v);
        return dict;
    }

    /**
     * Populates the map from a plain object
     * @param {Object} aDict - The object to populate from
     * @returns {Map_ideal} This map instance
     * @category Conversion
     */
    fromDict (aDict) {
        this.clear();
        Object.entries(aDict).forEach(([k, v]) => this.set(k, v));
        return this;
    }

    /**
     * Returns a string description of the map
     * @returns {string} A JSON string representation of the map
     * @category Conversion
     */
    description () {
        return JSON.stableStringifyWithStdOptions(this.asDict(), null, 2); // may throw error if values aren't json compatible
    }

    /**
     * Reorders a key to be before another key
     * @param {*} keyToMove - The key to move
     * @param {*} beforeKey - The key to move before
     * @returns {Map_ideal} This map instance
     * @category Reordering
     */
    reorderKeyToBeBefore (keyToMove, beforeKey) {
        if (!this.has(keyToMove) || !this.has(beforeKey)) {
            return this;
        }

        const value = this.get(keyToMove);
        this.delete(keyToMove);

        const entries = Array.from(this.entries());
        this.clear();

        let keyInserted = false;
        for (const [key, val] of entries) {
            if (key === beforeKey && !keyInserted) {
                this.set(keyToMove, value);
                keyInserted = true;
            }
            if (key !== keyToMove) {
                this.set(key, val);
            }
        }

        return this;
    };

    /**
     * Reorders a key to be after another key
     * @param {*} keyToMove - The key to move
     * @param {*} afterKey - The key to move after
     * @returns {Map_ideal} This map instance
     * @category Reordering
     */
    reorderKeyToBeAfter (keyToMove, afterKey) {
        if (!this.has(keyToMove) || !this.has(afterKey)) {
            return this;
        }

        const value = this.get(keyToMove);
        this.delete(keyToMove);

        const entries = Array.from(this.entries());
        this.clear();

        for (const [key, val] of entries) {
            this.set(key, val);
            if (key === afterKey) {
                this.set(keyToMove, value);
            }
        }

        return this;
    }

    /**
     * Creates an index of the map's values based on a method call
     * @param {string} methodName - The name of the method to call on each value
     * @returns {Map} A new map where keys are method results and values are sets of matching entries
     * @category Indexing
     */
    indexedByMethod (methodName) {
        const index = new Map();
        this.valuesArray().forEach(v => {
            const methodResult = v[methodName]();
            let matchSet = index.get(methodResult);
            if (!matchSet) {
                matchSet = new Set();
                index.set(methodResult, matchSet);
            }
            matchSet.add(v);
        });
        return index;
    }

    /**
     * Creates a new map with keys and values swapped
     * @returns {Map_ideal} A new map with inverted key-value pairs
     * @category Conversion
     */
    inverted () {
        const invertedMap = new this.constructor();
        this.forEachKV((k, v) => {
            invertedMap.set(v, k);
        });
        return invertedMap;
    }

    /**
     * Returns a 64-bit hash code for the map
     * @returns {number} A 64-bit hash code
     * @category Information
     */
    hashCode64 () {
        const prime = 31;
        let result = 0;

        for (const [key, value] of this) {
            const keyHash = Type.hashCode64(key);
            const valueHash = Type.hashCode64(value);
            const entryHash = (keyHash + (valueHash * prime)) | 0;  // Combine key and value hashes
            result = (result + entryHash * prime) | 0;  // Update result with entryHash
        }

        return result;
    };

}).initThisCategory();
