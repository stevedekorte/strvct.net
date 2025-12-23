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
 * The manifest structure preserves subnode order:
 * {
 *     subnodeIds: ["id1", "id2", ...],  // Ordered array
 *     items: {
 *         "id1": { title: "...", subtitle: "...", thumbnailUrl: "...", lastModified: ... },
 *         "id2": { title: "...", subtitle: "...", thumbnailUrl: "...", lastModified: ... }
 *     }
 * }
 */
(class SvSyncCollectionSource extends SvSummaryNode {

    static jsonSchemaDescription () {
        return "Abstract base class for collection sync sources";
    }

    initPrototypeSlots () {
        /**
         * @member {SvJsonArrayNode} targetCollection - The collection to sync
         */
        {
            const slot = this.newSlot("targetCollection", null);
            slot.setSlotType("SvJsonArrayNode");
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
    async asyncFetchItem (itemId) {
        throw new Error("Subclass must implement asyncFetchItem()");
    }

    /**
     * Uploads an item to the source (for writable sources).
     * @param {Object} item - The item node to upload
     * @returns {Promise<void>}
     * @category Abstract
     */
    async asyncUploadItem (item) {
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
    async asyncDeleteItem (itemId) {
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
     * Gets sync metadata for an item, including thumbnail URL.
     * @param {Object} item - The item node
     * @returns {Promise<Object>} Metadata object with title, subtitle, thumbnailUrl, lastModified
     * @category Manifest
     */
    async asyncSyncMetadataForItem (item) {
        // If item has its own syncMetadata method, use it
        if (item.asyncSyncMetadata) {
            return await item.asyncSyncMetadata();
        }

        const metadata = {
            title: item.title ? item.title() : item.jsonId(),
            subtitle: item.subtitle ? item.subtitle() : "",
            thumbnailUrl: null,
            lastModified: Date.now()
        };

        // Get thumbnail URL if available
        if (item.asyncNodeThumbnailUrl) {
            try {
                metadata.thumbnailUrl = await item.asyncNodeThumbnailUrl();
            } catch (e) {
                // Thumbnail not available, leave as null
                console.warn("Failed to get thumbnail URL for item:", item.jsonId(), e);
            }
        }

        return metadata;
    }

    // --- Sync Operations ---

    /**
     * Syncs items from the source to the target collection.
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
                const newItem = this.createItemFromJson(json);
                if (newItem) {
                    collection.addSubnode(newItem);
                    this.didSyncItemFromSource(newItem, sourceMetadata);
                }
            } else if (this.shouldUpdateItem(localItem, sourceMetadata)) {
                // Update existing item if source is newer
                const json = await this.asyncFetchItem(itemId);
                localItem.setJson(json);
                this.didSyncItemFromSource(localItem, sourceMetadata);
            }
        }

        // Reorder subnodes to match manifest order
        this.reorderCollectionToMatchManifest();
    }

    /**
     * Syncs items from the target collection to the source.
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

        // Upload items that need syncing
        for (const item of collection.subnodes()) {
            if (this.itemNeedsUpload(item)) {
                await this.asyncUploadItem(item);
                this.didSyncItemToSource(item);
            }
        }

        // Update and upload manifest
        await this.asyncUpdateManifestFromCollection();
        await this.asyncUploadManifest();
    }

    /**
     * Creates an item node from JSON data.
     * @param {Object} json - The item's JSON data
     * @returns {Object|null} The created item node
     * @category Sync
     */
    createItemFromJson (json) {
        const collection = this.targetCollection();
        if (!collection) {
            return null;
        }

        const subnodeClasses = collection.subnodeClasses();
        if (!subnodeClasses || subnodeClasses.length === 0) {
            console.warn("No subnode classes defined on collection");
            return null;
        }

        const newItem = subnodeClasses[0].clone();
        newItem.setJson(json);
        return newItem;
    }

    /**
     * Determines if a local item should be updated from source.
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

        const localModified = localItem.cloudLastModified ? localItem.cloudLastModified() : 0;
        return sourceMetadata.lastModified > localModified;
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

        // Replace subnodes with ordered array
        collection.setSubnodes(orderedSubnodes);
    }

}.initThisClass());
