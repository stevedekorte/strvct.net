/**
 * @module library.node.storage.base
 */

"use strict";

/**
 * @class PersistentObjectPool
 * @extends ObjectPool
 * @classdesc An ObjectPool that uses a PersistentAtomicMap to store its records.
 */
(class PersistentObjectPool extends ObjectPool {
    
    /**
     * @static
     * @description Initializes the class.
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes the prototype slots.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype.
     */
    initPrototype () {
    }

    /**
     * @static
     * @description Returns the shared pool instance.
     * @returns {PersistentObjectPool} The shared pool instance.
     */
    static sharedPool () {
        return this.shared();
    }

    /**
     * @description Initializes the PersistentObjectPool.
     * @returns {PersistentObjectPool} The initialized instance.
     */
    init () {
        super.init();
        this.setName("defaultDataStore");
        this.setRecordsMap(PersistentAtomicMap.clone());
        //this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Throws an error as synchronous open is not available.
     * @throws {Error} Indicates that synchronous open is not available.
     */
    open () {
        throw new Error(this.type() + " synchronous open not available - use promiseOpen()");
    }

    /**
     * @description Performs a self-test asynchronously.
     * @returns {Promise<void>}
     */
    async promiseSelfTest () {
        console.log(this.type() + " --- self test start --- ");
        const store = this.thisClass().clone();
        await store.promiseOpen();
        this.selfTestOnStore(store);
    }

    /**
     * @description Performs a self-test on the given store.
     * @param {PersistentObjectPool} store - The store to test.
     */
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

    /**
     * @static
     * @description Schedules a self-test to run after a delay.
     * @returns {Promise<void>}
     */
    static async promiseSelfTest () {
        this.addTimeout(() => { 
            return PersistentObjectPool.promiseSelfTest() 
        }, 1000);
    }
    
}.initThisClass());