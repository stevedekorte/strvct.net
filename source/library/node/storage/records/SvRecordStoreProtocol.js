"use strict";

/**
 * @module library.node.storage.records
 * @class SvRecordStoreProtocol
 * @extends Protocol
 * @interface
 * @classdesc The store interface of the Record Store plan: one read side with
 * several backings (in-memory for tests, IndexedDB, Firestore, later a SQL
 * service) and a write side per backing. Rows are plain JSON dicts in the shape
 * SvRecordRow describes; a backing never invents identifiers or renames columns
 * on the way up or down.
 *
 * Read side — the whole sync protocol: a reader takes the root's `version`
 * first and accepts only rows stamped at or below it.
 *
 * Write side — `asyncPut` / `asyncDelete` are the local mirror (no protocol);
 * `asyncCommit` is the cloud protocol (compare-and-set on the root's version,
 * idempotent by request id). A backing that is only a mirror may implement
 * `asyncCommit` by refusing.
 */
(class SvRecordStoreProtocol extends Protocol {

    /**
     * @description Opens a pool: its root row and every live record.
     * @param {String} poolId
     * @returns {Promise<Object|null>} `{ root, records, version, state }`, or null when the pool does not exist.
     * @category Read
     */
    async asyncOpen (poolId) {
        void poolId;
        return null;
    }

    /**
     * @description The live rows whose `parentId` is nodeId — a folder's child
     * pools (their root rows) or a windowed collection's elements — ordered by
     * `(orderKey, objectId)`.
     * @param {String} nodeId
     * @param {Object} [range] `{ after?: orderKey, limit?: Number }`
     * @returns {Promise<Array>}
     * @category Read
     */
    async asyncChildren (nodeId, range) {
        void nodeId; void range;
        return [];
    }

    /**
     * @description Everything written to the pool after sinceVersion.
     * @param {String} poolId
     * @param {Number} sinceVersion
     * @returns {Promise<Object>} `{ rows, tombstones, version, reloadRequired }`; reloadRequired when sinceVersion is older than the pool's tombstone retention floor.
     * @category Read
     */
    async asyncReadChanges (poolId, sinceVersion) {
        void poolId; void sinceVersion;
        return null;
    }

    /**
     * @description Opens the pool a far ref `{ "**": poolId }` names: local first, cloud second, cached thereafter.
     * @param {String} poolId
     * @returns {Promise<Object|null>} as asyncOpen
     * @category Read
     */
    async asyncResolveFar (poolId) {
        void poolId;
        return null;
    }

    /**
     * @description Writes rows into the local mirror, all or nothing; an invalid row refuses the whole batch.
     * @param {Array} rows
     * @returns {Promise<void>}
     * @category Write (mirror)
     */
    async asyncPut (rows) {
        void rows;
    }

    /**
     * @description Removes rows from the local mirror.
     * @param {Array} keys `[{ poolId, objectId }]`
     * @returns {Promise<void>}
     * @category Write (mirror)
     */
    async asyncDelete (keys) {
        void keys;
    }

    /**
     * @description The cloud commit: `{ poolId, baseVersion, requestId, writes, deletes }`.
     * Compare-and-set against the root row's version; idempotent by requestId.
     * @param {Object} commit
     * @returns {Promise<Object>} `{ status: "committed", version }`, `{ status: "conflict", version }` or `{ status: "refused", reason }`
     * @category Write (cloud)
     */
    async asyncCommit (commit) {
        void commit;
        return { status: "refused", reason: "not a cloud backing" };
    }

}.initThisProtocol());
