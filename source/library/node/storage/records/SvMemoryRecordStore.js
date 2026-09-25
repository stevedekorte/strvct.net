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
 * Server-owned state that is not a local column (the tombstone retention floor,
 * an open staged commit) lives beside the rows, keyed by pool.
 *
 * Staged commits (SvStagedRecordCommit) behave as the cloud's do: begin reserves
 * the next version, each batch keeps its rows' pre-images, every other reader and
 * writer is answered "busy" until finalize, and an abandoned stage (idle past
 * stageIdleTtlMs) is rolled back by the next access. Set maxOpsPerCommit to make
 * asyncCommit stage large commits, as the cloud store does.
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
        {
            const slot = this.newSlot("stages", null);
            slot.setSlotType("Map");
            slot.setDescription("poolId → the open staged commit { requestId, reservedVersion, expiresAt, preimages: Map(row key → row|null) }");
        }
        {
            const slot = this.newSlot("stageIdleTtlMs", 2 * 60 * 1000);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("maxOpsPerCommit", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
            slot.setDescription("when set, asyncCommit stages commits larger than this (null: never)");
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
        this.setStages(new Map());
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
        if (this.isStaging(poolId)) {
            return { root: null, records: [], version: root.version, state: "busy" };
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
        if (this.isStaging(poolId)) {
            return { rows: [], tombstones: [], version: root.version, reloadRequired: false, state: "busy" };
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
        if (this.maxOpsPerCommit() !== null && SvStagedRecordCommit.needsStaging(commit, this.maxOpsPerCommit(), Infinity)) {
            return this.asyncCommitStaged(commit);
        }
        const result = this.commitResult(commit);
        if (result.status === "committed") {
            this.receipts().set(receiptKey, result);
        }
        return result;
    }

    commitResult (commit) {
        const root = this.rootRowForPool(commit.poolId) || this.createdRootFor(commit);
        if (!root) {
            return { status: "refused", reason: "unknown pool '" + commit.poolId + "' (a pool is created by a baseVersion 0 commit carrying its root record)" };
        }
        const refusal = this.commitRefusal(commit);
        if (refusal) {
            return { status: "refused", reason: refusal };
        }
        if (this.isStaging(commit.poolId)) {
            return { status: "busy", version: root.version };
        }
        if (root.version !== commit.baseVersion) {
            return { status: "conflict", version: root.version };
        }
        return { status: "committed", version: this.applyCommit(commit, root) };
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

    // --- staged commits ---

    async asyncCommitStaged (commit) {
        try {
            return await SvStagedRecordCommit.clone().setStore(this).setCommit(commit).setMaxOpsPerWrite(this.maxOpsPerCommit()).asyncRun();
        } catch (error) {
            if (error.code === "failed-precondition" || error.code === "invalid-argument") {
                return { status: "refused", reason: error.message };
            }
            throw error;
        }
    }

    async asyncStageBegin (args) {
        const receiptKey = args.poolId + " " + args.requestId;
        if (this.receipts().has(receiptKey)) {
            return this.receipts().get(receiptKey);
        }
        const root = this.rootRowForPool(args.poolId);
        if (!root) {
            return { status: "refused", reason: "unknown pool '" + args.poolId + "'" };
        }
        if (this.isStaging(args.poolId)) {
            const stage = this.stages().get(args.poolId);
            return stage.requestId === args.requestId ? { status: "staging", version: stage.reservedVersion } : { status: "busy", version: root.version };
        }
        if (root.version !== args.baseVersion) {
            return { status: "conflict", version: root.version };
        }
        this.stages().set(args.poolId, { requestId: args.requestId, reservedVersion: root.version + 1, expiresAt: Date.now() + this.stageIdleTtlMs(), preimages: new Map() });
        return { status: "staging", version: root.version + 1 };
    }

    async asyncStageWrite (args) {
        const stage = this.openStage(args.poolId, args.requestId);
        const commit = { poolId: args.poolId, writes: args.writes || [], deletes: args.deletes || [] };
        const refusal = this.commitRefusal(commit) || (commit.writes.some(row => SvRecordRow.isRoot(row)) ? "the root record is written by finalize" : null);
        if (refusal) {
            throw Object.assign(new Error(refusal), { code: "invalid-argument" });
        }
        commit.writes.map(row => SvRecordRow.keyOf(row)).concat(commit.deletes.map(key => SvRecordRow.keyFor(key.poolId, key.objectId))).forEach((key) => {
            if (!stage.preimages.has(key)) {
                stage.preimages.set(key, this.rows().get(key) || null);
            }
        });
        const root = this.rootRowForPool(args.poolId);
        const written = commit.writes.map(row => this.stampedWrite(row, stage.reservedVersion, root));
        written.forEach(row => SvRecordRow.assertValid(row));
        written.forEach(row => this.rows().set(SvRecordRow.keyOf(row), row));
        commit.deletes.forEach(key => this.tombstone(key, stage.reservedVersion));
        stage.expiresAt = Date.now() + this.stageIdleTtlMs();
        return { status: "staging", version: stage.reservedVersion };
    }

    async asyncStageFinalize (args) {
        const receiptKey = args.poolId + " " + args.requestId;
        if (this.receipts().has(receiptKey)) {
            return this.receipts().get(receiptKey);
        }
        const stage = this.openStage(args.poolId, args.requestId);
        const root = this.rootRowForPool(args.poolId);
        if (args.rootWrite) {
            const stamped = this.stampedWrite(args.rootWrite, stage.reservedVersion, root);
            SvRecordRow.assertValid(stamped);
            this.rows().set(SvRecordRow.keyOf(stamped), stamped);
        }
        this.rootRowForPool(args.poolId).version = stage.reservedVersion;
        this.stages().delete(args.poolId);
        const result = { status: "committed", version: stage.reservedVersion };
        this.receipts().set(receiptKey, result);
        return result;
    }

    openStage (poolId, requestId) {
        const stage = this.isStaging(poolId) ? this.stages().get(poolId) : null;
        if (!stage || stage.requestId !== requestId) {
            throw Object.assign(new Error("no open stage " + requestId + " (finished, rolled back, or never begun)"), { code: "failed-precondition" });
        }
        return stage;
    }

    /**
     * @description Whether a live staged commit holds the pool; an abandoned one
     * is rolled back from its pre-images first.
     * @category Staging
     */
    isStaging (poolId) {
        const stage = this.stages().get(poolId);
        if (stage && stage.expiresAt <= Date.now()) {
            this.rollBackStage(poolId, stage);
            return false;
        }
        return !!stage;
    }

    rollBackStage (poolId, stage) {
        stage.preimages.forEach((row, key) => {
            if (row) {
                this.rows().set(key, row);
            } else {
                this.rows().delete(key);
            }
        });
        this.stages().delete(poolId);
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
