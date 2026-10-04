"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsBackend
 * @extends ProtoClass
 * @classdesc
 * Abstract backend interface for the cloud-filesystem abstraction.
 * Concrete subclasses bind it to a specific transport (Firestore +
 * Storage SDK, an in-memory store for tests, a self-hosted
 * SQL+filesystem etc).
 *
 * The model (`SvFsNode`, `SvFsFolder`, `SvFsBlob`, `SvFsClient`) is
 * fully decoupled from the backend; swapping the backend swaps the data
 * plane without touching the model layer.
 *
 * What it holds: scopes (a scope root node and its members — the
 * permissions store), blobs, and the multiplayer channels. Documents and
 * folders are records (SvCloudRecordStore; Plans/Placed Subnodes), not
 * nodes.
 *
 * # Method conventions
 *
 * - All async methods return Promises.
 * - `watch*` methods take a callback and return an unsubscribe function.
 * - Direct CRUD methods raise on permission denial; the caller maps
 *   errors to UX. Concrete backends should use error codes that map
 *   cleanly to "permission-denied", "not-found", "aborted",
 *   "failed-precondition", and "internal".
 *
 * # Function-routed operations
 *
 * Some operations are policy-gated and run server-side (uploadBlob,
 * deleteScope, etc.). The default implementations forward to
 * `callFunction(name, args)`; subclasses that prefer to embed routing
 * into specific methods can override them.
 */

