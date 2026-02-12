/**
 * @module library.node.nodes.syncing
 * @class SvCloudSyncSource
 * @extends SvSyncCollectionSource
 * @description Sync source for Firebase Cloud Storage.
 *
 * Handles reading and writing JSON files to Firebase Storage.
 * Supports bidirectional sync and hierarchical collections with sub-collection paths.
 * Note: Compression is currently disabled for easier debugging.
 *
 * Storage structure (flat):
 * /users/{userId}/{folderName}/
 *     _manifest.json           - Collection manifest
 *     {jsonId}.json             - Item data (plain JSON)
 *
 * Storage structure (hierarchical):
 * /users/{userId}/{folderName}/
 *     _manifest.json           - Top-level manifest
 *     {itemJsonId}.json         - Item data
 *     {subCollectionJsonId}/   - Sub-collection folder
 *         _manifest.json       - Sub-collection manifest
 *         {nestedItemId}.json
 */
(class SvCloudSyncSource extends SvSyncCollectionSource {

    static jsonSchemaDescription () {
        return "Sync source for Firebase Cloud Storage";
    }

    // --- Retry Utility ---

    /**
     * Retries an async function with exponential backoff on transient errors.
     * Only retries on network errors and HTTP 5xx; does not retry auth (401) or validation (400).
     * @param {Function} fn - Async function to retry
     * @param {Number} [maxAttempts=3] - Maximum number of attempts
     * @param {Array<Number>} [delays=[1000, 3000]] - Delay in ms between retries
     * @returns {Promise<*>} Result of the function
     * @category Helpers
     */
    static async asyncRetry (fn, maxAttempts = 3, delays = [1000, 3000]) {
        let lastError;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;

                // Don't retry auth or validation errors
                if (this.isNonRetryableError(error)) {
                    throw error;
                }

                if (attempt < maxAttempts - 1) {
                    const delay = delays[Math.min(attempt, delays.length - 1)];
                    console.warn("CLOUDSYNC [SvCloudSyncSource] Transient error (attempt " + (attempt + 1) + "/" + maxAttempts + "), retrying in " + delay + "ms:", error.message);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError;
    }

    /**
     * Checks if an error is non-retryable (auth or validation).
     * @param {Error} error - The error to check
     * @returns {Boolean} True if the error should not be retried
     * @category Helpers
     */
    static isNonRetryableError (error) {
        const msg = error.message || "";
        // Firebase auth errors
        if (error.code === "storage/unauthorized" || error.code === "storage/unauthenticated") {
            return true;
        }
        // HTTP 400/401/403
        if (msg.includes("400") || msg.includes("401") || msg.includes("403")) {
            return true;
        }
        return false;
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
     * Gets the path to the manifest backup file.
     * @returns {String}
     * @category Paths
     */
    manifestBackupPath () {
        return `${this.basePath()}/_manifest_backup.json`;
    }

    /**
     * Gets the path to an item file.
     * @param {String} itemId - The item's jsonId
     * @returns {String}
     * @category Paths
     */
    itemPath (itemId) {
        // Using .json instead of .json.gz for easier debugging
        return `${this.basePath()}/${itemId}.json`;
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

            // Primary manifest corrupt or unreadable - try backup
            console.warn("CLOUDSYNC [SvCloudSyncSource] Primary manifest failed, trying backup:", error.message);
            return await this.asyncFetchManifestBackup();
        }
    }

    /**
     * Fetches the backup manifest. Returns empty manifest if backup also fails.
     * @returns {Promise<Object>}
     * @category Sync
     */
    async asyncFetchManifestBackup () {
        try {
            const ref = this.storageRefForPath(this.manifestBackupPath());
            const url = await ref.getDownloadURL();
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch backup manifest: ${response.status}`);
            }
            console.log("CLOUDSYNC [SvCloudSyncSource] Loaded manifest from backup");
            return await response.json();
        } catch (backupError) {
            console.warn("CLOUDSYNC [SvCloudSyncSource] Backup manifest also unavailable:", backupError.message);
            return this.emptyManifest();
        }
    }

    /**
     * Fetches an item's JSON data from Firebase Storage.
     * @param {String} itemId
     * @returns {Promise<Object>}
     * @category Sync
     */
    async asyncFetchItem (itemId) {
        try {
            const ref = this.storageRefForPath(this.itemPath(itemId));
            const url = await ref.getDownloadURL();
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn("CLOUDSYNC [SvCloudSyncSource] Item not found (404):", itemId);
                    return null;
                }
                throw new Error(`Failed to fetch item ${itemId}: ${response.status}`);
            }
            // Using plain JSON for easier debugging (no compression)
            return await response.json();
        } catch (error) {
            if (error.code === "storage/object-not-found" ||
                (error.message && error.message.includes("404")) ||
                (error.message && error.message.includes("does not exist"))) {
                console.warn("CLOUDSYNC [SvCloudSyncSource] Item not found:", itemId);
                return null;
            }
            throw error;
        }
    }

    /**
     * Uploads an item to Firebase Storage.
     * @param {Object} item - The item node to upload
     * @returns {Promise<void>}
     * @category Sync
     */
    async asyncUploadItem (item) {
        const ref = this.storageRefForPath(this.itemPath(item.jsonId()));
        const json = item.asCloudJson();
        // Using plain JSON for easier debugging (no compression)
        const jsonString = JSON.stringify(json, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

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
            contentType: "application/json",
            customMetadata: customMetadata
        };

        await this.thisClass().asyncRetry(() => ref.put(blob, metadata));
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
        const manifestJson = JSON.stringify(this.manifest(), null, 2);
        const blob = new Blob([manifestJson], { type: "application/json" });

        // Save backup of current manifest before overwriting
        try {
            const backupRef = this.storageRefForPath(this.manifestBackupPath());
            await backupRef.put(blob, { contentType: "application/json" });
        } catch (backupError) {
            // Non-fatal - continue with primary upload
            console.warn("CLOUDSYNC [SvCloudSyncSource] Manifest backup failed:", backupError.message);
        }

        const ref = this.storageRefForPath(this.manifestPath());
        await this.thisClass().asyncRetry(() => ref.put(blob, { contentType: "application/json" }));
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

        // Cascade delete: also delete any sub-collection folder for this item
        await this.asyncDeleteSubFolder(itemId);
    }

    /**
     * Deletes all files in an item's sub-collection folder.
     * @param {String} itemId - The item ID whose subfolder to delete
     * @returns {Promise<void>}
     * @category Storage
     */
    async asyncDeleteSubFolder (itemId) {
        try {
            const subFolderRef = this.storageRefForPath(`${this.basePath()}/${itemId}`);
            const result = await subFolderRef.listAll();

            if (result.items.length === 0 && result.prefixes.length === 0) {
                return; // No subfolder exists
            }

            // Delete all files in the subfolder
            for (const fileRef of result.items) {
                try {
                    await fileRef.delete();
                } catch (e) {
                    console.warn("CLOUDSYNC [SvCloudSyncSource] Failed to delete sub-item:", fileRef.fullPath, e.message);
                }
            }

            // Recursively delete nested subfolders
            for (const prefixRef of result.prefixes) {
                try {
                    const nested = await prefixRef.listAll();
                    for (const nestedFile of nested.items) {
                        await nestedFile.delete();
                    }
                } catch (e) {
                    console.warn("CLOUDSYNC [SvCloudSyncSource] Failed to delete nested folder:", prefixRef.fullPath, e.message);
                }
            }

            console.log("CLOUDSYNC [SvCloudSyncSource] Cascade deleted subfolder for:", itemId);
        } catch (error) {
            if (error.code !== "storage/object-not-found") {
                console.warn("CLOUDSYNC [SvCloudSyncSource] Cascade delete failed for:", itemId, error.message);
            }
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
                // Extract jsonId from filename (e.g., "abc123.json" -> "abc123")
                // Skip manifest file
                if (name.endsWith(".json") && name !== "_manifest.json") {
                    const itemId = name.slice(0, -5); // Remove ".json"
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

    // --- Session Pool Methods (for SubObjectPool cloud sync) ---

    /**
     * Gets the path to a session's pool.json file.
     * @param {String} sessionId - The session ID
     * @returns {String}
     * @category Pool Sync
     */
    sessionPoolPath (sessionId) {
        return `${this.basePath()}/sessions/${sessionId}/pool.json`;
    }

    /**
     * Uploads a session pool JSON to Firebase Storage.
     * @param {String} sessionId - The session ID
     * @param {Object} poolJson - The pool JSON to upload
     * @returns {Promise<void>}
     * @category Pool Sync
     */
    async asyncUploadPoolJson (sessionId, poolJson) {
        const ref = this.storageRefForPath(this.sessionPoolPath(sessionId));
        const jsonString = JSON.stringify(poolJson, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        const metadata = {
            contentType: "application/json",
            customMetadata: {
                type: "session-pool",
                sessionId: sessionId,
                lastModified: String(Date.now())
            }
        };

        await this.thisClass().asyncRetry(() => ref.put(blob, metadata));
    }

    /**
     * Downloads a session pool JSON from Firebase Storage.
     * @param {String} sessionId - The session ID
     * @returns {Promise<Object|null>} The pool JSON or null if not found
     * @category Pool Sync
     */
    async asyncDownloadPoolJson (sessionId) {
        try {
            const ref = this.storageRefForPath(this.sessionPoolPath(sessionId));
            const url = await ref.getDownloadURL();
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch pool: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            if (error.code === "storage/object-not-found" ||
                (error.message && error.message.includes("404")) ||
                (error.message && error.message.includes("does not exist"))) {
                console.log("CLOUDSYNC [SvCloudSyncSource] No pool found for session:", sessionId);
                return null;
            }
            throw error;
        }
    }

    /**
     * Deletes a session pool JSON from Firebase Storage.
     * @param {String} sessionId - The session ID
     * @returns {Promise<void>}
     * @category Pool Sync
     */
    async asyncDeleteSessionPool (sessionId) {
        try {
            const ref = this.storageRefForPath(this.sessionPoolPath(sessionId));
            await ref.delete();
        } catch (error) {
            if (error.code !== "storage/object-not-found") {
                throw error;
            }
        }
    }

    // --- Session Delta Methods (for incremental sync) ---

    /**
     * Gets the path to a session's deltas folder.
     * @param {String} sessionId - The session ID
     * @returns {String}
     * @category Pool Sync
     */
    sessionDeltasFolder (sessionId) {
        return `${this.basePath()}/sessions/${sessionId}/deltas`;
    }

    /**
     * Gets the path to a specific delta file.
     * @param {String} sessionId - The session ID
     * @param {Number} timestamp - The delta timestamp
     * @returns {String}
     * @category Pool Sync
     */
    sessionDeltaPath (sessionId, timestamp) {
        return `${this.sessionDeltasFolder(sessionId)}/${timestamp}.json`;
    }

    /**
     * Uploads a delta JSON file to Firebase Storage.
     * @param {String} sessionId - The session ID
     * @param {Object} delta - The delta object {writes, deletes, timestamp}
     * @returns {Promise<void>}
     * @category Pool Sync
     */
    async asyncUploadDelta (sessionId, delta) {
        const path = this.sessionDeltaPath(sessionId, delta.timestamp);
        const ref = this.storageRefForPath(path);
        const jsonString = JSON.stringify(delta, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });

        const metadata = {
            contentType: "application/json",
            customMetadata: {
                type: "session-delta",
                sessionId: sessionId,
                timestamp: String(delta.timestamp)
            }
        };

        await this.thisClass().asyncRetry(() => ref.put(blob, metadata));
        console.log("CLOUDSYNC [SvCloudSyncSource] Uploaded delta:", delta.timestamp,
            "writes:", Object.keys(delta.writes || {}).length,
            "deletes:", (delta.deletes || []).length);
    }

    /**
     * Downloads all delta files for a session, sorted chronologically.
     * @param {String} sessionId - The session ID
     * @returns {Promise<Array<Object>>} Sorted array of delta objects
     * @category Pool Sync
     */
    async asyncDownloadDeltas (sessionId) {
        const folderRef = this.storageRefForPath(this.sessionDeltasFolder(sessionId));
        let result;

        try {
            result = await folderRef.listAll();
        } catch (error) {
            if (error.code === "storage/object-not-found") {
                return [];
            }
            throw error;
        }

        if (result.items.length === 0) {
            return [];
        }

        console.log("CLOUDSYNC [SvCloudSyncSource] Found", result.items.length, "delta files for session:", sessionId);

        // Sort by filename (timestamp) to ensure chronological order
        const sortedItems = result.items.slice().sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        const deltas = [];
        for (const itemRef of sortedItems) {
            try {
                const url = await itemRef.getDownloadURL();
                const response = await fetch(url);
                if (response.ok) {
                    const delta = await response.json();
                    deltas.push(delta);
                }
            } catch (error) {
                console.warn("CLOUDSYNC [SvCloudSyncSource] Failed to download delta:", itemRef.name, error.message);
            }
        }

        return deltas;
    }

    /**
     * Deletes all delta files for a session.
     * @param {String} sessionId - The session ID
     * @returns {Promise<void>}
     * @category Pool Sync
     */
    async asyncDeleteAllDeltas (sessionId) {
        const folderRef = this.storageRefForPath(this.sessionDeltasFolder(sessionId));
        let result;

        try {
            result = await folderRef.listAll();
        } catch (error) {
            if (error.code === "storage/object-not-found") {
                return;
            }
            throw error;
        }

        if (result.items.length === 0) {
            return;
        }

        console.log("CLOUDSYNC [SvCloudSyncSource] Deleting", result.items.length, "delta files for session:", sessionId);

        for (const itemRef of result.items) {
            try {
                await itemRef.delete();
            } catch (error) {
                if (error.code !== "storage/object-not-found") {
                    console.warn("CLOUDSYNC [SvCloudSyncSource] Failed to delete delta:", itemRef.name, error.message);
                }
            }
        }
    }

    /**
     * Returns the timestamp of the latest delta file for a session.
     * Delta files are named {timestamp}.json, so the latest timestamp
     * can be derived from the filenames without downloading any data.
     * Used by the reader to determine the true lastModified when the
     * manifest may not have been updated on every delta write.
     * @param {String} sessionId - The session ID
     * @returns {Promise<Number>} The latest delta timestamp, or 0 if no deltas
     * @category Pool Sync
     */
    async asyncLatestDeltaTimestamp (sessionId) {
        const folderRef = this.storageRefForPath(this.sessionDeltasFolder(sessionId));

        try {
            const result = await folderRef.listAll();
            if (result.items.length === 0) {
                return 0;
            }

            let latest = 0;
            for (const itemRef of result.items) {
                const timestamp = parseInt(itemRef.name.replace(".json", ""), 10);
                if (!isNaN(timestamp) && timestamp > latest) {
                    latest = timestamp;
                }
            }
            return latest;
        } catch (error) {
            if (error.code === "storage/object-not-found") {
                return 0;
            }
            throw error;
        }
    }

    /**
     * Counts the number of delta files for a session.
     * @param {String} sessionId - The session ID
     * @returns {Promise<Number>} The count of delta files
     * @category Pool Sync
     */
    async asyncCountDeltas (sessionId) {
        const folderRef = this.storageRefForPath(this.sessionDeltasFolder(sessionId));

        try {
            const result = await folderRef.listAll();
            return result.items.length;
        } catch (error) {
            if (error.code === "storage/object-not-found") {
                return 0;
            }
            throw error;
        }
    }

    // --- Lock Management Methods ---

    /**
     * Acquires or refreshes a lock on a session.
     * @param {String} sessionId - The session ID
     * @param {String} clientId - The client ID requesting the lock
     * @returns {Promise<Object>} Result with success boolean and error message if failed
     * @category Lock Management
     */
    async asyncAcquireLock (sessionId, clientId) {
        // This calls the Firebase Function endpoint for lock management
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            return { success: false, error: "Not authenticated" };
        }

        let idToken = await currentUser.getIdToken();
        const baseUrl = UoBuildEnv.functions.url;

        const url = `${baseUrl}api/manifest/acquire-lock`;
        console.log("SvCloudSyncSource: Acquiring lock at:", url);

        let response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
                sessionId: sessionId,
                clientId: clientId
            })
        });

        // If token expired, force-refresh and retry once
        if (response.status === 401) {
            console.log("SvCloudSyncSource: Token expired, refreshing and retrying lock acquire");
            idToken = await currentUser.getIdToken(true);
            response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    clientId: clientId
                })
            });
        }

        // Cache token for use during page unload (releaseLockOnUnload)
        this._cachedIdToken = idToken;

        console.log("SvCloudSyncSource: Lock response status:", response.status);
        const result = await response.json();
        console.log("SvCloudSyncSource: Lock response:", result);
        return result;
    }

    /**
     * Releases a lock on a session.
     * @param {String} sessionId - The session ID
     * @param {String} clientId - The client ID releasing the lock
     * @returns {Promise<Object>} Result with success boolean
     * @category Lock Management
     */
    async asyncReleaseLock (sessionId, clientId) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            return { success: false, error: "Not authenticated" };
        }

        let idToken = await currentUser.getIdToken();
        const baseUrl = UoBuildEnv.functions.url;

        let response = await fetch(`${baseUrl}/api/manifest/release-lock`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${idToken}`
            },
            body: JSON.stringify({
                sessionId: sessionId,
                clientId: clientId
            })
        });

        // If token expired, force-refresh and retry once
        if (response.status === 401) {
            console.log("SvCloudSyncSource: Token expired, refreshing and retrying lock release");
            idToken = await currentUser.getIdToken(true);
            response = await fetch(`${baseUrl}/api/manifest/release-lock`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    clientId: clientId
                })
            });
        }

        const result = await response.json();
        return result;
    }

    /**
     * Releases a lock using a keepalive fetch that survives page unload.
     * Use this in beforeunload handlers where async operations cannot complete.
     * @param {String} sessionId - The session ID
     * @param {String} clientId - The client ID releasing the lock
     * @category Lock Management
     */
    releaseLockOnUnload (sessionId, clientId) {
        const currentUser = firebase.auth().currentUser;
        if (!currentUser) {
            return;
        }

        // Use the cached token - getIdToken() is async and won't complete during unload
        currentUser.getIdToken().then(idToken => {
            // This won't run during unload, but is here for completeness
            this._cachedIdToken = idToken;
        });

        const idToken = this._cachedIdToken;
        if (!idToken) {
            return;
        }

        const baseUrl = UoBuildEnv.functions.url;

        try {
            fetch(`${baseUrl}/api/manifest/release-lock`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    clientId: clientId
                }),
                keepalive: true // Survives page unload
            });
        } catch (e) {
            // Best effort - can't do much during unload
        }
    }

    /**
     * Caches the current auth token for use during page unload.
     * Call this periodically or after token refresh to keep it fresh.
     * @category Lock Management
     */
    async asyncCacheAuthToken () {
        const currentUser = firebase.auth().currentUser;
        if (currentUser) {
            this._cachedIdToken = await currentUser.getIdToken();
        }
    }

}.initThisClass());
