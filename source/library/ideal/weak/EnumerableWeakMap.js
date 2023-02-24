"use strict";

/*

  EnumerableWeakMap

  A Map with WeakRef values internally, but external API looks normal (gets and sets values).
  Unlike WeakMap, the keys can be strings, and it's entries are enumerable.

  Unlike WeakMap, keys can be primitives such as strings and numbers.
  All values should be objects (or null, numbers, strings) but cannot be undefined.

*/

getGlobalThis().EnumerableWeakMap = (class EnumerableWeakMap {

  constructor() {
    this._refs = new Map()
  }

  assertValidValue (v) {
    if (v === undefined) {
      throw new Error("values cannot be undefined as unref returns undefined after collection")
      return
    }
  }

  clear () {
    this._refs.clear()
  }

  has (k) {
    return this.get(k) !== undefined
  }

  get (k) {
    const refs = this._refs
    const wr = refs.get(k)
    if (wr) { 
      // make sure it's not collected yet
      const v = wr.deref()
      if (v === undefined) {
        refs.delete(k)
        return undefined
      }
      return v
    }
    return undefined
  }

  set (k, v) {
    this.assertValidValue(v)

    if (this.get(k) !== v) {
      this._refs.set(k, new WeakRef(v))
    }
    return this
  }

  delete (k) {
    const hasKey = this.has(k) // this may delete it if weakref is stale
    if (hasKey) {
      this._refs.delete(k)
    }
    return hasKey
  }

  forEach (fn) { // fn (value, key, map)
    // also removes collected keys
    const refs = this._refs
    let keysToRemove = null
    // fn(value, key, set)
    if (refs.size) {
      refs.forEach((wr, k) => {
        const v = wr.deref()
        if (v !== undefined) {
          fn(v, k, this)
        } else {
          if (!keysToRemove) {
            keysToRemove = []
          }
          keysToRemove.push(k)
        }
      })
    }
    if (keysToRemove) {
      keysToRemove.forEach(k => refs.delete(k))
    }
  }

  removeCollectedValues () {
    const refs = this._refs
    const keysToRemove = []
    if (refs.size) {
      refs.forEach((wr, k) => {
        const v = wr.deref()
        if (v === undefined) {
          keysToRemove.push(k)
        }
      })
    }
    keysToRemove.forEach(k => refs.delete(k))
  }

  count () {
    this.removeCollectedValues()
    // since weakrefs are only removed after a collection cycle, 
    // actual size of reachable objects may be lower than this 
    return this._refs.size 
  }

  keysArray () {
    const keys = []
    this.forEach((v, k) => {
      keys.push(k)
    })
    return keys
    //return this._refs.keysArray()
  }

  /*
  valuesSet () {
    return new Set(this._refs.values())
  }

  hasValue (v) {
    return this.valuesSet().has(v)
  }

  values () {
    const weakValues = this._refs.values()
    const values = weakValues.map(ref => ref.deref())
    return values.filter(v => v !== undefined)
  }
  */
});

//EnumerableWeakMap.selfTest()

