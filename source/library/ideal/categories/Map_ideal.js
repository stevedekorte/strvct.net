"use strict";

/*

    Map_ideal

    Some extra methods for the Javascript Map primitive.

*/

(class Map_ideal extends Map {

    deepCopy (refMap = new Map()) { // refMap is used to deal with multiple refs to same object, this includes cycles
        const m = new this.constructor();

        this.forEachKV((k, v) => {
            m.set(k, Type.deepCopyForValue(v, refMap));
        });

        return m;
    }

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

    // --- reordering ---

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


}).initThisCategory();

    