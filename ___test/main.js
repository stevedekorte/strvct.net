

class Test {

  constructor () {
    this._wm = new UsableWeakMap()
    this._count = 0
  }

  run () {
    setInterval(() => this.onTimer(), 1)
  }

  onTimer () {
    const eventTypes = ["mousemove", "blur", "focus", "focusin", "focusout", "onFocusOut"];

    const k = "k" + this._count 

    const view = { }
    const div = document.createElement("div");  
    eventTypes.forEach(eventType =>  div.addEventListener(eventType, event => this.onEvent(event, eventType)))

    div.innerHTML = k
    document.body.appendChild(div)
    view._div = div
    div._view = view

    this._wm.set(k, div)
    this._count ++;
    if (this._count % 100 === 0) {
      const s = "count: " + this._count + " weakMap size: " + this._wm.size()
      console.log(s)
      //document.body.innerHTML = s
      this.removeAllElements()
    }

    //EventTarget.addEventListener
  }

  onEvent (event, eventType) {
    console.log("onEvent(" + eventType + ")")
  }

  removeAllElements () {
    const e = document.body
    while (e.lastChild) {
      e.removeChild(e.lastChild);
    }
  }
  

}

// -----------------------------------------

class UsableWeakMap {

    constructor () {
      this._refs = {}
      this._reg = new FinalizationRegistry(obj => this.onFinalizeValue(obj)) 
    }

    onFinalizeValue (v) {
      this.rawDeleteKeysWithValue(v)
    }

    rawDeleteKeysWithValue (v) {
      const refs = this._refs
      Object.keys(refs).forEach(k => {
        if (refs[k].deref() === v) {
          console.log("deleting key '" + k + "' for finalized object") 
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


new Test().run()