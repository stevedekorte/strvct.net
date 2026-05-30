"use strict";

/**
 * @module library.cloudfs
 */

/**
 * @class SvFsClient
 * @extends ProtoClass
 * @classdesc
 * Top-level facade for the cloud-filesystem layer. Holds the
 * `SvFsBackend` (transport) and the `SvFsListenerPool` (budget),
 * and provides convenience accessors for reading and watching nodes
 * by id.
 *
 * Apps wire this up once at boot, typically by:
 *   1. Constructing the application's concrete `SvFsBackend` subclass
 *      (e.g. `UoFsBackend extends SvFirebaseFsBackend`) which knows
 *      how to call the app's specific HTTP routes.
 *   2. Calling `SvFsClient.shared().setBackend(backendInstance)`.
 */

(class SvFsClient extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true);
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("backend", null);
            slot.setSlotType("SvFsBackend");
        }
        {
            const slot = this.newSlot("listenerPool", null);
            slot.setSlotType("SvFsListenerPool");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.setListenerPool(SvFsListenerPool.shared());
        return this;
    }

    /**
     * Read a single node and wrap it in the appropriate SvFsNode subclass.
     * @param {string} id
     * @returns {Promise<SvFsNode|null>}
     */
    async asyncReadNode (id) {
        const data = await this.backend().readNode(id);
        if (!data) return null;
        return SvFsNode.fromData(this, data);
    }

    /**
     * Watch a single node by id, delivering hydrated SvFsNode instances
     * (or null on delete) to the callback.
     * @param {string} id
     * @param {function(SvFsNode|null):void} onSnap
     * @param {function(Error):void} [onErr]
     * @returns {Object} listener-pool handle
     */
    watchNode (id, onSnap, onErr) {
        const unsubscribe = this.backend().watchNode(id, (data) => {
            onSnap(data ? SvFsNode.fromData(this, data) : null);
        }, onErr);
        return this.listenerPool().acquire({ label: "node:" + id, unsubscribe });
    }

    /** Release a handle returned by any `watch*` method on this client. */
    unwatch (handle) {
        this.listenerPool().release(handle);
    }

    // ---------------------------------------------------------------- multiplayer subcollections

    /**
     * Pool-managed watch on `/Nodes/{rootId}/_meta/{docId}`.
     * @param {string} rootId
     * @param {string} docId
     * @param {function(Object|null):void} onSnap
     * @param {function(Error):void} [onErr]
     * @returns {Object} listener-pool handle (release via `unwatch`)
     */
    watchMetaDoc (rootId, docId, onSnap, onErr) {
        const unsubscribe = this.backend().watchMetaDoc(rootId, docId, onSnap, onErr);
        return this.listenerPool().acquire({ label: "meta:" + rootId + "/" + docId, unsubscribe });
    }

    /**
     * Pool-managed watch on the HAEB liveness roster `/live/{sessionId}/*`.
     * onSnap receives a { uid: data } map on every connect/disconnect.
     * @param {string} sessionId
     * @param {function(Object):void} onSnap
     * @param {function(Error):void} [onErr]
     * @returns {Object} listener-pool handle
     */
    watchLive (sessionId, onSnap, onErr) {
        const unsubscribe = this.backend().watchLive(sessionId, onSnap, onErr);
        return this.listenerPool().acquire({ label: "live:" + sessionId, unsubscribe });
    }

    /**
     * Promote a scope-leaf document to a fresh scope-root. Convenience
     * wrapper over `backend.promoteToScopeRoot`.
     */
    async asyncPromoteToScopeRoot (args) {
        return this.backend().promoteToScopeRoot(args);
    }

    /**
     * Caller's `_members` entries across all scopes (collection-group
     * query). Each result is `{uid, role, joinedAt, scopeRootId}`.
     * Filter client-side by role to find owned-vs-joined scopes.
     */
    async asyncListMyMemberships () {
        return this.backend().listMyMemberships();
    }

    /**
     * Upload a blob already cached in the local `SvBlobPool` to the
     * cloud-nodes content-addressable store. Idempotent: the server
     * function fast-paths if `/Blobs/{hash}` already exists.
     *
     * Local hashes from `SvBlobPool` are bare hex; the cloud-nodes
     * function expects `sha256:<hex>` — this helper adds the prefix
     * if the caller passes a bare hex hash.
     *
     * @param {Object} args
     * @param {string} args.hash         bare hex sha256 OR `sha256:<hex>`
     * @param {string} args.scopeRootId  scope owning this upload
     * @param {string} [args.mimeType]
     * @returns {Promise<{hash:string, bytes:number, created:boolean}|null>}
     *          null if the local pool has no blob for the hash
     */
    async asyncUploadLocalBlob (args) {
        const localPool = SvBlobPool.shared();
        const bareHash = (args.hash || "").replace(/^sha256:/, "");
        const localBlob = await localPool.asyncGetBlob(bareHash);
        if (!localBlob) return null;
        const arrayBuffer = await localBlob.arrayBuffer();
        const base64 = SvFsClient._arrayBufferToBase64(arrayBuffer);
        return this.backend().uploadBlob({
            hash: "sha256:" + bareHash,
            fileData: base64,
            scopeRootId: args.scopeRootId,
            mimeType: args.mimeType || localBlob.type || "application/octet-stream"
        });
    }

    static _arrayBufferToBase64 (buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
        }
        return (typeof btoa === "function") ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
    }

    /**
     * Resolve the cloud-nodes blob URL for a hash. Accepts either a
     * bare hex sha256 (as produced by `SvBlobPool`) or the full
     * `sha256:<hex>` form expected by the storage path. Throws if the
     * blob isn't present in /blobs/{hash} (caller should fall back to
     * a legacy storage path).
     *
     * @param {string} hash
     * @returns {Promise<string>}
     */
    async asyncBlobUrl (hash) {
        const fullHash = (typeof hash === "string" && hash.startsWith("sha256:")) ? hash : "sha256:" + hash;
        return this.backend().blobUrl(fullHash);
    }

    /**
     * Ensure a document node exists at `id` and return it as an
     * `SvFsDocument`. If the node is missing, create it with the given
     * parent / scope / subtype metadata; if it already exists, just
     * read it back without touching its lease/headSeq state.
     *
     * Use this before opening a session to back app-level state on a
     * stable node id (e.g. UoCharacter.characterId() → one node per
     * character).
     *
     * @param {Object} args
     * @param {string} args.id            - Stable node id (e.g. character id).
     * @param {string} args.parentId      - Parent folder node id.
     * @param {string} args.scopeRootId   - Owning scope-root id (typically the user's home).
     * @param {string} [args.title]       - Display title (defaults to id).
     * @param {string} [args.sortKey]     - Sibling order key (defaults to id).
     * @param {Object} args.subtype       - { type:"document", documentClass, schemaVersion?, ... }
     * @param {string} [args.visibility="private"]
     * @returns {Promise<SvFsDocument>}
     */
    async asyncEnsureDocument (args) {
        const existing = await this.asyncReadNode(args.id);
        if (existing) {
            if (!(existing instanceof SvFsDocument)) {
                const e = new Error("node " + args.id + " exists but is not a document (" + existing.svType() + ")");
                e.code = "failed-precondition";
                throw e;
            }
            return existing;
        }

        const ts = this.backend().serverTimestampSentinel();
        const data = {
            id: args.id,
            parentId: args.parentId,
            sortKey: args.sortKey || args.id,
            scopeRootId: args.scopeRootId,
            visibility: args.visibility || "private",
            title: args.title || args.id,
            subtype: args.subtype,
            lease: null,
            createdAt: ts,
            lastModified: ts,
            childrenLastModified: ts
        };
        await this.backend().writeNode(args.id, data);
        const created = await this.asyncReadNode(args.id);
        if (!(created instanceof SvFsDocument)) {
            const e = new Error("created node " + args.id + " did not read back as document");
            e.code = "internal";
            throw e;
        }
        return created;
    }

    /**
     * Ensure a folder node exists at `id` and return it as an
     * `SvFsFolder`. Symmetric with `asyncEnsureDocument`.
     *
     * @param {Object} args
     * @param {string} args.id
     * @param {string} args.parentId
     * @param {string} args.scopeRootId
     * @param {string} [args.title]
     * @param {string} [args.sortKey]
     * @param {Object} [args.subtype]   - defaults to { type: "folder" }
     * @param {string} [args.visibility="private"]
     * @returns {Promise<SvFsFolder>}
     */
    async asyncEnsureFolder (args) {
        const existing = await this.asyncReadNode(args.id);
        if (existing) {
            if (!(existing instanceof SvFsFolder)) {
                const e = new Error("node " + args.id + " exists but is not a folder (" + existing.svType() + ")");
                e.code = "failed-precondition";
                throw e;
            }
            return existing;
        }

        const ts = this.backend().serverTimestampSentinel();
        const data = {
            id: args.id,
            parentId: args.parentId,
            sortKey: args.sortKey || args.id,
            scopeRootId: args.scopeRootId,
            visibility: args.visibility || "private",
            title: args.title || args.id,
            subtype: args.subtype || { type: "folder" },
            createdAt: ts,
            lastModified: ts,
            childrenLastModified: ts
        };
        await this.backend().writeNode(args.id, data);
        const created = await this.asyncReadNode(args.id);
        if (!(created instanceof SvFsFolder)) {
            const e = new Error("created node " + args.id + " did not read back as folder");
            e.code = "internal";
            throw e;
        }
        return created;
    }

}.initThisClass());
