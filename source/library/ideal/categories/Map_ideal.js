"use strict";

/*

    Map_ideal

    Some extra methods for the Javascript Map primitive.

*/

(class Map_ideal extends Map {
    shallowCopy () {
        return new Map(this)
    }

    count () {
        return this.size
    }

    at (k) {
        return this.get(k)
    }

    atIfAbsentPut (k, v) {
        if (!this.has(k)) {
            this.set(k, v)
        }
        return this
    }

    hasKey (k) {
        return this.has(k)
    }

    atPut (k, v) {
        this.set(k, v)
        return this
    }

    removeKey (k) {
        this.delete(k)
        return this
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

    // --- keys ---

    keysArray () {
        return Array.fromIterator(this.keys())
    }

    keysSet () {
        return Set.fromIterator(this.keys())
    }

    // --- values ---

    valuesArray () {
        return Array.fromIterator(this.values())
    }

    valuesSet () {
        return Set.fromIterator(this.values())
    }

    // ---

    mergeInto (aMap) {
        this.forEachKV((k, v) => aMap.set(k, v))
    }


    merge (aMap) {
        aMap.forEachKV((k, v) => this.set(k, v))
    }

    select (fn) {
        const m = new this()
        this.forEach((v, k) => {
            if (fn(k, v)) {
                m.set(k, v)
            }
        })
        return m
    }

    isEqual (aMap) {
        if (this.count() !== aMap.count()) {
            return false
        }

        for (let k in this) {
            const v1 = this.get(k)
            const v2 = aMap.get(k)
            if (v1 !== v2) {
                return false
            }
        }
        
        return true
    }

    isEmpty () {
        return this.size === 0        
    }

    asDict () {
        const dict = {}
        this.forEachKV((k, v) => dict[k] = v)
        return dict
    }
    
    fromDict (aDict) {
        this.clear()
        aDict.ownForEachKV((k, v) => this.set(k, v))
        return this
    }

    description () {
        return JSON.stringify(this.asDict(), null, 2) // may throw error if values aren't json compatible
    }

}).initThisCategory();

    