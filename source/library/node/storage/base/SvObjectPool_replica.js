"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_replica
 * @extends SvObjectPool
 * @classdesc A replica pool: a read-only local copy of a hosted document's
 * projection (Plans/Server-Hosted Sessions, M1a). It is imported like any
 * pool from the cloud, with `isReplica` set, so each record loads as its
 * class's `replicaClass()` and local changes are never stored.
 *
 * The host's changes arrive as rows — on its `poolVersion` notice, or pulled
 * from the store after a gap — and are applied to the LIVE objects in place:
 * the rows are written to the local store first (so a reference to a record
 * new in this change resolves when it is followed), then each changed object
 * that is loaded reloads from its record, setting its slots as a load does,
 * so the views observing them update. A record not yet loaded needs nothing:
 * it loads from its new row when first reached.
 */
(class SvObjectPool_replica extends SvObjectPool {

    /**
     * @description Whether a change built on `baseVersion` applies here: the
     * replica holds exactly that version. Otherwise it has missed one (or the
     * change is old) and pulls the changes since its version instead.
     * @param {Number} baseVersion
     * @returns {Boolean}
     * @category Replica
     */
    canApplyReplicaChangesFrom (baseVersion) {
        return this.replicaVersion() === baseVersion;
    }

    /**
     * @description The projection version this replica holds.
     * @returns {Number}
     * @category Replica
     */
    replicaVersion () {
        const root = this.rowForPid(this.poolId());
        return (root && Number.isInteger(root.version)) ? root.version : 0;
    }

    /**
     * @description Applies the host's changes to this replica, in place.
     * @param {Object} changes - { version, rows: [{ objectId, payloadJson, parentId?, orderKey? }], tombstones: [{ objectId }] }
     * @returns {Promise<SvObjectPool>}
     * @category Replica
     */
    async asyncApplyReplicaChanges (changes) {
        assert(this.isReplica(), "only a replica applies the host's changes");
        const rows = changes.rows.map(row => this.replicaRowFrom(row, changes.version));
        const tombstones = changes.tombstones || [];
        const arriving = rows.filter(row => row.parentId && !this.activeObjectForPid(row.objectId)); // windowed elements not loaded yet
        this.dropLiveWindowedElements(tombstones);
        await this.asyncWriteReplicaRows(rows, tombstones, changes.version);
        await this.asyncPrefetchTextBlobsForRows(rows);
        this.reloadLiveObjects(rows.map(row => row.objectId));
        this.addArrivingWindowedElements(arriving);
        tombstones.forEach(key => this.activeObjects().delete(key.objectId));
        return this;
    }

    /**
     * @description New windowed elements (a chat message) join their
     * collection's loaded window — no record references them, so no reload
     * reaches them. A collection whose window is not loaded needs nothing: it
     * reads them when it loads.
     * @param {Array<Object>} rows - rows whose objects were not loaded
     * @category Replica
     */
    addArrivingWindowedElements (rows) {
        const byParent = new Map();
        rows.forEach((row) => {
            const parent = this.activeObjectForPid(row.parentId);
            if (parent && parent.subnodesAreWindowed && parent.subnodesAreWindowed()) {
                if (!byParent.has(parent)) {
                    byParent.set(parent, []);
                }
                byParent.get(parent).push(row.objectId);
            }
        });
        byParent.forEach((pids, parent) => parent.didReceiveWindowedElements(this.loadWindowedObjects(pids)));
        return this;
    }

    loadWindowedObjects (pids) {
        this.beginWindowLoad(); // a load, not an edit
        try {
            const objects = pids.map(pid => this.objectForPid(pid)).filter(obj => !Type.isNullOrUndefined(obj));
            if (!this.isFinalizing() && this.loadingPids().count() > 0) {
                this.didInitLoadingPids();
            }
            return objects;
        } finally {
            this.endWindowLoad();
        }
    }

    /**
     * @description Removed windowed elements leave their collection's loaded
     * window (before their rows go).
     * @param {Array<Object>} tombstones
     * @category Replica
     */
    dropLiveWindowedElements (tombstones) {
        tombstones.forEach((key) => {
            const element = this.activeObjectForPid(key.objectId);
            const parent = element && element.parentNode ? element.parentNode() : null;
            if (parent && parent.subnodesAreWindowed && parent.subnodesAreWindowed()) {
                parent.didLoseWindowedElement(element);
            }
        });
        return this;
    }

    replicaRowFrom (row, version) {
        const local = this.recordStore().localRowFromCloudRow(Object.assign({}, row, { poolId: this.poolId() }));
        local.modifiedVersion = row.modifiedVersion || version;
        if (local.objectId === this.poolId()) {
            const stored = this.rowForPid(this.poolId()); // server-owned columns a notice doesn't carry stay as stored
            local.version = version;
            local.ownerUid = local.ownerUid || (stored && stored.ownerUid) || null;
        }
        return local;
    }

    async asyncWriteReplicaRows (rows, tombstones, version) {
        const store = this.recordStore();
        await store.asyncBeginBatch();
        rows.forEach(row => store.putRowInBatch(row));
        tombstones.forEach(key => store.deleteRowInBatch(this.poolId(), key.objectId));
        const root = store.rowForKey(this.poolId(), this.poolId());
        if (root && root.version !== version) {
            store.putRowInBatch(Object.assign({}, root, { version: version }));
        }
        await store.asyncCommitBatch();
        return this;
    }

    /**
     * @description Each loaded object among the changed reloads from its new
     * record. Every row is already stored, so references to records new in
     * this change resolve as they are followed.
     * @param {Array<String>} pids
     * @category Replica
     */
    reloadLiveObjects (pids) {
        pids.forEach((pid) => {
            const obj = this.activeObjectForPid(pid);
            if (obj && obj.reloadFromRecord) {
                obj.reloadFromRecord(this.recordForPid(pid), this);
            }
        });
        return this;
    }

}.initThisCategory());
