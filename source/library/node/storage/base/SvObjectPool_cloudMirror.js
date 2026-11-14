"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_cloudMirror
 * @extends SvObjectPool
 * @classdesc The cloud mirror: the pool.json snapshot and the delta since it, and the
 * commit protocol against a cloud record store (Plans/Record Store §7) — with
 * the pool projection a hosted session's replicas read, the blank-commit
 * tripwire, and what a commit's records carry. A category of SvObjectPool,
 * split from SvObjectPool.js unchanged (Plans/Cleanup § 3).
 */
(class SvObjectPool_cloudMirror extends SvObjectPool {

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
     *
     * With `options.projection` (an SvPoolProjection) the projection's changes
     * ride the same commit — one transaction, both or neither — when the two fit
     * in one; otherwise the truth commits first and the projection follows on
     * its own, so the projection never gets ahead of the truth. The answer then
     * carries `projection: { version, baseVersion, writes, deletes }` — what the
     * replicas' copy received, for the caller's notice.
     * @param {SvCloudRecordStore} cloudStore
     * @param {Object} [options] { cloudPoolId, create: { scopeId } for a pool's first commit, projection }
     * @returns {Promise<Object>} { status: "committed"|"conflict"|"refused"|"unchanged", version?, reason?, projection? }
     * @category Cloud Mirror
     */
    async asyncCommitToCloud (cloudStore, options = {}) {
        await this.asyncFlushDirty();
        const rootRow = this.rowForPid(this.poolId());
        assert(rootRow, "the pool has no root row to commit");
        const changed = this.cloudChanges();
        this.reportIfCommitLooksBlank(changed);
        const projection = options.projection || null;
        const projected = projection ? projection.changes() : null;
        if (changed.isEmpty) {
            return (projected && !projected.isEmpty)
                ? this.asyncCommitProjection(cloudStore, projection, projected, { status: "unchanged", version: rootRow.version || 0 })
                : { status: "unchanged", version: rootRow.version || 0 };
        }
        // What this commit sends, as a snapshot: taken now, not after the
        // network wait — records stored locally while the commit is in flight
        // were not sent, and a snapshot taken on completion counted them as
        // synced, so they never reached the cloud while records sent later
        // referenced them (dangling refs in a dev session, 2026-09-26).
        const sentSnapshot = Object.assign({}, this.asJson());
        const commit = this.cloudCommitFor(changed, rootRow, options);
        await cloudStore.asyncEnsureCommitLimits(); // fitsInOneCommit reads them
        const isPaired = !!(projected && !projected.isEmpty) && this.fitsInOneCommit(cloudStore, commit, projection.commitPart(projected));
        if (isPaired) {
            commit.projection = projection.commitPart(projected);
        } else if (projected && !projected.isEmpty) {
            return this.asyncCommitBesideProjection(cloudStore, { commit, sentSnapshot }, { projection, projected });
        }
        const result = await cloudStore.asyncCommit(commit);
        if (result && result.status === "committed") {
            await this.mirrorCloudVersion(result.version, commit);
            this.setLastSyncedSnapshot(sentSnapshot);
            return isPaired ? this.answerWithProjection(result, projection, projected, result.projectionVersion) : result;
        }
        if (result && result.status === "conflict") {
            if (isPaired && result.version === commit.baseVersion) {
                projection.didConflict(result.projectionVersion); // only the projection moved: resend it whole next time
            }
            return Object.assign({ commit: commit }, result); // what was refused, for the caller to tell whether reloading loses it
        }
        return result;
    }

    /**
     * @description Save-side tripwire (Cleanup § 4), report only: a commit that
     * deletes at least half the records the cloud holds (and at least 5) looks
     * like a wrongly loaded, default-initialized document saved over the real
     * one, the class of bug that has destroyed data. A delete tombstones the
     * record's payload, so the error is logged (and reported) before it goes.
     * The commit is still sent; whether to refuse is decided from these reports.
     * @param {Object} changed - cloudChanges()
     * @returns {Boolean} whether it tripped
     * @category Cloud Mirror
     */
    reportIfCommitLooksBlank (changed) {
        const syncedCount = this.syncedRecordCount();
        const deleteCount = changed.deletes.length;
        const trips = deleteCount >= 5 && deleteCount * 2 >= syncedCount;
        if (trips) {
            const error = new Error("TRIPWIRE: commit deletes " + deleteCount + " of the " + syncedCount + " records the cloud holds (writes " + Object.keys(changed.writes).length + ") — a wrongly loaded document saved over the real one?");
            const rootType = this.rootObject() ? this.rootObject().svType() : null;
            console.error(this.logPrefix() + error.message + " Pool " + this.poolId() + ", root " + rootType + "\n" + error.stack);
            if (SvGlobals.has("SvErrorReport")) {
                SvErrorReport.asyncSend(error, { kind: "blank-commit", rootType: rootType, poolId: this.poolId(), deletes: deleteCount, synced: syncedCount });
            }
        }
        return trips;
    }

    /**
     * @description How many records the last synced snapshot holds (the cloud's
     * copy as this pool last saw it), not counting its bookkeeping entries.
     * @returns {Number}
     * @category Cloud Mirror
     */
    syncedRecordCount () {
        const snapshot = this.lastSyncedSnapshot() || {};
        return Object.keys(snapshot).filter(pid => pid !== this.rootKey() && pid !== this.placementsKey()).length;
    }

    cloudCommitFor (changed, rootRow, options) {
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
        return commit;
    }

    /**
     * @description Whether a truth commit and its projection fit in one
     * transaction (the backend's operation and payload limits, counted together).
     * @returns {Boolean}
     * @category Cloud Mirror
     */
    fitsInOneCommit (cloudStore, commit, projectionPart) {
        const parts = [commit, projectionPart];
        const ops = parts.reduce((n, part) => n + part.writes.length + part.deletes.length, 0);
        const bytes = parts.reduce((n, part) => n + SvCloudRecordStore.payloadBytes(part.writes), 0);
        return ops <= cloudStore.maxOpsPerCommit() && bytes <= cloudStore.maxBytesPerCommit();
    }

    /**
     * @description Commits the projection on its own, when only the projection
     * changed (its first commit, or a resend after a conflict).
     * @returns {Promise<Object>} the truth's answer, with the projection's added
     * @category Cloud Mirror
     */
    async asyncCommitProjection (cloudStore, projection, projected, truthAnswer) {
        const result = await this.asyncSendProjection(cloudStore, { projection, projected }, null);
        return this.answerFromProjection(truthAnswer, { projection, projected }, result);
    }

    /**
     * @description A truth commit too large to pair with its projection: both
     * are sent at once, and the projection's
     * publication waits for the truth's — it is aborted when the truth did not
     * land, so players never see a version the truth lacks.
     * @param {Object} truth - { commit, sentSnapshot }
     * @param {Object} side - { projection, projected }
     * @returns {Promise<Object>} the truth's answer, with the projection's added
     * @category Cloud Mirror
     */
    async asyncCommitBesideProjection (cloudStore, truth, side) {
        let openGate = null;
        const gate = new Promise(resolve => { openGate = resolve; });
        const projectionWork = this.asyncSendProjection(cloudStore, side, gate);
        const result = await this.asyncCommitTruthOpening(cloudStore, truth, openGate);
        const projectionResult = await projectionWork;
        return (result && result.status === "committed") ? this.answerFromProjection(result, side, projectionResult) : result;
    }

    /**
     * @description Commits the truth and then opens the projection's gate —
     * true when it landed, false otherwise (including a throw).
     * @returns {Promise<Object>} the truth's answer (a conflict carries the commit)
     * @category Cloud Mirror
     */
    async asyncCommitTruthOpening (cloudStore, truth, openGate) {
        let result = null;
        try {
            result = await cloudStore.asyncCommit(truth.commit);
            if (result && result.status === "committed") {
                await this.mirrorCloudVersion(result.version, truth.commit);
                this.setLastSyncedSnapshot(truth.sentSnapshot);
            }
        } finally {
            openGate(!!result && result.status === "committed");
        }
        return (result && result.status === "conflict") ? Object.assign({ commit: truth.commit }, result) : result;
    }

    /**
     * @description Sends the projection's changes as their own commit, gated
     * when given a gate; a failure is answered, not thrown, since the truth
     * may already have landed (the changes stay unsent and go with the next save).
     * @returns {Promise<Object>} the projection commit's answer
     * @category Cloud Mirror
     */
    async asyncSendProjection (cloudStore, side, gate) {
        const part = Object.assign({ requestId: Object.newUuid() }, side.projection.commitPart(side.projected));
        try {
            return await cloudStore.asyncCommit(part, { finalizeGate: gate });
        } catch (error) {
            return { status: "failed", reason: error && error.message };
        }
    }

    /**
     * @description The truth's answer, with the projection's added when it
     * committed; a conflict marks the projection for a whole resend.
     * @returns {Object}
     * @category Cloud Mirror
     */
    answerFromProjection (truthAnswer, side, result) {
        if (result && result.status === "committed") {
            return this.answerWithProjection(truthAnswer, side.projection, side.projected, result.version);
        }
        if (result && result.status === "conflict") {
            side.projection.didConflict(result.version);
        }
        if (!result || result.status !== "aborted") {
            console.warn(this.logPrefix() + "projection commit " + (result && result.status) + (result && result.reason ? " (" + result.reason + ")" : ""));
        }
        return truthAnswer;
    }

    answerWithProjection (answer, projection, projected, version) {
        const baseVersion = projection.version();
        projection.didCommit(version, projected);
        return Object.assign({}, answer, { projection: { version: version, baseVersion: baseVersion, writes: projected.writes, deletes: projected.deletes } });
    }

    /**
     * @description Whether this pool's stored rows already hold what a commit
     * wrote and deleted (payloads as the cloud holds them). After a conflict
     * and a reload, true means the refused commit lost nothing — e.g. it only
     * carried a default a newer slot fills on load, which the reloaded copy
     * filled again.
     * @param {Object} commit - { writes: [{ objectId, payloadJson }], deletes: [{ objectId }] }
     * @returns {Boolean}
     * @category Cloud Mirror
     */
    holdsCommitContent (commit) {
        const holdsWrite = (write) => {
            const row = this.rowForPid(write.objectId);
            return !!(row && !row.isDeleted && SvObjectPool.cloudPayloadFor(row.payloadJson) === write.payloadJson);
        };
        const holdsDelete = (del) => {
            const row = this.rowForPid(del.objectId);
            return !row || row.isDeleted;
        };
        return commit.writes.every(holdsWrite) && commit.deletes.every(holdsDelete);
    }

    /**
     * @description The records a cloud commit sends: the pool.json delta minus
     * its two non-record keys (the root pointer and the placements string), plus
     * every windowed element whose placement changed without its payload (a
     * re-key) — placement travels as the row's parentId/orderKey columns.
     * @returns {Object} { writes: { pid: payloadJson }, deletes: [pid], isEmpty }
     * @category Cloud Mirror
     */
    cloudChanges () {
        const delta = this.collectDelta();
        const changed = delta === null ? this.wholePoolAsDelta() : delta;
        const nonRecord = new Set([this.rootKey(), this.placementsKey()]);
        const writes = {};
        Object.keys(changed.writes).filter(pid => !nonRecord.has(pid)).forEach((pid) => { writes[pid] = changed.writes[pid]; });
        this.movedPlacementPids().forEach((pid) => {
            const row = this.rowForPid(pid);
            if (row && !row.isDeleted) {
                writes[pid] = row.payloadJson;
            }
        });
        const snapshot = this.lastSyncedSnapshot() || {};
        const moved = new Set(this.movedPlacementPids());
        Object.keys(writes).forEach((pid) => {
            // a record whose only changes are local bookkeeping has nothing to send
            if (!moved.has(pid) && Object.hasOwn(snapshot, pid) && SvObjectPool.cloudPayloadFor(snapshot[pid]) === SvObjectPool.cloudPayloadFor(writes[pid])) {
                delete writes[pid];
            }
        });
        const deletes = changed.deletes.filter(pid => !nonRecord.has(pid));
        return { writes: writes, deletes: deletes, isEmpty: Object.keys(writes).length === 0 && deletes.length === 0 };
    }

    /**
     * @description A record's payload as the record cloud holds it: the local
     * record minus its local-only entries (slots with isInCloudRecord false).
     * Unchanged when its class has none.
     * @param {String} jsonString - the local record JSON
     * @returns {String}
     * @category Cloud Mirror
     */
    static cloudPayloadFor (jsonString) {
        let record = null;
        try {
            record = JSON.parse(jsonString);
        } catch {
            return jsonString;
        }
        const localOnly = (record && record.type) ? this.localOnlySlotNamesForType(record.type) : null;
        if (!localOnly || localOnly.size === 0 || !Array.isArray(record.entries)) {
            return jsonString;
        }
        record.entries = record.entries.filter(entry => !localOnly.has(entry[0]));
        return JSON.stringify(record);
    }

    /**
     * @description The names of a class's stored slots that stay local
     * (isInCloudRecord false), cached per type.
     * @param {String} type
     * @returns {Set<String>}
     * @category Cloud Mirror
     */
    static localOnlySlotNamesForType (type) {
        if (!this._localOnlySlotNames) {
            this._localOnlySlotNames = new Map();
        }
        if (!this._localOnlySlotNames.has(type)) {
            const aClass = SvGlobals.globals()[type];
            const names = new Set();
            if (aClass && aClass.prototype && aClass.prototype.allSlotsMap) {
                aClass.prototype.allSlotsMap().forEachKV((name, slot) => {
                    if (slot.isInCloudRecord && !slot.isInCloudRecord()) {
                        names.add(name);
                    }
                });
            }
            this._localOnlySlotNames.set(type, names);
        }
        return this._localOnlySlotNames.get(type);
    }

    /**
     * @description Windowed elements whose [parentId, orderKey] differ from the
     * last synced snapshot's placements.
     * @returns {Array<String>}
     * @category Cloud Mirror
     */
    movedPlacementPids () {
        const snapshot = this.lastSyncedSnapshot() || {};
        const before = snapshot[this.placementsKey()] ? JSON.parse(snapshot[this.placementsKey()]) : {};
        const now = this.recordStore().placementsForPool(this.poolId());
        return Object.keys(now).filter(pid => !before[pid] || before[pid][0] !== now[pid][0] || before[pid][1] !== now[pid][1]);
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
        const deletes = Object.keys(snapshot).filter(pid => pid !== this.rootKey() && pid !== this.placementsKey() && !Object.hasOwn(writes, pid));
        return { writes: writes, deletes: deletes, isEmpty: Object.keys(writes).length === 0 && deletes.length === 0 };
    }

    cloudWriteForRecord (pid, jsonString, cloudPoolId = this.poolId()) {
        const write = { poolId: cloudPoolId, objectId: pid, payloadJson: SvObjectPool.cloudPayloadFor(jsonString) };
        if (pid === this.poolId()) {
            const root = this.rootObject();
            // the root may name a cloud placement of its own (a folder id that is
            // the same on every device) instead of the local folder node's puuid
            write.parentId = (root && root.cloudParentId) ? root.cloudParentId() : this.parentNodeId();
            write.orderKey = write.parentId ? (this.orderKey() || SvOrderKey.keyBetween(null, null)) : null;
        } else {
            const row = this.rowForPid(pid); // a windowed element carries its place in its collection
            if (row && row.parentId) {
                write.parentId = row.parentId;
                write.orderKey = row.orderKey;
            }
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
        // A pass can leave objects dirty — mutated while serialized (a lazy slot
        // materializing), deferred to the next pass — so drain, or a cloud
        // commit made right after would miss their current state. The defer cap
        // (deferDirtyObjectDuringStore) bounds a serializer that re-mutates.
        for (let pass = 0; pass < 5 && this.hasDirtyObjects(); pass++) {
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

}.initThisCategory());
