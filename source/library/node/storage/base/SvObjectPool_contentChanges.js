"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_contentChanges
 * @extends SvObjectPool
 * @classdesc What counts as an edit: changes applied from the cloud or a host are stored
 * but not announced; a store pass collects the objects whose stored content
 * changed and announces them once it ends. Also the record budget (size
 * warnings) and storing a record's blobs. A category of SvObjectPool, split
 * from SvObjectPool.js unchanged (Plans/Cleanup § 3).
 */
(class SvObjectPool_contentChanges extends SvObjectPool {

    // --- content changes (what counts as an edit) ---

    /**
     * @description Applies state that is not a local edit — the cloud's copy,
     * a host's snapshot or patches: objects first dirtied while fn runs are
     * stored as usual but their change is not announced
     * (announceContentChanges), so no document counts it as edited. A time
     * window, like Slot.isMaterializingAnyLazySlot — sound in single-threaded
     * JS; a counter because applies can nest. fn must be synchronous.
     * @param {Function} fn
     * @returns {*} fn's result
     * @category Content Changes
     */
    static applyAsNonEdit (fn) {
        this._nonEditDepth = (this._nonEditDepth || 0) + 1;
        try {
            return fn();
        } finally {
            this._nonEditDepth--;
        }
    }

    static isApplyingNonEdit () {
        return (this._nonEditDepth || 0) > 0;
    }

    /**
     * @description Classifies a dirtying: inside applyAsNonEdit it is not an
     * edit — unless the object was already dirty from an edit — and outside
     * it, it is (a later edit supersedes an earlier non-edit).
     * @param {String} puuid
     * @category Content Changes
     */
    noteEditKindOfDirty (puuid) {
        if (!SvObjectPool.isApplyingNonEdit()) {
            if (this.nonEditPids()) {
                this.nonEditPids().delete(puuid);
            }
            return;
        }
        if (!this.dirtyObjects().has(puuid)) {
            this.addNonEditPid(puuid);
        }
    }

    addNonEditPid (puuid) {
        if (!this.nonEditPids()) {
            this.setNonEditPids(new Set());
        }
        this.nonEditPids().add(puuid);
    }

    /**
     * @description Whether puuid's pending change was a non-edit, forgetting it.
     * @param {String} puuid
     * @returns {Boolean}
     * @category Content Changes
     */
    takeNonEdit (puuid) {
        const pids = this.nonEditPids();
        return !!(pids && pids.delete(puuid));
    }

    /**
     * @description Reclassifies the pending (dirty, not yet stored) changes of
     * aNode and its descendants as non-edits: a cloud sync that applied them
     * has just finished (SvSyncableJsonGroup.didSyncFromCloud).
     * @param {SvNode} aNode
     * @category Content Changes
     */
    markPendingChangesAsNonEditsUnder (aNode) {
        this.dirtyObjects().forEachKV((puuid, obj) => {
            if (SvObjectPool.isObjectWithin(obj, aNode)) {
                this.addNonEditPid(puuid);
            }
        });
    }

    /**
     * @description Whether aNode or a descendant has an edit waiting for the
     * next flush (dirty, not a non-edit). An edit counts from the moment it is
     * made — a save right after it must see it — though the stamp that records
     * it (announceContentChanges) comes with the flush.
     * @param {SvNode} aNode
     * @returns {Boolean}
     * @category Content Changes
     */
    hasPendingEditsWithin (aNode) {
        const nonEdits = this.nonEditPids();
        for (const [puuid, obj] of this.dirtyObjects()) {
            if (!(nonEdits && nonEdits.has(puuid)) && SvObjectPool.isObjectWithin(obj, aNode)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description Whether obj is aNode or below it, climbing the same links
     * didStoreChangedContent climbs.
     * @category Content Changes
     */
    static isObjectWithin (obj, aNode) {
        let current = obj;
        for (let depth = 0; current && depth < 1000; depth++) {
            if (current === aNode) {
                return true;
            }
            current = SvObjectPool.upwardLinkOf(current);
        }
        return false;
    }

    static upwardLinkOf (obj) {
        if (obj.parentNode && obj.parentNode()) {
            return obj.parentNode();
        }
        if (obj.ownerNode && obj.ownerNode()) {
            return obj.ownerNode();
        }
        return obj.owner ? obj.owner() : null;
    }

    /**
     * @description Remembers an object whose stored content changed, to be told
     * when the flush ends (announceContentChanges).
     * @param {Object} obj
     * @category Content Changes
     */
    noteContentChangeOf (obj) {
        if (!this.contentChangedObjects()) {
            this.setContentChangedObjects(new Set());
        }
        this.contentChangedObjects().add(obj);
    }

    /**
     * @description Whether a new row changes what the old one held: its payload
     * as the cloud holds it, or — for a windowed element — its place in its
     * collection. Re-storing the same content — a load, a derived value
     * recomputed, a didUpdateNode with nothing stored behind it — is not a
     * change, and neither is local-only bookkeeping (slots with
     * isInCloudRecord false). The root row's placement is the pool's, not
     * content (and an imported root names the cloud's folder id where a local
     * store names the local folder node).
     * @param {Object|null} oldRow
     * @param {Object} newRow
     * @returns {Boolean}
     * @category Content Changes
     */
    isContentChange (oldRow, newRow) {
        if (!oldRow || oldRow.isDeleted || !oldRow.payloadJson) {
            return true;
        }
        const isRoot = newRow.objectId === this.poolId();
        if (!isRoot && (oldRow.parentId !== newRow.parentId || oldRow.orderKey !== newRow.orderKey)) {
            return true;
        }
        if (oldRow.payloadJson === newRow.payloadJson) {
            return false;
        }
        return SvObjectPool.cloudPayloadFor(oldRow.payloadJson) !== SvObjectPool.cloudPayloadFor(newRow.payloadJson);
    }

    /**
     * @description A store pass is starting. Passes nest: a folder whose
     * documents are pools stores a new document's pool inside its own pass
     * (ensureChildPoolForRoot).
     * @category Content Changes
     */
    static beginStorePass () {
        this._storePassDepth = (this._storePassDepth || 0) + 1;
    }

    /**
     * @description A pool's store pass ended. Its content changes wait for the
     * outermost pass: the announcement climbs to ancestors in other pools (a
     * document tells its folder), and an outer pass that already stored one
     * would see the answer — a folder's timestamp — as a mutation mid-pass.
     * @param {SvObjectPool} pool
     * @category Content Changes
     */
    static endStorePass (pool) {
        this._storePassDepth--;
        this.poolsAwaitingAnnouncement().add(pool);
        if (this._storePassDepth > 0) {
            return;
        }
        const pools = Array.from(this.poolsAwaitingAnnouncement());
        this.poolsAwaitingAnnouncement().clear();
        pools.forEach(p => p.announceContentChanges());
    }

    static poolsAwaitingAnnouncement () {
        if (!this._poolsAwaitingAnnouncement) {
            this._poolsAwaitingAnnouncement = new Set();
        }
        return this._poolsAwaitingAnnouncement;
    }

    /**
     * @description Tells each object whose stored content changed in the flush
     * that just ended (didStoreChangedContent), or the pool's root when the
     * object cannot say where it belongs. After the flush, so a timestamp set
     * in answer is stored by the next one rather than deferred mid-pass.
     * @category Content Changes
     */
    announceContentChanges () {
        const changed = this.contentChangedObjects();
        if (!changed) {
            return;
        }
        this.setContentChangedObjects(null);
        changed.forEach(obj => {
            const target = obj.didStoreChangedContent ? obj : this.rootObject();
            if (target && target.didStoreChangedContent) {
                target.didStoreChangedContent();
            }
        });
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
        this.warnIfRecordOverBudget(record.type, jsonString.length);
        return jsonString;
    }

    /**
     * @description Record size discipline (Plans/Record Store §5): records
     * stay small (stored Strings are capped, BlobStrings spill), so one over
     * this budget means a class keeps unbounded data inline (a growing list, a
     * large JSON value) — named here, once per class, long before a row nears a
     * backend's per-row limit (Firestore's 1 MiB).
     * @category Record Size
     */
    warnIfRecordOverBudget (type, length) {
        if (length > SvObjectPool.recordBudgetLength() && !SvObjectPool.overBudgetTypes().has(type)) {
            SvObjectPool.overBudgetTypes().add(type);
            console.warn(this.logPrefix() + "a " + type + " record is " + length + " characters, over the " + SvObjectPool.recordBudgetLength() + " record budget (Record Store §5) — move its unbounded data to rows or text blobs");
        }
        return this;
    }

    static recordBudgetLength () {
        return 65536;
    }

    static overBudgetTypes () {
        if (!this._overBudgetTypes) {
            this._overBudgetTypes = new Set();
        }
        return this._overBudgetTypes;
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

}.initThisCategory());
