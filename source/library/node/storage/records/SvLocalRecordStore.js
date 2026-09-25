"use strict";

/**
 * @module library.node.storage.records
 * @class SvLocalRecordStore
 * @extends ProtoClass
 * @classdesc The local record store: SvRecordStoreProtocol over one
 * SvPersistentAtomicMap (IndexedDB in the browser, LevelDB under Node) — the
 * mirror side of the Record Store plan. It holds the rows of many pools in one
 * database; a row's key is `poolId + separator + objectId`, so a pool's rows are
 * one key-prefix range and the root row is the key `[X, X]`. The map is loaded
 * whole at open (as today's pool map is), so reads are in-memory scans; the
 * write side batches into the map's transactions.
 *
 * Settings (`homePoolId`) live in the same map under a reserved prefix that no
 * pool id can produce.
 *
 * A mirror has no commit protocol: `asyncCommit` refuses. The cloud protocol is
 * exercised against SvMemoryRecordStore (and later the cloud backings).
 */
(class SvLocalRecordStore extends ProtoClass {

    static keySeparator () {
        return "\u0001"; // a control character no pool or object id contains
    }

    static settingsPrefix () {
        return "settings" + this.keySeparator();
    }

    static rowKeyFor (poolId, objectId) {
        return poolId + this.keySeparator() + objectId;
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("name", "records");
            slot.setSlotType("String");
            slot.setDescription("the database name");
        }
        {
            const slot = this.newSlot("kvMap", null);
            slot.setSlotType("SvAtomicMap");
            slot.setDescription("row key → row JSON string; a settings key → its value string");
        }
        {
            const slot = this.newSlot("pools", null);
            slot.setSlotType("Map");
            slot.setDescription("poolId → the open SvObjectPool over this store's rows");
        }
        {
            const slot = this.newSlot("textBlobs", null);
            slot.setSlotType("Map");
            slot.setDescription("hash → text of every spilled BlobString the open pools refer to (filled at open, before materialization)");
        }
        {
            const slot = this.newSlot("homePool", null);
            slot.setSlotType("SvObjectPool");
            slot.setAllowsNullValue(true);
            slot.setDescription("the pool whose root is the app's model; child pools share its blob pool");
        }
        {
            const slot = this.newSlot("blobPool", null);
            slot.setSlotType("SvBlobPool");
            slot.setAllowsNullValue(true);
            slot.setDescription("the blob pool this store's pools share when it has no home pool (an in-memory cache of cloud pools uses the app's)");
        }
        {
            const slot = this.newSlot("outlivesItsPools", false);
            slot.setSlotType("Boolean");
            slot.setDescription("true for a store no pool owns — an in-memory cache of cloud pools, opened and closed one by one: closing a pool never closes it");
        }
    }

    initPrototype () {
        this.addProtocol(SvRecordStoreProtocol);
    }

    init () {
        super.init();
        this.setKvMap(SvPersistentAtomicMap.clone());
        this.setPools(new Map());
        this.setTextBlobs(new Map());
        return this;
    }

    // --- pools over this store ---

    registerPool (pool) {
        this.pools().set(pool.poolId(), pool);
        return this;
    }

    forgetPool (poolId) {
        this.pools().delete(poolId);
        return this;
    }

    /**
     * @description The open pool for an id, opening it when its rows are here;
     * null when the store has no such pool.
     * @category Pools
     */
    poolForId (poolId) {
        if (this.pools().has(poolId)) {
            return this.pools().get(poolId);
        }
        if (!this.rootRowForPool(poolId)) {
            return null;
        }
        return this.openPoolWithId(poolId);
    }

    openPoolWithId (poolId) {
        const row = this.rootRowForPool(poolId);
        const pool = this.newPoolWithId(poolId);
        if (row) {
            pool.setParentNodeId(row.parentId);
            pool.setOrderKey(row.orderKey);
            pool.setOwnerUid(row.ownerUid);
        }
        pool.openSync();
        return pool;
    }

    newChildPool (poolId, parentNodeId, orderKey) {
        const pool = this.newPoolWithId(poolId);
        pool.setParentNodeId(parentNodeId);
        pool.setOrderKey(orderKey);
        if (this.homePool()) {
            pool.setOwnerUid(this.homePool().ownerUid());
        }
        pool.openSync();
        return pool;
    }

    newPoolWithId (poolId) {
        const pool = SvObjectPool.clone();
        pool.setRecordStore(this);
        pool.setPoolId(poolId);
        pool.setName(this.name());
        const blobPool = this.homePool() ? this.homePool().blobPool() : this.blobPool();
        if (blobPool) {
            pool.setBlobPool(blobPool);
        }
        this.registerPool(pool);
        return pool;
    }

    /**
     * @description Root rows of the pools placed under any of the given node ids
     * — the children of a folder, for a deletion cascade.
     * @category Pools
     */
    childPoolRootRows (nodeIdSet) {
        return this.allRows().filter(row => SvRecordRow.isRoot(row) && row.parentId !== null && nodeIdSet.has(row.parentId));
    }

    /**
     * @description Replaces a pool's rows with a cloud pool.json (record JSON by
     * puuid plus a root pointer) and opens it. A live pool of the same id is
     * forgotten first: the caller owns replacing its objects.
     * @category Import
     */
    /**
     * @description Replaces a pool's rows with rows read from a cloud backing
     * (asyncOpen's `{ root, records }`): server-owned columns arrive with them
     * and are kept as the mirror. Opens the pool and reads its root.
     * @category Import
     */
    async asyncImportOpenedPool (opened, localPoolId = null) {
        // a cloud pool id is scoped ("<scope>:<local>"); locally the pool keeps its own id
        const poolId = localPoolId || SvRecordRow.localPoolId(opened.root.poolId);
        const live = this.pools().get(poolId);
        if (live) {
            live.close();
            this.forgetPool(poolId);
        }
        await this.asyncDeletePool(poolId);
        const rows = [opened.root].concat(opened.records).map(row => this.localRowFromCloudRow(Object.assign({}, row, { poolId: poolId })));
        await this.asyncPut(rows);
        const pool = this.openPoolWithId(poolId);
        pool.setLastSyncedSnapshot(Object.assign({}, pool.asJson()));
        await pool.asyncPrefetchTextBlobsForRows(rows);
        pool.readRootObject();
        return pool;
    }

    /**
     * @description The local row is the cloud row minus the columns a client
     * never reads (Plans/Record Store §3).
     * @category Import
     */
    localRowFromCloudRow (row) {
        return SvRecordRow.newRow({
            poolId: row.poolId,
            objectId: row.objectId,
            parentId: row.parentId === undefined ? null : row.parentId,
            orderKey: row.orderKey === undefined ? null : row.orderKey,
            ownerUid: row.ownerUid === undefined ? null : row.ownerUid,
            version: row.version === undefined ? null : row.version,
            modifiedVersion: row.modifiedVersion || 0,
            isDeleted: !!row.isDeleted,
            payloadJson: row.isDeleted ? null : row.payloadJson
        });
    }

    placementsFromCloudJson (json, placementsKey) {
        const raw = json[placementsKey];
        if (!raw) {
            return {};
        }
        return Type.isString(raw) ? JSON.parse(raw) : raw;
    }

    async asyncImportPoolJson (json, rootKey = "root", placementsKey = "_placements") {
        const poolId = json[rootKey];
        assert(poolId, "pool.json has no root pointer");
        const live = this.pools().get(poolId);
        if (live) {
            live.close();
            this.forgetPool(poolId);
        }
        const existing = this.rootRowForPool(poolId);
        await this.asyncDeletePool(poolId);
        const placements = this.placementsFromCloudJson(json, placementsKey);
        const rows = [];
        Object.keys(json).forEach((pid) => {
            if (pid === rootKey || pid === placementsKey) {
                return;
            }
            const row = SvRecordRow.newRow({ poolId: poolId, objectId: pid, payloadJson: json[pid] });
            if (placements[pid]) {
                row.parentId = placements[pid][0];
                row.orderKey = placements[pid][1];
            }
            if (pid === poolId) {
                row.ownerUid = existing ? existing.ownerUid : (this.homePool() ? this.homePool().ownerUid() : "local");
                row.version = existing ? existing.version : 0;
                row.parentId = existing ? existing.parentId : null;
                row.orderKey = existing ? existing.orderKey : null;
            }
            rows.push(row);
        });
        await this.asyncPut(rows);
        const pool = this.openPoolWithId(poolId);
        await pool.asyncPrefetchTextBlobsForRows(rows);
        pool.readRootObject();
        return pool;
    }

    /**
     * @description Use a plain in-memory atomic map instead of a persistent one
     * (tests, the cloud-import staging area).
     * @category Setup
     */
    useMemoryMap () {
        this.setKvMap(ideal.SvAtomicMap.clone());
        return this;
    }

    // --- open / close ---

    async asyncOpenStore () {
        const map = this.kvMap();
        if (map.setName) {
            map.setName(this.name());
        }
        await map.promiseOpen();
        return this;
    }

    isOpen () {
        return this.kvMap().isOpen();
    }

    close () {
        this.kvMap().close();
        return this;
    }

    async asyncClear () {
        await this.kvMap().promiseBegin();
        this.kvMap().clear();
        await this.kvMap().promiseCommit();
        return this;
    }

    supportsCommitProtocol () {
        return false;
    }

    // --- read side ---

    async asyncOpen (poolId) {
        const root = this.rootRowForPool(poolId);
        if (!root) {
            return null;
        }
        const records = this.liveRowsForPool(poolId).filter(row => !SvRecordRow.isRoot(row));
        return { root: root, records: records, version: root.version, state: "ready" };
    }

    async asyncChildren (nodeId, range = {}) {
        let children = this.allRows().filter(row => row.parentId === nodeId && !row.isDeleted);
        children.sort((a, b) => SvRecordRow.compareChildren(a, b));
        if (!Type.isNullOrUndefined(range.after)) {
            children = children.filter(row => row.orderKey > range.after);
        }
        if (Number.isInteger(range.limit)) {
            children = children.slice(0, range.limit);
        }
        return children;
    }

    async asyncReadChanges (poolId, sinceVersion) {
        const root = this.rootRowForPool(poolId);
        if (!root) {
            return null;
        }
        const changed = this.rowsForPool(poolId).filter(row => row.modifiedVersion > sinceVersion);
        return {
            rows: changed.filter(row => !row.isDeleted),
            tombstones: changed.filter(row => row.isDeleted).map(row => ({ poolId: row.poolId, objectId: row.objectId })),
            version: root.version,
            reloadRequired: false
        };
    }

    async asyncResolveFar (poolId) {
        return this.asyncOpen(poolId);
    }

    // --- mirror writes ---

    async asyncPut (rows) {
        rows.forEach(row => SvRecordRow.assertValid(row)); // all or nothing
        await this.kvMap().promiseBegin();
        rows.forEach(row => this.kvMap().atPut(SvLocalRecordStore.rowKeyFor(row.poolId, row.objectId), JSON.stringify(row)));
        await this.kvMap().promiseCommit();
    }

    async asyncDelete (keys) {
        await this.kvMap().promiseBegin();
        keys.forEach(key => this.kvMap().removeKey(SvLocalRecordStore.rowKeyFor(key.poolId, key.objectId)));
        await this.kvMap().promiseCommit();
    }

    async asyncDeletePool (poolId) {
        const keys = this.rowsForPool(poolId).map(row => ({ poolId: row.poolId, objectId: row.objectId }));
        await this.asyncDelete(keys);
        return keys.length;
    }

    async asyncCommit (commit) {
        void commit;
        return { status: "refused", reason: "the local store is a mirror; commits go to the cloud" };
    }

    // --- synchronous reads for the pool layer (the map is in memory once open) ---

    rowForKey (poolId, objectId) {
        const json = this.kvMap().at(SvLocalRecordStore.rowKeyFor(poolId, objectId));
        return Type.isString(json) ? JSON.parse(json) : undefined;
    }

    hasRow (poolId, objectId) {
        return this.kvMap().hasKey(SvLocalRecordStore.rowKeyFor(poolId, objectId));
    }

    rowsForPool (poolId) {
        const prefix = poolId + SvLocalRecordStore.keySeparator();
        const rows = [];
        const map = this.kvMap();
        map.keysArray().forEach((key) => { // keysArray/at are allowed inside a batch; forEachKV is not
            if (key.startsWith(prefix)) {
                rows.push(JSON.parse(map.at(key)));
            }
        });
        return rows;
    }

    liveRowsForPool (poolId) {
        return this.rowsForPool(poolId).filter(row => !row.isDeleted);
    }

    rootRowForPool (poolId) {
        const root = this.rowForKey(poolId, poolId);
        return (root && !root.isDeleted) ? root : null;
    }

    allRows () {
        const rows = [];
        const settingsPrefix = SvLocalRecordStore.settingsPrefix();
        const map = this.kvMap();
        map.keysArray().forEach((key) => {
            if (!key.startsWith(settingsPrefix)) {
                rows.push(JSON.parse(map.at(key)));
            }
        });
        return rows;
    }

    poolIds () {
        const ids = new Set();
        const separator = SvLocalRecordStore.keySeparator();
        const settingsPrefix = SvLocalRecordStore.settingsPrefix();
        this.kvMap().keysArray().forEach((key) => {
            if (!key.startsWith(settingsPrefix)) {
                ids.add(key.slice(0, key.indexOf(separator)));
            }
        });
        return ids;
    }

    rowCount () {
        return this.allRows().length;
    }

    // --- windowed collections (Plans/Record Store §6) ---

    /**
     * @description The rows placed under a node of the same pool, newest first
     * before `beforeKey` (or from the end when null), at most `limit`, returned in
     * ascending order.
     * @category Windowed
     */
    windowedRowsForNode (poolId, nodeId, beforeKey, limit) {
        let rows = this.rowsForPool(poolId).filter(row => row.parentId === nodeId && !row.isDeleted);
        if (!Type.isNullOrUndefined(beforeKey)) {
            rows = rows.filter(row => row.orderKey < beforeKey);
        }
        rows.sort((a, b) => SvRecordRow.compareChildren(a, b));
        if (Number.isInteger(limit) && rows.length > limit) {
            rows = rows.slice(rows.length - limit);
        }
        return rows;
    }

    orderKeysForNode (poolId, nodeId) {
        const keys = new Map();
        this.rowsForPool(poolId).forEach((row) => {
            if (row.parentId === nodeId && !row.isDeleted && row.orderKey) {
                keys.set(row.objectId, row.orderKey);
            }
        });
        return keys;
    }

    windowedRowCountForNode (poolId, nodeId) {
        return this.rowsForPool(poolId).filter(row => row.parentId === nodeId && !row.isDeleted).length;
    }

    placementsForPool (poolId) {
        const placements = {};
        this.rowsForPool(poolId).forEach((row) => {
            if (row.parentId && !row.isDeleted && row.objectId !== poolId) {
                placements[row.objectId] = [row.parentId, row.orderKey];
            }
        });
        return placements;
    }

    // --- settings ---

    settingAt (name) {
        const value = this.kvMap().at(SvLocalRecordStore.settingsPrefix() + name);
        return Type.isString(value) ? JSON.parse(value) : undefined;
    }

    async asyncSetSetting (name, value) {
        await this.kvMap().promiseBegin();
        this.kvMap().atPut(SvLocalRecordStore.settingsPrefix() + name, JSON.stringify(value));
        await this.kvMap().promiseCommit();
        return this;
    }

    // --- transactions spanning several writes (the pool's store pass) ---

    async asyncBeginBatch () {
        await this.kvMap().promiseBegin();
    }

    putRowInBatch (row) {
        SvRecordRow.assertValid(row);
        this.kvMap().atPut(SvLocalRecordStore.rowKeyFor(row.poolId, row.objectId), JSON.stringify(row));
        return this;
    }

    deleteRowInBatch (poolId, objectId) {
        this.kvMap().removeKey(SvLocalRecordStore.rowKeyFor(poolId, objectId));
        return this;
    }

    async asyncCommitBatch () {
        await this.kvMap().promiseCommit();
    }

    putSettingInBatch (name, value) {
        this.kvMap().atPut(SvLocalRecordStore.settingsPrefix() + name, JSON.stringify(value));
        return this;
    }

    /**
     * @description Loads a pool from the cloud pool.json shape (record JSON by
     * puuid plus a root pointer) straight into the map, outside any batch — the
     * import path of SvObjectPool.fromCloudJson. Rows get the server-neutral
     * defaults; the root row is owned locally until the cloud says otherwise.
     * @category Import
     */
    loadFromCloudJson (poolId, json, rootKey, placementsKey = "_placements") {
        const dict = {};
        const placements = this.placementsFromCloudJson(json, placementsKey);
        Object.keys(json).forEach((pid) => {
            if (pid === rootKey || pid === placementsKey) {
                return;
            }
            const row = SvRecordRow.newRow({ poolId: poolId, objectId: pid, payloadJson: json[pid] });
            if (placements[pid]) {
                row.parentId = placements[pid][0];
                row.orderKey = placements[pid][1];
            }
            if (pid === poolId) {
                row.ownerUid = "local";
                row.version = 0;
            }
            dict[SvLocalRecordStore.rowKeyFor(poolId, pid)] = JSON.stringify(row);
        });
        this.kvMap().fromJson(dict);
        return this;
    }

    revertBatch () {
        this.kvMap().revert();
        return this;
    }

}.initThisClass());
