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
 *   - THE UNIFIED DELETION PIPELINE: deleting a child queues a persisted,
 *     scope-aware delete descriptor (removeSubnode + isBeingDeleted());
 *     the queue survives reloads, retries every to-cloud pass, and doubles
 *     as the deletion tombstone consulted by every re-add path
 *   - asyncSyncToCloud  (save dirty children + flush pending deletes)
 *   - asyncSyncFromCloud (read folder → optional childrenLastModified
 *     cache check → COMPLETE listing → apply children; eager or
 *     lazy/manifest-first → PRUNE local children deleted in cloud —
 *     the listing is authoritative for membership; a dirty local child
 *     is later than the cloud and wins, per most-recent-wins)
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

        {
            // The unified deletion pipeline's queue: descriptors
            // ({nodeId, scopeRootId|null}) of deleted children whose cloud
            // delete has not yet SUCCEEDED. Stored, so an unflushed delete
            // survives a reload (the old in-memory Set died with the page
            // and the child re-added itself from cloud next boot). Doubles
            // as the deletion tombstone: every re-add path consults it.
            // Mutate ONLY copy-on-write through the helpers below — in-place
            // mutation never reaches persistence dirty-tracking. Retroactive
            // default [] = empty queue = legacy behavior.
            const slot = this.newSlot("pendingCloudDeletes", []);
            slot.setSlotType("Array");
            slot.setShouldStoreSlot(true);
            slot.setIsInCloudJson(false);
        }
    }

    // ---------------------------------------------------------------- Pending-delete queue (copy-on-write)

    /**
     * @description Queues a cloud delete descriptor ({nodeId, scopeRootId})
     * for flushing on the next to-cloud pass. Copy-on-write so the stored
     * slot's setter fires (persistence + the folder's own dirty touch, which
     * self-schedules the flush).
     * @param {Object} descriptor - { nodeId: String, scopeRootId: String|null }
     * @returns {SvCloudFolder}
     * @category Deletion Pipeline
     */
    addPendingCloudDelete (descriptor) {
        if (!descriptor || !descriptor.nodeId) return this;
        if (this.hasPendingCloudDelete(descriptor.nodeId)) return this;
        this.setPendingCloudDeletes(this.pendingCloudDeletes().concat([{
            nodeId: descriptor.nodeId,
            scopeRootId: descriptor.scopeRootId || null,
            // "delete" (default) removes the node/scope; "leave" removes only
            // the caller's membership row (a client leaving a shared scope)
            scopeAction: descriptor.scopeAction || "delete"
        }]));
        return this;
    }

    removePendingCloudDelete (nodeId) {
        this.setPendingCloudDeletes(this.pendingCloudDeletes().filter(d => d.nodeId !== nodeId));
        return this;
    }

    hasPendingCloudDelete (nodeId) {
        return this.pendingCloudDeletes().some(d => d.nodeId === nodeId);
    }

    /**
     * @description Whether a delete is pending for the given multiplayer
     * scope — consulted by scope-discovery re-add paths.
     * @param {String} scopeRootId
     * @returns {Boolean}
     * @category Deletion Pipeline
     */
    hasPendingCloudDeleteScope (scopeRootId) {
        return !!scopeRootId && this.pendingCloudDeletes().some(d => d.scopeRootId === scopeRootId);
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
            // asMillis before the fallback: an uninterpretable object is
            // truthy, so `lm || Date.now()` would forward the object itself
            // and null out both stamps downstream (which reads as
            // never-synced and re-uploads the item on every startup).
            if (child.didSyncFromCloud) child.didSyncFromCloud(Date.asMillis(lm) || Date.now());
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
        // Queue a cloud delete ONLY for true deletions. removeSubnode fires
        // for every removal — structural swaps (replaceSubnodeWith),
        // cloud-initiated prunes, zombie reconciliation — and none of those
        // may delete the cloud object. The child's delete() sets
        // isBeingDeleted() before detaching (SvNode.delete), which is the
        // discriminator. The child supplies its own scope-aware descriptor
        // via the optional cloudDeleteDescriptor() hook.
        const isDeletion = aSubnode && typeof aSubnode.isBeingDeleted === "function" && aSubnode.isBeingDeleted();
        if (isDeletion) {
            this.addPendingCloudDelete(this.cloudDeleteDescriptorForChild(aSubnode));
        }
        return super.removeSubnode(aSubnode);
    }

    /**
     * @description The delete descriptor for a child: the child's own
     * cloudDeleteDescriptor() when it has one (e.g. a promoted session adds
     * its multiplayer scope id, which the flush deletes scope-aware), else
     * { nodeId } from cloudFsNodeId(). Null when the child has no cloud id
     * (never synced — nothing to delete).
     * @param {SvNode} child
     * @returns {Object|null}
     * @category Deletion Pipeline
     */
    cloudDeleteDescriptorForChild (child) {
        try {
            if (typeof child.cloudDeleteDescriptor === "function") {
                return child.cloudDeleteDescriptor();
            }
            const nodeId = (typeof child.cloudFsNodeId === "function") ? child.cloudFsNodeId() : null;
            return nodeId ? { nodeId: nodeId, scopeRootId: null } : null;
        } catch {
            // e.g. a client-session mirror whose stable-id accessor throws;
            // it has no folder-owned cloud doc to delete
            return null;
        }
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
        // Flush the persisted delete queue, scope-aware: a promoted session's
        // descriptor carries its scopeRootId and must go through deleteScope
        // (which also removes the _members subcollection and RTDB bus trees,
        // and is the only path the backend permits for a scope root); plain
        // folder children go through deleteNode. Entries persist across
        // reloads and retry every pass until the cloud confirms — stronger
        // than the in-page retry burst this replaces.
        for (const descriptor of this.pendingCloudDeletes().slice()) {
            const client = this.cloudFsClient();
            try {
                if (descriptor.scopeRootId && descriptor.scopeAction === "leave") {
                    await client.backend().leaveScope(descriptor.scopeRootId);
                    console.log(this.cloudSyncLogPrefix(), "Left multiplayer scope:", descriptor.scopeRootId);
                } else if (descriptor.scopeRootId && typeof client.backend().deleteScope === "function") {
                    // exact log text is a spec contract (delete-session-persists)
                    await client.backend().deleteScope(descriptor.scopeRootId);
                    console.log(this.cloudSyncLogPrefix(), "Deleted multiplayer scope:", descriptor.scopeRootId);
                } else {
                    await client.backend().deleteNode(descriptor.nodeId);
                    console.log(this.cloudSyncLogPrefix(), "Deleted cloud child:", descriptor.nodeId);
                }
                this.removePendingCloudDelete(descriptor.nodeId);
                didUpload = true;
            } catch (e) {
                if (/not.?found|no such|does not exist/i.test((e && e.message) || "")) {
                    // Already gone (deleted elsewhere, or the child never
                    // finished its first sync) — the goal state is reached;
                    // retrying forever would just be an error storm.
                    console.log(this.cloudSyncLogPrefix(), "cloud delete target already absent:", descriptor.nodeId);
                    this.removePendingCloudDelete(descriptor.nodeId);
                } else {
                    console.warn(this.cloudSyncLogPrefix(), "cloud delete failed for", descriptor.nodeId, "(will retry):", e && e.message);
                }
            }
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

            const { children: childNodes, isComplete } = await folder.asyncListAllChildren();
            const listedStableIds = new Set();
            // Load children CONCURRENTLY. These are independent per-child
            // reads; doing them sequentially makes startup scale with the
            // child count × round-trip — and any orphaned/dead child entry
            // (listed but whose document 404s) adds a full round-trip each.
            // Failures are isolated per child so one bad entry can't block
            // the rest. Lazy folders render the list from the manifest and
            // defer each child's full-content download to first open — this
            // keeps startup to ~the manifest read instead of N full pool.json
            // downloads. Eager folders load every child's content up front.
            //
            // BOTH branches skip children with a pending local delete: the
            // cloud doc is still listed until the flush lands, and re-adding
            // it here would undo a delete performed just before a reload.
            if (this.usesLazyChildLoading()) {
                for (const child of childNodes) {
                    const stableId = this.cloudFsChildIdFromNodeId(child.id());
                    if (!stableId) continue;
                    listedStableIds.add(stableId);
                    if (this.hasPendingCloudDelete(child.id())) continue;
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
                    listedStableIds.add(stableId);
                    if (this.hasPendingCloudDelete(child.id())) return;
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
            // Deletion reconciliation: the complete cloud listing is
            // authoritative for MEMBERSHIP. A truncated listing must never
            // prune — absence would be indistinguishable from truncation.
            if (isComplete) {
                this.pruneChildrenAbsentFromCloud(listedStableIds);
            } else {
                console.warn(this.cloudSyncLogPrefix(), "listing truncated at ceiling — skipping deletion prune");
            }
            // Record the validated stamp so the next sync can cache-hit.
            // Safe even though it consumes the change evidence: deletes
            // bubble childrenLastModified too (onNodeWrite handles the
            // before-exists/after-null case), so a future cache hit proves
            // membership is unchanged.
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

    // ---------------------------------------------------------------- Deletion reconciliation (prune)

    /**
     * @description Subclasses MAY exclude children whose membership is
     * governed by another authority than this folder's listing (e.g.
     * multiplayer sessions discovered via scope membership). Default: every
     * child is folder-governed.
     * @param {SvNode} child
     * @returns {Boolean}
     * @category Deletion Pipeline
     */
    childMayBeCloudPruned (/*child*/) {
        return true;
    }

    /**
     * @description Exception-safe stable id for a child (a client-session
     * mirror's accessor throws — such a child has no folder entry).
     * @param {SvNode} child
     * @returns {String|null}
     * @category Deletion Pipeline
     */
    cloudStableIdForChild (child) {
        if (!child || typeof child.cloudFsStableId !== "function") return null;
        try {
            return child.cloudFsStableId();
        } catch {
            return null;
        }
    }

    /**
     * @description Removes local children that were deleted in the cloud:
     * previously synced (cloudLastModified set), clean (a dirty child is
     * LATER than the cloud and wins — its next save legitimately recreates
     * the doc: most-recent-wins), folder-governed, and absent from a
     * COMPLETE cloud listing. Cloud-initiated, so the removal must not
     * queue a cloud delete — guaranteed by the isBeingDeleted()
     * discriminator in removeSubnode (these children are shut down and
     * removed, never delete()d).
     * @param {Set<String>} listedStableIds
     * @returns {SvCloudFolder}
     * @category Deletion Pipeline
     */
    pruneChildrenAbsentFromCloud (listedStableIds) {
        for (const child of this.subnodes().slice()) {
            const stableId = this.cloudStableIdForChild(child);
            if (!stableId) continue;                    // not a folder-owned doc
            if (listedStableIds.has(stableId)) continue; // present in cloud
            const wasSynced = child.cloudLastModified && child.cloudLastModified();
            if (!wasSynced) continue;                   // never reached cloud — local-new wins
            if (child.needsCloudSync && child.needsCloudSync()) continue; // dirty — local wins
            if (!this.childMayBeCloudPruned(child)) continue; // another authority governs it
            console.log(this.cloudSyncLogPrefix(), "pruning local child deleted in cloud:", stableId);
            this.removeSubnodeForCloudPrune(child);
        }
        return this;
    }

    /**
     * @description The governing PARENT listing proved this folder's own
     * cloud doc was DELETED (the user-home read path: a complete listing of
     * the home's children that does not contain this folder). rm -rf
     * semantics: remove every previously-synced local child, INCLUDING
     * dirty ones — a deleted folder is authoritative over its whole
     * subtree, and the dirty bit on an eager-loaded child (a session's
     * self-dirtying wiring) is bookkeeping churn, not a user edit an
     * admin wipe must respect. This is deliberately STRONGER than
     * pruneChildrenAbsentFromCloud (which is per-record reconciliation
     * inside a LIVE folder, where dirty-local-wins protects offline
     * edits). Never-synced children survive: born locally, never the
     * deletion's target — they re-upload into a recreated folder.
     * Children governed by another authority (childMayBeCloudPruned
     * false, e.g. membership-discovered multiplayer sessions) are
     * untouched: their cloud life isn't in this folder. Clears the
     * children clm cache so a later recreate re-lists from scratch.
     * @returns {Number} how many children were pruned
     * @category Deletion Pipeline
     */
    pruneSyncedChildrenForDeletedCloudFolder () {
        let pruned = 0;
        for (const child of this.subnodes().slice()) {
            const wasSynced = child.cloudLastModified && child.cloudLastModified();
            if (!wasSynced) continue;                         // never reached cloud — locally born, keep
            if (!this.childMayBeCloudPruned(child)) continue; // another authority governs it
            const stableId = this.cloudStableIdForChild(child);
            console.log(this.cloudSyncLogPrefix(), "cloud folder deleted — pruning previously-synced child:", stableId || (child.title && child.title()) || child.svType());
            this.removeSubnodeForCloudPrune(child);
            pruned += 1;
        }
        if (pruned > 0) {
            this.setSyncedChildrenClmKey(null);
        }
        return pruned;
    }

    /**
     * @description Split-brain self-heal: drop stored refs to children whose
     * parentNode() is a DIFFERENT folder. Historical adoption bugs wrote the
     * same child into two folders' stored subnode lists (two per-realm
     * collections sharing one uid-flat cloud folder); at every load the
     * instances re-parent the same pooled nodes back and forth ("already has
     * parent" warnings), and — worse — a delete() only detaches the child
     * from its CURRENT parent, so the other list resurrects it on the next
     * boot (observed in prod 2026-08-20: deleted sessions all returned on
     * reload with a clean cloud). Run AFTER pool loading settles (the last
     * loader owns the child); every other holder purges its stale ref. Plain
     * removeSubnode — the child is not being deleted, so nothing queues a
     * cloud delete; persisting the removal is the heal.
     * @returns {Number} how many stale refs were dropped
     * @category Deletion Pipeline
     */
    dropSubnodesParentedElsewhere () {
        let dropped = 0;
        for (const child of this.subnodes().slice()) {
            const parent = child.parentNode && child.parentNode();
            if (!parent || parent === this) continue;
            if (!(parent instanceof SvCloudFolder)) continue; // only heal folder-vs-folder splits
            console.log(this.cloudSyncLogPrefix(), "[split-brain] dropping stale ref to", (child.title && child.title()) || child.svType(), "— its live parent is", parent.svType());
            this.removeSubnode(child);
            dropped += 1;
        }
        return dropped;
    }

    /**
     * @description Cloud-initiated local removal: shut the child down (stop
     * observers, audio, timers) and detach it. Same shape as the zombie
     * reconciliation removal — never .delete() (which queues cloud deletes
     * and navigates).
     * @param {SvNode} child
     * @returns {SvCloudFolder}
     * @category Deletion Pipeline
     */
    removeSubnodeForCloudPrune (child) {
        if (typeof child.shutdown === "function") {
            try {
                child.shutdown();
            } catch (e) {
                console.warn(this.cloudSyncLogPrefix(), "prune shutdown failed:", e && e.message);
            }
        }
        this.removeSubnode(child);
        return this;
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
            try { return JSON.stringify(clm); } catch { return null; }
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
