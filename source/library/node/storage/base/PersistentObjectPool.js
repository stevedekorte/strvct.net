"use strict";

/*

    PersistentObjectPool

        An ObjectPool that uses a PersistentAtomicMap
        to store it's records.

*/

(class PersistentObjectPool extends ObjectPool {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        this.setName("defaultDataStore")
        this.setRecordsMap(PersistentAtomicMap.clone())
        //this.setIsDebugging(false)
        return this
    }

    open () {
        throw new Error(this.type() + " synchronous open not available - use promiseOpen()")
    }

    promiseSelfTest () {
        console.log(this.type() + " --- self test start --- ")
        const store = this.thisClass().clone()
        return store.promiseOpen().then(() => this.selfTestOnStore(store))
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

    static promiseSelfTest () {
        return new Promise((resolve, reject) => {
            this.addTimeout(() => { return PersistentObjectPool.promiseSelfTest() }, 1000)
        })
    }
    
}.initThisClass());



