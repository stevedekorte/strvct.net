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
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @static
     * @description Returns the shared pool instance.
     * @returns {PersistentObjectPool} The shared pool instance.
     * @category Instance Management
     */
    static sharedPool () {
        return this.shared();
    }

    /**
     * @description Initializes the PersistentObjectPool.
     * @returns {PersistentObjectPool} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setName("defaultDataStore");
        this.setKvMap(PersistentAtomicMap.clone());
        //this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Throws an error as synchronous open is not available.
     * @throws {Error} Indicates that synchronous open is not available.
     * @category Operation
     */
    open () {
        throw new Error(this.svType() + " synchronous open not available - use promiseOpen()");
    }

    /**
     * @description Performs a self-test asynchronously.
     * @returns {Promise<void>}
     * @category Testing
     */
    async promiseSelfTest () {
        console.log(this.svType() + " --- self test start --- ");
        const store = this.thisClass().clone();
        await store.promiseOpen();
        this.selfTestOnStore(store);
    }

    /**
     * @description Performs a self-test on the given store.
     * @param {PersistentObjectPool} store - The store to test.
     * @category Testing
     */
    selfTestOnStore (store) {
        store.rootOrIfAbsentFromClosure(() => SvStorableNode.clone());
        //store.flushIfNeeded();
        console.log("store:", store.asJson());
        console.log(" --- ");
        store.collect();
        store.clearCache();
        const loadedNode = store.rootObject();
        console.log("loadedNode = ", loadedNode);
        console.log(this.svType() + " --- self test end --- ");
    }

    /**
     * @static
     * @description Schedules a self-test to run after a delay.
     * @returns {Promise<void>}
     * @category Testing
     */
    static async promiseSelfTest () {
        this.addTimeout(() => {
            return PersistentObjectPool.promiseSelfTest();
        }, 1000);
    }

}.initThisClass());
