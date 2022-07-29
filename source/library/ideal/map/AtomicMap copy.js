"use strict";

/*

    AtomicMap
 
*/

getGlobalThis().ideal.AtomicMap = class AtomicMap extends ProtoClass {

    initPrototype () {
        this.newSlot("isInTx", false) // private method - Bool, true during a tx
        this.newSlot("snapshot", null) // private method - Map, contains state of map
        this.newSlot("changes", null) // private method - Map, contains changes to map since begin tx 
        this.newSlot("isOpen", true) // private method
        this.newSlot("keysAndValuesAreStrings", true) // private method - Bool, if true, runs assertString on all input keys and values
    }

    setSnapshot (v) {
        this._snapshot = v
        if (v) {
            console.log("setSnapshot:" + v.type())
        }
      //  debugger;
        return this
    }

    init () {
        super.init()
        this.setSnapshot(new Map())
        //this.setChanges(new Map()) // set during tx
    }

    open () {
        this.setIsOpen(true)
        return this
    }

    assertAccessible () {
        this.assertOpen()
    }

    assertOpen () {
        assert(this.isOpen())
    }

    asyncOpen (callback) {
        this.open()
        callback()
    }

    close () {
        this.setIsOpen(false)
        return this
    }

    begin () {
        this.debugLog(() => this.type() + " begin ---")
        this.assertAccessible()
        this.assertNotInTx()
        this.setChanges(new Map()) 
        this.setIsInTx(true)
        return this
    }

    revert () {
        this.debugLog(() => this.type() + " revert ---")
        this.assertInTx()
        this.setChanges(null)
        this.setIsInTx(false)
        return this
    }

    commit () {
        this.debugLog(() => this.type() + " prepare commit ---")
        this.assertInTx()
        if (this.hasChanges()) {
            this.applyChanges()
        }
        this.setChanges(null) 
        this.setIsInTx(false)
        return this
    }

    // --- changes ---

    hasChanges () {
        return this.changes() && this.changes().size > 0
    }

    applyChanges () { // private - apply changes to snapshot
        const snapshot = this.snapshot()
        this.changes().forEachKV((k, v) => {
            // treat undefined values as removes
            if (Type.isUndefined(v)) {
                snapshot.delete(k)
            } else {
                snapshot.set(k, v)
            }
        })
        return this
    }

    // need to make sure writes happen within a transaction

    assertInTx () { // private
	    assert(this.isInTx())
    }

    assertNotInTx () { // private
	    assert(!this.isInTx())
    }

    // writes

    has (k) {
        return this.hasKey(k)
    }

    hasKey (k) {
        const changes = this.changes()
        if (changes.has(k)) {
            if (Type.isUndefined(changes.get(k))) {
                return false
            }
            return true
        }
        return this.snapshot().has(k)
    }

    at (k) {
        const changes = this.changes()
        if (changes.has(k)) {
            return changes.get(k) // will return undefined if key removed (see removeKey)
        }
        return this.snapshot().get(k)
    }

    atPut (k, v) {
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k))
            assert(Type.isString(v))
        }

        this.assertAccessible()
        this.assertInTx()
        this.changes().set(k, v)
        return this
    }

    removeKey (k) {
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k))
        }

        this.assertAccessible()
        this.assertInTx()
        this.changes().set(k, undefined) // our marker for removing a key
        return this
    }

    // --- enumeration ---

    forEachKV (fn) {
        this.assertNotInTx() 
        this.assertAccessible()
        this.snapshot().forEach((v, k, self) => fn(k, v, self))
    }

    forEachK (fn) {
        this.assertNotInTx() 
        this.assertAccessible()
        this.snapshot().forEach((v, k) => fn(k))
    }

    forEachV (fn) {
        this.assertNotInTx() 
        this.assertAccessible()
        this.snapshot().forEach(v => fn(v))
    }

    // read extras 

    keysArray () {
        if (this.isInTx()) {
            return this.snapshot().keysArray()
        }
        this.assertNotInTx() // unless we want to calculate union w changes
        this.assertAccessible()
        return this.snapshot().keysArray();
    }
	
    valuesArray () {
        this.assertNotInTx() // unless we want to calculate union w changes
        this.assertAccessible()
        return this.snapshot().valuesArray();
    }

    count () { 
        this.assertNotInTx() // unless we want to calculate union w changes
        this.assertAccessible()
        return this.snapshot().count();
    }	

    totalBytes () {
        this.assertNotInTx()
        this.assertAccessible()
        assert(this.keysAndValuesAreStrings())
        let byteCount = 0
        this.snapshot().ownForEachKV((k, v) => {
            byteCount += k.length + v.length
        })
        return byteCount
    }

    // test

    static selfTest () {
        const m = this.clone()

        m.begin()
        m.atPut("foo", "bar")
        m.commit()

        assert(m.count() === 1)
        assert(m.Array()[0] === "foo")

        m.begin()
        m.removeAt("foo")
        m.commit()

        assert(m.count() === 0)

        return this
    }
}.initThisClass(); //.selfTest()

