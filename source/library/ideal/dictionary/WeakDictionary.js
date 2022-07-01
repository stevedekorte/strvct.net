"use strict";

/*

  WeakDictionary

  A dictionary with WeakRef values internally, but external API looks normal.
  Unlike WeakMap, the keys can be symbols, and it's entries are enumerable.

  All values should be objects.

  It is implemented using WeakRef and FinalizationRegistry.

  Notes:

  Not well tested yet.

  Frequent calls to these methods may not perform well for large maps:
    - values()
    - size()
    - hasValue(v)

*/

const globalFinReg = new FinalizationRegistry(aClosure => aClosure()) 

class WeakDictionary {

  static finReg () {

  }

  constructor () {
    this._refs = {}
    this._reg = new FinalizationRegistry(k => this.onFinalizeKey(k)) 
  }

  onFinalizeKey (k) {
    const refs = this._refs
    delete refs[k]
    if (k % 1000 === 0) {
      console.log("finalized:" + k + " size: " + this.size())
    }
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
    //this._reg.register(v, k, v)
    globalFinReg.register(v, () => { this.onFinalizeKey(k) }, v)
  }

  delete (k) {
    const ref = this._refs[k]
    if (ref !== undefined) {
      const v = ref.deref()
      delete this._refs[k]
      if (!this.hasValue(v)) {
        //this._reg.unregister(v)
        globalFinReg.unregister(v)
      }
    }
  }

  hasValue (v) {
    return this.values().indexOf(v) !== -1
  }

  values () {
    const weakValues = Object.values(this._refs)
    const values = weakValues.map(ref => ref.deref())
    return values.filter(v => v !== undefined)
  }

  size () {
    return Object.values(this._refs).length
    //return this.values().length
  }


  static selfTest () {
    const wd = new WeakDictionary()
    let count = 0
    setInterval(() => {
      const v = { k: count } // make sure it works with same value for multiple keys
      for (let i = 0; i < 1000; i++) {
        const k = count
        if (count === 100000) {
          console.log("------------")
        }
        if (count < 100000) {
          if (count % 1000 === 0) {
            console.log("adding:" + k + " size: " + wd.size())
            //console.log("adding:" + k)
          }
          wd.set(k, v)
        } else {
          if (count % 1000 === 0) {
            console.log("alloc:" + k + " size: " + wd.size())
            if (wd.size() === 0) {
              throw new Error("success")
            }
          }
        }

        count ++
      }
    }, 1)
  }
}

WeakDictionary.selfTest()