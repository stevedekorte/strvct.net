"use strict";

/** * @module library.ideal.weak
 */

/** * @class EnumerableWeakMap
 * @classdesc A Map with WeakRef values internally, but external API looks normal (gets and sets values).
 * Unlike WeakMap, the keys can be primitives such as strings and numbers, and it's entries are enumerable.
 * All values should be objects (or null, numbers, strings) but cannot be undefined.
 * @extends Map
 
 
 */

/**

 */
SvGlobals.globals().EnumerableWeakMap = (class EnumerableWeakMap extends Object {

    /**
   * Creates an instance of EnumerableWeakMap.
   * @category Initialization
   */
    constructor () {
        super();
        this._refs = new Map();
    }

    /**
   * Asserts that the provided value is valid (not undefined).
   * @param {*} v - The value to assert.
   * @throws {Error} - If the value is undefined.
   * @description Throws an error if the provided value is undefined because unref returns undefined after collection.
   * @category Validation
   */
    assertValidValue  (v) {
        if (v === undefined) {
            throw new Error("values cannot be undefined as unref returns undefined after collection");
        }
    }

    /**
   * Clears the EnumerableWeakMap instance.
   * @description Removes all key-value pairs from the EnumerableWeakMap instance.
   * @category Modification
   */
    clear () {
        this._refs.clear();
    }

    /**
   * Checks if the EnumerableWeakMap instance has the specified key.
   * @param {*} k - The key to check.
   * @returns {boolean} - True if the key exists, false otherwise.
   * @description Returns true if the specified key exists in the EnumerableWeakMap instance, false otherwise.
   * @category Lookup
   */
    has (k) {
        return this.get(k) !== undefined;
    }

    /**
   * Retrieves the value associated with the specified key.
   * @param {*} k - The key to retrieve the value for.
   * @returns {*} - The value associated with the key, or undefined if the key does not exist or the value has been garbage collected.
   * @description Retrieves the value associated with the specified key. If the key does not exist or the value has been garbage collected, it returns undefined.
   * @category Lookup
   */
    get (k) {
        const refs = this._refs;
        const wr = refs.get(k);
        if (wr) {
            // make sure it's not collected yet
            const v = wr.deref();
            if (v === undefined) {
                refs.delete(k);
                return undefined;
            }
            return v;
        }
        return undefined;
    }

    /**
   * Sets the value for the specified key.
   * @param {*} k - The key to set the value for.
   * @param {*} v - The value to set.
   * @returns {EnumerableWeakMap} - The EnumerableWeakMap instance.
   * @description Sets the value for the specified key. If the key already exists and the value is different, it creates a new WeakRef and updates the value.
   * @category Modification
   */
    set (k, v) {
        this.assertValidValue(v);

        if (this.get(k) !== v) {
            this._refs.set(k, new WeakRef(v));
        }
        return this;
    }

    /**
   * Removes the specified key from the EnumerableWeakMap instance.
   * @param {*} k - The key to remove.
   * @returns {boolean} - True if the key existed and was removed, false otherwise.
   * @description Removes the specified key from the EnumerableWeakMap instance and returns a boolean indicating whether the key existed and was removed.
   * @category Modification
   */
    delete (k) {
        const hasKey = this.has(k); // this may delete it if weakref is stale
        if (hasKey) {
            this._refs.delete(k);
        }
        return hasKey;
    }

    /**
   * Executes the provided function once for each key-value pair in the EnumerableWeakMap instance.
   * @param {Function} fn - The function to execute for each key-value pair.
   * @description Executes the provided function once for each key-value pair in the EnumerableWeakMap instance. The function is passed the value, key, and the EnumerableWeakMap instance itself. Also removes collected keys during iteration.
   * @category Iteration
   */
    forEach (fn, optionalRemovedKeysClosure = null) { // fn (value, key, map)
        // also removes collected keys
        const refs = this._refs;
        let keysToRemove = null;
        // fn(value, key, set)
        if (refs.size) {
            refs.forEach((wr, k) => {
                const v = wr.deref();
                if (v !== undefined) {
                    fn(v, k, this);
                } else {
                    if (!keysToRemove) {
                        keysToRemove = [];
                    }
                    keysToRemove.push(k);
                }
            });
        }

        if (keysToRemove) {
            keysToRemove.forEach(k => refs.delete(k));
        }

        if (optionalRemovedKeysClosure) {
            optionalRemovedKeysClosure(keysToRemove);
        }
    }

    /**
   * Executes the provided function once for each key-value pair, with key first.
   * @param {Function} fn - The function to execute for each key-value pair (receives key, value, map).
   * @description Like forEach but passes key before value to match Map_ideal convention.
   * @category Iteration
   */
    forEachKV (fn) { // fn (key, value, map)
        this.forEach((v, k, self) => fn(k, v, self));
    }

    /**
   * Executes the provided function once for each key.
   * @param {Function} fn - The function to execute for each key.
   * @description Executes the provided function once for each key in the EnumerableWeakMap instance.
   * @category Iteration
   */
    forEachK (fn) { // fn (key)
        this.forEach((v, k) => fn(k));
    }

    /**
   * Removes collected values from the EnumerableWeakMap instance.
   * @description Removes collected values (values that have been garbage collected) from the EnumerableWeakMap instance.
   * @category Maintenance
   */
    removeCollectedValues () {
        const refs = this._refs;
        const keysToRemove = [];
        if (refs.size) {
            refs.forEach((wr, k) => {
                const v = wr.deref();
                if (v === undefined) {
                    keysToRemove.push(k);
                }
            });
        }
        keysToRemove.forEach(k => refs.delete(k));
    }

    /**
   * Returns the number of key-value pairs in the EnumerableWeakMap instance.
   * @returns {number} - The number of key-value pairs in the EnumerableWeakMap instance.
   * @description Returns the number of key-value pairs in the EnumerableWeakMap instance. Note that since WeakRefs are only removed after a collection cycle, the actual size of reachable objects may be lower than this.
   * @category Information
   */
    count () {
        this.removeCollectedValues ();
        // since weakrefs are only removed after a collection cycle,
        // actual size of reachable objects may be lower than this
        return this._refs.size;
    }

    /**
   * Returns an array of keys in the EnumerableWeakMap instance.
   * @returns {Array} - An array of keys in the EnumerableWeakMap instance.
   * @description Returns an array of keys in the EnumerableWeakMap instance.
   * @category Information
   */
    keysArray () {
        const keys = [];
        this.forEach((v, k) => {
            keys.push(k);
        });
        return keys;
    //return this._refs.keysArray()
    }
});

//EnumerableWeakMap.selfTest()
