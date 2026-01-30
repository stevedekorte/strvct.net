"use strict";

/**
 * @module library.node.nodes.syncing
 * @class SvSyncableArrayNode
 * @extends SvJsonArrayNode
 * @classdesc A JSON array node that supports cloud syncing via SvCloudSyncSource.
 * Uses timestamp-based dirty tracking (same pattern as SvSyncableJsonGroup).
 *
 * Subclasses must implement:
 * - cloudFolderName() - returns the folder name for cloud storage (e.g., "sessions", "characters")
 *
 * Subclasses may override:
 * - subnodeClasses() - to specify what types of items the collection contains
 */
(class SvSyncableArrayNode extends SvJsonArrayNode {

    static jsonSchemaDescription () {
        return "A JSON array node that supports cloud syncing";
    }

    initPrototypeSlots () {
        {
            /**
             * @member {SvCloudSyncSource} cloudSyncSource
             * @description Sync source for cloud storage
             */
            const slot = this.newSlot("cloudSyncSource", null);
            slot.setSlotType("SvCloudSyncSource");
            slot.setShouldStoreSlot(false);
        }

        {
            /**
             * @member {Number} cloudLastModified
             * @description Timestamp (ms since epoch) when this collection was last synced FROM cloud.
             * @category Sync
             */
            const slot = this.newSlot("cloudLastModified", null);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setAllowsNullValue(true);
        }

        {
            /**
             * @member {Number} localLastModified
             * @description Timestamp (ms since epoch) when this collection was last modified locally.
             * @category Sync
             */
            const slot = this.newSlot("localLastModified", null);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setAllowsNullValue(true);
        }
    }

    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(true);
    }

    // --- Abstract Methods ---

    /**
     * @description Returns the folder name for cloud storage.
     * Subclasses MUST override this method.
     * @returns {String} The folder name (e.g., "sessions", "characters")
     * @category Abstract
     */
    cloudFolderName () {
        throw new Error("Subclass must implement cloudFolderName()");
    }

    // --- Mutation Tracking ---

    /**
     * @description Called when the node or any descendant changes.
     * Marks this collection for cloud sync.
     * @returns {Boolean} Whether the notification was posted
     * @category Sync
     */
    didUpdateNode () {
        if (this.hasDoneInit()) {
            this.touchLocalModified();
        }
        return super.didUpdateNode();
    }

    // --- Cloud Sync Helpers ---

    /**
     * @description Checks if local changes need to be pushed to cloud.
     * True if collection was locally modified OR any item needs sync.
     * @returns {Boolean}
     * @category Sync
     */
    needsCloudSync () {
        // Check if collection itself was modified
        const local = this.localLastModified();
        const cloud = this.cloudLastModified();
        if (!cloud) {
            return true; // Not in cloud = needs sync
        }
        if (local && local > cloud) {
            return true; // Local changes pending
        }
        // Check if any item needs sync
        return this.subnodes().canDetect(item => item.needsCloudSync && item.needsCloudSync());
    }

    /**
     * @description Marks the collection as locally modified.
     * @returns {SvSyncableArrayNode} This instance
     * @category Sync
     */
    touchLocalModified () {
        this.setLocalLastModified(Date.now());
        return this;
    }

    /**
     * @description Called after successfully syncing TO the cloud.
     * @param {Number} [timestamp=Date.now()] - The sync timestamp
     * @returns {SvSyncableArrayNode} This instance
     * @category Sync
     */
    didSyncToCloud (timestamp = Date.now()) {
        this.setCloudLastModified(timestamp);
        return this;
    }

    /**
     * @description Called after successfully syncing FROM the cloud.
     * Sets both timestamps to indicate local and cloud are in sync.
     * @param {Number} [cloudTimestamp=Date.now()] - The cloud's lastModified timestamp
     * @returns {SvSyncableArrayNode} This instance
     * @category Sync
     */
    didSyncFromCloud (cloudTimestamp = Date.now()) {
        this.setCloudLastModified(cloudTimestamp);
        this.setLocalLastModified(cloudTimestamp);
        return this;
    }

    // --- Cloud Sync Source Setup ---

    /**
     * @description Gets the current Firebase user ID or throws if not logged in.
     * @returns {String} The user ID
     * @category Auth
     */
    currentUserId () {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            throw new Error("No authenticated user - please sign in first");
        }
        return currentUser.uid;
    }

    /**
     * @description Gets or creates the cloud sync source for this collection.
     * @returns {SvCloudSyncSource} The sync source
     * @category Sync
     */
    getOrCreateCloudSyncSource () {
        const existing = this.cloudSyncSource();
        if (!existing || !existing.targetCollection()) {
            const syncSource = SvCloudSyncSource.clone();
            syncSource.setUserId(this.currentUserId());
            syncSource.setFolderName(this.cloudFolderName());
            syncSource.setStorageRef(firebase.storage().ref());
            syncSource.setTargetCollection(this);
            this.setCloudSyncSource(syncSource);
        }
        return this.cloudSyncSource();
    }

    /**
     * @description Clears the sync source (call on logout).
     * @returns {SvSyncableArrayNode} This instance
     * @category Sync
     */
    clearCloudSyncSource () {
        this.setCloudSyncSource(null);
        return this;
    }

    // --- Cloud Sync Operations ---

    /**
     * @description Lazy syncs from cloud - loads manifest and creates stubs.
     * Full item data is fetched on-demand when opened.
     * @returns {Promise<SvSyncableArrayNode>} This instance
     * @category Sync
     */
    async asyncLazySyncFromCloud () {
        const syncSource = this.getOrCreateCloudSyncSource();
        await syncSource.asyncLazySyncFromSource();
        this.didSyncFromCloud();
        return this;
    }

    /**
     * @description Full sync from cloud - loads all item data.
     * @returns {Promise<SvSyncableArrayNode>} This instance
     * @category Sync
     */
    async asyncFullSyncFromCloud () {
        const syncSource = this.getOrCreateCloudSyncSource();
        await syncSource.asyncSyncFromSource();
        this.didSyncFromCloud();
        return this;
    }

    /**
     * @description Syncs local changes to cloud.
     * Only uploads items that have been modified locally.
     * @returns {Promise<SvSyncableArrayNode>} This instance
     * @category Sync
     */
    async asyncSyncToCloud () {
        const syncSource = this.getOrCreateCloudSyncSource();
        await syncSource.asyncSyncToSource();
        this.didSyncToCloud();
        return this;
    }

    /**
     * @description Bidirectional sync with cloud.
     * @returns {Promise<SvSyncableArrayNode>} This instance
     * @category Sync
     */
    async asyncSyncWithCloud () {
        await this.asyncLazySyncFromCloud();
        await this.asyncSyncToCloud();
        return this;
    }

    /**
     * @description Finds a subnode by its jsonId.
     * @param {String} jsonId - The jsonId to search for
     * @returns {Object|null} The subnode or null
     * @category Lookup
     */
    subnodeWithJsonId (jsonId) {
        return this.subnodes().detect(sn => sn.jsonId() === jsonId);
    }

}.initThisClass());
