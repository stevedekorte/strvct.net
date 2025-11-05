/**
 * @module library.node.storage.base
 */

"use strict";

/**
 * @class SvBlobPool
 * @extends ProtoClass
 * @classdesc Global singleton for content-addressable blob storage.
 * Provides efficient storage and retrieval of binary data using SHA-256 hashing.
 * Completely independent of ObjectPool - objects store blob references (hashes),
 * and SvBlobPool manages the actual blob data.
 *
 * Features:
 * - Content-addressable storage (automatic deduplication)
 * - Metadata storage (contentType, size, timestamps, custom metadata)
 * - Weak reference cache for active blobs
 * - Async operations (does not affect ObjectPool synchronicity)
 * - Works with both IndexedDB (browser) and LevelDB (Node.js)
 * - Backward compatible with old ArrayBuffer-only storage format
 *
 * Storage Format:
 * - Data key: {hash} → ArrayBuffer
 * - Metadata key: {hash}/meta → JSON string with { contentType, size, timeCreated, customMetadata }
 * - Old format (plain ArrayBuffer at {hash}) is detected and handled transparently
 *
 * Caching Strategy:
 * - activeBlobs cache stores Blob objects using weak references
 * - Blob.asyncToArrayBuffer() caches the extracted ArrayBuffer in blob._cachedArrayBuffer
 * - This ensures the same ArrayBuffer instance is returned on repeated calls
 * - When a Blob is garbage collected, its cached ArrayBuffer is collected with it
 *
 * @example
 * // Store a blob with custom metadata
 * const hash = await SvBlobPool.shared().asyncStoreBlob(blob, { author: "user123" });
 *
 * // Retrieve a blob
 * const blob = await SvBlobPool.shared().asyncGetBlob(hash);
 *
 * // Get just the metadata
 * const metadata = await SvBlobPool.shared().asyncGetMetadata(hash);
 *
 * // Direct ArrayBuffer access with content type
 * const hash = await SvBlobPool.shared().asyncStoreArrayBuffer(arrayBuffer, "image/png");
 * const arrayBuffer = await SvBlobPool.shared().asyncGetArrayBuffer(hash);
 *
 * // Check existence
 * const exists = await SvBlobPool.shared().asyncHasBlob(hash);
 */
