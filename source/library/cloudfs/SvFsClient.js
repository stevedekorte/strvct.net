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
        {
            // Bare-hex hashes confirmed present in the cloud blob store
            // (via a successful upload or a has-blobs check). Lets repeat
            // saves skip both the bytes AND the existence round-trip.
            // App-lifetime cache: content-addressed blobs never change,
            // and deletion (tombstone reaping) is rare enough that a
            // stale entry just means one redundant envelope-heal fetch.
            const slot = this.newSlot("cloudKnownBlobHashes", null);
            slot.setSlotType("Set");
        }
    }

    initPrototype () {
    }

    init () {
        super.init();
        this.setListenerPool(SvFsListenerPool.shared());
        this.setCloudKnownBlobHashes(new Set());
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

    // ---------------------------------------------------------------- multiplayer liveness

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
     * Record that the cloud is known to hold a blob (bare hex or
     * `sha256:<hex>` accepted). Future uploads/filters skip it.
     * @param {string} hash
     */
    noteCloudHasBlobHash (hash) {
        const bareHash = (hash || "").replace(/^sha256:/, "");
        if (bareHash) {
            this.cloudKnownBlobHashes().add(bareHash);
        }
    }

    /** @param {string} hash @returns {boolean} */
    cloudIsKnownToHaveBlobHash (hash) {
        const bareHash = (hash || "").replace(/^sha256:/, "");
        return this.cloudKnownBlobHashes().has(bareHash);
    }

    /**
     * Given a collection of hashes (bare hex or `sha256:<hex>`), return
     * the bare-hex subset the cloud does NOT have. Hashes already in the
     * known-set are skipped without a network call; the rest go through
     * one batched `has-blobs` request, whose "existing" results are
     * remembered. Typical steady-state cost for a save: zero requests.
     *
     * @param {Iterable<string>} hashes
     * @returns {Promise<string[]>} bare-hex hashes missing from the cloud
     */
    async asyncFilterHashesMissingInCloud (hashes) {
        const known = this.cloudKnownBlobHashes();
        const unknown = [];
        for (const h of hashes) {
            const bareHash = (h || "").replace(/^sha256:/, "");
            if (bareHash && !known.has(bareHash)) {
                unknown.push(bareHash);
            }
        }
        if (unknown.length === 0) {
            return [];
        }
        const result = await this.backend().hasBlobs(unknown.map(h => "sha256:" + h));
        const existing = (result && result.existing) || [];
        existing.forEach(h => this.noteCloudHasBlobHash(h));
        return ((result && result.missing) || []).map(h => h.replace(/^sha256:/, ""));
    }

    /**
     * Upload a blob already cached in the local `SvBlobPool` to the
     * cloud-nodes content-addressable store. Idempotent: skipped
     * client-side when the hash is in the known-set, and the server
     * fast-paths if `/Blobs/{hash}` already exists.
     *
     * Transport: tries the direct-to-Storage path first (signed PUT URL
     * + finalize — raw bytes, no base64, no function double-hop) and
     * falls back to the legacy base64 `upload-blob` function on any
     * failure, so a broken signed-URL environment degrades to the old
     * behavior instead of losing the blob.
     *
     * Local hashes from `SvBlobPool` are bare hex; the cloud-nodes
     * functions expect `sha256:<hex>` — this helper adds the prefix
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
        const bareHash = (args.hash || "").replace(/^sha256:/, "");
        const fullHash = "sha256:" + bareHash;

        if (this.cloudIsKnownToHaveBlobHash(bareHash)) {
            return { ok: true, hash: fullHash, created: false };
        }

        const localPool = SvBlobPool.shared();
        const localBlob = await localPool.asyncGetBlob(bareHash);
        if (!localBlob) return null;
        const mimeType = args.mimeType || localBlob.type || "application/octet-stream";

        let result = null;
        try {
            // null result = server said the environment can't take a
            // direct PUT (e.g. Storage emulator) — quiet legacy fallback.
            result = await this.asyncDirectUploadBlob({
                fullHash,
                blob: localBlob,
                scopeRootId: args.scopeRootId,
                mimeType
            });
        } catch (directError) {
            console.warn("SvFsClient: direct blob upload failed (" + (directError && directError.message) +
                "); falling back to base64 upload for " + bareHash.slice(0, 12) + "...");
        }
        if (!result) {
            const arrayBuffer = await localBlob.arrayBuffer();
            const base64 = SvFsClient._arrayBufferToBase64(arrayBuffer);
            result = await this.backend().uploadBlob({
                hash: fullHash,
                fileData: base64,
                scopeRootId: args.scopeRootId,
                mimeType
            });
        }
        this.noteCloudHasBlobHash(bareHash);
        return result;
    }

    /**
     * Direct-to-Storage upload: mint a signed PUT URL, PUT the raw
     * bytes, then finalize (server verifies the hash and creates the
     * blob's metadata doc). Returns null when the server flags the
     * environment as legacy-only (Storage emulator); throws on any
     * step failing. Either way the caller falls back to base64.
     * @private-ish (used by asyncUploadLocalBlob)
     */
    async asyncDirectUploadBlob ({ fullHash, blob, scopeRootId, mimeType }) {
        const urlResult = await this.backend().blobUploadUrl({
            hash: fullHash,
            scopeRootId,
            mimeType
        });
        if (urlResult && urlResult.exists) {
            return { ok: true, hash: fullHash, created: false };
        }
        if (urlResult && urlResult.useLegacy) {
            return null;
        }
        if (!urlResult || !urlResult.uploadUrl) {
            throw new Error("blob-upload-url returned no URL");
        }
        const putResponse = await fetch(urlResult.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": urlResult.contentType || mimeType },
            body: blob
        });
        if (!putResponse.ok) {
            throw new Error("signed PUT failed: " + putResponse.status + " " + putResponse.statusText);
        }
        return this.backend().finalizeBlob({
            hash: fullHash,
            scopeRootId,
            mimeType
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
