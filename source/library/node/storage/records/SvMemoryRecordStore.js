"use strict";

/**
 * @module library.node.storage.records
 * @class SvMemoryRecordStore
 * @extends ProtoClass
 * @classdesc The in-memory record store: the reference backing every other
 * backing is tested against. It implements both sides of
 * SvRecordStoreProtocol — the mirror writes (`asyncPut` / `asyncDelete`) and
 * the cloud commit protocol (`asyncCommit`: compare-and-set on the root's
 * version, idempotent by request id, tombstones for deletes) — so a suite
 * written against it exercises the whole contract without a network.
 *
 * Server-owned state that is not a local column (the tombstone retention floor)
 * lives beside the rows, keyed by pool.
 */
(class SvMemoryRecordStore extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("rows", null);
            slot.setSlotType("Map");
            slot.setDescription("row key (SvRecordRow.keyOf) → row");
        }
        {
            const slot = this.newSlot("receipts", null);
            slot.setSlotType("Map");
            slot.setDescription("poolId + requestId → the commit's result, for idempotent retries");
        }
        {
            const slot = this.newSlot("minDeltaVersions", null);
            slot.setSlotType("Map");
            slot.setDescription("poolId → tombstone retention floor (server-owned; readers older than it must reload)");
        }
    }

    initPrototype () {
        this.addProtocol(SvRecordStoreProtocol);
    }

    init () {
        super.init();
        this.setRows(new Map());
        this.setReceipts(new Map());
        this.setMinDeltaVersions(new Map());
        return this;
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
        let children = [];
        this.rows().forEach((row) => {
            if (row.parentId === nodeId && !row.isDeleted) {
                children.push(row);
            }
        });
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
            reloadRequired: sinceVersion < this.minDeltaVersionForPool(poolId)
        };
    }

    async asyncResolveFar (poolId) {
        return this.asyncOpen(poolId);
    }

    // --- mirror writes ---

    async asyncPut (rows) {
        rows.forEach(row => SvRecordRow.assertValid(row)); // all or nothing: validate before the first write
        rows.forEach(row => this.rows().set(SvRecordRow.keyOf(row), row));
    }

    async asyncDelete (keys) {
        keys.forEach(key => this.rows().delete(SvRecordRow.keyFor(key.poolId, key.objectId)));
    }

    // --- cloud commit protocol ---

    async asyncCommit (commit) {
        const receiptKey = commit.poolId + " " + commit.requestId;
        if (this.receipts().has(receiptKey)) {
            return this.receipts().get(receiptKey); // a retry gets the first answer
        }
        const result = this.commitResult(commit);
        if (result.status === "committed") {
            this.receipts().set(receiptKey, result);
        }
        return result;
    }

    commitResult (commit) {
        const root = this.rootRowForPool(commit.poolId);
        if (!root) {
            return { status: "refused", reason: "unknown pool '" + commit.poolId + "'" };
        }
        const refusal = this.commitRefusal(commit);
        if (refusal) {
            return { status: "refused", reason: refusal };
        }
        if (root.version !== commit.baseVersion) {
            return { status: "conflict", version: root.version };
        }
        return { status: "committed", version: this.applyCommit(commit, root) };
    }

    /**
     * @description Why the commit cannot be applied regardless of version, or null.
     * A client sends payloads and placement, never server-owned columns, and never
     * a row of another pool or a deletion of the root.
     * @category Commit
     */
    commitRefusal (commit) {
        const writes = commit.writes || [];
        const deletes = commit.deletes || [];
        for (const row of writes) {
            if (row.poolId !== commit.poolId) {
                return "write for another pool: " + row.poolId + "/" + row.objectId;
            }
            if (!Type.isNullOrUndefined(row.version) || !Type.isNullOrUndefined(row.modifiedVersion) && row.modifiedVersion !== 0) {
                return "server-owned column sent for " + row.objectId + " (version, modifiedVersion)";
            }
            if (row.isDeleted) {
                return "a delete is sent in 'deletes', not as a tombstone row (" + row.objectId + ")";
            }
        }
        for (const key of deletes) {
            if (key.poolId !== commit.poolId) {
                return "delete for another pool: " + key.poolId + "/" + key.objectId;
            }
            if (key.objectId === commit.poolId) {
                return "the root record is not deleted by a commit; delete the pool";
            }
        }
        return null;
    }

    applyCommit (commit, root) {
        const version = root.version + 1;
        const written = (commit.writes || []).map(row => this.stampedWrite(row, version, root));
        written.forEach(row => SvRecordRow.assertValid(row));
        written.forEach(row => this.rows().set(SvRecordRow.keyOf(row), row));
        (commit.deletes || []).forEach(key => this.tombstone(key, version));
        this.rootRowForPool(commit.poolId).version = version;
        return version;
    }

    stampedWrite (row, version, root) {
        const stamped = SvRecordRow.newRow(Object.assign({}, row, { modifiedVersion: version, isDeleted: false }));
        if (SvRecordRow.isRoot(stamped)) {
            stamped.version = root.version;      // the server owns it; applyCommit advances it after the writes
            stamped.ownerUid = root.ownerUid;
        }
        return stamped;
    }

    tombstone (key, version) {
        const rowKey = SvRecordRow.keyFor(key.poolId, key.objectId);
        const existing = this.rows().get(rowKey) || SvRecordRow.newRow({ poolId: key.poolId, objectId: key.objectId });
        this.rows().set(rowKey, Object.assign({}, existing, { isDeleted: true, payloadJson: null, modifiedVersion: version }));
    }

    // --- server-owned state beside the rows ---

    setMinDeltaVersion (poolId, version) {
        this.minDeltaVersions().set(poolId, version);
        return this;
    }

    minDeltaVersionForPool (poolId) {
        return this.minDeltaVersions().has(poolId) ? this.minDeltaVersions().get(poolId) : 0;
    }

    // --- helpers ---

    rowsForPool (poolId) {
        const rows = [];
        this.rows().forEach((row) => {
            if (row.poolId === poolId) {
                rows.push(row);
            }
        });
        return rows;
    }

    liveRowsForPool (poolId) {
        return this.rowsForPool(poolId).filter(row => !row.isDeleted);
    }

    rootRowForPool (poolId) {
        const root = this.rows().get(SvRecordRow.keyFor(poolId, poolId));
        return (root && !root.isDeleted) ? root : null;
    }

}.initThisClass());
