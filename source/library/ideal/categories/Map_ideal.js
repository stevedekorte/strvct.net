"use strict";

/*

    Map_ideal

    Some extra methods for the Javascript Set primitive.

*/

(class Map_ideal extends Map {
    /*
    shallowCopy () {
        return new Map(this)
    }
    */

    at (k) {
        return this.get(k)
    }

    atPut (k, v) {
        return this.set(k, v)
    }

    forEachKV (fn) {
        this.forEach((v, k, self) => fn(k, v, self))
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
        if (this.size !== aMap.size) {
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

}).initThisCategory();

    