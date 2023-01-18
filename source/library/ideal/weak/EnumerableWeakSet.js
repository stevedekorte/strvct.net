"use strict";

/*

  EnumerableWeakSet

  A Set with WeakRef values internally, but external API looks normal (gets and sets values).
  Unlike WeakSet, it's values are enumerable.
  
  Internally, a EnumerableWeakMap of value puuid keys to weakrefs is used so we can
  implement add(), has(), delete() etc quickly (i.e. without enumerating all weakref values).

*/

getGlobalThis().EnumerableWeakSet = (class EnumerableWeakSet {

  constructor () {
    this._refs = new EnumerableWeakMap()
  }

  assertValidValue (v) {
    if (v === undefined) {
      throw new Error("values cannot be undefined as unref returns undefined after collection")
      return
    }
  }

  add (v) {
    this.assertValidValue(v)

    const refs = this._refs
    const pid = v.puuid()
    if (!refs.has(pid)) {
      refs.set(pid, v)
    }

    return this
  }

  clear () {
    this._refs.clear()
  }

  delete (v) {
    this.assertValidValue(v)

    const hadValue = this.has(v)
    if (hadValue) {
      this._refs.delete(v.puuid())
    }
    return hadValue
  }

  has (v) {
    this.assertValidValue(v)
    return this._refs.has(v.puuid())
  }

  keys () {
    return this.valuesArray()
  }

  values () {
    return this.valuesArray()
  }

  count () {
    return this._refs.count() // IMPORTANT: due to nature of WeakRefs, size may be smaller when actually used
  }

  forEach (fn) {
    this._refs.forEach(v => fn(v, v, this))
  }

  // --- extras ---

  entries () {
    throw new Error("unimplemented")
  }

  clearCollected () {
    this.forEach(v => {}) // forEach will remove any stale weakrefs
  }

  valuesSet () {
    const set = new Set()
    this.forEach(v => set.add(v))
    return set
  }

  valuesArray () {
    const a = new Array()
    this.forEach(v => a.push(v))
    return a
  }

  keysArray () {
    return this._refs.keysArray()
  }

});

//EnumerableWeakSet.selfTest()

