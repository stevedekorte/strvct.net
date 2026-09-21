/**
 * @module library.node.storage.base
 */

"use strict";

/**
 * @class SvPersistentObjectPool
 * @extends SvObjectPool
 * @classdesc An SvObjectPool that uses a SvPersistentAtomicMap to store its records.
 */
(class SvPersistentObjectPool extends SvObjectPool {

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
     * @returns {SvPersistentObjectPool} The shared pool instance.
     * @category Instance Management
     */
    static sharedPool () {
        return this.shared();
    }

    /**
     * @description Initializes the SvPersistentObjectPool.
     * @returns {SvPersistentObjectPool} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setName("defaultDataStore");
        this.setRecordStore(SvLocalRecordStore.clone()); // persistent: IndexedDB in the browser, LevelDB under Node
        this.setIsDebugging(false);
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

    isHomePool () {
        return true; // its id is settings.homePoolId; its root is the app's model
    }

    async promiseOpen () {
        const wasOpen = this.isOpen();
        this.recordStore().setHomePool(this);
        await super.promiseOpen();
        if (this.poolId()) {
            this.recordStore().registerPool(this);
        }
        if (!wasOpen && this.isOpen()) {
            this.deleteLegacyDatabase(); // the pre-records database of the same name: a reset, not a migration
            await this.asyncCollectChildPools();
        }
        return this;
    }

    setRootPid (pid) {
        super.setRootPid(pid);
        this.recordStore().registerPool(this);
        return this;
    }

    /**
     * @description Every other pool in the store (documents in folders) collects
     * its own records by reachability from its own root, as this pool just did.
     * @category Open
     */
    async asyncCollectChildPools () {
        const store = this.recordStore();
        for (const poolId of store.poolIds()) {
            if (poolId === this.poolId() || !store.rootRowForPool(poolId)) {
                continue;
            }
            const pool = store.poolForId(poolId);
            if (pool) {
                await pool.promiseCollect();
            }
        }
        return this;
    }

    /**
     * @description Removes the database this pool used before records (keyed by
     * puuid, a "root" pointer entry). Nothing reads it any more; deleting it
     * frees the space. Fire-and-forget: a failure only leaves it behind.
     * @category Open
     */
    deleteLegacyDatabase () {
        try {
            const legacy = SvIndexedDbFolder.clone().setPath(this.name());
            legacy.promiseDelete().catch(() => {});
        } catch {
            // no IndexedDB in this environment
        }
        return this;
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
     * @param {SvPersistentObjectPool} store - The store to test.
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

    async asyncTotalSize () {
        return await this.recordStore().kvMap().asyncTotalSize();
    }

    /**
     * @static
     * @description Schedules a self-test to run after a delay.
     * @returns {Promise<void>}
     * @category Testing
     */
    static async promiseSelfTest () {
        this.addWeakTimeout(() => {
            return SvPersistentObjectPool.promiseSelfTest();
        }, 1000);
    }

}.initThisClass());
