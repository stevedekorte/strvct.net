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
     * @description Creates an SvObjectPool from cloud JSON data.
     * @param {Object} json - The JSON object containing pool data
     * @returns {SvObjectPool} A new pool initialized from the JSON
     * @category Cloud Sync
     */
    static fromCloudJson (json) {
        const pool = this.clone();
        pool.recordStore().kvMap().open();
        pool.setPoolId(json[pool.rootKey()]);
        pool.recordStore().loadFromCloudJson(pool.poolId(), json, pool.rootKey(), pool.placementsKey());
        pool.loadStoredRoot();
        SvObjectPool.openPools().add(pool); // register so blob GC knows about this pool's references
        return pool;
    }

    /**
     * @static
     * @description
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

    static compactionThreshold () {
        return 20; // deltas appended to a cloud document before it is folded back into pool.json
    }

    static fullUploadThreshold () {
        return 0.5; // the changed fraction of records above which a whole pool.json beats a delta
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
            const slot = this.newSlot("lastSyncedSnapshot", null);
            slot.setSlotType("Object");
            slot.setDescription("cloud mirror: the pool.json (record JSON by puuid) as last uploaded or downloaded, for delta collection");
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
            this.blobPool().setName(this.name() + "/blobs");
            await this.blobPool().asyncOpen();
            await this.asyncPrefetchTextBlobsForRows(this.isHomePool() ? this.recordStore().allRows() : this.recordStore().rowsForPool(this.poolId()));
            await this.onPoolOpenSuccess();
            SvObjectPool.openPools().add(this);
        } catch (error) {
            this.onPoolOpenFailure(error);
        }
    }

    async promiseClose () {
        SvSyncScheduler.shared().unscheduleTargetAndMethod(this, "commitStoreDirtyObjects");
        SvSyncScheduler.shared().unscheduleTargetAndMethod(this, "asyncCollectBlobs");
        if (this.recordStore().isOpen()) {
            this.recordStore().close(); // synchronous in indexeddb
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

    // --- BlobString: spilled text (Plans/Record Store §5) ---

    /**
     * @description Names a spilled string's blob and stores the bytes: the record
     * keeps { "#": hash }. The hash is computed synchronously (the store pass is
     * synchronous); the blob store computes the same digest of the same bytes.
     * @category Text Blobs
     */
    hashForSpilledText (text) {
        const hash = text.hexSha256Sync();
        const store = this.recordStore();
        if (!store.textBlobs().has(hash)) {
            store.textBlobs().set(hash, text);
            if (this.blobPool().isOpen()) {
                this.blobPool().asyncStoreBlob(new Blob([text], { type: "text/plain" })).catch((e) => {
                    console.warn(this.logPrefix() + "could not store text blob " + hash.slice(0, 8) + ": " + (e && e.message));
                });
            }
        }
        return hash;
    }

    /**
     * @description The text behind a { "#": hash } entry, from the store's text
     * blob cache filled at open (asyncPrefetchTextBlobs); a blob that never
     * arrived reads as an empty string (logged once).
     * @category Text Blobs
     */
    textForSpilledHash (hash) {
        const text = this.recordStore().textBlobs().get(hash);
        if (text === undefined) {
            if (this.shouldReportMissingPid(hash)) {
                console.warn(this.logPrefix() + "spilled text blob " + hash.slice(0, 8) + " is not available — reading it as empty");
            }
            return "";
        }
        return text;
    }

    /**
     * @description Loads every text blob the given rows refer to into the store's
     * cache before any record is materialized — spilled text is fetched with its
     * record, never on access. Blobs missing locally are asked of the missing-
     * text-blob fetcher (the app's cloud blob path) when one is installed.
     * @param {Array} rows
     * @category Text Blobs
     */
    async asyncPrefetchTextBlobsForRows (rows) {
        const store = this.recordStore();
        const hashes = new Set();
        const pattern = /"#":"([0-9a-f]{64})"/g;
        rows.forEach((row) => {
            if (!row.payloadJson) { return; }
            let match;
            while ((match = pattern.exec(row.payloadJson)) !== null) {
                if (!store.textBlobs().has(match[1])) { hashes.add(match[1]); }
            }
        });
        for (const hash of hashes) {
            const text = await this.asyncFetchTextBlob(hash);
            if (Type.isString(text)) {
                store.textBlobs().set(hash, text);
            }
        }
        return this;
    }

    async asyncFetchTextBlob (hash) {
        try {
            if (this.blobPool().isOpen()) {
                const blob = await this.blobPool().asyncGetBlob(hash);
                if (blob) { return await blob.text(); }
            }
            const fetcher = SvObjectPool.missingTextBlobFetcher();
            if (fetcher) {
                const text = await fetcher(hash);
                if (Type.isString(text) && this.blobPool().isOpen()) {
                    this.blobPool().asyncStoreBlob(new Blob([text], { type: "text/plain" })).catch(() => {});
                }
                return text;
            }
        } catch (e) {
            console.warn(this.logPrefix() + "text blob " + hash.slice(0, 8) + " fetch failed: " + (e && e.message));
        }
        return null;
    }

    static setMissingTextBlobFetcher (fn) {
        this._missingTextBlobFetcher = fn; // async (hash) → text | null; the app installs its cloud blob path
        return this;
    }

    static missingTextBlobFetcher () {
        return this._missingTextBlobFetcher || null;
    }

    // --- cloud mirror: pool.json snapshots and deltas ---

    /**
     * @description Compares the pool's current pool.json against lastSyncedSnapshot.
     * @returns {Object|null} { writes, deletes, timestamp, isEmpty } or null when a full upload is better (no snapshot, or most records changed).
     * @category Cloud Mirror
     */
    collectDelta () {
        const snapshot = this.lastSyncedSnapshot();
        if (!snapshot) {
            return null;
        }
        const currentJson = this.asJson();
        const writes = {};
        const deletes = [];
        Object.keys(currentJson).forEach((key) => {
            if (!Object.hasOwn(snapshot, key) || snapshot[key] !== currentJson[key]) {
                writes[key] = currentJson[key];
            }
        });
        Object.keys(snapshot).forEach((key) => {
            if (!Object.hasOwn(currentJson, key)) {
                deletes.push(key);
            }
        });
        const totalChanges = Object.keys(writes).length + deletes.length;
        if (totalChanges === 0) {
            return { writes: {}, deletes: [], timestamp: Date.now(), isEmpty: true };
        }
        const totalRecords = Object.keys(currentJson).length;
        if (totalRecords > 0 && totalChanges / totalRecords > SvObjectPool.fullUploadThreshold()) {
            return null;
        }
        return { writes: writes, deletes: deletes, timestamp: Date.now() };
    }

    updateLastSyncedSnapshot () {
        this.setLastSyncedSnapshot(Object.assign({}, this.asJson()));
        return this;
    }

    /**
     * @description The commit protocol against a cloud record store (Plans/Record
     * Store §7): the records changed since lastSyncedSnapshot become writes and
     * deletes, sent with the root row's version as baseVersion. On "committed"
     * the new version is mirrored onto the root row (server-owned, written through
     * the non-dirtying path) and the snapshot advances; on "conflict" nothing
     * changes and the caller reloads; a refusal is returned as is.
     * @param {SvCloudRecordStore} cloudStore
     * @param {Object} [options] { create: { scopeId } } for a pool's first commit
     * @returns {Promise<Object>} { status: "committed"|"conflict"|"refused"|"unchanged", version?, reason? }
     * @category Cloud Mirror
     */
    async asyncCommitToCloud (cloudStore, options = {}) {
        await this.asyncFlushDirty();
        const rootRow = this.rowForPid(this.poolId());
        assert(rootRow, "the pool has no root row to commit");
        const delta = this.collectDelta();
        const changed = delta === null ? this.wholePoolAsDelta() : delta;
        if (changed.isEmpty) {
            return { status: "unchanged", version: rootRow.version || 0 };
        }
        // the cloud names the pool by its scoped id (SvRecordRow.localPoolId)
        const cloudPoolId = options.cloudPoolId || this.poolId();
        const commit = {
            poolId: cloudPoolId,
            baseVersion: Number.isInteger(rootRow.version) ? rootRow.version : 0,
            requestId: Object.newUuid(),
            writes: Object.keys(changed.writes).map(pid => this.cloudWriteForRecord(pid, changed.writes[pid], cloudPoolId)),
            deletes: changed.deletes.map(pid => ({ poolId: cloudPoolId, objectId: pid }))
        };
        if (options.create) {
            commit.create = options.create;
        }
        const result = await cloudStore.asyncCommit(commit);
        if (result && result.status === "committed") {
            await this.mirrorCloudVersion(result.version, commit);
            this.updateLastSyncedSnapshot();
        }
        return result;
    }

    /**
     * @description When the delta is not worth it (no snapshot, or most records
     * changed) every current record is written — and, unlike a whole pool.json
     * upload, the records the snapshot had and the pool no longer has are still
     * deleted: a commit never replaces the cloud's set, it changes it.
     * @category Cloud Mirror
     */
    wholePoolAsDelta () {
        const writes = {};
        this.forEachRecordJson((pid, jsonString) => { writes[pid] = jsonString; });
        const snapshot = this.lastSyncedSnapshot() || {};
        const deletes = Object.keys(snapshot).filter(pid => pid !== this.rootKey() && !Object.hasOwn(writes, pid));
        return { writes: writes, deletes: deletes, isEmpty: Object.keys(writes).length === 0 && deletes.length === 0 };
    }

    cloudWriteForRecord (pid, jsonString, cloudPoolId = this.poolId()) {
        const write = { poolId: cloudPoolId, objectId: pid, payloadJson: jsonString };
        if (pid === this.poolId()) {
            const root = this.rootObject();
            // the root may name a cloud placement of its own (a folder id that is
            // the same on every device) instead of the local folder node's puuid
            write.parentId = (root && root.cloudParentId) ? root.cloudParentId() : this.parentNodeId();
            write.orderKey = write.parentId ? (this.orderKey() || SvOrderKey.keyBetween(null, null)) : null;
        }
        return write;
    }

    /**
     * @description After a commit the server's version and each written row's
     * modifiedVersion are mirrored down — server-owned columns, not content, so
     * nothing is marked dirty.
     * @category Cloud Mirror
     */
    async mirrorCloudVersion (version, commit) {
        const store = this.recordStore();
        await store.asyncBeginBatch();
        commit.writes.forEach((write) => {
            const row = store.rowForKey(this.poolId(), write.objectId);
            if (row) {
                row.modifiedVersion = version;
                if (write.objectId === this.poolId()) { row.version = version; }
                store.putRowInBatch(row);
            }
        });
        const rootRow = store.rowForKey(this.poolId(), this.poolId());
        if (rootRow && rootRow.version !== version) {
            rootRow.version = version;
            store.putRowInBatch(rootRow);
        }
        await store.asyncCommitBatch();
        return this;
    }

    /**
     * @description Makes an object the root of this pool and stores its closure
     * now — a pool built from a live graph (an export, a test fixture).
     * @param {Object} rootObj
     * @returns {Promise<SvObjectPool>}
     * @category Storing
     */
    async initializeFromRoot (rootObj) {
        assert(rootObj, "rootObj is required");
        this.setRootObject(rootObj);
        await this.commitStoreDirtyObjects();
        return this;
    }

    /**
     * @description Stores every dirty object now (the scheduled pass, run early).
     * @category Storing
     */
    async asyncFlushDirty () {
        if (this.hasDirtyObjects()) {
            await this.commitStoreDirtyObjects();
        }
        return this;
    }

    /**
     * @description The database the pool's rows live in: the pool's name plus a
     * suffix, so today's pre-records database of the same name is never read as
     * rows (the cutover is a reset, not a migration).
     * @category Open
     */
    recordStoreName () {
        return this.name() + ".records";
    }

    /**
     * @description A home pool learns its id from the store's settings; any
     * other pool is told its id (its root's puuid) when created or opened.
     * @category Open
     */
    readHomePoolId () {
        if (!this.poolId() && this.isHomePool()) {
            const homePoolId = this.recordStore().settingAt("homePoolId");
            if (homePoolId) {
                this.setPoolId(homePoolId);
            }
        }
        return this;
    }

    isHomePool () {
        return false;
    }

    /**
     * @async
     * @description called when the pool opens successfully
     * @returns {Promise}
     */
    async onPoolOpenSuccess () {
        // here so subclasses can easily hook
        await this.onRecordsDictOpen();
    }

    /**
     * @description called when the pool opens successfully
     * @param {Error} error - the error that occurred
     * @returns {void}
     */
    onPoolOpenFailure (error) {
        // here so subclasses can easily hook
        throw error;
    }

    /*
    postOpenNote () {
        this.postNoteNamed("objectPoolDidOpen")
    }
    */

    /**
     * @description show the records map
     * @param {String} s - optional comment
     * @returns {void}
     */
    show (s) {
        const comment = s ? " " + s + " " : "";
        console.log("---" + comment + "---");
        const max = 40;
        console.log(this.count() + " records: ");
        this.forEachRecordJson((k, v) => {
            if (v.length > max) {
                v = v.slice(0, max) + "...";
            }
            console.log("   '" + k + "': '" + v + "'");
        });

        console.log("------");
    }

    /**
     * @async
     * @description called when the records map opens successfully
     * @returns {Promise}
     */
    async onRecordsDictOpen () {
        //this.show("ON OPEN");
        await this.promiseCollect();
        //this.show("AFTER COLLECT");
        this.nodeStoreDidOpenNote().post();
        return this;
    }

    /**
     * @description check if the object pool is open
     * @returns {Boolean}
     */
    isOpen () {
        return this.recordStore().isOpen(); // an in-memory record store is open from the start, as the in-memory map was
    }

    // --- root ---

    /**
     * @description get the root key
     * @returns {String}
     */
    rootKey () {
        return "root"; // the root pointer's key in the cloud pool.json format (asJson / fromCloudJson)
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
        this.recordStore().close();
        this._hasOpened = false;
        return this;
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

        const puuid = anObject.puuid();

        if (this.isStoringObject(anObject)) {
            // mutated AFTER being stored in the active commit pass. The old
            // silent return DROPPED the change — in-memory state diverged
            // from the stored record until the next genuine mutation. Defer
            // the fresh state to the next commit instead (tripwire-logged;
            // see deferDirtyObjectDuringStore).
            this.deferDirtyObjectDuringStore(anObject, new Error().stack);
            return this;
        }

        if (this.isLoadingObject(anObject)) {
            return this;
        }

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
                const savedLimit = Error.stackTraceLimit;
                Error.stackTraceLimit = 60;
                this.midStoreDirtyStacks().set(puuid, new Error().stack);
                Error.stackTraceLimit = savedLimit;
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

        return totalStoreCount;
    }

    // --- reading ---

    /**
     * @description The className conversion map, SHARED BY EVERY POOL.
     *
     * A rename is a fact about the codebase's history, not a property of one
     * pool, so there is exactly one map and it does not matter which pool an
     * app registers renames on.
     *
     * It was per-instance, and the app registers renames on the shared
     * persistent pool only — so every SvSubObjectPool (cloud nodes, sessions)
     * resolved class names against an EMPTY map. A renamed class then loaded
     * fine from the local store and came back `null` from a cloud record, whose
     * nulls are then "repaired" out of the subnodes array: silent data loss on
     * the cloud path, once per boot. The JSON layer already got this right
     * (SvJsonIdNode.jsonTypeRenameMap is static), which is exactly why cloud
     * JSON followed renames while cloud RECORDS did not.
     *
     * Deliberately keyed off SvObjectPool itself rather than `this` — a static
     * touched through a subclass would give each subclass its own map and
     * reintroduce the same bug one level up.
     * @returns {Map}
     */
    classNameConversionMap () {
        return SvObjectPool.sharedClassNameConversionMap();
    }

    /**
     * @description The one conversion map. See classNameConversionMap().
     * @returns {Map}
     */
    static sharedClassNameConversionMap () {
        if (!SvObjectPool._classNameConversionMap) {
            SvObjectPool._classNameConversionMap = new Map();
        }
        return SvObjectPool._classNameConversionMap;
    }

    /**
     * @description Class-side registration, so renames can be declared before
     * (or without) any pool existing.
     * @param {String} oldName
     * @param {String} newName
     * @returns {Class}
     */
    static addClassNameConversion (oldName, newName) {
        this.sharedClassNameConversionMap().set(oldName, newName);
        if (typeof SvJsonIdNode !== "undefined" && SvJsonIdNode.addJsonTypeRename) {
            SvJsonIdNode.addJsonTypeRename(oldName, newName); // keep the JSON layer in step
        }
        return this;
    }

    /**
     * @description Adds a class name conversion to the map.
     * Used when a class has been renamed and stored records reference the old name.
     * @param {String} oldName - The old class name
     * @param {String} newName - The new class name
     * @returns {SvObjectPool}
     */
    addClassNameConversion (oldName, newName) {
        this.classNameConversionMap().set(oldName, newName);
        // Mirror into the JSON layer: record loading and JSON deserialization
        // both have to follow renames, and ClassRenames.json should be the only
        // place a rename is declared. Without this, a renamed class loaded fine
        // from the store and resolved to null from a cloud/catalog document.
        if (typeof SvJsonIdNode !== "undefined" && SvJsonIdNode.addJsonTypeRename) {
            SvJsonIdNode.addJsonTypeRename(oldName, newName);
        }
        return this;
    }

    addClassNameConversionTuples (conversionTuples) {
        conversionTuples.forEach((conversionTuple) => {
            this.addClassNameConversion(conversionTuple[0], conversionTuple[1]);
        });
        return this;
    }

    /**
     * @description get the class for the given name
     * @param {String} className - the name of the class
     * @returns {Class}
     */
    classForName (className) {
        const m = this.classNameConversionMap();
        if (m.has(className)) {
            const newName = m.get(className);
            return Object.getClassNamed(newName);
        }
        return Object.getClassNamed(className);
    }

    /**
     * @description get the object for the given record
     * @param {Object} aRecord - the record to get the object for
     * @returns {Object}
     */
    objectForRecord (aRecord) { // private
        const className = aRecord.type;
        if (className === "Promise") {
            console.warn(this.svType() + " WARNING: a Promise was stored. Returning a null. Check stack trace to see which object stored it.");
            return null;
        }

        const aClass = this.classForName(className);

        if (!aClass) {
            const error = "missing class '" + className + "' - returning null";
            console.warn(error);
            //throw new Error(error);

            return null;
        }
        assert(!Type.isNullOrUndefined(aRecord.id));

        if (Type.isUndefined(aClass.instanceFromRecordInStore)) {
            console.warn("Class '" + className + "' missing method 'instanceFromRecordInStore' - deserializing as null");
            return null;
        }

        let isSingleton = false;
        if (aClass.isSingleton !== undefined) {
            isSingleton = aClass.isSingleton();
        }
        //const wasAlreadyAllocated = isSingleton && (aClass._shared !== null && aClass._shared !== undefined);

        // Breadcrumb for dangling-reference diagnostics: while this record
        // loads, any "missing record for <pid>" it triggers (resolving its
        // refs) can name WHO holds the dangling reference — without it the
        // missing-record log is untraceable (reported: hundreds of missing
        // records with no way to find the referrer).
        if (!this._loadingRecordStack) { this._loadingRecordStack = []; }
        this._loadingRecordStack.push(aRecord.type + ":" + aRecord.id);
        let obj;
        try {
            obj = aClass.instanceFromRecordInStore(aRecord, this);
        } finally {
            this._loadingRecordStack.pop();
        }
        if (obj) {
            SvTransactionContext.noteLoaded(obj); // loaded, not allocated: a rollback never retires it
        }
        if (obj === null) {
            // maybe the class shouldStore is false?
            return null;
        }

        // this assert may fail if the object is a singleton and was already allocated
        if (!isSingleton) {
            assert(!this.hasActiveObject(obj), "objectForRecord: object is already active in memory"); // if it's already active in memory, we shouldn't be asking for it's record to load it into memory
        }

        /*
        if (isSingleton && obj.hasPuuid() && obj.puuid() !== aRecord.id) {
            console.log(this.logPrefix() + " changing singleton object " + obj.svDebugId() + " pid from " + obj.puuid() + " to " + aRecord.id);
        }
        */
        obj.setPuuid(aRecord.id);

        if (obj.shouldStore) {
            if (!obj.shouldStore()) {
                console.warn(this.logPrefix() + "WARNING: object " + obj.svType() + " loaded from store but has shouldStore=false. Not adding to activeObjects.");
            }
            this.addActiveObject(obj);
        }

        if (obj.puuid() === this.rootPid()) {
            this._rootObject = obj; // bit of a hack to make sure root ref is set before we load root contents
            // might want to split this method into one to get ref and another to load contents instead
        }

        obj.loadFromRecord(aRecord, this);

        this.loadingPids().delete(obj.puuid()); // need to do this to get object to ber marked as dirty if it's slots are updated in finalInit

        //assert(!obj._hasDoneInit); // if the class is a singleton, _hasDoneInit may already be true. Should init be called in that case?

        if (isSingleton || obj._hasDoneInit === false || obj._hasDoneInit === undefined) {
            if (obj.finalInit) {
                obj.finalInit();  // this might be called again if the object is a singleton
            }

            if (obj.afterInit) {
                obj.afterInit(); // calls didInit, which sets _hasDoneInit to true
            }
        }

        if (obj.afterUnserializeAndInit) {
            obj.afterUnserializeAndInit();
        }

        return obj;
    }

    /**
     * @description get the active object for the given pid
     * @param {String} puuid - the pid to get the active object for
     * @returns {Object}
     */
    activeObjectForPid (puuid) {
        return this.activeObjects().get(puuid);
    }

    checkValidAsyncPidValue (v) {
        if (typeof v === "string") {
            if (v.startsWith("_")) {
                return true;
            }
        }
        return false;
    }

    asyncObjectForPid (puuid) {
        assert(this.checkValidAsyncPidValue(puuid), "invalid async pid value: " + puuid);
    }

    /**
     * @description get the object for the given pid
     * @param {String} puuid - the pid to get the object for
     * @returns {Object}
     */
    objectForPid (puuid) { // PRIVATE (except also used by SvStoreRef)
        //console.log("objectForPid " + puuid)

        // return active object for pid, if there is one
        const activeObj = this.activeObjectForPid(puuid);
        if (activeObj) {
            return activeObj;
        }

        // schedule didInitLoadingPids to occur at end of event loop

        if (!this.isFinalizing() && this.loadingPids().count() === 0) {
            SvSyncScheduler.shared().scheduleTargetAndMethod(this, "didInitLoadingPids");
        }

        this.loadingPids().add(puuid);

        const aRecord = this.recordForPid(puuid);
        if (Type.isUndefined(aRecord)) {
            const referrer = (this._loadingRecordStack && this._loadingRecordStack.length > 0)
                ? this._loadingRecordStack[this._loadingRecordStack.length - 1]
                : "(not during a record load)";
            if (this.shouldReportMissingPid(puuid)) {
                console.log(this.logPrefix() + "missing record for " + puuid + " — referenced while loading " + referrer);
            }
            return undefined;
        }
        if (aRecord.type === "SvPersistentObjectPool") {
            console.log(this.logPrefix() + "skipping SvPersistentObjectPool record for " + puuid);
            return null;
        }
        const loadedObj = this.objectForRecord(aRecord);
        return loadedObj;
    }

    /**
     * @description initialize the loading pids
     * @returns {void}
     */
    didInitLoadingPids () {
        assert(!this.isFinalizing()); // sanity check
        this.setIsFinalizing(true);
        while (!this.loadingPids().isEmpty()) { // while there are still loading pids
            const lastSet = this.loadingPids();
            this.setLoadingPids(new Set());

            lastSet.forEach(loadedPid => { // sends didLoadFromStore to each matching object
                const obj = this.activeObjectForPid(loadedPid);
                if (Type.isUndefined(obj)) {
                    if (this.shouldReportMissingPid(loadedPid)) {
                        console.warn(this.logPrefix() + "missing activeObjectForPid " + loadedPid);
                    }
                    //throw new Error(errorMsg)
                } else if (obj.didLoadFromStore) {
                    obj.didLoadFromStore(); // should this be able to trigger an objectForPid() that would add to loadingPids?
                }
            });
        }
        this.setIsFinalizing(false);
    }

    //

    allPidsSet () {
        return new Set(this.allPids());
    }

    allPids () {
        if (!this.poolId()) {
            return [];
        }
        return this.recordStore().rowsForPool(this.poolId()).filter(row => !row.isDeleted).map(row => row.objectId);
    }

    refForPid (aPid) {
        // is this ever called?
        return {
            "*": aPid.pid()
            //"*": this.pid()
        };
    }

    /**
     * @description get the pid for the given ref
     * @param {Object} aRef - the ref to get the pid for
     * @returns {String}
     */
    pidForRef (aRef) {
        return aRef.getOwnProperty("*");
    }

    /**
     * @description unref the value if needed
     * @param {Object} v - the value to unref
     * @returns {Object}
     */
    unrefValueIfNeeded (v) {
        return this.unrefValue(v);
    }

    /**
     * @description unref the value
     * @param {Object} v - the value to unref
     * @returns {Object}
     */
    unrefValue (v) {
        if (Type.isLiteral(v)) {
            return v;
        }
        const farPoolId = v.getOwnProperty("**");
        if (farPoolId) {
            return this.farObjectForPoolId(farPoolId);
        }
        const puuid = v.getOwnProperty("*");
        assert(puuid);
        const obj = this.objectForPid(puuid);
        return obj;
    }

    /**
     * @description Resolves a far ref { "**": poolId }: the root of that pool,
     * opened from the same record store when its rows are local (synchronous —
     * the store's map is in memory), undefined when the pool is not here.
     * @category References
     */
    farObjectForPoolId (poolId) {
        const pool = this.recordStore().poolForId(poolId);
        if (!pool) {
            if (this.shouldReportMissingPid(poolId)) {
                console.log(this.logPrefix() + "far ref to pool " + poolId + " which is not in the local store");
            }
            return undefined;
        }
        return pool.rootObject() || pool.readRootObject();
    }

    /**
     * @description ref the value
     * @param {Object} v - the value to ref
     * @returns {Object}
     */
    refValue (v) {
        assert(!Type.isPromise(v));

        if (Type.isLiteral(v)) {
            // literals will be inlined in the record
            return v;
        }

        if (Type.isBlob(v)) {
            // indexeddb will handle blob values in records natively, nice!
            // NOTES:
            // - idb doesn't deduplicate them
            // - idb doesn't load the blob value into memory until it's needed (e.g. async method blob.arrayBuffer() called)
            return v;
        }

        assert(!v.isClass(), "refValue called on a class: " + v.svType() + " and we can't serialize classes");

        if (!v.shouldStore()) {
            console.warn(this.logPrefix() + "WARNING: called refValue on " + v.svType() + " which has shouldStore=false");
            return null;
        }

        if (this.isFarObject(v)) {
            this.ensureChildPoolForRoot(v);
            return { "**": v.puuid() };
        }
        if (!this.hasActiveObject(v)) {
            this.addActiveObject(v);
            this.addDirtyObject(v);
        } else {
            this.warnIfRefWillDangle(v);
        }
        const ref = { "*": v.puuid() };
        return ref;
    }

    /**
     * @description An element of a windowed collection is placed under its
     * collection node with an order key between its stored neighbours' keys; a
     * key, once assigned, is kept. Any other record has no placement.
     * @category Storing
     */
    placementForWindowedElement (obj, existing) {
        const parent = (obj && obj.parentNode) ? obj.parentNode() : null;
        if (!parent || !parent.subnodesAreWindowed || !parent.subnodesAreWindowed()) {
            return { parentId: null, orderKey: null };
        }
        if (existing && existing.parentId === parent.puuid() && existing.orderKey) {
            return { parentId: existing.parentId, orderKey: existing.orderKey };
        }
        const key = this.pendingPlacementsFor(parent).get(obj.puuid()) || SvOrderKey.keyBetween(null, null);
        return { parentId: parent.puuid(), orderKey: key };
    }

    /**
     * @description Keys for every not-yet-placed element of a windowed node,
     * computed in one pass over its loaded elements (each between the nearest
     * placed neighbours) the first time the store pass needs one — a
     * 5,000-message append is O(n), not a walk per element. Cleared with the pass.
     * @category Storing
     */
    pendingPlacementsFor (parent) {
        if (!this._pendingPlacements) {
            this._pendingPlacements = new Map();
        }
        if (this._pendingPlacements.has(parent)) {
            return this._pendingPlacements.get(parent);
        }
        const stored = this.recordStore().orderKeysForNode(this.poolId(), parent.puuid()); // pid → orderKey
        const siblings = parent._subnodes || [];
        const nextStoredKey = new Array(siblings.length).fill(null);
        let upcoming = null;
        for (let i = siblings.length - 1; i >= 0; i--) {
            nextStoredKey[i] = upcoming;
            const key = stored.get(siblings[i].puuid());
            if (key) { upcoming = key; }
        }
        // The array is the truth of the order. A stored key that does not
        // follow the previous element's key (the collection was re-sorted, or
        // an earlier build placed elements out of order) is re-keyed like an
        // unplaced element, and its row is rewritten in this batch — never an
        // assertion in the store pass, which would lose the save.
        const pending = new Map();
        let previous = null;
        siblings.forEach((sibling, i) => {
            const key = stored.get(sibling.puuid());
            if (key && (previous === null || key > previous)) {
                previous = key;
                return;
            }
            let upper = nextStoredKey[i];
            if (upper !== null && previous !== null && upper <= previous) {
                upper = this.firstStoredKeyAfter(siblings, i, stored, previous); // rare: the misordered case
            }
            const assigned = SvOrderKey.keyBetween(previous, upper);
            pending.set(sibling.puuid(), assigned);
            if (key) {
                this.rekeyPlacedRow(sibling.puuid(), assigned);
            }
            previous = assigned;
        });
        this._pendingPlacements.set(parent, pending);
        return pending;
    }

    firstStoredKeyAfter (siblings, index, stored, previous) {
        for (let j = index + 1; j < siblings.length; j++) {
            const key = stored.get(siblings[j].puuid());
            if (key && key > previous) {
                return key;
            }
        }
        return null;
    }

    /**
     * @description Rewrites an already-placed element's row with a new order key
     * (inside the store pass's batch), so the store's order follows the array's.
     * @category Storing
     */
    rekeyPlacedRow (pid, orderKey) {
        const store = this.recordStore();
        const row = store.rowForKey(this.poolId(), pid);
        if (row) {
            row.orderKey = orderKey;
            store.putRowInBatch(row);
        }
        return this;
    }

    orderKeyForPid (pid) {
        const row = this.rowForPid(pid);
        return (row && row.orderKey) ? row.orderKey : null;
    }

    /**
     * @description Elements attached to a windowed node before it had a pool join
     * the pool when the node is stored (the node's record holds no ref to them).
     * @category Storing
     */
    enrollWindowedElementsOf (node) {
        const elements = node._subnodes || [];
        elements.forEach((element) => {
            if (element && element.shouldStore && element.shouldStore() && !this.hasActiveObject(element)) {
                this.addActiveObject(element);
                this.addDirtyObject(element);
            }
        });
        return this;
    }

    // --- windowed collections: loading by range (Plans/Record Store §6) ---

    isLoadingWindow () {
        return (this._windowLoadDepth || 0) > 0;
    }

    beginWindowLoad () {
        this._windowLoadDepth = (this._windowLoadDepth || 0) + 1;
        return this;
    }

    endWindowLoad () {
        this._windowLoadDepth = Math.max(0, (this._windowLoadDepth || 0) - 1);
        return this;
    }

    /**
     * @description The newest `limit` elements of a windowed node older than
     * beforeKey (all of them when beforeKey is null), materialized as loads —
     * nothing dirtied, in order.
     * @category Windowed Collections
     */
    loadWindowedElements (node, beforeKey, limit) {
        const rows = this.recordStore().windowedRowsForNode(this.poolId(), node.puuid(), beforeKey, limit);
        this.beginWindowLoad();
        try {
            const objects = rows.map(row => this.objectForPid(row.objectId)).filter(obj => !Type.isNullOrUndefined(obj));
            if (!this.isFinalizing() && this.loadingPids().count() > 0) {
                this.didInitLoadingPids();
            }
            return objects;
        } finally {
            this.endWindowLoad();
        }
    }

    windowedElementCount (node) {
        return this.recordStore().windowedRowCountForNode(this.poolId(), node.puuid());
    }

    async asyncDeleteRecordRow (pid) {
        await this.recordStore().asyncDelete([{ poolId: this.poolId(), objectId: pid }]);
        return this;
    }

    /**
     * @description A value is far when it is the root of another pool: a direct
     * subnode of a collection whose subnodesArePools (a document in a folder),
     * or an object already active in a different pool.
     * @category References
     */
    isFarObject (v) {
        if (v === this.rootObject()) {
            return false;
        }
        if (v.isPoolRoot && v.isPoolRoot()) {
            return true;
        }
        const pool = SvObjectPool.poolOfObject(v);
        return !!(pool && pool !== this && pool.rootObject() === v);
    }

    /**
     * @description The pool a folder's element is the root of, created in this
     * pool's record store on first reference and placed under the folder node
     * with an order key between its siblings' keys.
     * @category References
     */
    ensureChildPoolForRoot (v) {
        const store = this.recordStore();
        let pool = store.poolForId(v.puuid());
        if (!pool) {
            const placement = this.placementForPoolRoot(v);
            pool = store.newChildPool(v.puuid(), placement.parentNodeId, placement.orderKey);
            pool.setRootObject(v);
            pool.storeDirtyObjects(); // its first rows land in the same batch as the far ref that names it
            return pool;
        }
        if (!pool.rootObject()) {
            pool.setRootObject(v);
        }
        const folder = v.parentNode();
        if (folder && pool.parentNodeId() !== folder.puuid()) {
            const placement = this.placementForPoolRoot(v); // moved to another folder: re-place the root row
            pool.setParentNodeId(placement.parentNodeId);
            pool.setOrderKey(placement.orderKey);
            pool.addDirtyObject(v);
        }
        return pool;
    }

    placementForPoolRoot (v) {
        const folder = v.parentNode();
        if (!folder) {
            return { parentNodeId: null, orderKey: null };
        }
        const siblings = folder.subnodes();
        const index = siblings.indexOf(v);
        const keyOf = (node) => {
            const pool = node ? this.recordStore().poolForId(node.puuid()) : null;
            return pool ? pool.orderKey() : null;
        };
        const before = index > 0 ? keyOf(siblings.at(index - 1)) : null;
        const after = index < siblings.length - 1 ? keyOf(siblings.at(index + 1)) : null;
        const orderKey = (before !== null || after === null) ? SvOrderKey.keyBetween(before, after) : SvOrderKey.keyBetween(null, after);
        return { parentNodeId: folder.puuid(), orderKey: orderKey };
    }

    /**
     * @description Tripwire for the dangling-reference class of bug: we are
     * about to write {"*": pid} into a record, so that pid MUST end up with a
     * record of its own — either it already has one, or it is queued in this
     * write cycle. If neither holds, the reference is dangling the moment it
     * is written, and nothing will notice until a much later boot fails to
     * materialize it ("missing record for pid ... in lazy slot ...").
     *
     * Log-only and deliberately non-repairing: marking the object dirty here
     * would grow the dirty set mid-flush, and silently self-healing would hide
     * the write path that produced the danger. First occurrence per pid only.
     * @param {Object} v - the object about to be referenced
     * @returns {Boolean} true if the reference is safe
     * @category Storing
     */
    /**
     * @description First-occurrence gate for missing-pid reports. A dangling
     * subtree is retried on every access and re-walked on every save cycle, so
     * without this one broken character produced hundreds of identical console
     * entries per cycle (each with a stack), which buried everything else and
     * measurably slowed sync. SvStoreRef already latches its own
     * materialization warning for the same reason; this is the pool-level half.
     * @param {String} pid
     * @returns {Boolean} true the first time this pid is reported
     * @category Loading
     */
    shouldReportMissingPid (pid) {
        if (!this.warnedMissingPidSet()) {
            this.setWarnedMissingPidSet(new Set());
        }
        if (this.warnedMissingPidSet().has(pid)) {
            return false;
        }
        this.warnedMissingPidSet().add(pid);
        return true;
    }

    warnIfRefWillDangle (v) {
        const pid = v.puuid();

        if (this.dirtyObjects().has(pid)) {
            return true; // queued for writing in this cycle
        }
        if (this.hasRecordForPid(pid)) {
            return true; // already on disk
        }

        if (!this.warnedDanglingRefPidSet()) {
            this.setWarnedDanglingRefPidSet(new Set());
        }
        if (this.warnedDanglingRefPidSet().has(pid)) {
            return false;
        }
        this.warnedDanglingRefPidSet().add(pid);

        console.warn(this.logPrefix()
            + "DANGLING REF being written: " + v.svType() + " " + pid
            + " is active but has no record and is not queued — the referring"
            + " record will point at nothing after this commit."
            + "\n" + new Error("dangling ref write site").stack);
        return false;
    }

    // read a record

    hasRecordForPid (puuid) {
        return !!this.poolId() && this.recordStore().hasRow(this.poolId(), puuid);
    }

    rowForPid (puuid) { // private
        return this.poolId() ? this.recordStore().rowForKey(this.poolId(), puuid) : undefined;
    }

    recordForPid (puuid) { // private
        const row = this.rowForPid(puuid);
        if (!row || row.isDeleted) {
            return undefined;
        }
        const aRecord = JSON.parse(row.payloadJson);
        aRecord.id = puuid;
        return aRecord;
    }

    async asyncRecordForPid (puuid) {
        return this.recordForPid(puuid);
    }

    storeObject (obj) {
        /*
        if (Type.isDictionary(obj)) {
        }
        */

        // --- sanity checks ---
        assert(obj.shouldStore(), "object " + obj.svType() + " shouldStore is false");

        this.logDebug(() => "storeObject(" + obj.svTypeId() + ")");

        // --- store ---

        const puuid = obj.puuid();
        assert(!Type.isNullOrUndefined(puuid));

        if (obj === this.rootObject()) {
            this.setRootPid(puuid);
        }

        {
            //console.log(this.logPrefix() + "storeObject " + obj.svTypeId());
            const jsonString = this.jsonStringForObject(obj);

            /*
            const record = obj.recordForStore(this);
            const jsonString = JSON.stringify(record);
            //this.logDebug(() => "store " + puuid + " <- " + record.type )

            {
                // sanity checks
                // object should have a type and a class
                const recordType = record.type;
                assert(!Type.isNullOrUndefined(recordType), "object has no type property");

                const recordClass = SvGlobals.globals()[recordType];
                assert(recordClass && recordClass.isClass && recordClass.isClass(), "missing class for " + recordType);
            }
            */


            this.putRecordJson(puuid, jsonString, obj);
            this.storeBlobsReferencedByObject(obj);
        }
        return this;
    }

    putRecordJson (puuid, jsonString, obj = null) { // private — inside a record store batch
        this.ensurePoolId();
        this.recordStore().putRowInBatch(this.rowForRecordJson(puuid, jsonString, obj));
        return this;
    }

    /**
     * @description The row for a record: identity and payload from the object,
     * placement and ownership from the pool (root row only), version and
     * modifiedVersion kept from the existing row (server-owned, mirrored).
     * @category Storing
     */
    rowForRecordJson (puuid, jsonString, obj = null) {
        const existing = this.rowForPid(puuid);
        const isRoot = puuid === this.poolId();
        const placement = isRoot ? { parentId: this.parentNodeId(), orderKey: this.orderKey() } : this.placementForWindowedElement(obj, existing);
        return SvRecordRow.newRow({
            poolId: this.poolId(),
            objectId: puuid,
            parentId: placement.parentId,
            orderKey: placement.orderKey,
            ownerUid: isRoot ? this.ownerUid() : null,
            version: isRoot ? ((existing && Number.isInteger(existing.version)) ? existing.version : 0) : null,
            modifiedVersion: existing ? existing.modifiedVersion : 0,
            isDeleted: false,
            payloadJson: jsonString
        });
    }

    jsonStringForObject (obj) {
        const record = obj.recordForStore(this);
        const jsonString = JSON.stringify(record);
        //this.logDebug(() => "store " + puuid + " <- " + record.type )

        {
            // sanity checks
            // object should have a type and a class
            const recordType = record.type;
            assert(!Type.isNullOrUndefined(recordType), "object has no type property");

            const recordClass = SvGlobals.globals()[recordType];
            assert(recordClass && recordClass.isClass && recordClass.isClass(), "missing class for " + recordType);
        }

        return jsonString;
    }

    storeBlobsReferencedByObject (obj) {
        if (obj.referencedBlobsSet) {
            const blobsSet = obj.referencedBlobsSet();
            blobsSet.forEach(blob => {
                this.blobPool().asyncStoreBlob(blob);
            });
        }
    }

    /*
    storeRecord (puuid, record) {
        const jsonString = JSON.stringify(record);
        this.logDebug(() => "store " + puuid + " <- " + record.type );
        this.kvMap().set(puuid, jsonString);
        return this;
    }
    */

    // -------------------------------------

    /**
     * @description flush if needed
     * @returns {Object}
     */
    flushIfNeeded () {
        if (this.hasDirtyObjects() && !this.currentTransaction()) {
            this.storeDirtyObjects();
            assert(!this.hasDirtyObjects());
        }
        return this;
    }

    async promiseCollect () {
        if (!this.hasStoredRoot()) {
            const count = this.count();
            if (count > 0) {
                console.log(this.logPrefix() + "---- NO ROOT RECORD FOR COLLECT - clearing " + count + " records of pool " + this.poolId() + " ----");
                await this.recordStore().asyncDeletePool(this.poolId());
            }
            return 0;
        }
        await this.recordStore().asyncBeginBatch();
        this.flushIfNeeded(); // store any dirty objects
        const isDebugging = this.isDebugging();
        this.logDebug(() => "--- begin collect --- with " + this.count() + " pids");
        this.setMarkedSet(new Set());
        this.markPid(this.rootPid());
        this.markWindowedElements();
        const deleteCount = this.sweep();
        this.setMarkedSet(null);
        this.logDebug(() => "--- end collect --- collecting " + deleteCount + " pids ---");
        await this.recordStore().asyncCommitBatch();
        if (this.isHomePool()) {
            this.scheduleMethod("asyncCollectBlobs"); // blobs are store-wide (every pool's references count), so the home pool collects them once
        }
        const remainingCount = this.count();
        this.logDebug(() => " ---- keys count after commit: " + remainingCount + " ---");
        this.setIsDebugging(isDebugging);
        return remainingCount;
    }

    /**
     * @description Elements of windowed collections are not referenced by any
     * record: a row whose parentId is a marked node is reachable, and so is what
     * it references. Repeats until no row is newly marked (an element may itself
     * be a windowed collection).
     * @category Collection
     */
    markWindowedElements () {
        let marked = true;
        while (marked) {
            marked = false;
            this.recordStore().rowsForPool(this.poolId()).forEach((row) => {
                if (row.parentId && !row.isDeleted && this.markedSet().has(row.parentId) && !this.markedSet().has(row.objectId)) {
                    this.markPid(row.objectId);
                    marked = true;
                }
            });
        }
        return this;
    }

    markPid (pid) { // private
        // TODO: rewrite to not use recursion in order to avoid stack depth limit
        //this.logDebug(() => "markPid(" + pid + ")")
        if (!this.markedSet().has(pid)) {
            this.markedSet().add(pid);
            const refPids = this.refSetForPuuid(pid);
            refPids.forEach(refPid => this.markPid(refPid));
            return true;
        }
        return false;
    }

    /**
     * @description get the ref set for the given puuid
     * @param {String} puuid - the puuid to get the ref set for
     * @returns {Set}
     */
    refSetForPuuid (puuid) {
        const record = this.recordForPid(puuid);
        const puuids = new Set();

        if (record) {
            Object.keys(record).forEach(k => this.puuidsSetFromJson(record[k], puuids));
        }

        return puuids;
    }

    /**
     * @description get the puuids set from json
     * @param {Object} json - the json to get the puuids set from
     * @param {Set} puuids - the puuids set to add to
     * @returns {Set}
     */
    puuidsSetFromJson (json, puuids = new Set()) {
        // json can only contain array's, dictionaries, and literals.
        // We store dictionaries as an array of entries,
        // and reserve dicts in the json for pointers with the format { "*": "<puuid>" }

        //console.log(this.logPrefix() + " json: ", JSON.stringify(json, null, 2));

        if (Type.isLiteral(json)) {
            // we could call refsPidsForJsonStore but none will add any pids,
            // and null raises exception, so we can just skip it for now
        } else if (Type.isObject(json) && json.refsPidsForJsonStore) {
            json.refsPidsForJsonStore(puuids);
        } else {
            throw new Error("unable to handle json type: " + typeof(json) + " missing refsPidsForJsonStore() method?");
        }

        return puuids;
    }

    objectSetReferencingPid (pid) {
        const objects = new Set();
        this.allPids().forEach(objPid => {
            const obj = this.objectForPid(objPid);
            if (obj.refSetForPuuid(pid).has(objPid)) {
                objects.add(obj);
            }
        });
        return objects;
    }

    sweep () {
        const unmarkedPidSet = this.allPidsSet().difference(this.markedSet());
        unmarkedPidSet.forEach(pid => {
            this.onCollectPid(pid);
            this.recordStore().deleteRowInBatch(this.poolId(), pid);
        });
        return unmarkedPidSet.count();
    }

    onCollectPid (pid) {
        // give the class a chance to do something before the pid is collected
        const record = this.recordForPid(pid);
        const aClass = this.classForName(record.type);
        if (aClass && aClass.willCollectRecord) {
            const collectMethod = aClass.willCollectRecord(record);
            if (collectMethod) {
                collectMethod.apply(aClass, [record]);
            }
        }
    }

    async promiseDeleteAll () {
        await this.promiseOpen();
        assert(this.isOpen());
        if (this.poolId()) {
            await this.recordStore().asyncDeletePool(this.poolId());
        }
        await this.forgetPoolId();
    }

    /**
     * @description After the pool's rows are gone a new root may be set, which
     * gives the pool a new id; the home setting is cleared with it.
     * @category Clearing
     */
    async forgetPoolId () {
        if (this.isHomePool() && this.poolId()) {
            await this.recordStore().asyncSetSetting("homePoolId", null);
        }
        this.setPoolId(null);
        this._rootObject = null;
        return this;
    }

    async promiseClear () {
        await this.recordStore().asyncClear();
        this.setPoolId(null);
        this._rootObject = null;
    }

    rootSubnodeWithTitleForProto (aTitle, aProto) {
        return this.rootObject().subnodeWithTitleIfAbsentInsertProto(aTitle, aProto);
    }

    count () {
        return this.allPids().length;
    }

    totalBytes () {
        let bytes = 0;
        this.forEachRecordJson((pid, jsonString) => { bytes += jsonString.length; });
        return bytes;
    }

    // ---------------------------

    /*
    activeObjectsReferencingObject (anObject) {
        // useful for seeing if we can unload an object
        // BUT, to do full collect, do a mark/sweep on active objects
        // where sweep only removes unmarked from activeObjects and records cache?

        assert(this.hasActiveObject(anObject)) ;

        const referencers = new Set();
        const pid = anObject.puuid();

        this.activeObjects().forEachKV((pid, obj) => {
            const refPids = this.refSetForPuuid(obj.puuid())
            if (refPids.has(pid)) {
                referencers.add(obj);
            }
        });

        return referencers;
    }
    */

    /*
    static selfTestRoot () {
        const aTypedArray = Float64Array.from([1.2, 3.4, 4.5]);
        const aSet = new Set("sv1", "sv2");
        const aMap = new Map([ ["mk1", "mv1"], ["mk2", "mv2"] ]);
        const aNode = SvStorableNode.clone();
        const a = [1, 2, [3, null], { foo: "bar", b: true }, aSet, aMap, new Date(), aTypedArray, aNode];
        return a;
    }

    static selfTest () {
        console.log(this.svType() + " --- self test start --- ");
        const store = SvObjectPool.clone()
        store.open();;

        store.rootOrIfAbsentFromClosure(() => SvStorableNode.clone());
        store.flushIfNeeded();
        console.log("store:", store.asJson());
        console.log(" --- ");
        store.promiseCollect();
        store.clearCache();
        const loadedNode = store.rootObject();
        console.log("loadedNode = ", loadedNode);
        console.log(this.svType() + " --- self test end --- ");
    }
    */

    // --- blobs ---

    /**
     * @async
     * @description collect blobs
     * @returns {Promise<number>}
     */
    async asyncCollectBlobs () {
        if (!this.blobPool().isOpen()) {
            return 0;
        }
        try {
            const keySet = this.allBlobHashesSet();
            return await this.blobPool().asyncCollectUnreferencedKeySet(keySet);
        } catch (error) {
            if (!this.blobPool().isOpen() || /not open/i.test(error && error.message)) {
                return 0; // the blob store closed while the collection ran (shutdown, a test's reopen)
            }
            throw error;
        }
    }


    allObjects () {
        const objects = new Set();
        this.allPids().forEach(pid => {
            const obj = this.objectForPid(pid);
            objects.add(obj);
        });
        return objects;
    }

    allRecords () {
        const records = new Set();
        this.allPids().forEach(pid => {
            const record = this.recordForPid(pid);
            records.add(record);
        });
        return records;
    }

    allBlobHashesSet () {
        // Every pool in the local store counts, open or not: pools share the
        // blob store, and a session, character or catalog document that is not
        // open at boot still owns its images. (Walking only the open pools
        // evicted every catalog image on the first boot after the records
        // cutover, before the child pools had been imported — a one-time
        // re-download of the whole catalog.)
        //
        // Walks ROWS, not instances (materializing the store to ask each
        // object would defeat slot lazy loading). Blob hashes are hex sha256
        // strings, so scanning record JSON for 64-hex tokens is a conservative
        // superset — a blob can never be wrongly deleted. ACTIVE instances of
        // the open pools are still asked directly, which covers hashes added
        // since the last save.
        const hashesSet = new Set();
        const hexHashRegex = /[0-9a-f]{64}/g;
        this.recordStore().allRows().forEach((row) => {
            if (!row.isDeleted && row.payloadJson) {
                const matches = row.payloadJson.match(hexHashRegex);
                if (matches) {
                    matches.forEach(h => hashesSet.add(h));
                }
            }
        });
        SvObjectPool.openPools().forEach((pool) => {
            pool.activeObjects().forEachKV((pid, obj) => {
                if (obj && obj.referencedBlobHashesSet) {
                    hashesSet.addAll(obj.referencedBlobHashesSet());
                }
            });
        });
        return hashesSet;
    }

    localBlobHashesSet () {
        const hashesSet = new Set();
        const hexHashRegex = /[0-9a-f]{64}/g;
        this.forEachRecordJson((pid, recordString) => {
            const matches = recordString.match(hexHashRegex);
            if (matches) {
                matches.forEach(h => hashesSet.add(h));
            }
        });
        this.activeObjects().forEachKV((pid, obj) => {
            if (obj && obj.referencedBlobHashesSet) {
                hashesSet.addAll(obj.referencedBlobHashesSet());
            }
        });
        return hashesSet;
    }

    recordDescriptorsContaining (substring) {
        const found = [];
        this.forEachRecordJson((pid, recordString) => {
            if (recordString.includes(substring)) {
                const typeMatch = recordString.match(/"type"\s*:\s*"([^"]+)"/);
                found.push((typeMatch ? typeMatch[1] : "?") + " " + pid);
            }
        });
        return found;
    }

}.initThisClass());

