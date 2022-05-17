"use strict";

/*

    Set-ideal

    Some extra methods for the Javascript Set primitive.

*/

(class Set_ideal extends Set {
    shallowCopy () {
        return new Set(this.values())
    }

    keysArray () {
        return Array.fromIterator(this.values())
    }

    valuesArray () {
        return this.keysArray()
    }

    detect (fn) {
        // TODO: optimize?
        return this.valuesArray().detect(fn)
    }

    select (fn) {
        // TODO: optimize?
        return this.valuesArray().select(fn)
    }

    isSuperset (subset) {
        for (let v of subset) {
            if (!this.has(v)) {
                return false;
            }
        }
        return true;
    }
    
    union (setB) {
        let _union = new Set(this);
        for (let v of setB) {
            _union.add(v);
        }
        return _union;
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
    
    difference (setB) {
        let _difference = new Set(this);
        for (let v of setB) {
            _difference.delete(v);
        }
        return _difference;
    }

    map (func) {
        const result = new Set()
        this.forEach((v) => result.add(func(v)))
        return result
    }

    isEmpty (func) {
        return this.size == 0        
    }

}).initThisCategory();

    
/*
    //Examples
    let setA = new Set([1, 2, 3, 4])
    let setB = new Set([2, 3])
    let setC = new Set([3, 4, 5, 6])
    
    setA.isSuperset(setB); // => true
    setA.union(setC); // => Set [1, 2, 3, 4, 5, 6]
    setA.intersection(setC); // => Set [3, 4]
    setA.symmetricDifference(setC); // => Set [1, 2, 5, 6]
    setA.difference(setC); // => Set [1, 2]
*/