(class SvFsBackend extends ProtoClass {

    static initClass () {
        this.setIsSingleton(false);
    }

    initPrototypeSlots () {
    }

    initPrototype () {
    }

    init () {
        super.init();
        return this;
    }

    // ---------------------------------------------------------------- node CRUD

    /**
     * Read a single node's data by id. Resolves to the node payload or null
     * if the node does not exist.
     * @param {string} _id
     * @returns {Promise<Object|null>}
     */
    async readNode (/*_id*/) {
        throw this.notImplementedError("readNode");
    }

    /**
     * Watch a single node by id. The callback receives the latest data
     * (or null if the node was deleted) on every change. Returns an
     * unsubscribe function.
     * @param {string} _id
     * @param {function(Object|null):void} _onSnap
     * @param {function(Error):void} [_onErr]
     * @returns {function():void} unsubscribe
     */
    watchNode (/*_id, _onSnap, _onErr*/) {
        throw this.notImplementedError("watchNode");
    }

    // ---------------------------------------------------------------- blobs

    /**
     * Upload a content-addressable blob. The transport encodes bytes as
     * a base64 string in `fileData` (a data-URL prefix is also accepted
     * and stripped server-side).
     *
     * @param {Object} args
     * @param {string} args.hash         "sha256:<64 hex>"
     * @param {string} args.fileData     base64-encoded bytes (or data:URL)
     * @param {string} args.scopeRootId
     * @param {string} [args.mimeType]
     * @returns {Promise<{hash:string, bytes:number, created:boolean}>}
     */
    async uploadBlob (args) {
        return this.callFunction("upload-blob", args);
    }

    /**
     * Batch existence check: which of these hashes does the cloud
     * already have? Lets callers skip shipping bytes for known blobs.
     * Server-side also clears tombstones on the existing ones
     * ("still referenced; don't reap").
     *
     * @param {string[]} hashes  "sha256:<64 hex>" each
     * @returns {Promise<{existing:string[], missing:string[]}>}
     */
    async hasBlobs (hashes) {
        return this.callFunction("has-blobs", { hashes });
    }

    /**
     * Mint a short-lived signed PUT URL for a blob the cloud doesn't
     * have yet. Returns `{exists:true}` (no URL) when the blob is
     * already present.
     *
     * @param {Object} args
     * @param {string} args.hash         "sha256:<64 hex>"
     * @param {string} args.scopeRootId
     * @param {string} [args.mimeType]
     * @returns {Promise<{hash:string, exists:boolean, uploadUrl?:string, contentType?:string}>}
     */
    async blobUploadUrl (args) {
        return this.callFunction("blob-upload-url", args);
    }

    /**
     * After a direct PUT, ask the server to verify the object's bytes
     * hash to the claimed value and create the blob's metadata doc.
     *
     * @param {Object} args
     * @param {string} args.hash
     * @param {string} args.scopeRootId
     * @param {string} [args.mimeType]
     * @returns {Promise<{hash:string, bytes:number, created:boolean}>}
     */
    async finalizeBlob (args) {
        return this.callFunction("finalize-blob", args);
    }

    /**
     * Resolve a public/auth-readable URL for a blob hash. Default
     * implementation expects a backend-provided convention
     * (e.g., GCS public-read URL).
     * @param {string} _hash
     * @returns {Promise<string>}
     */
    async blobUrl (/*_hash*/) {
        throw this.notImplementedError("blobUrl");
    }

    // ---------------------------------------------------------------- federation

    /**
     * Owner-gated deletion of an entire scope-root (e.g. a promoted
     * multiplayer session). Removes the scope-root node + descendants, its
     * _members/_invites subcollections (so collection-group membership
     * discovery stops re-adopting it), the real-time channel data, and
     * the scope's storage payload.
     * @param {string} scopeRootId
     * @returns {Promise<{ok:true, deletedNodes:number}>}
     */
    async deleteScope (scopeRootId) {
        return this.callFunction("delete-scope", { scopeRootId });
    }

    /**
     * A member removes themselves from a scope (guest "leave session").
     * Removes the caller's own _members row + RTDB ACL/liveness entries
     * server-side (admin SDK), so it works even for stale scopes whose
     * /sessions record is missing. The caller can only remove their own
     * membership (uid is taken from the verified auth token).
     * @param {string} scopeRootId
     * @returns {Promise<{ok:true, memberRemoved:boolean}>}
     */
    async leaveScope (scopeRootId) {
        return this.callFunction("leave-scope", { scopeRootId });
    }

    /**
     * Deletes a document by its records pool (Plans/Placed Subnodes §7 6d): an
     * editor of the pool's scope removes every record of it. A pool a
     * multiplayer scope names is refused — delete the scope. An absent pool
     * is already deleted.
     * @param {string} poolId
     * @returns {Promise<{ok:true, deletedRecords:number}>}
     */
    async deletePool (poolId) {
        return this.callFunction("records-delete-pool", { poolId });
    }

    /**
     * Makes a document's pool a multiplayer scope: a fresh scope root naming
     * the pool, with the caller as its owner. The pool stays in its scope.
     * Idempotent: a retry returns the scope already made.
     *
     * @param {Object} args
     * @param {string} args.poolId       - the document's records pool
     * @param {string} args.dstParentId  - the new scope root's parent (the host's home)
     * @param {string} [args.title]      - the scope's title (an invite shows it)
     * @returns {Promise<{dstRootId:string, promoted:boolean}>}
     */
    async promotePool ({ poolId, dstParentId, title }) {
        return this.callFunction("promote-pool", { poolId, dstParentId, title });
    }

    // ---------------------------------------------------------------- membership discovery

    /**
     * Collection-group query for the caller's own `_members` entries
     * across all scopes. Each result is the raw doc payload
     * `{uid, role, joinedAt, scopeRootId}`. Caller filters by role
     * client-side (e.g. role==="owner" finds scopes the caller hosts).
     *
     * Rule-friendly: the standing collection-group rule grants reads
     * only for docs whose `data.uid == request.auth.uid`, so this query
     * returns nothing more than the caller's own memberships even on a
     * shared multiplayer scope.
     *
     * @returns {Promise<Array<Object>>}
     */
    async listMyMemberships () {
        throw this.notImplementedError("listMyMemberships");
    }

    // ---------------------------------------------------------------- invites

    async createInvite (args) {
        return this.callFunction("create-invite", args);
    }

    async previewInvite (token) {
        return this.callFunction("preview-invite", { token });
    }

    async acceptInvite (token) {
        return this.callFunction("accept-invite", { token });
    }

    // ---------------------------------------------------------------- user lifecycle

    async ensureUserHome () {
        return this.callFunction("ensure-home", {});
    }

    // ---------------------------------------------------------------- transport hook

    /**
     * Server-side function dispatcher. Default throws; concrete backends
     * implement actual transport (HTTPS POST, in-process, WebSocket, …).
     * @param {string} _name
     * @param {Object} _args
     * @returns {Promise<any>}
     */
    async callFunction (/*_name, _args*/) {
        throw this.notImplementedError("callFunction");
    }

    /**
     * Backend-native sentinel for "set this field to the server's clock at
     * write time" when constructing node payloads (e.g. lastModified).
     * Concrete backends return their SDK's server-timestamp value;
     * fallback is a client `Date.now()`-based stamp.
     * @returns {*}
     */
    serverTimestampSentinel () {
        return new Date();
    }

    // ---------------------------------------------------------------- helpers

    notImplementedError (method) {
        return new Error(this.svType() + "." + method + ": not implemented (abstract)");
    }

}.initThisClass());
