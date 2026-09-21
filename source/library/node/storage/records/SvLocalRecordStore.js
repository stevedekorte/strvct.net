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
    }

    initPrototype () {
        this.addProtocol(SvRecordStoreProtocol);
    }

    init () {
        super.init();
        this.setKvMap(SvPersistentAtomicMap.clone());
        return this;
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
        this.kvMap().forEachKV((key, json) => {
            if (key.startsWith(prefix)) {
                rows.push(JSON.parse(json));
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
        this.kvMap().forEachKV((key, json) => {
            if (!key.startsWith(settingsPrefix)) {
                rows.push(JSON.parse(json));
            }
        });
        return rows;
    }

    poolIds () {
        const ids = new Set();
        const separator = SvLocalRecordStore.keySeparator();
        const settingsPrefix = SvLocalRecordStore.settingsPrefix();
        this.kvMap().forEachK((key) => {
            if (!key.startsWith(settingsPrefix)) {
                ids.add(key.slice(0, key.indexOf(separator)));
            }
        });
        return ids;
    }

    rowCount () {
        return this.allRows().length;
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

    revertBatch () {
        this.kvMap().revert();
        return this;
    }

}.initThisClass());
