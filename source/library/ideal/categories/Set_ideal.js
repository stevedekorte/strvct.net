"use strict";

/**
 * @module library.ideal
 * @class Set_ideal
 * @extends Set
 * @description Extended Set class with additional utility methods.
 */
(class Set_ideal extends Set {

    /**
     * Creates a new Set from an iterator
     * @param {Iterator} iterator - The iterator to create the Set from
     * @returns {Set_ideal} A new Set containing the iterator's values
     * @category Creation
     */
    static fromIterator (iterator) {
        const results = new this()
        let entry = iterator.next()
        while (!entry.done) {
            const v = entry.value
            results.add(v)
            entry = iterator.next()
        }
        return results
    }

    addAll (anObject) {
        // we should support arrays, sets, and map values, and iterators
        if (anObject instanceof Array) {
            anObject.forEach(v => this.add(v));
        } else if (anObject instanceof Set) {
            anObject.forEach(v => this.add(v));
        } else if (anObject instanceof Map) {
            anObject.forEach((v, k) => this.add(k, v));
        } else if (anObject instanceof Iterator) {
            anObject.forEach(v => this.add(v));
        } else {
            throw new Error("Invalid argument type");
        }
    }

    /**
     * Checks if this set is equal to another set
     * @param {Set} aSet - The set to compare with
     * @returns {boolean} True if the sets are equal, false otherwise
     * @category Comparison
     */
    equals (aSet) {
        return this.size === aSet.size && [...this].every(v => aSet.has(v));
    }

    /**
     * Returns the number of elements in the set
     * @returns {number} The number of elements
     * @category Information
     */
    count () {
        return this.size
    }

    /**
     * Creates a shallow copy of the set
     * @returns {Set} A new Set with the same elements
     * @category Creation
     */
    shallowCopy () {
        return new Set(this);
    }

    /**
     * Creates a deep copy of the set
     * @param {Map} [refMap=new Map()] - A map to handle circular references
     * @returns {Set_ideal} A new Set with deeply copied elements
     * @category Creation
     */
    deepCopy (refMap = new Map()) {
        const newSet = new this.constructor();

        this.forEachV((v) => {
            newSet.add(Type.deepCopyForValue(v, refMap));
        });

        return newSet;
    }

    /**
     * Returns an array of all elements in the set
     * @returns {Array} An array containing all elements
     * @category Conversion
     */
    keysArray () {
        return Array.fromIterator(this.values())
    }

    /**
     * Returns an array of all elements in the set
     * @returns {Array} An array containing all elements
     * @category Conversion
     */
    valuesArray () {
        return this.keysArray()
    }

    /**
     * Returns an array of all elements in the set
     * @returns {Array} An array containing all elements
     * @category Conversion
     */
    asArray () {
        return this.keysArray()
    }
    
    /**
     * Iterates over the set, calling a function for each key-value pair
     * @param {function(*, *, Set_ideal): void} fn - The function to call for each entry
     * @category Iteration
     */
    forEachKV (fn) {
        this.forEach((v, k, self) => fn(k, v, self))
    }

    /**
     * Iterates over the set, calling a function for each key
     * @param {function(*): void} fn - The function to call for each key
     * @category Iteration
     */
    forEachK (fn) {
        this.forEach((v, k) => fn(k))
    }

    /**
     * Iterates over the set, calling a function for each value
     * @param {function(*): void} fn - The function to call for each value
     * @category Iteration
     */
    forEachV (fn) {
        this.forEach(v => fn(v))
    }

    /**
     * Checks if the set can detect an element that satisfies the given function
     * @param {function(*): boolean} func - The function to test each element
     * @returns {boolean} True if an element is detected, false otherwise
     * @category Search
     */
    canDetect (func) {
        const result = this.detect(func);
        return result !== undefined && result !== null;
    }
    
    /**
     * Finds the first element in the set that satisfies the given function
     * @param {function(*): boolean} fn - The function to test each element
     * @returns {*} The first element that satisfies the function, or undefined if none found
     * @category Search
     */
    detect (fn) {
        for (let v of this) {
            const r = fn(v)
            if (r === true) {
                return v;
            }
        }
        return undefined
    }

    /**
     * Alias for select method
     * @param {function(*): boolean} fn - The function to test each element
     * @returns {Array} An array of elements that satisfy the function
     * @category Filtering
     */
    filter (fn) {
        return this.select(fn)
    }
    
    /**
     * Returns an array of elements that satisfy the given function
     * @param {function(*): boolean} fn - The function to test each element
     * @returns {Array} An array of elements that satisfy the function
     * @category Filtering
     */
    select (fn) {
        return this.valuesArray().select(fn)
    }

    /**
     * Creates a new set with the results of calling a provided function on every element
     * @param {function(*): *} func - Function that produces an element of the new Set
     * @returns {Set} A new Set with each element being the result of the callback function
     * @category Transformation
     */
    map (func) {
        const result = new Set()
        this.forEach((v) => result.add(func(v)))
        return result
    }

    /**
     * Placeholder method to avoid throwing an error if the browser defines it
     * @private
     */
    isSubsetOf_isOptional () {
        // so exception isn't thrown if the browser defines it
    }

    /**
     * Checks if this set is a subset of another set
     * @param {Set} superSet - The set to check against
     * @returns {boolean} True if this set is a subset of superSet, false otherwise
     * @category Comparison
     */
    isSubsetOf (superSet) {
        return superSet.isSupersetOf(this);
    }

    /**
     * Placeholder method to avoid throwing an error if the browser defines it
     * @private
     */
    isSupersetOf_isOptional () {
        // so exception isn't thrown if the browser defines it
    }

    /**
     * Checks if this set is a superset of another set
     * @param {Set} subset - The set to check against
     * @returns {boolean} True if this set is a superset of subset, false otherwise
     * @category Comparison
     */
    isSupersetOf (subset) {
        if (this.size < subset.size) {
            return false
        }

        for (let v of subset) {
            if (!this.has(v)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Placeholder method to avoid throwing an error if the browser defines it
     * @private
     */
    union_isOptional () {
        // so exception isn't thrown if the browser defines it
    }
    
    /**
     * Returns a new set that is the union of this set and another set
     * @param {Set} setB - The set to union with
     * @returns {Set} A new set containing all elements from both sets
     * @category Set Operations
     */
    union (setB) {
        let _union = new Set(this);
        for (let v of setB) {
            _union.add(v);
        }
        return _union;
    }

    /**
     * Placeholder method to avoid throwing an error if the browser defines it
     * @private
     */
    intersection_isOptional () {
        // so exception isn't thrown if the browser defines it
    }
    
    /**
     * Returns a new set that is the intersection of this set and another set
     * @param {Set} setB - The set to intersect with
     * @returns {Set} A new set containing elements common to both sets
     * @category Set Operations
     */
    intersection (setB) {
        let _intersection = new Set();
        for (let elem of setB) {
            if (this.has(elem)) {
                _intersection.add(elem);
            }
        }
        return _intersection;
    }

    /**
     * Placeholder method to avoid throwing an error if the browser defines it
     * @private
     */
    symmetricDifference_isOptional () {
        // so exception isn't thrown if the browser defines it
    }

    /**
     * Returns a new set that is the symmetric difference of this set and another set
     * @param {Set} setB - The set to compute the symmetric difference with
     * @returns {Set} A new set containing elements in either set but not in both
     * @category Set Operations
     */
    symmetricDifference (setB) { 
        let _difference = new Set(this);
        for (let v of setB) {
            if (_difference.has(v)) {
                _difference.delete(v);
            } else {
                _difference.add(v);
            }
        }
        return _difference;
    }

    /**
     * Placeholder method to avoid throwing an error if the browser defines it
     * @private
     */
    difference_isOptional () {
        // so exception isn't thrown if the browser defines it
    }
    
    /**
     * Returns a new set that is the difference of this set and another set
     * @param {Set} setB - The set to subtract
     * @returns {Set} A new set containing elements in this set that are not in setB
     * @category Set Operations
     */
    difference (setB) {
        let _difference = new Set(this);
        for (let v of setB) {
            _difference.delete(v);
        }
        return _difference;
    }

    /**
     * Checks if the set is empty
     * @returns {boolean} True if the set is empty, false otherwise
     * @category Information
     */
    isEmpty () {
        return this.size == 0        
    }

    /**
     * Removes and returns an arbitrary element from the set
     * @returns {*} The removed element
     * @category Modification
     */
    pop () {
        const iter = this.values();
        const value = iter.next().value;
        return value
    }
    
    /**
     * Returns an immutable version of this set
     * @returns {ImmutableSet} An immutable set with the same elements as this set
     * @category Conversion
     */
    asImmutable () {
        return new ImmutableSet(this);
    }

    /**
     * Returns a 64-bit hash code for the set
     * @returns {number} A 64-bit hash code
     * @category Information
     */
    hashCode64 () {
        const prime = 31;
        let result = 0;
    
        for (const item of this) {
            result = (result + Type.hashCode64(item) * prime) | 0;  // Accumulate hash with prime multiplier
        }
    
        return result;
    }

}).initThisCategory();