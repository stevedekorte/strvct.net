"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool
 * @extends ProtoClass
 * @description

        For persisting a object tree to a JSON formatted representation and back.
        Usefull for both persistence and exporting object out the the app/browser and onto desktop or other browsers.

        This is a parent class for SvPersistentObjectPool, which just swaps out the recordDict SvAtomicMap,
        with a SvPersistentAtomicMap.

        An object pool can also be created by pointing at an object within another pool.

        JSON format of pool:

            {
                rootPid: "rootPid",
                puuidToDict: {
                    "<objPid>" : <Record>
                }
            }

        Example use:

            // converting a node to json
            const poolJson = SvObjectPool.clone().setRoot(rootNode).asJson()

            // converting json to a node
            const rootObject = SvObjectPool.clone().fromJson(poolJson).root()

        Notes:

        Objects to be stored must implement:

            // writing methods
            puuid
            recordForStore (aStore)

            // reading methods
            static instanceFromRecordInStore (aRecord, aStore)
            loadFromRecord (aRecord, aStore)

        These are implemented on Object, and other primitives such as Array, Set, etc.

*/

(class SvObjectPool extends ProtoClass {

    static instanceFromRecordInStore (/*aRecord, aStore*/) {
        throw new Error("We should not be calling instanceFromRecordInStore on SvObjectPool");
    }

    /**
     * @static
     * @description Returns whether instances of this class should be stored.
     * @returns {boolean}
     */
    static shouldStore () {
        return false;
    }

    /**
     * @static
     * @description Returns the set of all currently open ObjectPools.
     * Uses SvEnumerableWeakSet to allow pools to be garbage collected when no longer referenced.
     * @returns {SvEnumerableWeakSet}
     */
    /**
     * @description The pool an object is active in, or undefined. Objects belong
     * to one pool; the registry is filled when a pool adds an active object.
     * @param {Object} anObject
     * @returns {SvObjectPool|undefined}
     * @category Registry
     */
    static poolOfObject (anObject) {
        return this.objectPoolRegistry().get(anObject);
    }

    static objectPoolRegistry () {
        if (!this._objectPoolRegistry) {
            this._objectPoolRegistry = new WeakMap();
        }
        return this._objectPoolRegistry;
    }

    static fullUploadThreshold () {
        return 0.5; // the changed fraction of records above which a commit writes every record (and derives deletes) rather than diffing
    }

    static openPools () {
        if (!this._openPools) {
            this._openPools = new SvEnumerableWeakSet();
        }
        return this._openPools;
    }

    /**
     * @static
     * @description Notifies all open pools when an object's puuid changes.
     * This allows all pools tracking an object to update their internal mappings.
     * @param {Object} obj - The object whose puuid changed
     * @param {String} oldPid - The previous puuid
     * @param {String} newPid - The new puuid
     */
    static notifyAllPoolsOfPidChange (obj, oldPid, newPid) {
        this.openPools().forEach(pool => {
            if (pool.hasActiveObject(obj)) {
                pool.onObjectUpdatePid(obj, oldPid, newPid);
            }
        });
    }

    /**
     * @static
     * @description Force-marks an object as dirty in all open pools that contain it.
     * Used when schema changes require re-saving to purge stale slots.
     * @param {Object} anObject - The object to mark dirty
     */
    static forceAddDirtyObjectToAllPools (anObject) {
        let found = false;
        this.openPools().forEach(pool => {
            if (pool.hasActiveObject(anObject)) {
                pool.forceAddDirtyObject(anObject);
                found = true;
            }
        });
        if (!found) {
            console.warn("forceAddDirtyObjectToAllPools: " + anObject.svTypeId() + " (puuid:" + anObject.puuid() + ") not found in any open pool! openPools count: " + this.openPools().size);
        }
    }

    /**
     * @description initialize the prototype slots
     * @returns {void}
     */
    initPrototypeSlots () {
        /**
         * @member {String} name
         * @description the name of the object pool
         * @default "defaultDataStore"
         */
        {
            const slot = this.newSlot("name", "defaultDataStore");
            slot.setSlotType("String");
        }

        /**
         * @member {Object} rootObject
         * @description the root object of the object pool
         * @default null
         */

        {
            const slot = this.newSlot("rootObject", null);
            slot.setSlotType("Object");
        }

        /**
         * @member {SvAtomicMap} kvMap
         * @description the map of records for the object pool
         * @default null
         */
        {
            const slot = this.newSlot("recordStore", null);
            slot.setSlotType("SvLocalRecordStore");
            slot.setDescription("the record store holding this pool's rows (shared by every pool of one app)");
        }
        {
            const slot = this.newSlot("poolId", null);
            slot.setSlotType("String");
            slot.setDescription("the root object's puuid; the key prefix of every row of this pool");
        }
        {
            const slot = this.newSlot("parentNodeId", null);
            slot.setSlotType("String");
            slot.setDescription("root row placement: the owning collection node's id, or null for the home pool");
        }
        {
            const slot = this.newSlot("orderKey", null);
            slot.setSlotType("String");
            slot.setDescription("root row placement: this pool's sort key under its parent, or null");
        }
        {
            const slot = this.newSlot("leavingWindowedPids", null);
            slot.setSlotType("Set");
            slot.setFinalInitProto(Set);
            slot.setDescription("windowed elements detached from their collection whose rows are not deleted yet — a window load skips them");
        }
        {
            const slot = this.newSlot("isReplica", false);
            slot.setSlotType("Boolean");
            slot.setDescription("a replica: a read-only copy of a hosted document's projection — it loads each class's replicaClass() and never stores local changes (SvObjectPool_replica)");
        }
        {
            const slot = this.newSlot("lastSyncedSnapshot", null);
            slot.setSlotType("Object");
            slot.setDescription("cloud mirror: the pool.json (record JSON by puuid) as last uploaded or downloaded, for delta collection");
        }
        {
            const slot = this.newSlot("contentChangedObjects", null);
            slot.setSlotType("Set");
            slot.setDescription("objects whose stored content changed during the current flush; told once it ends");
        }
        {
            const slot = this.newSlot("nonEditPids", null);
            slot.setSlotType("Set");
            slot.setDescription("dirty objects whose pending change is not a local edit (applied from the cloud or a host); stored, not announced");
        }
        {
            const slot = this.newSlot("ownerUid", "local");
            slot.setSlotType("String");
            slot.setDescription("root row: the account that owns the pool; \"local\" until signed in");
        }

        /**
         * @member {SvEnumerableWeakMap} activeObjects
         * @description objects known to the pool (previously loaded or referenced)
         * @default null
         */
        {
            const slot = this.newSlot("activeObjects", null);
            slot.setDescription("objects known to the pool (previously loaded or referenced)");
            slot.setSlotType("SvEnumerableWeakMap");
        }

        /**
         * @member {Map} dirtyObjects
         * @description subset of activeObjects containing objects with mutations that need to be stored
         * @default null
         */
        {
            const slot = this.newSlot("dirtyObjects", null);
            slot.setDescription("subset of activeObjects containing objects with mutations that need to be stored");
            slot.setSlotType("Map");
        }

        /**
         * @member {Set} loadingPids
         * @description pids of objects that are currently being loaded
         * @default null
         */
        {
            const slot = this.newSlot("loadingPids", null);
            slot.setDescription("pids of objects that are currently being loaded");
            slot.setSlotType("Set");
        }

        /**
         * @member {Set} storingPids
         * @description pids of objects that are currently being stored
         * @default null
         */
        {
            const slot = this.newSlot("storingPids", null);
            slot.setDescription("pids of objects that are currently being stored");
            slot.setSlotType("Set");
        }

        /**
         * @member {Date} lastSyncTime
         * @description time of last sync. WARNING: vulnerable to system time changes/differences
         * @default null
         */
        {
            const slot = this.newSlot("lastSyncTime", null);
            slot.setDescription("Time of last sync. WARNING: vulnerable to system time changes/differences");
            slot.setSlotType("Date");
        }

        /**
         * @member {Set} markedSet
         * @description Set of puuids used during collection to mark objects that are reachable from the root
         * @default null
         */
        {
            const slot = this.newSlot("markedSet", null);
            slot.setDescription("Set of puuids used during collection to mark objects that are reachable from the root");
            slot.setSlotType("Set");
        }
        /*
        {
            const slot = this.newSlot("isReadOnly", false);
        }
        */

        /**
         * @member {SvNotification} nodeStoreDidOpenNote
         * @description Notification sent after pool opens
         * @default null
         */
        // TODO: change name to objectPoolDidOpen?
        {
            const slot = this.newSlot("nodeStoreDidOpenNote", null);
            slot.setDescription("Notification sent after pool opens");
            slot.setSlotType("SvNotification");
        }

        /**
         * @member {Boolean} isFinalizing
         * @description Set to true during method didInitLoadingPids() - used to ignore mutations during this period
         * @default false
         */
        {
            const slot = this.newSlot("isFinalizing", false);
            slot.setDescription("Set to true during method didInitLoadingPids() - used to ignore mutations during this period");
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Error|String} error
         * @description most recent error, if any
         * @default null
         */
        {
            const slot = this.newSlot("error", null); // most recent error, if any
            slot.setSlotType("Error");
        }

        /**
         * @member {Set} collectablePidSet
         * @description used during collection to store keys before tx begins
         * @default null
         */
        {
            const slot = this.newSlot("collectablePidSet", null); // used during collection to store keys before tx begins
            slot.setSlotType("Set");
        }

        /**
         * @member {Set} warnedDanglingRefPidSet
         * @description pids already reported by warnIfRefWillDangle, so one
         * bad subtree doesn't produce a wall of identical warnings
         * @default null
         */
        {
            const slot = this.newSlot("warnedDanglingRefPidSet", null);
            slot.setSlotType("Set");
        }

        /**
         * @member {Set} warnedMissingPidSet
         * @description pids already reported as missing, so a dangling subtree
         * reports once instead of on every load attempt and every save cycle
         * @default null
         */
        {
            const slot = this.newSlot("warnedMissingPidSet", null);
            slot.setSlotType("Set");
        }

        // blob pool
        {
            const slot = this.newSlot("blobPool", null);
            slot.setSlotType("SvBlobPool");
            slot.setDescription("Blob pool for storing blobs associated with the object pool");
        }


    }

    initPrototype () {
    }

    /**
     * @description initialize the object pool
     * @returns {void}
     */
    init () {
        super.init();
        this.setRecordStore(SvLocalRecordStore.clone().useMemoryMap());
        this.setActiveObjects(new SvEnumerableWeakMap());
        this.setDirtyObjects(new Map());
        this.setLoadingPids(new Set());
        this.setLastSyncTime(null);
        this.setMarkedSet(null);
        this.setBlobPool(SvBlobPool.clone());
        this.setNodeStoreDidOpenNote(this.newNoteNamed("nodeStoreDidOpen"));
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description set the debugging flag
     * @param {Boolean} b - the new debugging flag value
     * @returns {SvObjectPool}
     */
    setIsDebugging (b) {
        if (b === false && this.isDebugging() === true) {
            // make sure we're changing this for a good reason
        }
        super.setIsDebugging(b);
        return this;
    }

    /**
     * @description clear the cache
     * @returns {SvObjectPool}
     */
    clearCache () {
        this.setActiveObjects(new SvEnumerableWeakMap());
        this.setDirtyObjects(new Map());
        this.readRootObject();
        //this.setRootObject(this.objectForPid(this.rootObject().puuid()));
        return this;
    }

    // --- open ---

    /*
    open () { // this class can also be used with synchronous SvAtomicMap
        this.kvMap().setName(this.name());
        this.kvMap().open();
        this.onPoolOpenSuccess();
        return this
    }
    */

    /**
     * @async
     * @description open the object pool
     * @returns {Promise}
     */
    async promiseOpen () {
        const store = this.recordStore();
        if (store.isOpen() && this.hasOpened()) {
            return this;
        }
        try {
            if (!store.isOpen()) {
                store.setName(this.recordStoreName());
                await store.asyncOpenStore();
            }
            this.readHomePoolId();
            this._hasOpened = true;
            await this.asyncOpenBlobPool();
            await this.asyncPrefetchTextBlobsForRows(this.isHomePool() ? this.recordStore().allRows() : this.recordStore().rowsForPool(this.poolId()));
            await this.onPoolOpenSuccess();
            SvObjectPool.openPools().add(this);
        } catch (error) {
            this.onPoolOpenFailure(error);
        }
    }

    /**
     * @description The blob pool's database name: this pool's, with "/blobs".
     * @returns {String}
     * @category Blobs
     */
    blobPoolName () {
        return this.name() + "/blobs";
    }

    /**
     * @description Opens the blob pool under this pool's blob database name.
     * @returns {Promise}
     * @category Blobs
     */
    async asyncOpenBlobPool () {
        this.blobPool().setName(this.blobPoolName());
        await this.blobPool().asyncOpen();
    }

    /**
     * @description Removes every blob in this pool's blob database, opening it
     * first — before the store opens (a wipe at boot) the blob pool has no
     * name yet, and clearing it unnamed cleared another database.
     * @returns {Promise}
     * @category Blobs
     */
    async asyncClearBlobPool () {
        await this.asyncOpenBlobPool();
        await this.blobPool().asyncClear();
    }

    async promiseClose () {
        SvSyncScheduler.shared().unscheduleTargetAndMethod(this, "commitStoreDirtyObjects");
        SvSyncScheduler.shared().unscheduleTargetAndMethod(this, "asyncCollectBlobs");
        if (this.ownsRecordStore() && this.recordStore().isOpen()) {
            this.recordStore().close(); // synchronous in indexeddb; child pools share it
        }
        if (this.isHomePool() && this.blobPool().isOpen()) {
            await this.blobPool().close(); // child pools share it; the home pool owns it
        }
        this._hasOpened = false;
    }

    hasOpened () {
        return this._hasOpened === true;
    }

    /**
     * @description Opens a pool whose rows are already in an open record store:
     * nothing to await. Used for child pools reached through far refs.
     * @category Open
     */
    openSync () {
        assert(this.recordStore().isOpen(), "the record store must be open");
        this._hasOpened = true;
        SvObjectPool.openPools().add(this);
        return this;
    }

    /**
     * @description Deletes this pool: its rows, and — cascading down the
     * ownership tree — every pool whose root row is placed under one of this
     * pool's nodes. Live objects are released from the registry.
     * @category Deleting
     */
    async asyncDeletePool () {
        const store = this.recordStore();
        const childRoots = store.childPoolRootRows(this.allPidsSet());
        for (const row of childRoots) {
            const child = store.poolForId(row.poolId);
            if (child) {
                await child.asyncDeletePool();
            } else {
                await store.asyncDeletePool(row.poolId);
            }
        }
        SvSyncScheduler.shared().unscheduleTargetAndMethod(this, "commitStoreDirtyObjects");
        this.removeMutationObservations();
        this.setActiveObjects(new SvEnumerableWeakMap());
        this.setDirtyObjects(new Map());
        SvObjectPool.openPools().delete(this);
        store.forgetPool(this.poolId());
        await store.asyncDeletePool(this.poolId());
        return this;
    }

    // --- transactions (Plans/Client Transactions, M1) ---

    /**
     * @description Runs fn inside a transaction on this pool: fn is synchronous;
     * commit when it returns, rollback and rethrow when it throws. Nested on the
     * same pool it joins the open transaction; an inner throw poisons the whole
     * transaction even when an outer callback catches it.
     * @param {Function} fn
     * @returns {*} fn's result
     * @category Transactions
     */
    transaction (fn) {
        assert(this.storingPids() === null, "a transaction cannot begin during a store pass");
        const outer = SvTransactionContext.current();
        if (outer) {
            assert(outer.pool() === this, "a nested transaction must be on the same pool");
            try {
                return fn();
            } catch (error) {
                outer.setIsRollbackOnly(true);
                throw error;
            }
        }
        const transaction = SvTransaction.clone().setPool(this).begin();
        SvTransactionContext.push(transaction);
        let result;
        try {
            result = fn();
        } catch (error) {
            SvTransactionContext.pop(transaction);
            transaction.rollback();
            throw error;
        }
        SvTransactionContext.pop(transaction);
        if (transaction.isRollbackOnly()) {
            transaction.rollback();
            throw new Error("transaction poisoned by an inner failure — rolled back");
        }
        transaction.commit();
        return result;
    }

    currentTransaction () {
        const transaction = SvTransactionContext.current();
        return (transaction && transaction.pool() === this) ? transaction : null;
    }

    // --- root ---

    /**
     * @description get the root key
     * @returns {String}
     */
    rootKey () {
        return "root"; // the root pointer's key in asJson (the snapshot a cloud commit diffs against)
    }

    setRootPid (pid) {
        // private - called inside the store batch when the root object is stored
        if (this.poolId() !== pid) {
            assert(!this.hasStoredRoot(), "a pool's id is its root's puuid and cannot change once the root row exists");
            const previousId = this.poolId();
            this.setPoolId(pid);
            if (previousId) {
                this.rekeyRowsFromPool(previousId); // rows stored before the root was known (an anonymous pool)
            }
            if (this.isHomePool()) {
                this.recordStore().putSettingInBatch("homePoolId", pid);
            }
            if (this.isDebugging()) {
                console.log(this.logPrefix() + "---- SET POOL ID " + pid + " ----");
            }
        }
        return this;
    }

    rootPid () {
        return this.poolId();
    }

    /**
     * @description A pool may store records before it has a root (scratch pools,
     * tests): its rows are keyed under an anonymous id until a root names it.
     * @category Root
     */
    ensurePoolId () {
        if (!this.poolId()) {
            const root = this.rootObject();
            this.setRootPid(root ? root.puuid() : "anon-" + Object.newUuid());
        }
        return this;
    }

    rekeyRowsFromPool (previousId) { // private — inside the store batch
        const store = this.recordStore();
        store.rowsForPool(previousId).forEach((row) => {
            store.deleteRowInBatch(previousId, row.objectId);
            store.putRowInBatch(Object.assign({}, row, { poolId: this.poolId() }));
        });
        return this;
    }

    hasStoredRoot () {
        return !!this.poolId() && this.recordStore().hasRow(this.poolId(), this.poolId());
    }

    hasValidStoredRoot () {
        if (this.hasStoredRoot()) {
            const root = this.objectForPid(this.rootPid());
            if (Type.isNullOrUndefined(root)) {
                return false;
            }
            return true;
        }
        return false;
    }

    /**
     * @description Loads and returns the stored root object.
     * @returns {Object} The root object
     * @throws {Error} If no valid stored root exists
     * @category Root Management
     */
    loadStoredRoot () {
        if (!this.hasValidStoredRoot()) {
            throw new Error("No stored root in pool");
        }
        return this.readRootObject();
    }

    /**
     * @description get the root object or create it if it doesn't exist
     * @param {Function} aClosure - the closure to create the root object if it doesn't exist
     * @returns {Object}
     */
    rootOrIfAbsentFromClosure (aClosure) {
        if (this.hasValidStoredRoot()) {
            this.readRootObject();
        } else {
            if (!aClosure) {
                throw new Error("No stored root and no closure provided");
            }
            const newRoot = aClosure();
            assert(newRoot);
            this.setRootObject(newRoot);
        }
        return this.rootObject();
    }

    /**
     * @description read the root object
     * @returns {Object}
     */
    readRootObject () {
        //console.log(this.logPrefix() + " this.hasStoredRoot() = " + this.hasStoredRoot())

        if (this.hasStoredRoot()) {
            const root = this.objectForPid(this.rootPid()); // this call will actually internally set this._rootObject as we may need it while loading the root's refs
            //assert(!Type.isNullOrUndefined(root), this.svType() + " rootObject is null or undefined");
            if (Type.isNullOrUndefined(root)) {
                // this can happen is the root object class doesn't exist anymore
                console.log(this.logPrefix() + "readRootObject() rootObject is null or undefined");
                // we'll let the caller handle this
                return null;
            }
            this._rootObject = root;
            //this.setRootObject(root); // this is for setting up new root
            return this.rootObject();
        }
        throw new Error("missing root object");
    }

    /**
     * @description check if the object pool knows about the object. Does not check if the object is referenced within records, it should be in the kvMap if it is.
     * @param {Object} obj - the object to check
     * @returns {Boolean}
     */
    knowsObject (obj) { // private
        const puuid = obj.puuid();
        const foundIt = this.hasRecordForPid(puuid) ||
            this.activeObjects().has(puuid) ||
            this.dirtyObjects().has(puuid); // dirty objects check redundant with activeObjects?
        return foundIt;
    }

    /**
     * @description assert that the object pool is open
     * @returns {void}
     */
    assertOpen () {
        assert(this.isOpen());
    }

    /*
    changeOldPidToNewPid (oldPid, newPid) {
        // flush and change pids on all activeObjects
        // and pids and pidRefs in kvMap
        throw new Error("unimplemented");
        return this;
    }
    */

    /**
     * @description set the root object
     * @param {Object} obj - the new root object
     * @returns {SvObjectPool}
     */
    setRootObject (obj) { // only used for setting up a new root object
        this.assertOpen();
        if (this._rootObject) {
            // can support this if we change all stored and
            //this.changeOldPidToNewPid("root", Object.newUuid());
            throw new Error("can't change root object yet, unimplemented");
        }

        assert(!this.knowsObject(obj));


        //this.setRootPid(obj.puuid()); // this is set when the dirty root object is stored
        this._rootObject = obj;
        this.logDebug(" adding rootObject " + obj.svDebugId());
        this.addActiveObject(obj);
        this.addDirtyObject(obj);
        return this;
    }

    // ---  ---

    /**
     * @description convert the records map to a JSON string
     * @returns {String}
     */
    asJson () {
        // the cloud pool.json shape: every record's JSON by puuid, plus the root pointer
        const json = {};
        this.forEachRecordJson((pid, jsonString) => { json[pid] = jsonString; });
        if (this.poolId()) {
            json[this.rootKey()] = this.poolId();
            const placements = this.recordStore().placementsForPool(this.poolId());
            if (Object.keys(placements).length > 0) {
                json[this.placementsKey()] = JSON.stringify(placements); // a string, like every other value in the shape
            }
        }
        return json;
    }

    placementsKey () {
        return "_placements"; // windowed elements' { pid: [parentId, orderKey] } in the pool.json shape
    }

    forEachRecordJson (fn) {
        if (!this.poolId()) {
            return this;
        }
        this.recordStore().rowsForPool(this.poolId()).forEach((row) => {
            if (!row.isDeleted) {
                fn(row.objectId, row.payloadJson);
            }
        });
        return this;
    }

    /**
     * @description update the last sync time
     * @returns {SvObjectPool}
     */
    updateLastSyncTime () {
        this.setLastSyncTime(Date.now());
        return this;
    }

    // --- active and dirty objects ---

    /**
     * @description check if the object pool has the active object
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    hasActiveObject (anObject) {
        const puuid = anObject.puuid();
        return this.activeObjects().has(puuid);
    }

    /**
     * @description add an active object
     * @param {Object} anObject - the object to add
     * @returns {Boolean}
     */
    addActiveObject (anObject) {
        assert(!anObject.isClass());

        /*
        if (Type.isDictionary(anObject)) {
        }
        */
        /*
        if (anObject.svType() === "Error") {
            return false;
        }
        */


        if (Type.typeName(anObject) === "SvPersistentObjectPool") {
            const msg = "addActiveObject() called with SvPersistentObjectPool";
            console.warn(this.logPrefix() + msg);
            throw new Error(msg);
            //return false;
        }

        if (!anObject.shouldStore()) {
            const msg = "attempt to addActiveObject '" + anObject.svType() + "' but shouldStore is false. Adding anyway so we don't load it multiple times. Let's hope it's garbage collected.";
            console.warn(this.logPrefix() + msg);
            //anObject.shouldStore();
            //throw new Error(msg);
            //return false;
        }

        if (!anObject.isInstance()) {
            const msg = "can't store non instance of type '" + anObject.svType() + "'";
            console.warn(this.logPrefix() + msg);
            anObject.isKindOf(ProtoClass);
            throw new Error(msg);
        }

        if (!this.hasActiveObject(anObject)) {
            const other = SvObjectPool.poolOfObject(anObject);
            if (other && other !== this && other.hasActiveObject(anObject)) {
                console.warn(this.logPrefix() + "addActiveObject: " + anObject.svTypeId() + " is already active in pool " + other.poolId() + " — moving it to " + this.poolId());
                other.activeObjects().delete(anObject.puuid());
                other.dirtyObjects().delete(anObject.puuid());
                anObject.removeMutationObserver(other);
            }
            anObject.addMutationObserver(this);
            this.activeObjects().set(anObject.puuid(), anObject);
            SvObjectPool.objectPoolRegistry().set(anObject, this);
            SvTransactionContext.noteEnrolled(anObject, this);
        }
        return true;
    }

    /**
     * @description close the object pool
     * @returns {SvObjectPool}
     */
    close () {
        SvSyncScheduler.shared().unscheduleTargetAndMethod(this, "commitStoreDirtyObjects");
        SvObjectPool.openPools().delete(this);
        this.removeMutationObservations();
        this.setActiveObjects(new SvEnumerableWeakMap());
        this.setDirtyObjects(new Map());
        if (this.ownsRecordStore()) {
            this.recordStore().close();
        }
        this._hasOpened = false;
        return this;
    }

    /**
     * @description Whether closing this pool closes its record store: only the
     * pool that owns it (the home pool, or a pool with a store of its own) —
     * never a pool of a store that outlives its pools (an in-memory cache).
     * Child pools share the home pool's store — closing one (a document
     * re-imported from the cloud) used to close the whole local store, and
     * nothing persisted locally again until a reload (2026-09-24).
     * @returns {Boolean}
     * @category Lifecycle
     */
    ownsRecordStore () {
        const store = this.recordStore();
        if (store && store.outlivesItsPools && store.outlivesItsPools()) {
            return false;
        }
        const home = (store && store.homePool) ? store.homePool() : null;
        return !home || home === this;
    }

    /**
     * @description remove mutation observations
     * @returns {SvObjectPool}
     */
    removeMutationObservations () {
        this.activeObjects().forEachKV((puuid, obj) => {
            obj.removeMutationObserver(this); // activeObjects is super set of dirtyObjects
            if (SvObjectPool.poolOfObject(obj) === this) {
                SvObjectPool.objectPoolRegistry().delete(obj);
            }
        });
        return this;
    }

    /**
     * @description check if the object pool has dirty objects
     * @returns {Boolean}
     */
    hasDirtyObjects () {
        return !this.dirtyObjects().isEmpty();
    }

    /*
    hasDirtyObject (anObject) {
        const puuid = anObject.puuid();
        return this.dirtyObjects().has(puuid);
    }
    */

    /**
     * @description handle the object update pid event
     * @param {Object} anObject - the object that was updated
     * @param {String} oldPid - the old pid
     * @param {String} newPid - the new pid
     * @returns {void}
     */
    onObjectUpdatePid (anObject, oldPid, newPid) {
        // sanity check for debugging - could remove later
        if (this.hasActiveObject(anObject)) {
            const msg = "onObjectUpdatePid " + anObject.svTypeId() + " " + oldPid + " -> " + newPid;

            // Allow pid changes for singletons during loading (they may have been stored with different pids)
            const aClass = anObject.thisClass();
            const hasSingletonMethod = typeof aClass.isSingleton === "function";
            const isSingleton = hasSingletonMethod && aClass.isSingleton();

            if (this.isDebugging()) {
                console.log(this.logPrefix() + "onObjectUpdatePid check: " + aClass.svType() +
                    " hasSingletonMethod=" + hasSingletonMethod + " isSingleton=" + isSingleton);
            }

            if (isSingleton) {
                //console.warn(this.logPrefix() + "WARNING: singleton pid change allowed - " + msg);
                return; // Allow it for singletons
            }

            console.error(this.logPrefix() + msg);
            throw new Error(msg);
        }
    }

    /**
     * @description handle the object did mutate event
     * @param {Object} anObject - the object that was mutated
     * @param {String} slotName - the name of the slot that was mutated
     * @returns {void}
     */
    onDidMutateObject (anObject /* , slotName */) {
        // NOTE: no lazy-materialization filtering here. A blanket time-window
        // skip would also drop mutations of objects GENUINELY created or
        // changed by hooks during someone else's materialization — those must
        // be stored. The materialization write-back echo is filtered at its
        // precise source instead: the materializing instance's own didMutate
        // (SvStorableNode.didMutate, per-instance flag) and the cross-object
        // timestamp touch (SvSyncable*.touchLocalModified, global flag).
        //if (anObject.hasDoneInit() && ) {
        if (this.hasActiveObject(anObject) && !this.isLoadingObject(anObject) && anObject.shouldStore()) {
            this.addDirtyObject(anObject);
        }
    }

    /**
     * @description check if the object is being stored
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    isStoringObject (anObject) {
        const puuid = anObject.puuid();
        if (this.storingPids()) {
            if (this.storingPids().has(puuid)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description check if the object is being loaded
     * @param {Object} anObject - the object to check
     * @returns {Boolean}
     */
    isLoadingObject (anObject) { // private
        if (this.loadingPids()) {
            if (this.loadingPids().has(anObject.puuid())) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description add a dirty object
     * @param {Object} anObject - the object to add
     * @returns {SvObjectPool}
     */
    addDirtyObject (anObject) { // private
        if (anObject.thisClass && anObject.thisClass().isKindOf(SvObjectPool)) {
            throw new Error("attempt to addDirtyObject " + anObject.svTypeId() + " which is an SvObjectPool");
        }
        if (!this.hasActiveObject(anObject)) {
            console.log(this.logPrefix() + "looks like it hasn't been referenced yet");
            throw new Error("not referenced yet");
        }

        // Skip objects that shouldn't be stored
        if (!anObject.shouldStore()) {
            return this;
        }

        if (this.isReplica()) {
            return this; // a replica's rows mirror the host's projection; local changes are not its to store
        }

        const puuid = anObject.puuid();

        if (this.isStoringObject(anObject)) {
            // mutated AFTER being stored in the active commit pass. The old
            // silent return DROPPED the change — in-memory state diverged
            // from the stored record until the next genuine mutation. Defer
            // the fresh state to the next commit instead (tripwire-logged;
            // see deferDirtyObjectDuringStore).
            this.deferDirtyObjectDuringStore(anObject, this.deepStack());
            return this;
        }

        if (this.isLoadingObject(anObject)) {
            return this;
        }

        this.noteEditKindOfDirty(puuid);

        if (!this.dirtyObjects().has(puuid)) {
            this.logDebug(() => "addDirtyObject(" + anObject.svTypeId() + ")");
            if (this.storingPids() !== null) {
                // dirtied mid-pass but not yet stored this pass: legal (the
                // pass stores it in a later loop), but if it turns out the
                // object was ALREADY in the bucket being walked, the loop
                // guard will flag it — capture the culprit's stack now so
                // that report names the code that mutated during the store.
                // Capture DEEP: the culprit frame (whoever called the setter
                // / didUpdateNode) sits past V8's default 10-frame limit —
                // the didMutate→didUpdateSlot→setter plumbing alone eats the
                // whole default budget, so the report truncated exactly at
                // the frame that mattered.
                this.midStoreDirtyStacks().set(puuid, this.deepStack());
            }
            this.dirtyObjects().set(puuid, anObject);
            this.scheduleStore();
        }

        return this;
    }

    // --- mid-store mutation handling ---
    // An object mutated during the synchronous store pass, after the pass
    // already stored it, means its stored record is stale. The old behavior
    // threw, aborting the WHOLE commit (every save that cycle lost) and
    // surfacing as "attempt to double store <id>" with no clue WHO mutated.
    // Now: tripwire-log the mutation-time stack (console.error → error
    // reports) and re-queue the object for the next commit, which stores the
    // fresh state. The log is the bug report — mutating during a store pass
    // is still a defect to fix at the source; this just stops it from being
    // a data-loss crash.

    /**
     * @description The current stack, past V8's default 10 frames: the
     * didMutate→didUpdateSlot→setter plumbing alone fills those, so a report
     * truncated exactly at the frame that mattered.
     * @returns {String}
     */
    deepStack () {
        const savedLimit = Error.stackTraceLimit;
        Error.stackTraceLimit = 60;
        const stack = new Error().stack;
        Error.stackTraceLimit = savedLimit;
        return stack;
    }

    midStoreDirtyStacks () {
        if (!this._midStoreDirtyStacks) {
            this._midStoreDirtyStacks = new Map();
        }
        return this._midStoreDirtyStacks;
    }

    deferDirtyObjectDuringStore (anObject, dirtySourceStack) {
        const puuid = anObject.puuid();
        const stack = dirtySourceStack || this.midStoreDirtyStacks().get(puuid) || "(mutation-time stack not captured)";

        // A serializer that mutates ITS OWN stored slots re-defers every
        // commit forever (defer → next commit → same mutation → defer …).
        // Cap consecutive defers per pid: give up loudly, keep the stale
        // record (the pre-defer behavior), and break the commit loop. The
        // counter resets when the object gets through a pass without
        // re-deferring (see storeDirtyObjects).
        if (!this._consecutiveDeferCounts) {
            this._consecutiveDeferCounts = new Map();
        }
        const count = (this._consecutiveDeferCounts.get(puuid) || 0) + 1;
        this._consecutiveDeferCounts.set(puuid, count);
        if (count > 3) {
            console.error(this.logPrefix() + "TRIPWIRE: " + anObject.svTypeId() + " re-mutated during " + count + " consecutive store passes — giving up on it (stored record stays stale) to break the commit loop. Something mutates this object every time it is serialized; fix that. Mutation-time stack:\n" + stack);
            return this;
        }

        console.error(this.logPrefix() + "TRIPWIRE: " + anObject.svTypeId() + " was mutated during the store pass, after it was already stored this pass — deferring the fresh state to the next commit. Mutation-time stack:\n" + stack);
        if (!this._deferredDirtyObjects) {
            this._deferredDirtyObjects = new Map();
        }
        this._deferredDirtyObjects.set(puuid, anObject);
        return this;
    }

    /**
     * @description force add a dirty object - only use for when we change slots while loading an object from the store
     * @param {Object} anObject - the object to force add
     * @returns {SvObjectPool}
     */
    forceAddDirtyObject (anObject) {
        if (!anObject.shouldStore()) {
            return this;
        }

        if (!this.hasActiveObject(anObject)) {
            console.warn(this.logPrefix() + "forceAddDirtyObject(" + anObject.svTypeId() + ") not in pool - skipping");
            return this;
        }

        this.logDebug(() => "forceAddDirtyObject(" + anObject.svTypeId() + ")");
        if (this.storingPids() !== null) {
            // we might be in the middle of storing changes
            if (this.storingPids().has(anObject.puuid())) {
                // already STORED this pass (storingPids holds stored pids,
                // not queued ones) — the old silent skip dropped the change,
                // leaving a stale record; defer to the next commit instead
                this.deferDirtyObjectDuringStore(anObject, new Error().stack);
                return this;
            }
            this.midStoreDirtyStacks().set(anObject.puuid(), new Error().stack);
        }
        if (!this._forcedDirtyObjectsSet) {
            this._forcedDirtyObjectsSet = new Set();
        }
        this._forcedDirtyObjectsSet.add(anObject);

        this.dirtyObjects().set(anObject.puuid(), anObject);
        this.scheduleStore();
        return this;
    }

    /**
     * @description schedule the store of dirty objects
     * @returns {SvObjectPool}
     */
    scheduleStore () {
        if (!this.isOpen()) {
            console.warn(this.logPrefix() + "scheduleStore: can't schedule store yet, not open. Dirty count: " + this.dirtyObjects().size);
            return this;
        }
        assert(this.isOpen());
        const scheduler = SvSyncScheduler.shared();
        const methodName = "commitStoreDirtyObjects";
        if (!scheduler.isSyncingTargetAndMethod(this, methodName)) {
            if (!scheduler.hasScheduledTargetAndMethod(this, methodName)) {
                this.logDebug("scheduling commitStoreDirtyObjects dirty object count:" + this.dirtyObjects().size);
                scheduler.scheduleTargetAndMethod(this, methodName, 1000);
            }
        }
        return this;
    }

    // --- storing ---

    /**
     * @asynca
     * @description commit the store of dirty objects
     * @returns {void}
     */
    async commitStoreDirtyObjects () {
        if (!this.isOpen()) {
            return;
        }
        const transaction = this.currentTransaction();
        if (transaction) {
            transaction.setWasStoreDeferred(true); // the guard is at execution: commit reschedules, rollback writes nothing
            return;
        }
        this.logDebug("commitStoreDirtyObjects dirty object count:" + this.dirtyObjects().size);

        if (this.hasDirtyObjects()) {
            try {
                await this.recordStore().asyncBeginBatch();
                if (!this.isOpen()) {
                    this.recordStore().revertBatch();
                    return;
                }
                const storeCount = this.storeDirtyObjects();
                await this.recordStore().asyncCommitBatch();
                this.logDebug("--- commitStoreDirtyObjects end --- stored " + storeCount + " objects");
                this.logDebug("--- commitStoreDirtyObjects total objects: " + this.count());

                if (this._forcedDirtyObjectsSet) {
                    if (this._forcedDirtyObjectsSet.size !== 0) {
                        this.scheduleStore();
                    } else {
                        this._forcedDirtyObjectsSet = null;
                    }
                }
            } catch (error) {
                const isClosing = typeof SvIndexedDbTx !== "undefined" && SvIndexedDbTx.isConnectionClosingError && SvIndexedDbTx.isConnectionClosingError(error);
                if (!this.isOpen() || isClosing) {
                    console.warn(this.logPrefix(), "skipping store: IndexedDB connection is closing");
                    return;
                }
                throw error;
            }
        }
    }

    /**
     * @description store the dirty objects
     * @returns {Number}
     */
    storeDirtyObjects () { // PRIVATE
        SvObjectPool.beginStorePass();
        try {
            return this.storeDirtyObjectsInPass();
        } finally {
            SvObjectPool.endStorePass(this);
        }
    }

    storeDirtyObjectsInPass () { // PRIVATE
        // store the dirty objects, if they contain references objects unknown to pool,
        // they'll be added as active + dirty objects which will be stored on next loop.
        // We continue until there are no dirty objects left.

        let totalStoreCount = 0;
        if (this.rootObject() && this.poolId() !== this.rootObject().puuid()) {
            this.setRootPid(this.rootObject().puuid()); // every row needs the pool id, whatever order the bucket stores in
        }
        this.setStoringPids(new Set());

        for (;;) { // easier to express clearly than do/while in this case
            let thisLoopStoreCount = 0;
            const dirtyBucket = this.dirtyObjects();
            this.setDirtyObjects(new Map());

            dirtyBucket.forEachKV((puuid, obj) => {
                //console.log("  storing pid " + puuid);

                if (this.storingPids().has(puuid)) {
                    // already stored this pass, then mutated mid-pass (the
                    // dirty happened before its store turn, so addDirtyObject
                    // couldn't flag it) — defer the fresh state to the next
                    // commit with the mutation-time stack captured at add time
                    this.deferDirtyObjectDuringStore(obj, null);
                    return;
                }

                this.storingPids().add(puuid);

                if (this._forcedDirtyObjectsSet && this._forcedDirtyObjectsSet.has(obj)) {
                    this._forcedDirtyObjectsSet.delete(obj);
                }

                this.storeObject(obj);

                thisLoopStoreCount ++;
            });

            if (thisLoopStoreCount === 0) {
                break;
            }

            totalStoreCount += thisLoopStoreCount;
            //this.logDebug(() => "totalStoreCount: " + totalStoreCount);
        }

        this.setStoringPids(null);
        this._pendingPlacements = null;
        this._midStoreDirtyStacks = null;

        // pids that got through this pass WITHOUT re-deferring have settled —
        // reset their consecutive-defer counters
        if (this._consecutiveDeferCounts) {
            this._consecutiveDeferCounts.keysArray().forEach((pid) => {
                if (!this._deferredDirtyObjects || !this._deferredDirtyObjects.has(pid)) {
                    this._consecutiveDeferCounts.delete(pid);
                }
            });
        }

        // objects mutated after their store this pass re-queue for the next
        // commit, so their fresh state persists (their stored record is stale)
        if (this._deferredDirtyObjects) {
            this._deferredDirtyObjects.forEachKV((pid, obj) => {
                this.dirtyObjects().set(pid, obj);
            });
            this._deferredDirtyObjects = null;
            this.scheduleStore();
        }

        return totalStoreCount; // its content changes are announced when the outermost pass ends (endStorePass)
    }

}.initThisClass());
