"use strict";

/**
 * @module library.node.nodes.syncing
 */

/**
 * @class SvCloudFolder
 * @extends SvSyncableArrayNode
 * @classdesc
 * Backend-agnostic base for a collection node that mirrors a cloud-fs
 * FOLDER (an SvFsFolder) and whose subnodes mirror that folder's child
 * documents. Provides the reusable cloud-folder machinery:
 *
 *   - cloudFsClient() wiring (via the `defaultFsBackend()` hook)
 *   - "loading…" subtitle while the first sync is in flight
 *   - _pendingCloudDeletes tracking via the removeSubnode override
 *   - asyncSyncToCloud  (save dirty children + flush pending deletes)
 *   - asyncSyncFromCloud (read folder → optional childrenLastModified
 *     cache check → list + apply children; eager or lazy/manifest-first)
 *   - per-folder childrenLastModified cache (skip the re-list when the
 *     folder's direct children are unchanged since the last sync)
 *   - lazy manifest-first loading: render the list from the manifest and
 *     defer each child's full-content download to first open
 *
 * Subclasses MUST provide (backend binding):
 *   - cloudFsScopeRootId()  — the caller's scope-root id (e.g. the signed-in
 *                             user id); backend/auth-specific
 *   - defaultFsBackend()    — the SvFsBackend to use when the shared
 *                             SvFsClient has none set
 *
 * Subclasses MUST provide (collection shape):
 *   - cloudFsFolderId()                          — e.g. "sessions-{uid}"
 *   - cloudFsChildIdFromNodeId(nodeId)           — stable-id extractor
 *   - asyncApplyChildFromCloud(stableId, child)  — eager per-child load
 *     OR (for lazy folders) usesLazyChildLoading()===true +
 *        newChildForCloudStableId(stableId)
 *
 * Subclasses MAY override:
 *   - cloudSyncableSubnodes() / isChildCloudSyncable(child) — save filter
 *   - childWithCloudStableId(stableId)                      — cheaper lookup
 *
 * App layers subclass this and supply the auth/backend hooks (e.g. a
 * Firebase-backed `cloudFsScopeRootId()` reading the current uid).
 */

