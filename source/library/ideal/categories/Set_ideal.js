"use strict";

/*

    Set_ideal
    
    Some extra methods for the Javascript Set primitive.

*/

(class Set_ideal extends Set {

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

    equals (aSet) {
        return this.size === aSet.size && [...this].every(v => aSet.has(v));
    }

    count () {
        return this.size
    }

    shallowCopy () {
        return new Set(this)
    }

    // --- keys and values ---

    keysArray () {
        return Array.fromIterator(this.values())
    }

    valuesArray () {
        return this.keysArray()
    }

    asArray () {
        return this.keysArray()
    }
    
    // --- enumeration ---

    forEachKV (fn) {
        this.forEach((v, k, self) => fn(k, v, self))
    }

    forEachK (fn) {
        this.forEach((v, k) => fn(k))
    }

    forEachV (fn) {
        this.forEach(v => fn(v))
    }

    // --- detect, select, map ---

    detect (fn) {
        for (let v of this) {
            const r = fn(v)
            if (r === true) {
                return v;
            }
        }
        return undefined
    }

    filter (fn) {
        return this.select(fn)
    }
    
    select (fn) {
        // should this return a Set?
        return this.valuesArray().select(fn)
    }

    map (func) {
        const result = new Set()
        this.forEach((v) => result.add(func(v)))
        return result
    }

    isSubsetOf_isOptional () {
        // so exception isn't thrown if the browser defines it
    }

    isSubsetOf (superSet) {
        return superSet.isSupersetOf(this);
    }

    isSupersetOf_isOptional () {
        // so exception isn't thrown if the browser defines it
    }

    isSupersetOf (subset) {
        if (this.size < subset.size) { // can't contain it with fewer keys
            return false
        }

        for (let v of subset) {
            if (!this.has(v)) {
                return false;
            }
        }
        return true;
    }

    union_isOptional () {
        // so exception isn't thrown if the browser defines it
    }
    
    union (setB) {
        let _union = new Set(this);
        for (let v of setB) {
            _union.add(v);
        }
        return _union;
    }

    intersection_isOptional () {
        // so exception isn't thrown if the browser defines it
    }
    
    intersection (setB) {
        let _intersection = new Set();
        for (let elem of setB) {
            if (this.has(elem)) {
                _intersection.add(elem);
            }
        }
        return _intersection;
    }

    symmetricDifference_isOptional () {
        // so exception isn't thrown if the browser defines it
    }
    
    symmetricDifference (setB) { 
        // return values in self that are not in setB + values in setB not in self
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

    difference_isOptional () {
        // so exception isn't thrown if the browser defines it
    }
    
    difference (setB) { // return values in self that are not in setB
        let _difference = new Set(this);
        for (let v of setB) {
            _difference.delete(v);
        }
        return _difference;
    }

    isEmpty (func) {
        return this.size == 0        
    }

    pop () {
        const iter = this.values();
        const value = iter.next().value;
        return value
    }

}).initThisCategory();

    
/*
    //Examples
    let setA = new Set([1, 2, 3, 4])
    let setB = new Set([2, 3])
    let setC = new Set([3, 4, 5, 6])
    
    setA.isSupersetOf(setB); // => true
    setA.union(setC); // => Set [1, 2, 3, 4, 5, 6]
    setA.intersection(setC); // => Set [3, 4]
    setA.symmetricDifference(setC); // => Set [1, 2, 5, 6]
    setA.difference(setC); // => Set [1, 2]
*/
