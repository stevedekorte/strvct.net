/**
 * @module library.node.nodes.syncing
 * @class SvSyncCollectionSource
 * @extends SvSummaryNode
 * @description Abstract base class for synchronizing collections from external sources.
 *
 * Subclasses implement specific sync behaviors for different data sources:
 * - SvCloudSyncSource: Firebase Storage (read/write)
 * - SvLocalResourceSource: Bundled JSON resources (read-only)
 *
 * The manifest structure preserves subnode order and includes type for class instantiation:
 * {
 *     subnodeIds: ["id1", "id2", ...],  // Ordered array
 *     items: {
 *         "id1": { type: "UoCharacter", title: "...", subtitle: "...", thumbnailUrl: "...", lastModified: ... },
 *         "id2": { type: "UoCharacters", title: "...", subtitle: "...", thumbnailUrl: "...", lastModified: ... }
 *     }
 * }
 *
 * The type field is critical for hierarchical collections where items can be different classes
 * (e.g., UoCharacter instances and UoCharacters folder instances).
 */
(class SvSyncCollectionSource extends SvSummaryNode {

    static jsonSchemaDescription () {
        return "Abstract base class for collection sync sources";
    }

    initPrototypeSlots () {
        /**
         * @member {SvNode} targetCollection - The collection to sync
         */
        {
            const slot = this.newSlot("targetCollection", null);
            slot.setSlotType("SvNode");
            slot.setDescription("The collection node to sync items to/from");
        }

        /**
         * @member {String} sourcePath - Path to the source (URL, folder path, etc.)
         */
        {
            const slot = this.newSlot("sourcePath", null);
            slot.setSlotType("String");
            slot.setDescription("Path or URL to the sync source");
        }

        /**
         * @member {Object} manifest - The manifest containing subnode IDs and metadata
         */
        {
            const slot = this.newSlot("manifest", null);
            slot.setSlotType("Object");
            slot.setDescription("Manifest with subnodeIds array and items metadata");
        }

        /**
         * @member {Boolean} isReadOnly - Whether this source is read-only
         */
        {
            const slot = this.newSlot("isReadOnly", false);
            slot.setSlotType("Boolean");
            slot.setDescription("Whether this source is read-only");
        }

        /**
         * @member {Map} uploadedThumbnailUrls - Map of itemId -> cloud thumbnail URL (temporary, during sync)
         */
        {
            const slot = this.newSlot("uploadedThumbnailUrls", null);
            slot.setSlotType("Map");
            slot.setDescription("Temporary map of uploaded thumbnail URLs during sync");
        }
    }

    initPrototype () {
        this.setShouldStore(false);
    }

    // --- Abstract Methods (subclasses must implement) ---

    /**
     * Fetches the manifest from the source.
     * @returns {Promise<Object>} The manifest object
     * @category Abstract
     */
    async asyncFetchManifest () {
        throw new Error("Subclass must implement asyncFetchManifest()");
    }

    /**
     * Fetches an item's JSON data by its ID.
     * @param {String} itemId - The item's jsonId
     * @returns {Promise<Object>} The item's JSON data
     * @category Abstract
     */
    async asyncFetchItem (/* itemId */) {
        throw new Error("Subclass must implement asyncFetchItem()");
    }

    async asyncUploadItem (/* item */) {
        if (this.isReadOnly()) {
            throw new Error("Cannot upload to read-only source");
        }
        throw new Error("Subclass must implement asyncUploadItem()");
    }

    /**
     * Uploads the manifest to the source (for writable sources).
     * @returns {Promise<void>}
     * @category Abstract
     */
    async asyncUploadManifest () {
        if (this.isReadOnly()) {
            throw new Error("Cannot upload to read-only source");
        }
        throw new Error("Subclass must implement asyncUploadManifest()");
    }

    /**
     * Deletes an item from the source (for writable sources).
     * @param {String} itemId - The item's jsonId
     * @returns {Promise<void>}
     * @category Abstract
     */
    async asyncDeleteItem (/* itemId */) {
        if (this.isReadOnly()) {
            throw new Error("Cannot delete from read-only source");
        }
        throw new Error("Subclass must implement asyncDeleteItem()");
    }

    // --- Manifest Helpers ---

    /**
     * Creates a new empty manifest structure.
     * @returns {Object} Empty manifest
     * @category Manifest
     */
    emptyManifest () {
        return {
            subnodeIds: [],
            items: {}
        };
    }

    /**
     * Gets the ordered list of subnode IDs from the manifest.
     * @returns {Array<String>} Array of item IDs in order
     * @category Manifest
     */
    manifestSubnodeIds () {
        const manifest = this.manifest();
        return manifest ? manifest.subnodeIds || [] : [];
    }

    /**
     * Gets the metadata for a specific item from the manifest.
     * @param {String} itemId - The item's jsonId
     * @returns {Object|null} Item metadata or null
     * @category Manifest
     */
    manifestItemMetadata (itemId) {
        const manifest = this.manifest();
        if (!manifest || !manifest.items) {
            return null;
        }
        return manifest.items[itemId] || null;
    }

    /**
     * Updates the manifest with current collection state.
     * @returns {Promise<void>}
     * @category Manifest
     */
    async asyncUpdateManifestFromCollection () {
        const collection = this.targetCollection();
        if (!collection) {
            this.setManifest(this.emptyManifest());
            return;
        }

        const subnodeIds = [];
        const items = {};

        for (const subnode of collection.subnodes()) {
            const id = subnode.jsonId();
            subnodeIds.push(id);
            items[id] = await this.asyncSyncMetadataForItem(subnode);
        }

        this.setManifest({
            subnodeIds: subnodeIds,
            items: items
        });
    }

    /**
     * Gets sync metadata for an item, including type and thumbnail URL.
     * @param {Object} item - The item node
     * @returns {Promise<Object>} Metadata object with type, title, subtitle, thumbnailUrl, lastModified
     * @category Manifest
     */
    async asyncSyncMetadataForItem (item) {
        // If item has its own asyncSyncMetadata method, use it
        if (item.asyncSyncMetadata) {
            return await item.asyncSyncMetadata();
        }

        const metadata = {
            type: item.svType(),
            title: item.title ? item.title() : item.jsonId(),
            subtitle: item.subtitle ? item.subtitle() : "",
            thumbnailUrl: null,
            lastModified: Date.now()
        };

        // Check for uploaded cloud thumbnail URL first
        const uploadedUrls = this.uploadedThumbnailUrls();
        if (uploadedUrls && uploadedUrls.has(item.jsonId())) {
            metadata.thumbnailUrl = uploadedUrls.get(item.jsonId());
        } else if (item.asyncNodeThumbnailUrl) {
            // Fall back to item's thumbnail URL (skip data URLs - they're too large for manifest)
            try {
                const url = await item.asyncNodeThumbnailUrl();
                // Only include actual URLs, not data URLs (which can be hundreds of KB)
                if (url && !url.startsWith("data:")) {
                    metadata.thumbnailUrl = url;
                }
            } catch (e) {
                // Thumbnail not available, leave as null
                console.warn("Failed to get thumbnail URL for item:", item.jsonId(), e);
            }
        }

        return metadata;
    }

    // --- Sync Operations ---

    /**
     * Syncs items from the source to the target collection (full fetch).
     * @returns {Promise<void>}
     * @category Sync
     */
    async asyncSyncFromSource () {
        // Fetch manifest first
        const manifest = await this.asyncFetchManifest();
        this.setManifest(manifest);

        const collection = this.targetCollection();
        if (!collection) {
            throw new Error("No target collection set");
        }

        const subnodeIds = this.manifestSubnodeIds();

        // Fetch and add/update items in order
        for (const itemId of subnodeIds) {
            const localItem = collection.subnodeWithJsonId(itemId);
            const sourceMetadata = this.manifestItemMetadata(itemId);

            if (!localItem) {
                // New item - fetch and add
                const json = await this.asyncFetchItem(itemId);
                const typeName = sourceMetadata ? sourceMetadata.type : null;
                const newItem = await this.asyncCreateItemFromJsonWithErrorHandling(json, typeName, itemId);
                if (newItem) {
                    collection.addSubnode(newItem);
                    this.didSyncItemFromSource(newItem, sourceMetadata);
                }
            } else if (this.shouldUpdateItem(localItem, sourceMetadata)) {
                // Update existing item if source is newer
                const json = await this.asyncFetchItem(itemId);
                const success = await this.asyncApplyJsonWithErrorHandling(localItem, json, itemId);
                if (success) {
                    this.didSyncItemFromSource(localItem, sourceMetadata);
                }
            }
        }

        // Reorder subnodes to match manifest order
        this.reorderCollectionToMatchManifest();
    }

    /**
     * Syncs from source lazily - only loads manifest and creates stubs.
     * Items are fetched on-demand when accessed.
     * @returns {Promise<void>}
     * @category Sync
     */
    async asyncLazySyncFromSource () {
        // Fetch manifest first
        const manifest = await this.asyncFetchManifest();
        this.setManifest(manifest);

        const collection = this.targetCollection();
        console.log("CLOUDSYNC [SvSyncCollectionSource] asyncLazySyncFromSource - targetCollection:", collection, "this:", this.type ? this.type() : this.constructor?.name, "folderName:", this.folderName ? this.folderName() : "n/a", "userId:", this.userId ? this.userId() : "n/a");
        if (!collection) {
            throw new Error("No target collection set");
        }

        const subnodeIds = this.manifestSubnodeIds();

        // Create stubs for new items, update metadata for existing items
        for (const itemId of subnodeIds) {
            const localItem = collection.subnodeWithJsonId(itemId);
            const sourceMetadata = this.manifestItemMetadata(itemId);

            if (!localItem) {
                // New item - create stub (will fetch on demand)
                const stub = this.createStubFromMetadata(itemId, sourceMetadata);
                if (stub) {
                    collection.addSubnode(stub);
                }
            } else {
                // Existing item - always set content source so it can fetch if needed
                if (localItem.setContentSource) {
                    localItem.setContentSource(this);
                }

                if (this.shouldUpdateItem(localItem, sourceMetadata)) {
                    // Mark existing item as needing refresh
                    // We don't fetch yet - just mark it
                    if (localItem.setFetchState && localItem.isFetched && localItem.isFetched()) {
                        // Item was fetched before but cloud has newer - mark for refetch
                        localItem.setFetchState("unfetched");
                    }
                    if (localItem.setCloudLastModified && sourceMetadata.lastModified) {
                        localItem.setCloudLastModified(sourceMetadata.lastModified);
                    }
                }
            }
        }

        // Remove local items that were deleted from cloud
        // (items that exist locally, were previously synced, but are no longer in cloud manifest)
        const cloudIds = new Set(subnodeIds);
        for (const localItem of collection.subnodes().slice()) { // slice to avoid mutation during iteration
            if (!cloudIds.has(localItem.jsonId())) {
                // Item not in cloud manifest
                if (localItem.existsInCloud && localItem.existsInCloud()) {
                    // Item was synced before but no longer in cloud = deleted remotely
                    console.log("CLOUDSYNC [SvSyncCollectionSource] Removing locally item deleted from cloud:", localItem.jsonId());
                    collection.removeSubnode(localItem);
                }
                // If item doesn't exist in cloud (never synced), keep it as a new local item
            }
        }

        // Reorder subnodes to match manifest order
        this.reorderCollectionToMatchManifest();
    }

    /**
     * Syncs items from the target collection to the source.
     * Uploads modified items, deletes removed items, updates manifest.
     * @returns {Promise<void>}
     * @category Sync
     */
    async asyncSyncToSource () {
        if (this.isReadOnly()) {
            throw new Error("Cannot sync to read-only source");
        }

        const collection = this.targetCollection();
        if (!collection) {
            throw new Error("No target collection set");
        }

        // Clear uploaded thumbnail URLs from any previous sync
        this.setUploadedThumbnailUrls(new Map());

        // Remember old manifest IDs before updating
        const oldManifestIds = new Set(this.manifestSubnodeIds());

        // Upload items that need syncing
        for (const item of collection.subnodes()) {
            if (this.itemNeedsUpload(item)) {
                await this.asyncUploadItem(item);
                this.didSyncItemToSource(item);
            }
        }

        // Update manifest from current collection state
        await this.asyncUpdateManifestFromCollection();

        // Find and delete items that were removed locally
        const newManifestIds = new Set(this.manifestSubnodeIds());
        for (const oldId of oldManifestIds) {
            if (!newManifestIds.has(oldId)) {
                // Item was deleted locally - delete from cloud
                try {
                    await this.asyncDeleteItem(oldId);
                    console.log("Deleted cloud item:", oldId);
                } catch (error) {
                    console.warn("Failed to delete cloud item:", oldId, error.message);
                }
            }
        }

        // Upload updated manifest
        await this.asyncUploadManifest();
    }

    /**
     * Creates an item node from JSON data, using type field if available.
     * @param {Object} json - The item's JSON data
     * @param {String} [typeName] - Optional type name (from manifest metadata)
     * @returns {Object|null} The created item node
     * @category Sync
     */
    createItemFromJson (json, typeName = null) {
        const collection = this.targetCollection();
        if (!collection) {
            return null;
        }

        // Try to determine the class to use
        let itemClass = null;

        // 1. Use provided typeName (from manifest metadata)
        // 2. Fall back to type in json itself
        // 3. Fall back to first subnode class
        const typeToUse = typeName || json.type;
        if (typeToUse) {
            itemClass = this.classForTypeName(typeToUse);
        }

        if (!itemClass) {
            const subnodeClasses = collection.subnodeClasses();
            if (!subnodeClasses || subnodeClasses.length === 0) {
                console.warn("No subnode classes defined on collection and no type specified");
                return null;
            }
            itemClass = subnodeClasses[0];
        }

        const newItem = itemClass.clone();
        newItem.setCloudJson(json);
        return newItem;
    }

    /**
     * Creates a stub item from manifest metadata (for lazy loading).
     * The stub has basic info but fetchState = "unfetched".
     * @param {String} itemId - The item's jsonId
     * @param {Object} metadata - Metadata from manifest (type, title, subtitle, lastModified)
     * @returns {Object|null} The stub item node
     * @category Sync
     */
    createStubFromMetadata (itemId, metadata) {
        const collection = this.targetCollection();
        if (!collection) {
            return null;
        }

        const typeName = metadata.type;
        let itemClass = typeName ? this.classForTypeName(typeName) : null;

        if (!itemClass) {
            const subnodeClasses = collection.subnodeClasses();
            if (!subnodeClasses || subnodeClasses.length === 0) {
                console.warn("No subnode classes defined on collection and no type specified in metadata");
                return null;
            }
            itemClass = subnodeClasses[0];
        }

        const stub = itemClass.clone();

        // Set basic identification from manifest metadata
        stub.setJsonId(itemId);
        if (stub.setTitle && metadata.title) {
            stub.setTitle(metadata.title);
        }
        if (stub.setSubtitle && metadata.subtitle) {
            stub.setSubtitle(metadata.subtitle);
        }

        // Mark as unfetched for lazy loading
        if (stub.setFetchState) {
            stub.setFetchState("unfetched");
        }

        // Set content source so it can fetch itself
        if (stub.setContentSource) {
            stub.setContentSource(this);
        }

        // Set cloud timestamp from metadata
        if (stub.setCloudLastModified && metadata.lastModified) {
            stub.setCloudLastModified(metadata.lastModified);
        }

        return stub;
    }

    /**
     * Gets the class for a given type name.
     * @param {String} typeName - The class name (e.g., "UoCharacter")
     * @returns {Class|null} The class or null if not found
     * @category Sync
     */
    classForTypeName (typeName) {
        // Check if it's a valid subnode class for the collection
        const collection = this.targetCollection();
        if (collection) {
            const subnodeClasses = collection.subnodeClasses();
            if (subnodeClasses) {
                const matchingClass = subnodeClasses.find(cls => cls.svType() === typeName);
                if (matchingClass) {
                    return matchingClass;
                }
            }
        }

        // Fall back to global class lookup
        const cls = Object.getClassNamed(typeName);
        return cls || null;
    }

    /**
     * Determines if a local item should be updated from source.
     * Detects conflicts when both local and cloud have been modified.
     * @param {Object} localItem - The local item node
     * @param {Object} sourceMetadata - Metadata from the source manifest
     * @returns {Boolean}
     * @category Sync
     */
    shouldUpdateItem (localItem, sourceMetadata) {
        // Subclasses can override for more sophisticated comparison
        if (!sourceMetadata || !sourceMetadata.lastModified) {
            return false;
        }

        const localCloudTimestamp = localItem.cloudLastModified ? localItem.cloudLastModified() : 0;
        const cloudIsNewer = sourceMetadata.lastModified > localCloudTimestamp;

        if (!cloudIsNewer) {
            return false; // Cloud hasn't changed since last sync
        }

        // Check for conflict: cloud is newer AND local has unsaved changes
        // Only check for conflict if item was previously synced from cloud (has cloudLastModified)
        // If cloudLastModified is null, this is a first-time sync, not a conflict
        const wasPreiouslySyncedFromCloud = localItem.cloudLastModified && localItem.cloudLastModified();
        const hasLocalChanges = localItem.localLastModified && localItem.localLastModified() > localCloudTimestamp;

        if (wasPreiouslySyncedFromCloud && hasLocalChanges) {
            // True conflict: item was synced before, modified locally, and cloud has newer version
            this.handleSyncConflict(localItem, sourceMetadata);
            return false; // Don't overwrite local changes
        }

        return true; // Safe to update from cloud
    }

    /**
     * Handles a sync conflict where both local and cloud have changes.
     * Default behavior: keep local changes (will be uploaded on next sync).
     * Subclasses can override for custom conflict resolution.
     * @param {Object} localItem - The local item with unsaved changes
     * @param {Object} sourceMetadata - Metadata from cloud
     * @category Sync
     */
    handleSyncConflict (localItem, sourceMetadata) {
        console.warn("CLOUDSYNC [SvSyncCollectionSource] Conflict detected for item:", localItem.jsonId(),
            "- Local modified:", localItem.localLastModified ? localItem.localLastModified() : "unknown",
            "- Cloud modified:", sourceMetadata.lastModified,
            "- Keeping local changes (will upload on next sync)");
        // Default: keep local changes. They will be uploaded on the next syncToSource.
        // This is a "local wins" strategy. Subclasses can override for other behaviors
        // like prompting the user, merging, or creating a copy.
    }

    /**
     * Determines if an item needs to be uploaded to the source.
     * @param {Object} item - The item node
     * @returns {Boolean}
     * @category Sync
     */
    itemNeedsUpload (item) {
        // Default implementation uses dirty flag pattern
        if (item.needsCloudSync) {
            return item.needsCloudSync();
        }
        return false;
    }

    /**
     * Called after an item is synced from the source.
     * @param {Object} item - The item that was synced
     * @param {Object} sourceMetadata - The source metadata
     * @category Sync Hooks
     */
    didSyncItemFromSource (item, sourceMetadata) {
        if (item.didSyncFromCloud && sourceMetadata) {
            item.didSyncFromCloud(sourceMetadata.lastModified);
        }
    }

    /**
     * Called after an item is synced to the source.
     * @param {Object} item - The item that was synced
     * @category Sync Hooks
     */
    didSyncItemToSource (item) {
        if (item.didSyncToCloud) {
            item.didSyncToCloud();
        }
    }

    /**
     * Reorders the collection subnodes to match the manifest order.
     * @category Sync
     */
    reorderCollectionToMatchManifest () {
        const collection = this.targetCollection();
        if (!collection) {
            return;
        }

        const subnodeIds = this.manifestSubnodeIds();
        if (subnodeIds.length === 0) {
            return; // Nothing to reorder
        }

        const subnodeMap = new Map();

        // Build map of existing subnodes by ID
        collection.subnodes().forEach(subnode => {
            subnodeMap.set(subnode.jsonId(), subnode);
        });

        // Rebuild subnodes array in manifest order
        const orderedSubnodes = [];
        for (const id of subnodeIds) {
            const subnode = subnodeMap.get(id);
            if (subnode) {
                orderedSubnodes.push(subnode);
                subnodeMap.delete(id);
            }
        }

        // Append any subnodes not in manifest (new local items)
        for (const subnode of subnodeMap.values()) {
            orderedSubnodes.push(subnode);
        }

        // Replace subnodes using copyFrom to maintain SubnodesArray type
        collection.subnodes().copyFrom(orderedSubnodes);
    }

    // --- Error Handling for Cloud Sync ---

    /**
     * Creates an item from JSON with error handling.
     * If deserialization fails, logs error, notifies user, and deletes cloud item.
     * @param {Object} json - The JSON data
     * @param {String} typeName - The type name
     * @param {String} itemId - The item ID (for error handling)
     * @returns {Promise<Object|null>} The created item or null on error
     * @category Error Handling
     */
    async asyncCreateItemFromJsonWithErrorHandling (json, typeName, itemId) {
        try {
            return this.createItemFromJson(json, typeName);
        } catch (error) {
            await this.handleCloudItemError(itemId, error);
            return null;
        }
    }

    /**
     * Applies JSON to an item with error handling.
     * If deserialization fails, logs error, notifies user, and deletes cloud item.
     * @param {Object} item - The item to update
     * @param {Object} json - The JSON data
     * @param {String} itemId - The item ID (for error handling)
     * @returns {Promise<Boolean>} True if successful, false on error
     * @category Error Handling
     */
    async asyncApplyJsonWithErrorHandling (item, json, itemId) {
        try {
            item.setCloudJson(json);
            return true;
        } catch (error) {
            await this.handleCloudItemError(itemId, error);
            return false;
        }
    }

    /**
     * Handles an error when loading a cloud item.
     * Logs the error, notifies the user, and deletes the problematic cloud item.
     * @param {String} itemId - The item ID that failed
     * @param {Error} error - The error that occurred
     * @returns {Promise<void>}
     * @category Error Handling
     */
    async handleCloudItemError (itemId, error) {
        console.error("CLOUDSYNC [SvSyncCollectionSource] Failed to load cloud item '" + itemId + "':", error.message);
        console.error("CLOUDSYNC [SvSyncCollectionSource] The cloud data format is incompatible. Deleting cloud item.");

        // Show user notification
        this.showCloudItemErrorNotice(itemId, error);

        // Delete the problematic cloud item
        try {
            await this.asyncDeleteItem(itemId);
            console.log("CLOUDSYNC [SvSyncCollectionSource] Deleted incompatible cloud item:", itemId);
        } catch (deleteError) {
            console.warn("CLOUDSYNC [SvSyncCollectionSource] Failed to delete cloud item:", itemId, deleteError.message);
        }
    }

    /**
     * Shows a notice to the user about a cloud item error.
     * @param {String} itemId - The item ID that failed
     * @param {Error} error - The error that occurred
     * @category Error Handling
     */
    showCloudItemErrorNotice (itemId /*, error */) {
        const message = "A cloud-stored item could not be loaded due to a data format change. " +
            "The incompatible cloud data has been removed. Some data may have been lost. " +
            "(Item: " + itemId + ")";
        console.warn("CLOUD SYNC ERROR: " + message);

        throw new Error(message);
        //this.postNoteNamed("cloudItemError", message);
    }

}.initThisClass());
