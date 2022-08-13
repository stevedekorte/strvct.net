"use strict";

/*

  EnumerableWeakMap

  A Map with WeakRef values internally, but external API looks normal (gets and sets values).
  Unlike WeakMap, the keys can be strings, and it's entries are enumerable.

  All values should be objects (or null, numbers, strings) but cannot be undefined.

*/

class EnumerableWeakMap {

  constructor() {
    this._refs = new Map()
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
        this.delete(k)
        return undefined
      }
      return v
    }
    return undefined
  }

  set (k, v) {
    if (v === undefined) {
      throw new Error("value cannot be undefined as weakref returns undefined after collection") 
      return
    }

    if (this.get(k) !== v) {
      this._refs.set(k, new WeakRef(v))
    }
    return this
  }

  delete (k) {
    const hasKey = this.has(k)
    if (hasKey) {
      this._refs.delete(k)
    }
    return hasKey
  }

  forEach (fn) { // fn (value, key, map)
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

  size () {
    return this._refs.size // due to nature of weakrefs, actual size may be lower than this when enumerated
  }

};

//EnumerableWeakMap.selfTest()

