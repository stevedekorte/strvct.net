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
 * The model (`SvFsNode`, `SvFsFolder`, `SvFsDocument`, `SvFsBlob`,
 * `SvFsClient`) is fully decoupled from the backend; swapping the
 * backend swaps the data plane without touching the model layer.
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
 * appendDelta, etc.). The default implementations forward to
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

    /**
     * Watch the direct children of a folder ordered by sortKey.
     * Options: { limit, startAfterSortKey }.
     * @param {string} _parentId
     * @param {Object} _opts
     * @param {function(Array<Object>):void} _onSnap
     * @param {function(Error):void} [_onErr]
     * @returns {function():void} unsubscribe
     */
    watchChildren (/*_parentId, _opts, _onSnap, _onErr*/) {
        throw this.notImplementedError("watchChildren");
    }

    /**
     * One-shot list of direct children. Server-consistent (no local
     * cache fall-through). Default falls back to a watchChildren
     * subscription that auto-stops; concrete backends override with
     * a single `get()` for proper consistency semantics.
     * @param {string} parentId
     * @param {Object} opts - { limit, startAfterSortKey, scopeRootId }
     * @returns {Promise<Array<Object>>}
     */
    async listChildren (parentId, opts) {
        return new Promise((resolve, reject) => {
            const stop = this.watchChildren(parentId, opts, (list) => {
                try { stop(); } catch (_) { /* */ }
                resolve(list);
            }, reject);
        });
    }

    /**
     * Create or update a node (full payload semantics). Concrete
     * backends decide whether create-only or upsert; framework
     * callers expect upsert.
     * @param {string} _id
     * @param {Object} _data
     * @returns {Promise<void>}
     */
    async writeNode (/*_id, _data*/) {
        throw this.notImplementedError("writeNode");
    }

    /**
     * Apply a partial update to an existing node. Caller is responsible
     * for not violating immutability constraints (e.g., scopeRootId).
     * @param {string} _id
     * @param {Object} _patch
     * @returns {Promise<void>}
     */
    async updateNode (/*_id, _patch*/) {
        throw this.notImplementedError("updateNode");
    }

    /**
     * Delete a single node. Subtree-delete is its own operation
     * (`deleteSubtree` via callFunction).
     * @param {string} _id
     * @returns {Promise<void>}
     */
    async deleteNode (/*_id*/) {
        throw this.notImplementedError("deleteNode");
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
     * Resolve a public/auth-readable URL for a blob hash. Default
     * implementation expects a backend-provided convention
     * (e.g., GCS public-read URL).
     * @param {string} _hash
     * @returns {Promise<string>}
     */
    async blobUrl (/*_hash*/) {
        throw this.notImplementedError("blobUrl");
    }

    // ---------------------------------------------------------------- documents (lease + WAL)

    /**
     * Atomically claim or renew the single-writer lease on a document
     * node. Returns the active lease record.
     * @param {Object} args
     * @param {string} args.nodeId
     * @param {string} args.deviceId
     * @param {number} [args.ttlMs=60000]
     * @returns {Promise<{uid:string,deviceId:string,expiresAt:number,headSeq:number}>}
     */
    async acquireLease (/*args*/) {
        throw this.notImplementedError("acquireLease");
    }

    /**
     * Release the caller's lease on a document node.
     * @param {string} _nodeId
     * @returns {Promise<void>}
     */
    async releaseLease (/*_nodeId*/) {
        throw this.notImplementedError("releaseLease");
    }

    /**
     * Append a WAL delta to a document.
     * @param {Object} args
     * @param {string} args.nodeId
     * @param {number} args.expectedSeq    must equal lease.headSeq + 1
     * @param {*} args.delta
     * @returns {Promise<{seq:number}>}
     */
    async appendDelta (args) {
        return this.callFunction("write-delta", args);
    }

    /**
     * Resolve readable URLs for a document's pool + delta files.
     * @param {string} nodeId
     * @returns {Promise<{headSeq:number, poolUrl:string|null, deltas:Array<{seq:number,url:string}>}>}
     */
    async readDocument (nodeId) {
        return this.callFunction("read-url", { nodeId });
    }

    /**
     * Replace a document's pool with the lease holder's merged payload
     * and drop the deltas.
     * @param {Object} args
     * @param {string} args.nodeId
     * @param {*} args.newPool
     * @returns {Promise<{deletedDeltas:number,headSeq:number}>}
     */
    async coalesceDocument (args) {
        return this.callFunction("coalesce", args);
    }

    // ---------------------------------------------------------------- federation

    /**
     * Recursively delete a subtree.
     * @param {string} nodeId
     * @returns {Promise<{deletedNodes:number}>}
     */
    async deleteSubtree (nodeId) {
        return this.callFunction("delete-subtree", { nodeId });
    }

    /**
     * Cross-scope copy or move.
     * @param {Object} args
     * @param {string} args.srcId
     * @param {string} args.dstScopeRootId
     * @param {string} args.dstParentId
     * @param {"copy"|"move"} args.mode
     * @returns {Promise<{mode:string, count:number, idMap:Object}>}
     */
    async copyNode (args) {
        return this.callFunction("copy", args);
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
