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
 */
(class SvCloudRecordStore extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("backend", null);
            slot.setSlotType("Object");
            slot.setDescription("answers callFunction(name, args) against the cloud nodes API");
        }
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
        const result = await this.call("records-open", { poolId: poolId });
        return result && result.pool ? result.pool : null;
    }

    async asyncChildren (nodeId, range = {}) {
        const args = { parentId: nodeId };
        if (!Type.isNullOrUndefined(range.after)) { args.after = range.after; }
        if (Number.isInteger(range.limit)) { args.limit = range.limit; }
        const result = await this.call("records-children", args);
        return (result && result.rows) || [];
    }

    async asyncReadChanges (poolId, sinceVersion) {
        const result = await this.call("records-changes", { poolId: poolId, sinceVersion: sinceVersion });
        return result && result.changes ? result.changes : null;
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
        try {
            return await this.call("records-commit", commit);
        } catch (error) {
            const code = error && error.code;
            if (code === "invalid-argument" || code === "permission-denied" || code === "failed-precondition" || code === "unauthenticated") {
                return { status: "refused", reason: (error && error.message) || String(code) };
            }
            throw error;
        }
    }

}.initThisClass());
