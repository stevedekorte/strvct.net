"use strict";

/*

    AtomicMap
 
*/

getGlobalThis().ideal.AtomicMap = class AtomicMap extends ProtoClass {

    initPrototypeSlots () {
        this.newSlot("isInTx", false); // public read, private write - Bool, true during a tx
        this.newSlot("map", null); // public read, private write - Map, contains current state of map
        this.newSlot("snapshot", null); // private - Map, contains shallow copy of map before tx which we can revert to if tx is cancelled
        this.newSlot("isOpen", true); // public read, private write
        this.newSlot("changedKeySet", null); // private method
        this.newSlot("keysAndValuesAreStrings", true); // private method - Bool, if true, runs assertString on all input keys and values
        this.newSlot("totalBytesCache", null); // private
        //this.newSlot("currentTxPromise", null); // private
        //this.newSlot("queuedSets", null);
        this.newSlot("beginPromiseFifoQueue", null); // first-in-first-out queue of promises, last in queue is was the earliest promise added
    }

    init () {
        super.init();
        this.setMap(new Map());
        this.setSnapshot(null);
        this.setChangedKeySet(new Set());
        //this.setSnapshot(new Map());
        //this.setQueuedSets([]);
        this.setBeginPromiseFifoQueue([]);
        this.setIsDebugging(false);
    }

    open () {
        this.setIsOpen(true);
        return this;
    }

    assertAccessible () {
        this.assertOpen();
    }

    assertOpen () {
        assert(this.isOpen());
    }

    async promiseOpen () {
        this.open();
    }

    close () {
        this.setIsOpen(false);
        return this;
    }

    begin () {
        throw new Error("deprecated - use promiseBegin");
    }
    
    async promiseBegin () {
        const lastPromise = this.beginPromiseFifoQueue().last();

        this.beginPromiseFifoQueue().push(Promise.clone()); // do this first so next caller will see we were here first

        if (lastPromise) {
            await lastPromise; // now we can await for the previous one, if there is one
        }

        this.debugLog(() => " begin --- (queue size is " + this.beginPromiseFifoQueue().length + ")");
        this.assertAccessible();
        this.assertNotInTx(); // if in TX then this has been used improperly as it should only be called once per event loop?
        this.setSnapshot(this.map().shallowCopy());
        this.changedKeySet().clear();
        this.setIsInTx(true);
    }

    revert () {
        this.debugLog(() => " revert ---");
        this.assertInTx();
        this.setMap(this.snapshot());
        this.setSnapshot(null);
        this.changedKeySet().clear();
        this.setIsInTx(false);
        this.onCompleteTx();
        return this
    }

    async promiseApplyChanges () {
        // for subclasses to implement
        await this.applyChanges();
    }

    async promiseCommit () {
        this.debugLog(() => " prepare commit ---");
        this.assertInTx();
        if (this.hasChanges()) {
            //await this.asyncProcessSetPromiseQueue()
            await this.promiseApplyChanges();
            this.changedKeySet().clear();
            this.clearTotalBytesCache();
        }
        this.onCompleteTx();
    }

    onCompleteTx () {
        this.setIsInTx(false);
        const currentPromise = this.beginPromiseFifoQueue().shift();
        currentPromise.callResolveFunc();
    }

    // --- changes ---

    hasChanges () {
        return this.changedKeySet().size > 0;
        //return this.changedKeySet().size > 0 || this.queuedSets().length > 0
    }

    applyChanges () { // private - apply changes to snapshot
        this.setSnapshot(null);
        return this;
    }

    // need to make sure writes happen within a transaction

    assertInTx () { // private
	    assert(this.isInTx());
    }

    assertNotInTx () { // private
	    assert(!this.isInTx());
    }

    // reads
 
    // --- keys ---

    keysArray () {
        return this.map().keysArray();
    }

    keysSet () {
        return this.map().keysSet();
    }

    // --- values ---

    valuesArray () {
        return this.map().valuesArray();
    }

    valuesSet () {
        return this.map().valuesSet();
    }

    // ---

    has (k) {
        return this.map().has(k);
    }

    hasKey (k) {
        return this.map().hasKey(k);
    }

    at (k) {
        return this.map().at(k);
    }

    // writes

    clear () {
        this.keysArray().forEach(k => this.removeKey(k));
        return this;
    }

    // --- async set ---

    /*
    async asyncQueueSetKvPromise (kvPromise) {
        const promise = Promise.clone();
        const kvTuple = await kvPromise

        assert(Type.isArray(kvTuple) && kvTuple.length == 2);
        const k = kvTuple[0];
        const v = kvTuple[1];
        this.set(k, v);
        promise.callResolveFunc();

        this.queuedSets().push(setPromise);
        return promise;
    }

    async asyncProcessSetPromiseQueue () {
        await Promise.all(this.queuedSets());
        this.setQueuedSets([]);
    }
    */

    // ---------------

    set (k, v) {
        return this.atPut(k, v);
    }

    atPut (k, v) {
        this.assertInTx();
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k));
            assert(Type.isString(v));
        }

        //console.log(this.debugTypeId() + " atPut('" + k + "', <" + typeof(v) + "> '" + v + "')")
        this.assertAccessible();
        this.assertInTx();
        this.changedKeySet().add(k);
        this.map().set(k, v);
        return this;
    }

    removeKey (k) {
        this.assertInTx();
        this.changedKeySet().add(k);
        if (this.keysAndValuesAreStrings()) {
            assert(Type.isString(k));
        }

        this.assertAccessible();
        this.assertInTx();
        this.map().delete(k);
        return this;
    }

    // --- enumeration ---

    forEachKV (fn) {
        this.assertNotInTx() ;
        this.assertAccessible();
        this.map().forEach((v, k, self) => fn(k, v, self));
    }

    forEachK (fn) {
        //this.assertNotInTx()  // why is this needed?
        this.assertAccessible();
        this.map().forEach((v, k) => fn(k));
    }

    forEachV (fn) {
        this.assertNotInTx();
        this.assertAccessible();
        this.map().forEach(v => fn(v));
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

    clearTotalBytesCache () {
        this.setTotalBytesCache(null);
        return this;
    }

    /*
    String.prototype.lengthInBytes = function () {
        return (new TextEncoder().encode(this)).length
    }
    */

    totalBytes () {
        const cachedResult = this.totalBytesCache();
        if (!Type.isNull(cachedResult)) {
            return cachedResult;
        }

        this.assertNotInTx();
        this.assertAccessible();
        assert(this.keysAndValuesAreStrings());
        let byteCount = 0;
        this.map().forEachKV((k, v) => {
            byteCount += k.length + v.length // not correct for unicode, but fast and good enough for now
            //byteCount += k.byteLength() + v.byteLength() // correct, but slow
        })
        this.setTotalBytesCache(byteCount);
        return byteCount;
    }

    asJson () {
        return this.map().asDict();
    }

    fromJson (json) {
        this.map().clear();
        this.map().fromDict(json);
        return this
    }

    // test

    static async selfTest () {
        const m = this.clone()

        // atPut test
        await m.promiseBegin();
        m.atPut("foo", "bar");
        await m.promiseCommit(); 
        assert(m.count() === 1)
        assert(m.Array()[0] === "foo")

        // removeAt test
        await m.promiseBegin();
        m.removeAt("foo");
        await m.promiseCommit();
        assert(m.count() === 0);

        return true;
    }

}.initThisClass(); //.selfTest()

