/**
 * @module library.node.nodes.syncing
 * @class SvCloudSyncSource
 * @extends SvSyncCollectionSource
 * @description Sync source for Firebase Cloud Storage.
 *
 * Handles reading and writing gzipped JSON files to Firebase Storage.
 * Supports bidirectional sync with compression for bandwidth efficiency.
 *
 * Storage structure:
 * /users/{userId}/{folderName}/
 *     _manifest.json           - Collection manifest
 *     {jsonId}.json.gz         - Item data (gzipped)
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
     * @returns {String}
     * @category Paths
     */
    basePath () {
        return `users/${this.userId()}/${this.folderName()}`;
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
            if (error.code === "storage/object-not-found") {
                // No manifest exists yet - return empty
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

        // Get sync metadata (includes subtitle and thumbnailUrl)
        const syncMetadata = await this.asyncSyncMetadataForItem(item);

        // Firebase custom metadata values must be strings
        const customMetadata = {
            title: String(syncMetadata.title || ""),
            subtitle: String(syncMetadata.subtitle || ""),
            thumbnailUrl: String(syncMetadata.thumbnailUrl || ""),
            lastModified: String(syncMetadata.lastModified || Date.now())
        };

        const metadata = {
            contentType: "application/gzip",
            customMetadata: customMetadata
        };

        await ref.put(blob, metadata);
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
