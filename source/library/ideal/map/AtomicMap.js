"use strict";

/*

    AtomicMap
 
*/

getGlobalThis().ideal.AtomicDictionary = class AtomicMap extends Object {

    initPrototype () {
        this.newSlot("isInTx", false) // private method - Bool, true during a tx
        this.newSlot("snapshot", null) // private method - Map, contains state of map
        this.newSlot("changes", null) // private method - Map, contains changes to map since begin tx 
        this.newSlot("isOpen", true) // private method
        this.newSlot("keysAndValuesAreStrings", true) // private method - Bool, if true, runs assertString on all input keys and values
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
        this.assertAccessible()
        this.assertNotInTx()
        this.setChanges(new Map()) 
        this.setInTx(true)
        return this
    }

    revert () {
        this.assertInTx()
        this.setChanges(null)
        this.setInTx(false)
        return this
    }

    commit () {
        this.assertInTx()
        this.applyChanges()
        this.setChanges(null) 
        this.setInTx(false)
        return this
    }

    applyChanges () {
        const snapshot = this.snapshot()
        const changes = this.changes()
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

    // just need to make sure writes happen within a transaction

    assertInTx () { // private
	    assert(this.isInTx())
    }

    assertNotInTx () { // private
	    assert(!this.isInTx())
    }

    // writes

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

    // extras 

    keys () {
        this.assertNotInTx() // unless we want to calculate union w changes
        this.assertAccessible()
        return this.snapshot().keys();
    }
	
    values () {
        this.assertNotInTx() // unless we want to calculate union w changes
        this.assertAccessible()
        return this.snapshot().values();
    }

    size () { 
        this.assertNotInTx() // unless we want to calculate union w changes
        this.assertAccessible()
        return this.snapshot().size;
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
        this.selfTest_changeEntries()
    }

    static selfTest_changeEntries () {
        // changeEntries test
        const ad1 = this.clone()
        const ad2 = this.clone()

        ad1.begin()
        ad1.atPut("foo", "bar")
        ad1.commit()

        ad1.begin()
        ad1.removeAt("foo")
        let entries = ad1.changeEntries()
        ad1.commit()

        ad2.commitApplyChangeEntries(entries)

        assert(ad1.isEqual(ad2))

        return this
    }
}.initThisClass(); //.selfTest()

