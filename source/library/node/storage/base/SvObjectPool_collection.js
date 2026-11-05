"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SvObjectPool_collection
 * @extends SvObjectPool
 * @classdesc Collection: flushing, then a mark-and-sweep from the root (through
 * references and windowed placements) that deletes unreachable rows, with a
 * warning when a live object's row would go; plus clearing and deleting the
 * pool, and its counts. A category of SvObjectPool, split from SvObjectPool.js
 * unchanged (Plans/Cleanup § 3).
 */
(class SvObjectPool_collection extends SvObjectPool {

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
            this.warnIfSweepingLiveObject(pid);
            this.onCollectPid(pid);
            this.recordStore().deleteRowInBatch(this.poolId(), pid);
        });
        return unmarkedPidSet.count();
    }

    /**
     * @description Collecting the row of an object that is still live (in
     * memory, in this pool) means the reachability walk missed it — its row
     * goes while the object stays, so it vanishes on the next load (and a
     * replica never receives it). Diagnostic.
     * @category Collection
     */
    warnIfSweepingLiveObject (pid) {
        const obj = this.activeObjectForPid(pid);
        if (obj && obj.parentNode && obj.parentNode()) {
            const row = this.rowForPid(pid);
            const parent = obj.parentNode();
            console.warn(this.logPrefix() + "collect: sweeping the row of live " + obj.svType() + " " + pid + " (row parentId " + (row && row.parentId) + "; its parent " + parent.svType() + " " + (parent.puuid ? parent.puuid() : "?") + ", marked " + this.markedSet().has(parent.puuid ? parent.puuid() : null) + ")");
        }
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

}.initThisCategory());
