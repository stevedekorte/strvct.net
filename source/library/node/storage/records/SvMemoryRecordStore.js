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

    supportsCommitProtocol () {
        return true;
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
            const cursor = { orderKey: range.after, objectId: Type.isNullOrUndefined(range.afterObjectId) ? "\uffff" : range.afterObjectId };
            children = children.filter(row => SvRecordRow.compareChildren(row, cursor) > 0);
        }
        if (Number.isInteger(range.limit)) {
            children = children.slice(0, range.limit);
        }
        return children;
    }

    async asyncRootRows (poolIds) {
        return poolIds.map(poolId => this.rootRowForPool(poolId)).filter(row => row !== null);
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

    async asyncCommit (commit, options = {}) {
        const receiptKey = commit.poolId + " " + commit.requestId;
        if (this.receipts().has(receiptKey)) {
            return this.receipts().get(receiptKey); // a retry gets the first answer
        }
        const gate = options.finalizeGate || null;
        if (gate && !await gate) {
            return { status: "aborted" };
        }
        const result = this.commitResult(commit);
        if (result.status === "committed") {
            this.receipts().set(receiptKey, result);
        }
        return result;
    }

    /**
     * @description Applies a commit — and its paired `projection`, a second
     * pool committed with it, both or neither (Plans/Server-Hosted Sessions
     * M1a) — answering as the cloud does: `{ status, version }`, plus
     * `projectionVersion` for a pair.
     * @category Commit
     */
    commitResult (commit) {
        const parts = commit.projection ? [commit, commit.projection] : [commit];
        if (parts.length === 2 && commit.projection.poolId === commit.poolId) {
            return { status: "refused", reason: "a projection is a different pool" };
        }
        const checks = parts.map(part => this.commitCheck(part));
        const refused = checks.find(check => check.status === "refused");
        if (refused) {
            return { status: "refused", reason: refused.reason };
        }
        const blocked = checks.find(check => check.status !== "ready");
        if (blocked) {
            return this.commitAnswer(blocked.status, checks);
        }
        checks.forEach((check) => {
            check.version = this.applyCommit(check.part, check.root || this.createdRootFor(check.part));
        });
        return this.commitAnswer("committed", checks);
    }

    /**
     * @description One pool's part of a commit checked against its root,
     * changing nothing: "ready" (with the root, or null for a creating
     * commit), "refused" or "conflict" (with the pool's version).
     * @category Commit
     */
    commitCheck (part) {
        const root = this.rootRowForPool(part.poolId);
        const creates = !root && part.baseVersion === 0 && (part.writes || []).some(row => SvRecordRow.isRoot(row));
        if (!root && !creates) {
            return { status: "refused", reason: "unknown pool '" + part.poolId + "' (a pool is created by a baseVersion 0 commit carrying its root record)" };
        }
        const refusal = this.commitRefusal(part);
        if (refusal) {
            return { status: "refused", reason: refusal };
        }
        const version = root ? root.version : 0;
        if (version !== part.baseVersion) {
            return { status: "conflict", version: version };
        }
        return { status: "ready", part: part, root: root, version: version };
    }

    commitAnswer (status, checks) {
        const answer = { status: status, version: checks[0].version };
        if (checks.length === 2) {
            answer.projectionVersion = checks[1].version;
        }
        return answer;
    }

    /**
     * @description A pool's first commit (baseVersion 0, its root record among
     * the writes) creates it, as the cloud does: the root row at version 0,
     * owned by the committer (`create.ownerUid`, else "local").
     * @returns {Object|null} the new root row
     * @category Commit
     */
    createdRootFor (commit) {
        const rootWrite = (commit.writes || []).find(row => SvRecordRow.isRoot(row));
        if (commit.baseVersion !== 0 || !rootWrite || this.commitRefusal(commit)) {
            return null;
        }
        const ownerUid = (commit.create && commit.create.ownerUid) || "local";
        const root = SvRecordRow.newRow({ poolId: commit.poolId, objectId: rootWrite.objectId, ownerUid: ownerUid, version: 0, payloadJson: rootWrite.payloadJson, parentId: rootWrite.parentId || null, orderKey: rootWrite.parentId ? rootWrite.orderKey : null });
        this.rows().set(SvRecordRow.keyOf(root), root);
        return root;
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
            if (key.objectId === SvRecordRow.localPoolId(commit.poolId)) {
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
        const root = this.rows().get(SvRecordRow.keyFor(poolId, SvRecordRow.localPoolId(poolId))); // a scoped pool's root is its local id
        return (root && !root.isDeleted) ? root : null;
    }

}.initThisClass());
