"use strict";

/*

    PersistentObjectPool

        An ObjectPool that uses a PersistentAtomicMap
        to store it's records.

*/

(class PersistentObjectPool extends ObjectPool {
    
    static initClass () {
        this.setIsSingleton(true);
    }
    
    initPrototypeSlots () {
    }

    initPrototype () {
    }

    static sharedPool () {
        return this.shared();
    }

    init () {
        super.init();
        this.setName("defaultDataStore");
        this.setRecordsMap(PersistentAtomicMap.clone());
        //this.setIsDebugging(false);
        return this;
    }

    open () {
        throw new Error(this.type() + " synchronous open not available - use promiseOpen()");
    }

    async promiseSelfTest () {
        console.log(this.type() + " --- self test start --- ");
        const store = this.thisClass().clone();
        await store.promiseOpen();
        this.selfTestOnStore(store);
    }

    selfTestOnStore (store) {
        store.rootOrIfAbsentFromClosure(() => BMStorableNode.clone())
        //store.flushIfNeeded()
        console.log("store:", store.asJson())
        console.log(" --- ")
        store.collect()
        store.clearCache()
        const loadedNode = store.rootObject()
        console.log("loadedNode = ", loadedNode)
        console.log(this.type() + " --- self test end --- ")
    }

    static async promiseSelfTest () {
        this.addTimeout(() => { 
            return PersistentObjectPool.promiseSelfTest() 
        }, 1000);
    }
    
}.initThisClass());



