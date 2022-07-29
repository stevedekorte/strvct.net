"use strict";

/*

  UseableWeakMap

  A Map with WeakRef values internally, but external API looks normal (gets and sets values).
  Unlike WeakMap, the keys can be strings, and it's entries are enumerable.

  All values should be objects (or null, numbers, strings) but cannot be undefined.

  FinalizationRegistry is used to track reference collection.

  Notes:

  delete(k) has to check if there are any other keys with the same value before it unrefs the value

  Not well tested yet.

  Frequent calls to these methods may not perform well for large maps:
    - values()
    - size()
    - hasValue(v)

    QUESTIONS:

    What happens when we register the same object more than once? 
    - when the callback is the same, do we get 2 calls to it? when different, is each called
    What happens when the same object is registered in multiple FinalizationRegistries?
*/

class UseableWeakMap {

  constructor() {
    this._refs = new Map()
    this._reg = new FinalizationRegistry(k => this.onFinalizeKey(k))
  }

  finReg () {
    return this._reg
  }

  // ---

  onFinalizeKey (k) {
    const refs = this._refs
    refs.delete(k)
    //console.log("finalized:" + k + " size: " + refs.size)
  }

  has (k) {
    const refs = this._refs
    if (refs.has(k)) { 
      // make sure it's not collected yet
      const ref = refs.get(k)
      const v = ref.deref()
      if (v === undefined) { // we could still have the key if finalization callback hasn't occurred yet, so check
        return false
      }
      return true
    }
    return false
  }

  get (k) {
    const ref = this._refs.get(k)
    if (ref) {
      return ref.deref() // may return undefined if collected
    }
    return undefined
  }

  set (k, v) {
    if (v === undefined) {
      throw new Error("values cannot be undefined") // as unref returns undefined after collection
      return
    }

    if (this.has(k)) {
      if (v === this.get(k)) {
        return this // already set
      }
      this.delete(k) // will unregister old value
    }
    //if (!this.valuesSet().has(v)) {
      this._refs.set(k, new WeakRef(v))
      this.finReg().register(v, k, v)
    //}
    return this
  }

  delete (k) {
    const refs = this._refs
    if (refs.has(k)) {
      const ref = refs.get(k)
      const v = ref.deref()
      refs.delete(k)
      if (!this.hasValue(v)) { // only unregister if we have the last
        this.finReg().unregister(v)
      }
    }
  }

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

  size () {
    return this._refs.size
  }

  static selfTest() {

    const wd = new this()
    this._wd = wd
    let count = 0
    const maxCount = 100
    let interval = setInterval(() => { // need to return to event loop to allow collection
      for (let n = 0; n < 100; n++) {
        const v = { k: count } // make sure it works with same value for multiple keys
        for (let i = 0; i < 2; i++) {
          const k = count
          wd.set(k, v)
          count++
        }

        /*
        if (count % 1000 === 0) {
          console.log("adding:" + count + " size: " + wd.size())
        }
        */
      }

      if (count >= maxCount) {
        console.log("done adding values, now wait for collection. count: " + count + " size: " + wd.size())

        clearInterval(interval)
        this.completeSelfTest()
      }
    }, 0)
  }

  static completeSelfTest () {
    let clearCount = 0
    let dict = {}
    let interval = setInterval(() => { // force collection
      for (let n = 0; n < 10000; n++) {
        clearCount ++
        dict[clearCount] = { k: clearCount }
      }
      if (this._wd.size() === 0) {
        console.log("SUCCESS - all values collected and keys removed")
        clearInterval(interval)
      }
    }, 0)
  }
};

//UseableWeakMap.selfTest()

