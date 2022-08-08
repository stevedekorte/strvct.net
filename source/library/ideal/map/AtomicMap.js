"use strict";

/*

    AtomicMap
 
*/

getGlobalThis().ideal.AtomicMap = class AtomicMap extends ProtoClass {

    initPrototype () {
        this.newSlot("isInTx", false) // public read, private write - Bool, true during a tx
        this.newSlot("map", null) // public read, private write - Map, contains current state of map
        this.newSlot("snapshot", null) // private - Map, contains shallow copy of map before tx which we can revert to if tx is cancelled
        this.newSlot("isOpen", true) // public read, private write
        this.newSlot("changedKeySet", null) // private method
        this.newSlot("keysAndValuesAreStrings", true) // private method - Bool, if true, runs assertString on all input keys and values
    }

    init () {
        super.init()
        this.setMap(new Map())
        this.setSnapshot(null)
        this.setChangedKeySet(new Set())
        //this.setSnapshot(new Map())
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
        this.setSnapshot(this.map().shallowCopy()) 
        this.changedKeySet().clear()
        this.setIsInTx(true)
        return this
    }

    revert () {
        this.debugLog(() => this.type() + " revert ---")
        this.assertInTx()
        this.setMap(this.snapshot())
        this.setSnapshot(null)
        this.changedKeySet().clear()
        this.setIsInTx(false)
        return this
    }

    commit () {
        this.debugLog(() => this.type() + " prepare commit ---")
        this.assertInTx()
        if (this.hasChanges()) {
            this.applyChanges()
        }
        this.changedKeySet().clear()
        this.setIsInTx(false)
        return this
    }

    // --- changes ---

    hasChanges () {
        return this.changedKeySet().size > 0
        return this.map().isEqual(this.snapshot())
    }

    applyChanges () { // private - apply changes to snapshot
        this.setSnapshot(null)
        return this
    }

    // need to make sure writes happen within a transaction

    assertInTx () { // private
	    assert(this.isInTx())
    }

    assertNotInTx () { // private
	    assert(!this.isInTx())
    }

    // reads

 
    // --- keys ---

    keysArray () {
        return this.map().keysArray()
    }

    keysSet () {
        return this.map().keysSet()
    }

    // --- values ---

    valuesArray () {
        return this.map().valuesArray()
    }

    valuesSet () {
        return this.map().valuesSet()
    }

    // ---

    has (k) {
        return this.map().has(k)
    }

    hasKey (k) {
        return this.map().hasKey(k)
    }

    at (k) {
        return this.map().at(k)
    }

    // writes

    clear () {
        this.keysArray().forEach(k => this.removeKey(k))
        return this
    }

    set (k, v) {
        return this.atPut(k, v)
    }

    atPut (k, v) {
        this.assertInTx()
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k))
            assert(Type.isString(v))
        }

        console.log(this.debugTypeId() + " atPut('" + k + "', <" + typeof(v) + "> '" + v + "')")
        this.assertAccessible()
        this.assertInTx()
        this.changedKeySet().add(k)
        this.map().set(k, v)
        return this
    }

    removeKey (k) {
        this.assertInTx()
        this.changedKeySet().add(k)
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k))
        }

        this.assertAccessible()
        this.assertInTx()
        this.map().delete(k) 
        return this
    }

    // --- enumeration ---

    forEachKV (fn) {
        this.assertNotInTx() 
        this.assertAccessible()
        this.map().forEach((v, k, self) => fn(k, v, self))
    }

    forEachK (fn) {
        this.assertNotInTx() 
        this.assertAccessible()
        this.map().forEach((v, k) => fn(k))
    }

    forEachV (fn) {
        this.assertNotInTx() 
        this.assertAccessible()
        this.map().forEach(v => fn(v))
    }

    // read extras 

    keysArray () {
        return this.map().keysArray();
    }
	
    valuesArray () {
        return this.map().valuesArray();
    }

    count () { 
        return this.map().size;
    }	

    totalBytes () {
        this.assertNotInTx()
        this.assertAccessible()
        assert(this.keysAndValuesAreStrings())
        let byteCount = 0
        this.map().ownForEachKV((k, v) => {
            byteCount += k.length + v.length
        })
        return byteCount
    }

    asJson () {
        return this.map().asDict()
    }

    fromJson (json) {
        this.map().clear()
        this.map().fromDict(json)
        return this
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