(class SvBlobPool extends ProtoClass {

    /**
     * @description Initialize class as singleton
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }

    /**
     * @description Initialize prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        {
            /**
             * @member {SvIndexedDbFolder} idb
             * @category Storage
             */
            const slot = this.newSlot("idb", null);
            slot.setSlotType("SvIndexedDbFolder");
        }
        {
            /**
             * @member {EnumerableWeakMap} activeBlobs
             * @category Cache
             * @description Blobs known to the pool (previously loaded or referenced).
             * Maps hash keys to Blob objects. When ArrayBuffers are stored or retrieved,
             * they are converted to/from Blobs for caching.
             */
            const slot = this.newSlot("activeBlobs", null);
            slot.setSlotType("EnumerableWeakMap");
        }
        {
            /**
             * @member {Boolean} isOpen
             * @category State
             * @description Whether the blob pool is open and ready
             */
            const slot = this.newSlot("isOpen", false);
            slot.setSlotType("Boolean");
        }
    }

    /**
     * @description Initialize the instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setIdb(SvIndexedDbFolder.clone());
        this.setActiveBlobs(EnumerableWeakMap.clone());
        this.setIsDebugging(false);
    }

    // --- Open/Close ---

    /**
     * @description Open the blob pool database
     * @async
     * @returns {Promise<void>}
     * @category Lifecycle
     */
    async asyncOpen () {
        if (this.isOpen()) {
            return;
        }

        this.logDebug("Opening SvBlobPool");
        this.idb().setPath("sharedBlobPool");
        await this.idb().promiseOpen();
        this.setIsOpen(true);
        this.logDebug("SvBlobPool opened successfully");
    }

    /**
     * @description Close the blob pool database
     * @async
     * @returns {Promise<void>}
     * @category Lifecycle
     */
    async close () {
        if (!this.isOpen()) {
            return;
        }

        this.logDebug("Closing SvBlobPool");
        await this.idb().close();
        this.activeBlobs().clear();
        this.setIsOpen(false);
        this.logDebug("SvBlobPool closed");
    }

    /**
     * @description Assert that the pool is open
     * @private
     * @category Validation
     */
    assertOpen () {
        assert(this.isOpen(), "SvBlobPool is not open - call asyncOpen() first");
    }

    // --- Hash Computation ---

    /**
     * @description Compute SHA-256 hash for an ArrayBuffer
     * @async
     * @param {ArrayBuffer} arrayBuffer - The data to hash
     * @returns {Promise<string>} - Hex-encoded hash string
     * @category Hashing
     */
    async hashForArrayBuffer (arrayBuffer) {
        assert(arrayBuffer instanceof ArrayBuffer, "Must be ArrayBuffer");

        const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
        return hashHex;
    }

    // --- Key Management ---

    /**
     * @description Get the metadata key for a given blob hash
     * @param {string} hash - The blob hash
     * @returns {string} - The metadata key
     * @category Keys
     * @private
     */
    metadataKeyForHash (hash) {
        return hash + "/meta";
    }

    /**
     * @description Check if a key is a metadata key
     * @param {string} key - The key to check
     * @returns {boolean} - True if it's a metadata key
     * @category Keys
     * @private
     */
    isMetadataKey (key) {
        return key.endsWith("/meta");
    }

    /**
     * @description Extract the hash from a metadata key
     * @param {string} metaKey - The metadata key
     * @returns {string} - The blob hash
     * @category Keys
     * @private
     */
    hashFromMetadataKey (metaKey) {
        return metaKey.slice(0, -5); // Remove "/meta" suffix
    }

    // --- Storage Operations ---

    /**
     * @description Store a blob and return its content hash.
     * If the blob already exists (same hash), it won't be stored again (deduplication).
     * @async
     * @param {Blob} blob - The blob to store
     * @param {Object} customMetadata - Optional custom metadata to store with the blob
     * @returns {Promise<string>} - The content hash
     * @category Storage
     */
    async asyncStoreBlob (blob, customMetadata = {}) {
        this.assertOpen();
        assert(Type.isBlob(blob), "Must be a Blob");

        // Convert Blob to ArrayBuffer for storage
        const arrayBuffer = await blob.asyncToArrayBuffer();

        // Compute hash (used directly as storage key)
        const hash = await this.hashForArrayBuffer(arrayBuffer);

        this.logDebug(() => `Storing blob with hash ${hash.substring(0, 8)}... (${arrayBuffer.byteLength} bytes)`);

        // Check if already stored (deduplication)
        if (await this.idb().promiseHasKey(hash)) {
            this.logDebug(() => `Blob ${hash.substring(0, 8)}... already exists (deduplicated)`);
            // Cache the blob for future access
            this.activeBlobs().set(hash, blob);
            return hash;
        }

        // Create metadata
        const metadata = {
            contentType: blob.type || "application/octet-stream",
            size: arrayBuffer.byteLength,
            timeCreated: new Date().toISOString(),
            customMetadata: customMetadata
        };

        // Store ArrayBuffer at hash key
        await this.idb().promiseAtPut(hash, arrayBuffer);

        // Store metadata at hash:meta key (as JSON string)
        const metaKey = this.metadataKeyForHash(hash);
        await this.idb().promiseAtPut(metaKey, JSON.stringify(metadata));

        // Cache the blob for future access
        this.activeBlobs().set(hash, blob);

        this.logDebug(() => `Blob ${hash.substring(0, 8)}... stored successfully with metadata`);

        return hash;
    }

    /**
     * @description Retrieve a blob by its content hash.
     * @async
     * @param {string} hash - The content hash
     * @returns {Promise<Blob|null>} - The blob, or null if not found
     * @category Storage
     */
    async asyncGetBlob (hash) {
        this.assertOpen();
        assert(typeof hash === "string", "Hash must be a string");

        this.logDebug(() => `Getting blob ${hash.substring(0, 8)}...`);

        // Check cache first
        const cachedBlob = this.getCachedBlob(hash);
        if (cachedBlob) {
            this.logDebug(() => `Blob ${hash.substring(0, 8)}... found in activeBlobs`);
            return cachedBlob;
        }

        // Load ArrayBuffer from database
        const arrayBuffer = await this.idb().promiseAt(hash);

        if (!arrayBuffer) {
            this.logDebug(() => `Blob ${hash.substring(0, 8)}... not found`);
            return null;
        }

        // ArrayBuffer should always be an ArrayBuffer in the new format
        if (!(arrayBuffer instanceof ArrayBuffer)) {
            this.logDebug(() => `Blob ${hash.substring(0, 8)}... has invalid format (not ArrayBuffer)`);
            return null;
        }

        // Try to load metadata
        let contentType = "application/octet-stream";
        const metaKey = this.metadataKeyForHash(hash);
        const metadataJson = await this.idb().promiseAt(metaKey);

        if (metadataJson) {
            try {
                const metadata = JSON.parse(metadataJson);
                contentType = metadata.contentType || contentType;
                this.logDebug(() => `Blob ${hash.substring(0, 8)}... loaded with metadata (${arrayBuffer.byteLength} bytes, ${contentType})`);
            } catch (parseError) {
                this.logDebug(() => `Blob ${hash.substring(0, 8)}... metadata parse error: ${parseError.message}, using defaults`);
            }
        } else {
            this.logDebug(() => `Blob ${hash.substring(0, 8)}... loaded without metadata (${arrayBuffer.byteLength} bytes)`);
        }

        // Convert ArrayBuffer to Blob and cache it
        const blob = new Blob([arrayBuffer], { type: contentType });
        this.activeBlobs().set(hash, blob);
        return blob;
    }

    /**
     * @description Check if a blob exists in storage.
     * @async
     * @param {string} hash - The content hash
     * @returns {Promise<boolean>} - True if the blob exists
     * @category Storage
     */
    async asyncHasBlob (hash) {
        this.assertOpen();
        assert(typeof hash === "string", "Hash must be a string");

        // Check cache first (fast path)
        if (this.getCachedBlob(hash)) {
            return true;
        }

        // Check database (hash is used directly as key)
        return await this.idb().promiseHasKey(hash);
    }

    /**
     * @description Get metadata for a blob without loading its data.
     * @async
     * @param {string} hash - The content hash
     * @returns {Promise<Object|null>} - The metadata object, or null if not found
     * @category Information
     */
    async asyncGetMetadata (hash) {
        this.assertOpen();
        assert(typeof hash === "string", "Hash must be a string");

        // Try to load metadata from hash:meta key
        const metaKey = this.metadataKeyForHash(hash);
        const metadataJson = await this.idb().promiseAt(metaKey);

        if (metadataJson) {
            try {
                return JSON.parse(metadataJson);
            } catch (parseError) {
                this.logDebug(() => `Metadata parse error for ${hash.substring(0, 8)}...: ${parseError.message}`);
                return null;
            }
        }

        // If no metadata found, check if the data exists and generate basic metadata
        const arrayBuffer = await this.idb().promiseAt(hash);
        if (arrayBuffer instanceof ArrayBuffer) {
            // Old format or missing metadata: generate basic metadata
            return {
                contentType: "application/octet-stream",
                size: arrayBuffer.byteLength,
                timeCreated: null, // Unknown
                customMetadata: {}
            };
        }

        return null;
    }

    /**
     * @description Remove a blob from storage.
     * WARNING: Only call this if you're sure no objects reference this blob!
     * @async
     * @param {string} hash - The content hash
     * @returns {Promise<void>}
     * @category Storage
     */
    async asyncRemoveBlob (hash) {
        this.assertOpen();
        assert(typeof hash === "string", "Hash must be a string");

        this.logDebug(() => `Removing blob ${hash.substring(0, 8)}...`);

        // Remove from activeBlobs cache
        this.activeBlobs().delete(hash);

        // Remove blob data
        await this.idb().promiseRemoveAt(hash);

        // Remove metadata (if it exists)
        const metaKey = this.metadataKeyForHash(hash);
        await this.idb().promiseRemoveAt(metaKey);

        this.logDebug(() => `Blob ${hash.substring(0, 8)}... removed`);
    }

    // --- ArrayBuffer Helper Methods ---

    /**
     * @description Store an ArrayBuffer directly and return its content hash.
     * Helper method for low-level access when you already have an ArrayBuffer.
     * @async
     * @param {ArrayBuffer} arrayBuffer - The data to store
     * @param {string} contentType - MIME type (default: "application/octet-stream")
     * @param {Object} customMetadata - Optional custom metadata
     * @returns {Promise<string>} - The content hash
     * @category Storage
     */
    async asyncStoreArrayBuffer (arrayBuffer, contentType = "application/octet-stream", customMetadata = {}) {
        this.assertOpen();
        assert(arrayBuffer instanceof ArrayBuffer, "Must be ArrayBuffer");

        // Compute hash (used directly as storage key)
        const hash = await this.hashForArrayBuffer(arrayBuffer);

        this.logDebug(() => `Storing ArrayBuffer with hash ${hash.substring(0, 8)}... (${arrayBuffer.byteLength} bytes)`);

        // Check if already stored (deduplication)
        if (await this.idb().promiseHasKey(hash)) {
            this.logDebug(() => `ArrayBuffer ${hash.substring(0, 8)}... already exists (deduplicated)`);
            // Convert to Blob and cache for future access
            const blob = new Blob([arrayBuffer], { type: contentType });
            this.activeBlobs().set(hash, blob);
            return hash;
        }

        // Create metadata
        const metadata = {
            contentType: contentType,
            size: arrayBuffer.byteLength,
            timeCreated: new Date().toISOString(),
            customMetadata: customMetadata
        };

        // Store ArrayBuffer at hash key
        await this.idb().promiseAtPut(hash, arrayBuffer);

        // Store metadata at hash:meta key (as JSON string)
        const metaKey = this.metadataKeyForHash(hash);
        await this.idb().promiseAtPut(metaKey, JSON.stringify(metadata));

        // Convert to Blob and cache for future access
        const blob = new Blob([arrayBuffer], { type: contentType });
        this.activeBlobs().set(hash, blob);

        this.logDebug(() => `ArrayBuffer ${hash.substring(0, 8)}... stored successfully with metadata`);

        return hash;
    }

    /**
     * @description Retrieve an ArrayBuffer directly by its content hash.
     * Helper method for low-level access when you need the raw ArrayBuffer.
     * @async
     * @param {string} hash - The content hash
     * @returns {Promise<ArrayBuffer|null>} - The ArrayBuffer, or null if not found
     * @category Storage
     */
    async asyncGetArrayBuffer (hash) {
        this.assertOpen();
        assert(typeof hash === "string", "Hash must be a string");

        this.logDebug(() => `Getting ArrayBuffer ${hash.substring(0, 8)}...`);

        // Get the blob (which handles caching)
        const blob = await this.asyncGetBlob(hash);

        if (blob) {
            // Extract ArrayBuffer from blob (blob caches this internally)
            return await blob.asyncToArrayBuffer();
        }

        return null;
    }

    // --- Active Blobs Management ---

    /**
     * @description Get a cached Blob by hash
     * @param {string} hash - The content hash
     * @returns {Blob|null} - The cached Blob, or null if not in cache
     * @category Cache
     * @private
     */
    getCachedBlob (hash) {
        if (this.activeBlobs().has(hash)) {
            return this.activeBlobs().get(hash);
        }
        return null;
    }

    /**
     * @description Clear all active blobs from memory
     * @category Cache
     */
    clearActiveBlobs () {
        this.activeBlobs().clear();
        this.logDebug("Active blobs cleared");
    }

    // --- Garbage Collection ---

    /**
     * @description Remove blobs that are not referenced by the given set of hashes.
     * This is typically called during garbage collection to clean up orphaned blobs.
     * @async
     * @param {Set<string>} referencedHashesSet - Set of hashes that are currently in use
     * @returns {Promise<number>} - Number of blobs removed
     * @category Garbage Collection
     */
    async asyncCollectUnreferencedKeySet (referencedHashesSet) {
        this.assertOpen();
        assert(referencedHashesSet instanceof Set, "referencedHashesSet must be a Set");

        this.logDebug(`Collecting unreferenced blobs (${referencedHashesSet.size} referenced)`);

        const allHashes = await this.idb().promiseAllKeys();
        let removedCount = 0;

        for (const hash of allHashes) {
            if (!referencedHashesSet.has(hash)) {
                await this.asyncRemoveBlob(hash);
                removedCount++;
            }
        }

        this.logDebug(`Collected ${removedCount} unreferenced blobs`);

        return removedCount;
    }

    /**
     * @description Get all blob hashes currently in storage
     * @async
     * @returns {Promise<string[]>} - Array of all blob hashes (excludes metadata keys)
     * @category Information
     */
    async asyncAllHashes () {
        this.assertOpen();

        const allKeys = await this.idb().promiseAllKeys();
        // Filter out metadata keys - only return blob hashes
        return allKeys.filter(key => !this.isMetadataKey(key));
    }

    /**
     * @description Get the total number of blobs in storage
     * @async
     * @returns {Promise<number>} - Count of blobs (excludes metadata entries)
     * @category Information
     */
    async asyncCount () {
        this.assertOpen();

        const allKeys = await this.idb().promiseAllKeys();
        // Count only blob keys, not metadata keys
        return allKeys.filter(key => !this.isMetadataKey(key)).length;
    }

    /**
     * @description Clear all blobs from storage
     * WARNING: This will delete all blob data!
     * @async
     * @returns {Promise<void>}
     * @category Maintenance
     */
    async asyncClear () {
        this.assertOpen();

        this.logDebug("Clearing all blobs from storage");
        await this.idb().promiseClear();
        this.clearActiveBlobs();
        this.logDebug("All blobs cleared");
    }

}.initThisClass());
