"use strict";

/*

    StoreRef

*/


(class StoreRef extends Object {

    init () {
        super.init()
        Object.defineSlot(this, "_store", null) // move to initPrototype?
    }

    setPid (aPid) {
        this["*"] = aPid
        return this
    }

    pid () {
        return this.getOwnProperty("*")
    }

    setStore (aStore) {
        this._store = aStore
        return this
    }

    store () {
        return this._store
    }

    unref () {
        return this.store().objectForPid(this.pid())
    }

    ref () {
        return this.store().refForPid(this.pid())
    }
    
}.initThisClass());