(class SvCloudFolder extends SvSyncableArrayNode {

    initPrototypeSlots () {
        {
            // Local-only cache validator: the folder's childrenLastModified
            // value captured at the last SUCCESSFUL sync. Persisted with the
            // folder (restored from the local pool on reload) so a returning
            // user can skip the list-children round trip + per-child loads
            // when the folder's direct children haven't changed. Never sent
            // to cloud.
            const slot = this.newSlot("syncedChildrenClmKey", null);
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setIsInCloudJson(false);
        }
    }

    init () {
        super.init();
        // Loading state is on by default; the first asyncSyncFromCloud
        // clears it in its finally block. Subclasses can override
        // subtitle() if they want a different placeholder.
        this._isLoadingFromCloud = true;
        return this;
    }

    // ---------------------------------------------------------------- Loading state

    subtitle () {
        if (this._isLoadingFromCloud) {
            return "loading...";
        }
        return null;
    }

    // ---------------------------------------------------------------- Backend binding hooks

    /**
     * @description The SvFsBackend to use when the shared SvFsClient has no
     * backend set. Subclasses MUST override (the concrete backend is
     * app/transport-specific).
     * @returns {SvFsBackend}
     * @category Cloud Sync
     */
    defaultFsBackend () {
        throw new Error(this.svType() + " must override defaultFsBackend()");
    }

    /**
     * @description The caller's scope-root id (e.g. the signed-in user id).
     * Subclasses MUST override (auth/backend-specific).
     * @returns {String|null}
     * @category Cloud Sync
     */
    cloudFsScopeRootId () {
        throw new Error(this.svType() + " must override cloudFsScopeRootId()");
    }

    // ---------------------------------------------------------------- Cloud-FS helpers

    cloudFsClient () {
        const client = SvFsClient.shared();
        if (!client.backend()) client.setBackend(this.defaultFsBackend());
        return client;
    }

    cloudSyncLogPrefix () {
        return "CLOUDSYNC [" + this.svType() + "]";
    }

    // ---------------------------------------------------------------- Subclass hooks

    /**
     * @description Subclasses MUST return the cloud folder id for this
     * collection (e.g. "sessions-{uid}").
     * @returns {String|null}
     * @category Cloud Sync
     */
    cloudFsFolderId () {
        throw new Error(this.svType() + " must override cloudFsFolderId()");
    }

    /**
     * @description Subclasses MUST extract a child's stable id from its
     * cloud-fs node id. Returns null for ids that don't belong to this
     * folder (e.g. unrelated sibling docs).
     * @param {String} nodeId
     * @returns {String|null}
     * @category Cloud Sync
     */
    cloudFsChildIdFromNodeId (/*nodeId*/) {
        throw new Error(this.svType() + " must override cloudFsChildIdFromNodeId()");
    }

    /**
     * @description Subclasses using EAGER loading MUST update-or-create a
     * local subnode for the given cloud child and load its content.
     * @param {String} stableId
     * @param {SvFsNode} childFsNode
     * @returns {Promise<void>}
     * @category Cloud Sync
     */
    async asyncApplyChildFromCloud (/*stableId, childFsNode*/) {
        throw new Error(this.svType() + " must override asyncApplyChildFromCloud()");
    }

    /**
     * @description Which subnodes are eligible to save. Excludes unloaded
     * manifest placeholders (saving their empty content would clobber the
     * real cloud document) and anything that isn't dirty. Subclasses
     * narrow further by filtering on top of `isChildCloudSyncable`.
     * @returns {Array}
     * @category Cloud Sync
     */
    cloudSyncableSubnodes () {
        return this.subnodes().filter(c => this.isChildCloudSyncable(c));
    }

    /**
     * @description Whether a child may be saved to cloud: its full content
     * must be loaded (never save an empty placeholder) and it must be
     * dirty. Shared safety guarantee behind lazy manifest-first loading.
     * @param {SvNode} child
     * @returns {Boolean}
     * @category Cloud Sync
     */
    isChildCloudSyncable (child) {
        if (child.cloudContentLoaded && !child.cloudContentLoaded()) return false;
        if (child.needsCloudSync && !child.needsCloudSync()) return false;
        return true;
    }

    /**
     * @description Subclasses MAY override to render the list from the
     * folder MANIFEST and defer each child's full content load until the
     * child is first opened (manifest-first / lazy). When true,
     * asyncSyncFromCloud calls applyChildPlaceholderFromCloud (cheap,
     * synchronous, no content download) per child instead of the eager
     * asyncApplyChildFromCloud. Default false (eager full load).
     * @returns {Boolean}
     * @category Cloud Sync
     */
    usesLazyChildLoading () {
        return false;
    }

    /**
     * @description Create/refresh a lightweight placeholder subnode from a
     * manifest child node — title/subtitle only, no content download. The
     * child loads its full content lazily on first open (the document's
     * prepareForFirstAccess / asyncEnsureLoaded). Generic for all cloud
     * folders; subclasses only supply find-or-create via
     * `childWithCloudStableId` / `newChildForCloudStableId`.
     * @param {String} stableId
     * @param {SvFsNode} childFsNode
     * @category Cloud Sync
     */
    applyChildPlaceholderFromCloud (stableId, childFsNode) {
        let child = this.childWithCloudStableId(stableId);
        // Don't downgrade an already-loaded child back to a placeholder
        // (e.g. on a refresh after the user opened it).
        if (child && child.cloudContentLoaded && child.cloudContentLoaded()) {
            return;
        }
        if (!child) {
            child = this.newChildForCloudStableId(stableId);
        }
        if (!child) return;
        if (child.setCloudContentLoaded) child.setCloudContentLoaded(false);
        // Hydrate display fields from the manifest WITHOUT marking the
        // child dirty (suppress) and stamp cloud==local so needsCloudSync()
        // is false — belt-and-suspenders with isChildCloudSyncable so this
        // empty placeholder is never written back to cloud.
        child._suppressLocalModifiedTouch = true;
        try {
            const title = childFsNode && typeof childFsNode.title === "function" ? childFsNode.title() : null;
            const subtitle = childFsNode && typeof childFsNode.subtitle === "function" ? childFsNode.subtitle() : null;
            if (title && child.setTitle) child.setTitle(title);
            if (subtitle && child.setSubtitle) child.setSubtitle(subtitle);
            const lm = childFsNode && typeof childFsNode.lastModified === "function" ? childFsNode.lastModified() : null;
            if (child.didSyncFromCloud) child.didSyncFromCloud(lm || Date.now());
        } finally {
            child._suppressLocalModifiedTouch = false;
        }
    }

    /**
     * @description Find an existing child subnode by its cloud stable id.
     * Default matches on each child's `cloudFsStableId()`; subclasses may
     * override with a cheaper lookup.
     * @param {String} stableId
     * @returns {SvNode|null}
     * @category Cloud Sync
     */
    childWithCloudStableId (stableId) {
        // Exception-safe: a subnode may inherit cloudFsStableId as an
        // abstract-method throw without being a folder-owned doc (e.g. a
        // client-side session mirror living next to host sessions). Such a
        // child can't match a folder entry — treating the throw as
        // "no answer" instead of letting it abort the whole folder
        // reconciliation (which surfaced as "Sessions sync failed for
        // realm ...: UoClientSession must override cloudFsStableId()").
        return this.subnodes().detect(sn => {
            if (!sn.cloudFsStableId) {
                return false;
            }
            try {
                return sn.cloudFsStableId() === stableId;
            } catch {
                return false;
            }
        }) || null;
    }

    /**
     * @description Create a new (empty) child subnode for the given stable
     * id, added to this folder. Subclasses using lazy loading MUST override
     * (each knows its concrete child class).
     * @param {String} stableId
     * @returns {SvNode}
     * @category Cloud Sync
     */
    newChildForCloudStableId (/*stableId*/) {
        throw new Error(this.svType() + " uses lazy child loading but did not override newChildForCloudStableId()");
    }

    // ---------------------------------------------------------------- removeSubnode → pending cloud delete

    removeSubnode (aSubnode) {
        // Queue a cloud delete for the removed child UNLESS it deletes its own
        // cloud node. A self-deleting child (handlesOwnCloudDelete() === true,
        // e.g. one whose delete() runs its own asyncDeleteFromCloud — and may
        // need a scope-aware delete the generic deleteNode can't do) would
        // otherwise be deleted twice (here AND by the child). It would also be
        // wrongly deleted on a NON-delete removal such as replaceSubnodeWith,
        // since this fires for every removal, not just user deletes.
        const selfDeletes = aSubnode && typeof aSubnode.handlesOwnCloudDelete === "function" && aSubnode.handlesOwnCloudDelete();
        if (aSubnode && aSubnode.cloudFsNodeId && !selfDeletes) {
            const nodeId = aSubnode.cloudFsNodeId();
            if (nodeId) {
                if (!this._pendingCloudDeletes) this._pendingCloudDeletes = new Set();
                this._pendingCloudDeletes.add(nodeId);
            }
        }
        return super.removeSubnode(aSubnode);
    }

    // ---------------------------------------------------------------- Cloud sync

    async asyncSyncToCloud () {
        if (!this.cloudFsScopeRootId()) {
            console.warn(this.cloudSyncLogPrefix(), "asyncSyncToCloud: no signed-in user; skipping");
            return false;
        }
        let didUpload = false;
        for (const child of this.cloudSyncableSubnodes()) {
            try {
                const uploaded = await child.asyncSaveToCloud();
                if (uploaded !== false) didUpload = true;
            } catch (e) {
                // NOTE: do NOT auto-remove a child whose save fails with
                // "node not found". A brand-new child's cloud node may not
                // exist yet (first save still in flight / a save that timed
                // out), so removing it here deletes the item the user just
                // created. Just log; let the next save retry. Subclasses
                // may reconcile TERMINAL failures via the hook below.
                console.warn(this.cloudSyncLogPrefix(), "save failed for child:", e && e.message);
                this.onChildCloudSaveFailed(child, e);
            }
        }
        if (this._pendingCloudDeletes && this._pendingCloudDeletes.size > 0) {
            const client = this.cloudFsClient();
            const remaining = new Set();
            for (const nodeId of this._pendingCloudDeletes) {
                try {
                    await client.backend().deleteNode(nodeId);
                    didUpload = true;
                } catch (e) {
                    console.warn(this.cloudSyncLogPrefix(), "cloud delete failed for", nodeId, e && e.message);
                    remaining.add(nodeId);
                }
            }
            this._pendingCloudDeletes = remaining;
        }
        if (this.didSyncToCloud) {
            this.didSyncToCloud();
        }
        return didUpload;
    }

    /**
     * @description Hook: a child's asyncSaveToCloud failed (already logged
     * by the caller). Base does nothing — transient failures simply retry
     * on the next sync pass. Subclasses may reconcile failures they can
     * prove terminal (e.g. a permission-denied save of a child whose cloud
     * scope was deleted — retrying forever just produces an error storm).
     * @param {SvNode} child
     * @param {Error} error
     * @category Cloud Sync
     */
    onChildCloudSaveFailed (/*child, error*/) {
    }

    async asyncSyncFromCloud () {
        try {
            if (!this.cloudFsScopeRootId()) {
                console.warn(this.cloudSyncLogPrefix(), "asyncSyncFromCloud: no signed-in user; skipping");
                return this;
            }
            const client = this.cloudFsClient();
            const folder = await client.asyncReadNode(this.cloudFsFolderId());
            if (!folder || !(folder instanceof SvFsFolder)) {
                // No folder yet — nothing to load.
                if (this.didSyncFromCloud) this.didSyncFromCloud();
                return this;
            }

            // Cheap cache validation. The backend bubbles childrenLastModified
            // one level to a folder whenever any direct child is added,
            // removed, or its content/metadata changes (onNodeWrite trigger).
            // So if that stamp matches what we recorded at our last successful
            // sync AND we still have the children locally (restored from the
            // local pool), the child set + contents are unchanged — skip the
            // list-children round trip and per-child loads entirely. The
            // length>0 guard prevents a stale key from hiding real children.
            // High-write-rate folders opt out (their stamp churns; use the
            // live listener path instead).
            const cloudClmKey = this._childrenClmKey(folder);
            const isHighWrite = (typeof folder.isHighWriteRate === "function") && folder.isHighWriteRate();
            if (!isHighWrite
                && cloudClmKey !== null
                && this.syncedChildrenClmKey() === cloudClmKey
                && this.subnodes().length > 0) {
                this.isDebugging() && console.log(this.cloudSyncLogPrefix(), "children unchanged (clm cache hit) — skipping re-list");
                if (this.didSyncFromCloud) this.didSyncFromCloud();
                return this;
            }

            const childNodes = await folder.asyncListChildren({ limit: 200 });
            // Load children CONCURRENTLY. These are independent per-child
            // reads; doing them sequentially makes startup scale with the
            // child count × round-trip — and any orphaned/dead child entry
            // (listed but whose document 404s) adds a full round-trip each.
            // Failures are isolated per child so one bad entry can't block
            // the rest. Lazy folders render the list from the manifest and
            // defer each child's full-content download to first open — this
            // keeps startup to ~the manifest read instead of N full pool.json
            // downloads. Eager folders load every child's content up front.
            if (this.usesLazyChildLoading()) {
                for (const child of childNodes) {
                    const stableId = this.cloudFsChildIdFromNodeId(child.id());
                    if (!stableId) continue;
                    try {
                        this.applyChildPlaceholderFromCloud(stableId, child);
                    } catch (e) {
                        console.warn(this.cloudSyncLogPrefix(), "placeholder failed for", stableId, e && e.message);
                    }
                }
            } else {
                await Promise.all(childNodes.map(async (child) => {
                    const stableId = this.cloudFsChildIdFromNodeId(child.id());
                    if (!stableId) return;
                    // local-wins-while-dirty: never let a from-cloud apply
                    // overwrite a local child that has unsaved local changes. The
                    // live local instance is the fresher source of truth and will
                    // push to cloud via the to-cloud path — this is the symmetric
                    // counterpart of isChildCloudSyncable() (which gates to-cloud).
                    // Overwriting a dirty/in-use child also tends to orphan live
                    // references to it (bound UI tiles, in-flight async work) when
                    // the subclass swaps instances on apply.
                    const localChild = this.childWithCloudStableId(stableId);
                    if (localChild && localChild.needsCloudSync && localChild.needsCloudSync()) {
                        return;
                    }
                    try {
                        await this.asyncApplyChildFromCloud(stableId, child);
                    } catch (e) {
                        console.warn(this.cloudSyncLogPrefix(), "load failed for", stableId, e && e.message);
                    }
                }));
            }
            // Record the validated stamp so the next sync can cache-hit.
            this.setSyncedChildrenClmKey(cloudClmKey);
            if (this.didSyncFromCloud) this.didSyncFromCloud();
            return this;
        } finally {
            if (this._isLoadingFromCloud) {
                this._isLoadingFromCloud = false;
                this.didUpdateNode();
            }
        }
    }

    /**
     * @description Normalize a folder's childrenLastModified into a stable
     * scalar key for equality comparison. The value arrives from the
     * backend as a Firestore-style Timestamp shape ({_seconds,_nanoseconds}
     * or {seconds,nanoseconds}), or possibly a string/number. Returns null
     * when absent (no cache key available).
     * @param {SvFsFolder} folder
     * @returns {String|null}
     * @category Cloud Sync
     */
    _childrenClmKey (folder) {
        const clm = (folder && typeof folder.childrenLastModified === "function") ? folder.childrenLastModified() : null;
        if (clm == null) return null;
        if (typeof clm === "string" || typeof clm === "number") return String(clm);
        if (typeof clm === "object") {
            const s = (clm._seconds != null) ? clm._seconds : clm.seconds;
            const n = (clm._nanoseconds != null) ? clm._nanoseconds : clm.nanoseconds;
            if (s != null) return String(s) + "." + String(n || 0);
            try { return JSON.stringify(clm); } catch (e) { return null; }
        }
        return null;
    }

    async asyncLazySyncFromCloud () {
        // The childrenLastModified cache check inside asyncSyncFromCloud
        // makes this cheap when nothing changed (one folder read, then skip
        // the list + per-child loads).
        return this.asyncSyncFromCloud();
    }

    async asyncFullSyncFromCloud () {
        return this.asyncSyncFromCloud();
    }

    async asyncSyncWithCloud () {
        await this.asyncLazySyncFromCloud();
        await this.asyncSyncToCloud();
        return this;
    }

}.initThisClass());
