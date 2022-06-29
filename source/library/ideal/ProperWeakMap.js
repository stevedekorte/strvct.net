"use strict";

/*

  ProperWeakMap

  Javascript's built in WeakMap doesn't support non-object types (such as strings/numbers/symbols)
  to be used as keys, which make it unusable for most caching purposes. This class supports such
  keys. It is implemented using WeakRef and FinalizationRegistry.

  Notes:

  Not well tested yet.

  Frequent calls to these methods may not perform well for large maps:
    - values()
    - size()
    - hasValue(v)

*/

class ProperWeakMap {

    constructor () {
      this._refs = {}
      this._reg = new FinalizationRegistry(obj => this.onFinalizeValue(obj)) 
    }

    onFinalizeValue (v) {
      this.privateDeleteKeysWithValue(v)
    }

    privateDeleteKeysWithValue (v) {
      const refs = this._refs
      Object.keys(refs).forEach(k => {
        if (refs[k].deref() === v) {
          //console.log("deleting key '" + k + "' for finalized object") 
          delete refs[k]
        }})
    }

    has (k) {
      const ref = this._refs[k]
      if (ref) {
        const v = ref.deref()
        if (v === undefined) {
          this.delete(k)
          return false
        }
        return v
      }
      return undefined
    }

    get (k) {
      const ref = this._refs[k]
      if (ref) {
        const v = ref.deref()
        if (v === undefined) {
          this.delete(k)
        }
        return v
      }
      return undefined
    }

    set (k, v) {
      if (v === undefined) {
        this.delete(k)
        return
      }

      if (this.has(k)) {
        if (v === this.get(k)) {
          return
        }
        this.delete(k)
      } 
      this._refs[k] = new WeakRef(v)
      this._reg.register(v)
    }

    delete (k) {
      const ref = this._refs[k]
      if (ref !== undefined) {
        delete this._refs[k]
        if (!this.hasValue(v)) {
          this._reg.unregister(v)
        }
      }
    }

    hasValue (v) {
      return this.values().contains(v)
    }

    values () {
      const weakValues = Object.values(this._refs)
      const values = weakValues.map(ref => ref.deref())
      return values.filter(v => v !== undefined)
    }

    size () {
      return this.values().length
    }
}
