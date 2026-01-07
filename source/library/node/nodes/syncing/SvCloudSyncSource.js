/**
 * @module library.node.nodes.syncing
 * @class SvCloudSyncSource
 * @extends SvSyncCollectionSource
 * @description Sync source for Firebase Cloud Storage.
 *
 * Handles reading and writing gzipped JSON files to Firebase Storage.
 * Supports bidirectional sync with compression for bandwidth efficiency.
 * Supports hierarchical collections with sub-collection paths.
 *
 * Storage structure (flat):
 * /users/{userId}/{folderName}/
 *     _manifest.json           - Collection manifest
 *     {jsonId}.json.gz         - Item data (gzipped)
 *
 * Storage structure (hierarchical):
 * /users/{userId}/{folderName}/
 *     _manifest.json           - Top-level manifest
 *     {itemJsonId}.json.gz     - Item data
 *     {subCollectionJsonId}/   - Sub-collection folder
 *         _manifest.json       - Sub-collection manifest
 *         {nestedItemId}.json.gz
 */
(class SvCloudSyncSource extends SvSyncCollectionSource {

    static jsonSchemaDescription () {
        return "Sync source for Firebase Cloud Storage";
    }

    initPrototypeSlots () {
        /**
         * @member {String} userId - The user ID for the storage path
         */
        {
            const slot = this.newSlot("userId", null);
            slot.setSlotType("String");
            slot.setDescription("User ID for constructing storage paths");
        }

        /**
         * @member {String} folderName - The folder name within user's storage
         */
        {
            const slot = this.newSlot("folderName", null);
            slot.setSlotType("String");
            slot.setDescription("Folder name (e.g., 'characters', 'campaigns')");
        }

        /**
         * @member {String} subPath - Optional sub-path for nested collections
         */
        {
            const slot = this.newSlot("subPath", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setDescription("Sub-path for nested collections (e.g., '{parentJsonId}')");
        }

        /**
         * @member {Object} storageRef - Firebase Storage reference
         */
        {
            const slot = this.newSlot("storageRef", null);
            slot.setSlotType("Object");
            slot.setDescription("Firebase Storage reference object");
        }
    }

    initPrototype () {
        this.setIsReadOnly(false);
    }

    // --- Path Construction ---

    /**
     * Gets the base path for this collection in storage.
     * Includes subPath if set (for nested collections).
     * @returns {String}
     * @category Paths
     */
    basePath () {
        let path = `users/${this.userId()}/${this.folderName()}`;
        if (this.subPath()) {
            path += `/${this.subPath()}`;
        }
        return path;
    }

    /**
     * Creates a sync source for a sub-collection.
     * @param {String} subCollectionId - The jsonId of the sub-collection item
     * @returns {SvCloudSyncSource} A new sync source for the sub-collection
     * @category Paths
     */
    syncSourceForSubCollection (subCollectionId) {
        const subSource = this.thisClass().clone();
        subSource.setUserId(this.userId());
        subSource.setFolderName(this.folderName());
        subSource.setStorageRef(this.storageRef());

        // Build the sub-path
        const currentSubPath = this.subPath();
        const newSubPath = currentSubPath
            ? `${currentSubPath}/${subCollectionId}`
            : subCollectionId;
        subSource.setSubPath(newSubPath);

        return subSource;
    }

    /**
     * Gets the path to the manifest file.
     * @returns {String}
     * @category Paths
     */
    manifestPath () {
        return `${this.basePath()}/_manifest.json`;
    }

    /**
     * Gets the path to an item file.
     * @param {String} itemId - The item's jsonId
     * @returns {String}
     * @category Paths
     */
    itemPath (itemId) {
        return `${this.basePath()}/${itemId}.json.gz`;
    }

    // --- Abstract Method Implementations ---

    /**
     * Fetches the manifest from Firebase Storage.
     * @returns {Promise<Object>}
     * @category Sync
     */
    async asyncFetchManifest () {
        try {
            const ref = this.storageRefForPath(this.manifestPath());
            const url = await ref.getDownloadURL();
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch manifest: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            // Handle various "not found" error formats from Firebase Storage
            if (error.code === "storage/object-not-found" ||
                (error.message && error.message.includes("404")) ||
                (error.message && error.message.includes("does not exist"))) {
                // No manifest exists yet - return empty
                console.log("CLOUDSYNC [SvCloudSyncSource] No manifest found, starting fresh");
                return this.emptyManifest();
            }
            throw error;
        }
    }

    /**
     * Fetches an item's JSON data from Firebase Storage.
     * @param {String} itemId
     * @returns {Promise<Object>}
     * @category Sync
     */
    async asyncFetchItem (itemId) {
        const ref = this.storageRefForPath(this.itemPath(itemId));
        const url = await ref.getDownloadURL();
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch item ${itemId}: ${response.status}`);
        }
        const blob = await response.blob();
        return await this.asyncDecompressJson(blob);
    }

    /**
     * Uploads an item to Firebase Storage.
     * @param {Object} item - The item node to upload
     * @returns {Promise<void>}
     * @category Sync
     */
    async asyncUploadItem (item) {
        const ref = this.storageRefForPath(this.itemPath(item.jsonId()));
        const json = item.asJson();
        const blob = await this.asyncCompressJson(json);

        // Upload thumbnail if available and get cloud URL
        const thumbnailUrl = await this.asyncUploadThumbnailForItem(item);

        // Store the cloud thumbnail URL for manifest building
        if (thumbnailUrl) {
            if (!this.uploadedThumbnailUrls()) {
                this.setUploadedThumbnailUrls(new Map());
            }
            this.uploadedThumbnailUrls().set(item.jsonId(), thumbnailUrl);
        }

        // Get sync metadata (includes type, subtitle)
        const syncMetadata = await this.asyncSyncMetadataForItem(item);

        // Firebase custom metadata values must be strings
        const customMetadata = {
            type: String(syncMetadata.type || item.svType()),
            title: String(syncMetadata.title || ""),
            subtitle: String(syncMetadata.subtitle || ""),
            thumbnailUrl: String(thumbnailUrl || syncMetadata.thumbnailUrl || ""),
            lastModified: String(syncMetadata.lastModified || Date.now())
        };

        const metadata = {
            contentType: "application/gzip",
            customMetadata: customMetadata
        };

        await ref.put(blob, metadata);
    }

    /**
     * Uploads a thumbnail for an item and returns the public URL.
     * Uses content-addressable storage in /public/blobs/ via FirebaseStorageService.
     * @param {Object} item - The item node
     * @returns {Promise<String|null>} The public URL or null
     * @category Sync
     */
    async asyncUploadThumbnailForItem (item) {
        if (!item.asyncNodeThumbnailUrl) {
            return null;
        }

        try {
            const dataUrl = await item.asyncNodeThumbnailUrl();
            if (!dataUrl) {
                return null;
            }

            // If already a URL (not data URL), return as-is
            if (!dataUrl.startsWith("data:")) {
                return dataUrl;
            }

            // Convert data URL to blob
            const blob = this.dataUrlToBlob(dataUrl);
            if (!blob) {
                return null;
            }

            // Upload to public/blobs/ using content-addressable storage
            const publicUrl = await FirebaseStorageService.shared().asyncPublicUrlForBlob(blob);
            return publicUrl;

        } catch (e) {
            console.warn("Failed to upload thumbnail for item:", item.jsonId(), e.message);
            return null;
        }
    }

    /**
     * Converts a data URL to a Blob.
     * @param {String} dataUrl - The data URL
     * @returns {Blob|null}
     * @category Helpers
     */
    dataUrlToBlob (dataUrl) {
        try {
            const parts = dataUrl.split(",");
            const mimeMatch = parts[0].match(/:(.*?);/);
            if (!mimeMatch) {
                return null;
            }
            const mime = mimeMatch[1];
            const base64 = parts[1];
            const binary = atob(base64);
            const array = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                array[i] = binary.charCodeAt(i);
            }
            return new Blob([array], { type: mime });
        } catch (e) {
            console.warn("Failed to convert data URL to blob:", e.message);
            return null;
        }
    }

    /**
     * Uploads the manifest to Firebase Storage.
     * @returns {Promise<void>}
     * @category Sync
     */
    async asyncUploadManifest () {
        const ref = this.storageRefForPath(this.manifestPath());
        const manifestJson = JSON.stringify(this.manifest(), null, 2);
        const blob = new Blob([manifestJson], { type: "application/json" });
        await ref.put(blob, { contentType: "application/json" });
    }

    /**
     * Deletes an item from Firebase Storage.
     * @param {String} itemId
     * @returns {Promise<void>}
     * @category Sync
     */
    async asyncDeleteItem (itemId) {
        const ref = this.storageRefForPath(this.itemPath(itemId));
        try {
            await ref.delete();
        } catch (error) {
            if (error.code !== "storage/object-not-found") {
                throw error;
            }
            // Already deleted, ignore
        }
    }

    // --- Storage Helpers ---

    /**
     * Gets a Firebase Storage reference for a path.
     * @param {String} path
     * @returns {Object} Firebase Storage reference
     * @category Storage
     */
    storageRefForPath (path) {
        const storage = this.storageRef();
        if (!storage) {
            throw new Error("No storage reference set");
        }
        return storage.child(path);
    }

    /**
     * Lists all item files in the cloud folder.
     * @returns {Promise<Array<String>>} Array of item IDs found in cloud
     * @category Storage
     */
    async asyncListCloudItemIds () {
        const folderRef = this.storageRefForPath(this.basePath());
        const itemIds = [];

        try {
            const result = await folderRef.listAll();
            for (const itemRef of result.items) {
                const name = itemRef.name;
                // Extract jsonId from filename (e.g., "abc123.json.gz" -> "abc123")
                if (name.endsWith(".json.gz")) {
                    const itemId = name.slice(0, -8); // Remove ".json.gz"
                    itemIds.push(itemId);
                }
            }
        } catch (error) {
            console.warn("Failed to list cloud items:", error.message);
        }

        return itemIds;
    }

    /**
     * Deletes orphaned cloud files not in the manifest.
     * Call this periodically or after sync to clean up.
     * @returns {Promise<Array<String>>} Array of deleted item IDs
     * @category Storage
     */
    async asyncDeleteOrphanedCloudItems () {
        const manifestIds = new Set(this.manifestSubnodeIds());
        const cloudIds = await this.asyncListCloudItemIds();
        const deletedIds = [];

        for (const cloudId of cloudIds) {
            if (!manifestIds.has(cloudId)) {
                try {
                    await this.asyncDeleteItem(cloudId);
                    deletedIds.push(cloudId);
                    console.log("Deleted orphaned cloud item:", cloudId);
                } catch (error) {
                    console.warn("Failed to delete orphaned item:", cloudId, error.message);
                }
            }
        }

        return deletedIds;
    }

    // --- Compression Helpers ---

    /**
     * Compresses JSON data using gzip.
     * @param {Object} json - The JSON object to compress
     * @returns {Promise<Blob>} Compressed blob
     * @category Compression
     */
    async asyncCompressJson (json) {
        const jsonString = JSON.stringify(json);
        const uint8Array = new TextEncoder().encode(jsonString);

        if (typeof CompressionStream !== "undefined") {
            const stream = new Blob([uint8Array]).stream();
            const compressedStream = stream.pipeThrough(new CompressionStream("gzip"));
            return new Response(compressedStream).blob();
        }

        // Fallback: return uncompressed
        console.warn("CompressionStream not available, storing uncompressed");
        return new Blob([jsonString], { type: "application/json" });
    }

    /**
     * Decompresses gzipped JSON data.
     * @param {Blob} blob - The compressed blob
     * @returns {Promise<Object>} Decompressed JSON object
     * @category Compression
     */
    async asyncDecompressJson (blob) {
        const headerBytes = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
        const isGzipped = headerBytes[0] === 0x1f && headerBytes[1] === 0x8b;

        if (isGzipped && typeof DecompressionStream !== "undefined") {
            const stream = blob.stream();
            const decompressedStream = stream.pipeThrough(new DecompressionStream("gzip"));
            const decompressedBlob = await new Response(decompressedStream).blob();
            const text = await decompressedBlob.text();
            return JSON.parse(text);
        }

        // Not gzipped or no DecompressionStream - try as plain JSON
        const text = await blob.text();
        return JSON.parse(text);
    }

}.initThisClass());
