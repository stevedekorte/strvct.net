"use strict";

/**
* @module library.ideal.weak
* @class EnumerableWeakSet
* @extends WeakSet
* @classdesc A Set with WeakRef values internally, but external API looks normal (gets and sets values).
* Unlike WeakSet, it's values are enumerable.
*
* Internally, a EnumerableWeakMap of value puuid keys to weakrefs is used so we can
* implement add(), has(), delete() etc quickly (i.e. without enumerating all weakref values).
*/
SvGlobals.globals().EnumerableWeakSet = (class EnumerableWeakSet extends Object {

    /**
    * @constructor
    * @category Initialization
    */
    constructor () {
        super();
        this._refs = new EnumerableWeakMap();
    }

    /**
    * @description Asserts that the provided value is valid (not undefined).
    * @param {*} v - The value to assert.
    * @category Validation
    */
    assertValidValue (v) {
        if (v === undefined) {
            throw new Error("values cannot be undefined as unref returns undefined after collection");
        }
    }

    /**
    * @description Adds a value to the EnumerableWeakSet.
    * @param {*} v - The value to add.
    * @returns {EnumerableWeakSet} This instance.
    * @category Modification
    */
    add (v) {
        this.assertValidValue(v);

        const refs = this._refs;
        const pid = v.puuid();
        if (!refs.has(pid)) {
            refs.set(pid, v);
        }

        return this;
    }

    /**
    * @description Clears all values from the EnumerableWeakSet.
    * @category Modification
    */
    clear () {
        this._refs.clear();
    }

    /**
    * @description Deletes a value from the EnumerableWeakSet.
    * @param {*} v - The value to delete.
    * @returns {boolean} True if the value was present and removed, false otherwise.
    * @category Modification
    */
    delete (v) {
        this.assertValidValue(v);

        const hadValue = this.has(v);
        if (hadValue) {
            this._refs.delete(v.puuid());
        }
        return hadValue;
    }

    /**
    * @description Checks if the EnumerableWeakSet has a given value.
    * @param {*} v - The value to check for.
    * @returns {boolean} True if the value is present, false otherwise.
    * @category Query
    */
    has (v) {
        this.assertValidValue(v);
        return this._refs.has(v.puuid());
    }

    /**
    * @description Returns an array of the values in the EnumerableWeakSet.
    * @returns {Array} An array of the values.
    * @category Query
    */
    keys () {
        return this.valuesArray();
    }

    /**
    * @description Returns an array of the values in the EnumerableWeakSet.
    * @returns {Array} An array of the values.
    * @category Query
    */
    values () {
        return this.valuesArray();
    }

    /**
    * @description Returns the count of values in the EnumerableWeakSet.
    * @returns {number} The count of values.
    * @description IMPORTANT: due to the nature of WeakRefs, the size may be smaller when actually used.
    * @category Query
    */
    count () {
        return this._refs.count();
    }

    /**
    * @description Executes a provided function once for each value in the EnumerableWeakSet.
    * @param {Function} fn - The function to execute for each value.
    * @category Iteration
    */
    forEach (fn) {
        this._refs.forEach(v => fn(v, v, this));
    }

    // --- extras ---

    /**
    * @description Unimplemented method.
    * @throws {Error} Throws an error indicating that the method is unimplemented.
    * @category Uncategorized
    */
    entries () {
        throw new Error("unimplemented");
    }

    /**
    * @description Clears any collected (stale) WeakRefs from the EnumerableWeakSet.
    * @category Maintenance
    */
    clearCollected () {
        this.forEach((v) => {
            if (v) {
                // noop
            }
        }); // forEach will remove any stale weakrefs
    }

    /**
    * @description Returns a Set containing all values in the EnumerableWeakSet.
    * @returns {Set} A Set containing all values.
    * @category Query
    */
    valuesSet () {
        const set = new Set();
        this.forEach(v => set.add(v));
        return set;
    }

    /**
    * @description Returns an array containing all values in the EnumerableWeakSet.
    * @returns {Array} An array containing all values.
    * @category Query
    */
    valuesArray () {
        const a = new Array();
        this.forEach(v => a.push(v));
        return a;
    }

    /**
    * @description Returns an array containing all keys (puuid values) in the EnumerableWeakSet.
    * @returns {Array} An array containing all keys.
    * @category Query
    */
    keysArray () {
        return this._refs.keysArray();
    }

});

//EnumerableWeakSet.selfTest()
