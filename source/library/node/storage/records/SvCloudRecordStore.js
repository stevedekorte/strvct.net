"use strict";

/**
 * @module library.node.storage.records
 * @class SvCloudRecordStore
 * @extends ProtoClass
 * @classdesc SvRecordStoreProtocol over the cloud's records-as-documents backing
 * (Plans/Record Store §7a), reached through a backend that answers
 * `callFunction(name, args)` — the app's cloud-nodes backend. Reads and the
 * commit protocol only: the cloud is not a mirror, so `asyncPut` and
 * `asyncDelete` refuse; a client writes through `asyncCommit`.
 *
 * Routes (Servers/Firebase/functions/src/nodes/records.js):
 *   records-open      { poolId } → { pool: { root, records, version, state } | null }
 *   records-changes   { poolId, sinceVersion } → { changes: { rows, tombstones, version, reloadRequired } | null }
 *   records-children  { parentId, after?, limit? } → { rows }
 *   records-commit    { poolId, baseVersion, requestId, writes, deletes, create? } → { status, version }
 *   records-stage-begin / -write / -finalize — a commit too large for one
 *                     transaction, driven by SvStagedRecordCommit
 *
 * While another client's staged commit is open the pool answers "busy" (open and
 * changes: state "busy"; commit: status "busy"); this store waits and retries
 * for a while before handing "busy" back.
 */
(class SvCloudRecordStore extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("backend", null);
            slot.setSlotType("Object");
            slot.setDescription("answers callFunction(name, args) against the cloud nodes API");
        }
        {
            const slot = this.newSlot("busyRetryDelays", [250, 500, 1000, 2000, 4000, 8000, 8000, 8000]);
            slot.setSlotType("Array");
            slot.setDescription("ms waited between retries while the pool is busy (another client's staged commit)");
        }
    }

    maxOpsPerCommit () {
        return 450; // records.js MAX_OPS_PER_COMMIT
    }

    maxBytesPerCommit () {
        return 4 * 1024 * 1024; // well under the request and transaction limits
    }

    /**
     * @description Calls fn until its answer is not busy, waiting between tries;
     * the last answer when the pool stays busy.
     * @param {Function} fn - async () → answer
     * @param {Function} isBusy - (answer) → Boolean
     * @category Busy
     */
    async asyncRetryWhileBusy (fn, isBusy) {
        let answer = await fn();
        for (const delay of this.busyRetryDelays()) {
            if (!isBusy(answer)) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            answer = await fn();
        }
        return answer;
    }

    initPrototype () {
        this.addProtocol(SvRecordStoreProtocol);
    }

    supportsCommitProtocol () {
        return true;
    }

    isOpen () {
        return !!this.backend();
    }

    async call (name, args) {
        assert(this.backend(), "SvCloudRecordStore has no backend");
        return this.backend().callFunction(name, args);
    }

    // --- read side ---

    async asyncOpen (poolId) {
        const pool = await this.asyncRetryWhileBusy(async () => {
            const result = await this.call("records-open", { poolId: poolId });
            return result && result.pool ? result.pool : null;
        }, answer => !!answer && answer.state === "busy");
        if (pool && pool.state === "busy") {
            throw new Error("pool " + poolId + " stayed busy (another client's commit is in progress)");
        }
        return pool;
    }

    async asyncChildren (nodeId, range = {}) {
        const args = { parentId: nodeId };
        if (!Type.isNullOrUndefined(range.after)) { args.after = range.after; }
        if (Number.isInteger(range.limit)) { args.limit = range.limit; }
        const result = await this.call("records-children", args);
        return (result && result.rows) || [];
    }

    async asyncReadChanges (poolId, sinceVersion) {
        const changes = await this.asyncRetryWhileBusy(async () => {
            const result = await this.call("records-changes", { poolId: poolId, sinceVersion: sinceVersion });
            return result && result.changes ? result.changes : null;
        }, answer => !!answer && answer.state === "busy");
        if (changes && changes.state === "busy") {
            throw new Error("pool " + poolId + " stayed busy (another client's commit is in progress)");
        }
        return changes;
    }

    async asyncResolveFar (poolId) {
        return this.asyncOpen(poolId);
    }

    // --- writes ---

    async asyncPut (rows) {
        void rows;
        throw new Error("the cloud record store is not a mirror: write through asyncCommit");
    }

    async asyncDelete (keys) {
        void keys;
        throw new Error("the cloud record store is not a mirror: delete through asyncCommit");
    }

    /**
     * @description The commit protocol. A refusal (invalid argument, permission,
     * precondition) arrives as a thrown error from the backend and is returned as
     * `{ status: "refused", reason }` so callers see the three outcomes the
     * protocol names.
     * @category Write
     */
    async asyncCommit (commit) {
        return this.asyncRetryWhileBusy(() => this.asyncCommitOnce(commit), answer => !!answer && answer.status === "busy");
    }

    async asyncCommitOnce (commit) {
        try {
            if (SvStagedRecordCommit.needsStaging(commit, this.maxOpsPerCommit(), this.maxBytesPerCommit())) {
                return await SvStagedRecordCommit.clone().setStore(this).setCommit(commit).asyncRun();
            }
            return await this.call("records-commit", commit);
        } catch (error) {
            const code = error && error.code;
            if (code === "invalid-argument" || code === "permission-denied" || code === "failed-precondition" || code === "unauthenticated") {
                return { status: "refused", reason: (error && error.message) || String(code) };
            }
            throw error;
        }
    }

    // --- staging (SvStagedRecordCommit) ---

    async asyncStageBegin (args) {
        return this.call("records-stage-begin", args);
    }

    async asyncStageWrite (args) {
        return this.call("records-stage-write", args);
    }

    async asyncStageFinalize (args) {
        return this.call("records-stage-finalize", args);
    }

}.initThisClass());
