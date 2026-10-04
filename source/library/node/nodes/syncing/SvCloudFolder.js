"use strict";

/**
 * @module library.node.nodes.syncing
 */

/**
 * @class SvCloudFolder
 * @extends SvSyncableArrayNode
 * @classdesc
 * Backend-agnostic base for a collection node whose subnodes are the cloud
 * documents placed under it: a folder of the record cloud (Plans/Placed
 * Subnodes §3 — a document is a pool, a folder a one-row pool, and placement
 * is the tree). Provides the reusable cloud-folder machinery:
 *
 *   - cloudFsClient() wiring (via the `defaultFsBackend()` hook)
 *   - "loading…" subtitle while the first sync is in flight
 *   - THE UNIFIED DELETION PIPELINE: deleting a child queues a persisted,
 *     scope-aware delete descriptor (removeSubnode + isBeingDeleted());
 *     the queue survives reloads, retries every to-cloud pass, and doubles
 *     as the deletion tombstone consulted by every re-add path
 *   - asyncSyncToCloud  (save dirty children + flush pending deletes)
 *   - asyncSyncFromCloud: lists the folder from its scope's root rows — a
 *     placeholder per row placed under its id (title, subtitle, thumbnail
 *     from the row; content loads on first open). A complete listing PRUNES
 *     local children deleted in cloud — the listing is authoritative for
 *     membership, and a deletion outranks a local child's unsent edits
 *     (2026-09-30)
 *   - a folder that is itself a pool (Plans/Placed Subnodes §3: a folder is a
 *     one-row pool) keeps its row current: after each complete scope listing
 *     it writes its row when the listing lacks it or holds an older one
 *     (cloudFolderRow / mayWriteFolderRow)
 *
 * Subclasses MUST provide (backend binding):
 *   - cloudFsScopeRootId()  — the caller's scope-root id (e.g. the signed-in
 *                             user id); backend/auth-specific
 *   - defaultFsBackend()    — the SvFsBackend to use when the shared
 *                             SvFsClient has none set (deletes, scopes)
 *   - folderRecordStore()   — the record cloud it lists from (an
 *                             SvCloudRecordStore)
 *
 * Subclasses MUST provide (collection shape):
 *   - cloudFsFolderId()                          — e.g. "sessions-{uid}"
 *   - cloudFsChildIdFromNodeId(nodeId)           — stable-id extractor
 *   - newChildForCloudStableId(stableId)         — a placeholder child
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
            // The unified deletion pipeline's queue: descriptors
            // ({nodeId, scopeRootId|null, poolId|null}) of deleted children whose cloud
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
     * @description Queues a cloud delete descriptor for flushing on the next
     * to-cloud pass. Copy-on-write so the stored slot's setter fires
     * (persistence + the folder's own dirty touch, which self-schedules the
     * flush). `nodeId` identifies the child (its stable id is parsed from it);
     * a child that is a records pool with no node of its own sends `poolId`,
     * and the flush deletes the pool.
     * @param {Object} descriptor - { nodeId: String, scopeRootId: String|null, poolId: String|null }
     * @returns {SvCloudFolder}
     * @category Deletion Pipeline
     */
    addPendingCloudDelete (descriptor) {
        if (!descriptor || !descriptor.nodeId) return this;
        if (this.hasPendingCloudDelete(descriptor.nodeId)) return this;
        this.setPendingCloudDeletes(this.pendingCloudDeletes().concat([{
            nodeId: descriptor.nodeId,
            scopeRootId: descriptor.scopeRootId || null,
            poolId: descriptor.poolId || null,
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
     * @description Whether a delete is pending for the child with this stable
     * id (a row listing knows children by stable id, not node id).
     * @param {String} stableId
     * @returns {Boolean}
     * @category Deletion Pipeline
     */
    hasPendingCloudDeleteForStableId (stableId) {
        return this.pendingCloudDeletes().some(d => this.cloudFsChildIdFromNodeId(d.nodeId) === stableId);
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

    initPrototype () {
        this.setSubnodesArePools(true); // each child document is the root of its own pool (Plans/Record Store §6)
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
     * @description Whether a local child's content stands in for the cloud's
     * in a lazy sync, so it is kept rather than shown as a placeholder.
     * Default: its (stored) cloudContentLoaded flag. A folder whose cloud copy
     * wins overrides this to require content loaded in this session; one that
     * knows the listed version (rowFields.cloudVersion) can keep a copy that
     * is current and re-list one that is behind.
     * @param {SvNode} child
     * @param {Object} [rowFields] - the listed row's fields, with cloudVersion
     * @returns {Boolean}
     * @category Cloud Sync
     */
    childHasUsableLocalContent (child /*, rowFields */) {
        return !!(child.cloudContentLoaded && child.cloudContentLoaded());
    }

    /**
     * @description The row fields (title, subtitle, thumbnailHash,
     * rowDetailsJson) in a pool root record's payload — its record JSON, { type, entries: [[slot, value]] }.
     * Null when the payload has none of them.
     * @param {String} payloadJson
     * @returns {Object|null}
     * @category Cloud Sync
     */
    static rowFieldsFromRecordPayload (payloadJson) {
        let record = null;
        try {
            record = JSON.parse(payloadJson);
        } catch {
            return null;
        }
        const fields = {};
        ((record && record.entries) || []).forEach(([slot, value]) => {
            if (["title", "subtitle", "thumbnailHash", "rowDetailsJson"].includes(slot) && (typeof value === "string" || value === null)) {
                fields[slot] = value;
            }
        });
        return Object.keys(fields).length > 0 ? fields : null;
    }

    /**
     * @description The folder's scope's root rows — { rows, isComplete },
     * every root row of the scope, read in one request that concurrent folders
     * of the same scope share — of which the folder takes those placed under
     * its id (Plans/Placed Subnodes §3, Folders). Null when there is no record
     * cloud or no scope.
     * @returns {Promise<{rows: Array<Object>, isComplete: Boolean}|null>}
     * @category Cloud Sync
     */
    async asyncListedRootRows () {
        const store = this.folderRecordStore();
        const scopeId = this.cloudFsScopeRootId();
        return store && scopeId ? store.asyncScopeRootRows(scopeId) : null;
    }

    /**
     * @description Lists this folder from its scope's root rows: a placeholder
     * per row placed under this folder (its title, subtitle and thumbnail from
     * the row), then the prune a complete listing allows.
     * @param {Object} listing - { rows, isComplete }
     * @category Cloud Sync
     */
    applyRootRowListing (listing) {
        const folderId = this.cloudFsFolderId();
        const listedStableIds = new Set();
        listing.rows.filter(row => row.parentId === folderId).forEach((row) => {
            const stableId = this.stableIdForRootRow(row);
            listedStableIds.add(stableId);
            if (!this.hasPendingCloudDeleteForStableId(stableId)) {
                // the row's fields, and the version the cloud holds (a local copy behind it is stale)
                const fields = Object.assign({ cloudVersion: row.version }, SvCloudFolder.rowFieldsFromRecordPayload(row.payloadJson) || {});
                this.applyChildPlaceholderSafely(stableId, fields);
            }
        });
        this.pruneIfListingComplete(listedStableIds, listing.isComplete);
        this.ensureFolderRowFrom(listing);
        return this;
    }

    // --- the folder's own row (Plans/Placed Subnodes §3: a folder is a one-row pool) ---

    /**
     * @description This folder as a row of its scope: a pool with only a root
     * row, holding the folder's own data and placed under its parent. Null
     * (the default) for a folder that is not a pool.
     * @returns {Object|null} { poolId, objectId, parentId, orderKey, payloadJson, scopeId }
     * @category Folder Row
     */
    cloudFolderRow () {
        return null;
    }

    /**
     * @description Whether the signed-in user may write this folder's row (an
     * owner or editor of its scope). False by default.
     * @returns {Boolean}
     * @category Folder Row
     */
    mayWriteFolderRow () {
        return false;
    }

    /**
     * @description The record cloud the folder lists its children from and
     * writes its row to; null when the folder is not on one.
     * @returns {SvCloudRecordStore|null}
     * @category Folder Row
     */
    folderRecordStore () {
        return null;
    }

    /**
     * @description After a complete scope listing: writes this folder's row
     * when the listing lacks it or holds a different one. Fire and forget —
     * a failure is logged and the next listing tries again.
     * @param {Object} listing - { rows, isComplete }
     * @category Folder Row
     */
    ensureFolderRowFrom (listing) {
        const wanted = this.cloudFolderRow();
        if (!wanted || !listing.isComplete || !this.mayWriteFolderRow() || !this.folderRecordStore()) {
            return;
        }
        const listed = listing.rows.find(row => row.poolId === wanted.poolId) || null;
        if (SvCloudFolder.folderRowIsCurrent(listed, wanted)) {
            return;
        }
        this.folderRecordStore().asyncPutRootRow(wanted, { scopeId: wanted.scopeId, baseVersion: listed ? listed.version : 0 }).then((answer) => {
            console.log(this.cloudSyncLogPrefix(), "folder row " + wanted.poolId + ": " + (answer && answer.status));
        }).catch((e) => {
            console.warn(this.cloudSyncLogPrefix(), "folder row " + wanted.poolId + " not written:", e && e.message);
        });
    }

    /**
     * @description Whether a listed root row already is the wanted one: same
     * placement and payload (the listing's payload is the row cut to its row
     * entries, which is all a folder row holds).
     * @param {Object|null} listed
     * @param {Object} wanted
     * @returns {Boolean}
     * @category Folder Row
     */
    static folderRowIsCurrent (listed, wanted) {
        return !!listed && listed.parentId === wanted.parentId && listed.orderKey === wanted.orderKey && listed.payloadJson === wanted.payloadJson;
    }

    /**
     * @description The stable id of the child a root row lists. The row's
     * objectId is its pool root's puuid, so a child with that puuid IS the
     * document, whatever its stable id — a document from before pool ids were
     * its stable id has a pool named after its puuid (a character's
     * characterId differs). A row with no such child names a new document,
     * whose stable id is its pool's local id.
     * @param {Object} row
     * @returns {String}
     * @category Cloud Sync
     */
    stableIdForRootRow (row) {
        const child = this.subnodes().detect(sn => sn.puuid && sn.puuid() === row.objectId);
        const childStableId = child ? this.cloudStableIdForChild(child) : null;
        return childStableId || SvRecordRow.localPoolId(row.poolId);
    }

    /**
     * @description applyChildPlaceholderFromCloud, one child's failure isolated
     * from the rest of the listing.
     * @category Cloud Sync
     */
    applyChildPlaceholderSafely (stableId, rowFields) {
        try {
            this.applyChildPlaceholderFromCloud(stableId, rowFields);
        } catch (e) {
            console.warn(this.cloudSyncLogPrefix(), "placeholder failed for", stableId, e && e.message);
        }
    }

    /**
     * @description Create/refresh a lightweight placeholder subnode from a
     * listed root row — its row fields only, no content download. The child
     * loads its full content lazily on first open (the document's
     * prepareForFirstAccess / asyncEnsureLoaded). Generic for all cloud
     * folders; subclasses only supply find-or-create via
     * `childWithCloudStableId` / `newChildForCloudStableId`.
     * @param {String} stableId
     * @param {Object|null} rowFields - the row's fields, with cloudVersion
     * @category Cloud Sync
     */
    applyChildPlaceholderFromCloud (stableId, rowFields = null) {
        let child = this.childWithCloudStableId(stableId);
        // Don't downgrade a child whose local content counts (e.g. on a
        // refresh after the user opened it) back to a placeholder.
        if (child && this.childHasUsableLocalContent(child, rowFields)) {
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
            // the document's row (title, subtitle, thumbnail … on its root record)
            const fields = rowFields;
            if (fields && typeof fields.title === "string" && fields.title && child.setTitle) child.setTitle(fields.title);
            if (fields && typeof fields.subtitle === "string" && fields.subtitle && child.setSubtitle) child.setSubtitle(fields.subtitle);
            if (fields && child.applyRowFields) child.applyRowFields(fields);
            if (child.didSyncFromCloud) child.didSyncFromCloud(Date.now());
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
            SvTransactionContext.assertNoneOpen("queuing a cloud delete"); // an effect a rollback cannot undo
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
        // Flush the persisted delete queue. Entries persist across reloads and
        // retry every pass until the cloud confirms — stronger than the
        // in-page retry burst this replaces.
        for (const descriptor of this.pendingCloudDeletes().slice()) {
            try {
                await this.asyncFlushCloudDelete(descriptor);
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
     * @description Carries out one queued delete, scope-aware: a promoted
     * session's descriptor carries its scopeRootId and goes through
     * deleteScope (which also removes the _members subcollection and RTDB bus
     * trees, and is the only path the backend permits for a scope root), or
     * leaveScope for a member leaving; a document is deleted by its records
     * pool. A descriptor with neither has nothing in the cloud to delete.
     * @param {Object} descriptor - a pendingCloudDeletes entry
     * @returns {Promise}
     * @category Deletion Pipeline
     */
    async asyncFlushCloudDelete (descriptor) {
        const backend = this.cloudFsClient().backend();
        if (descriptor.scopeRootId && descriptor.scopeAction === "leave") {
            await backend.leaveScope(descriptor.scopeRootId);
            console.log(this.cloudSyncLogPrefix(), "Left multiplayer scope:", descriptor.scopeRootId);
        } else if (descriptor.scopeRootId) {
            // exact log text is a spec contract (delete-session-persists)
            await backend.deleteScope(descriptor.scopeRootId);
            console.log(this.cloudSyncLogPrefix(), "Deleted multiplayer scope:", descriptor.scopeRootId);
        } else if (descriptor.poolId) {
            await backend.deletePool(descriptor.poolId);
            console.log(this.cloudSyncLogPrefix(), "Deleted cloud child:", descriptor.nodeId, "(pool " + descriptor.poolId + ")");
        } else {
            console.warn(this.cloudSyncLogPrefix(), "dropping a queued delete with no pool or scope:", descriptor.nodeId);
        }
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
            const start = performance.now();
            const listing = await this.asyncListedRootRows();
            if (listing) {
                this.applyRootRowListing(listing);
                console.log("[rows] " + this.svType() + ": " + listing.rows.filter(row => row.parentId === this.cloudFsFolderId()).length + " of the scope's " + listing.rows.length + " root rows in " + Math.round(performance.now() - start) + " ms (started at " + Math.round(start) + " ms)");
            }
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
     * @description Deletion reconciliation: a complete listing is
     * authoritative for membership. A truncated one never prunes — absence
     * would be indistinguishable from truncation.
     * @param {Set<String>} listedStableIds
     * @param {Boolean} isComplete
     * @category Deletion Pipeline
     */
    pruneIfListingComplete (listedStableIds, isComplete) {
        if (isComplete) {
            this.pruneChildrenAbsentFromCloud(listedStableIds);
        } else {
            console.warn(this.cloudSyncLogPrefix(), "listing truncated at ceiling — skipping deletion prune");
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
     * previously synced (cloudLastModified set), folder-governed, and absent
     * from a COMPLETE cloud listing — dirty or not. A deletion is the user's
     * intent; unsent edits on a stale device are a sync that failed, not a
     * reason to bring the document back (Steve, 2026-09-30; it used to be
     * most-recent-wins, and a record commit to a deleted pool is refused
     * anyway). A child that never reached the cloud is kept: the deletion
     * cannot have been of it. Cloud-initiated, so the removal must not
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
            // dirty or not: the deletion was the user's intent (see above)
            if (!this.childMayBeCloudPruned(child)) continue; // another authority governs it
            console.log(this.cloudSyncLogPrefix(), "pruning local child deleted in cloud:", stableId);
            this.removeSubnodeForCloudPrune(child);
        }
        return this;
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

    async asyncLazySyncFromCloud () {
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
