"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_windowedCollections
 * @extends SvObjectPool
 * @classdesc Windowed collections (Plans/Record Store §6) — loading elements by range,
 * and leaving them — and the record rows they read and write: child pools,
 * placements, row and record access, and storing one object's record. A
 * category of SvObjectPool, split from SvObjectPool.js unchanged
 * (Plans/Cleanup § 3).
 */
(class SvObjectPool_windowedCollections extends SvObjectPool {

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
        const rows = this.recordStore().windowedRowsForNode(this.poolId(), node.puuid(), beforeKey, limit)
            .filter(row => !this.isLeavingWindowedElement(row.objectId, node));
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

    /**
     * @description Whether a windowed row belongs to an element that left
     * this collection — removed (its row goes on a later tick:
     * deleteWindowedRowIfDetached; noted in leavingWindowedPids meanwhile) or
     * moved. A window load must
     * not bring it back: a conversation cleared at session start had its old
     * messages loaded back AHEAD of the new system prompt, which then went to
     * the model as an ordinary message (Gemini: "Invalid message role: system").
     * @param {String} pid
     * @param {SvNode} node - the collection being loaded
     * @returns {Boolean}
     * @category Windowed Collections
     */
    isLeavingWindowedElement (pid, node) {
        if (this.leavingWindowedPids().has(pid)) {
            return true; // detached, its row not deleted yet — whether or not the object is still in memory
        }
        const live = this.activeObjectForPid(pid);
        return !!live && Type.isFunction(live.parentNode) && live.parentNode() !== node;
    }

    /**
     * @description Discards the stored elements of a windowed node that are
     * not loaded — what clearing the node must also take (the loaded ones go
     * through their own detach). Each is noted as leaving until its row is
     * deleted, so no window load brings it back: a chat cleared at session
     * start with its window unloaded kept its old messages, and an older-window
     * load put them AHEAD of the new system prompt ("Invalid message role:
     * system" from Gemini).
     * @param {SvNode} node
     * @returns {Number} how many were discarded
     * @category Windowed Collections
     */
    discardUnloadedWindowedElementsOf (node) {
        if (this.isReplica()) {
            return 0; // a replica's rows mirror the host's projection
        }
        const loaded = new Set((node._subnodes || []).map(sn => sn.puuid()));
        const unloaded = this.recordStore().windowedRowsForNode(this.poolId(), node.puuid(), null, null).filter(row => !loaded.has(row.objectId));
        unloaded.forEach((row) => {
            this.leavingWindowedPids().add(row.objectId);
            this.asyncDeleteRecordRow(row.objectId).then(() => this.leavingWindowedPids().delete(row.objectId)); // their subtrees are swept by the next collect
        });
        return unloaded.length;
    }

    windowedElementCount (node) {
        return this.recordStore().windowedRowCountForNode(this.poolId(), node.puuid());
    }

    async asyncDeleteRecordRow (pid) {
        if (this.isReplica()) {
            return this; // a replica's rows mirror the host's projection: it deletes nothing of its own
        }
        await this.recordStore().asyncDelete([{ poolId: this.poolId(), objectId: pid }]);
        // a windowed element left its collection: no record references it, so
        // the change is the pool's (its root's) to hear of
        const root = this.rootObject();
        if (root && root.didStoreChangedContent) {
            root.didStoreChangedContent();
        }
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
     * with an order key between its siblings' keys. A pool already in the
     * store whose root is not loaded (stored on an earlier visit) is only
     * named: the element is then a stand-in for it — a row listing's
     * placeholder — and adopting it as the root would write its empty record
     * over the stored document. The document loads from its rows when opened.
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
            if (pool.knowsObject(v)) {
                return pool; // stored, not loaded: v stands in for it
            }
            pool.setRootObject(v);
        }
        if (pool.rootObject() !== v) {
            return pool; // another instance is its root; only that one moves it
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
        const row = this.rowForRecordJson(puuid, jsonString, obj);
        const isEdit = !this.takeNonEdit(puuid);
        if (obj && isEdit && this.isContentChange(this.rowForPid(puuid), row)) {
            this.noteContentChangeOf(obj);
        }
        this.recordStore().putRowInBatch(row);
        return this;
    }

}.initThisCategory());
