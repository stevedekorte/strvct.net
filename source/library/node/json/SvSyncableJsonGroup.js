"use strict";

/**
 * @module library.node.json
 * @class SvSyncableJsonGroup
 * @extends JsonGroup
 * @classdesc A SvJsonGroup that supports cloud syncing and lazy loading.
 * Adds fetch state management, sync timestamps, and content source references.
 */
(class SvSyncableJsonGroup extends SvJsonGroup {

    initPrototypeSlots () {
        // --- Lazy Fetching Support ---

        {
            /**
             * @member {String} fetchState
             * @description State of content fetching from remote source.
             * Values: "unfetched" | "fetching" | "fetched" | "fetchError"
             * Default is "fetched" for existing objects that don't use lazy loading.
             * @category Fetching
             */
            const slot = this.newSlot("fetchState", "fetched");
            slot.setSlotType("String");
            slot.setShouldStoreSlot(true);
            slot.setSyncsToView(true);
            slot.setIsInJsonSchema(false);
        }

        {
            /**
             * @member {SvSyncCollectionSource} contentSource
             * @description Reference to the sync source that can fetch this node's content.
             * @category Fetching
             */
            const slot = this.newSlot("contentSource", null);
            slot.setSlotType("SvSyncCollectionSource");
            slot.setShouldStoreSlot(false);
        }

        // --- Cloud Sync Timestamps ---

        {
            /**
             * @member {Number} cloudLastModified
             * @description Timestamp (ms since epoch) when this item was last synced FROM cloud.
             * Used to compare with manifest to determine if cloud has newer data.
             * @category Sync
             */
            const slot = this.newSlot("cloudLastModified", null);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setAllowsNullValue(true);
            slot.setIsInJsonSchema(false);
        }

        {
            /**
             * @member {Number} localLastModified
             * @description Timestamp (ms since epoch) when this item was last modified locally.
             * Used to determine if local changes need to be pushed to cloud.
             * @category Sync
             */
            const slot = this.newSlot("localLastModified", null);
            slot.setSlotType("Number");
            slot.setShouldStoreSlot(true);
            slot.setAllowsNullValue(true);
            slot.setIsInJsonSchema(false);
        }
    }

    // --- Fetch State Helpers ---

    /**
     * @description Checks if content has been fetched.
     * @returns {Boolean}
     * @category Fetching
     */
    isFetched () {
        return this.fetchState() === "fetched";
    }

    /**
     * @description Checks if content has not been fetched yet.
     * @returns {Boolean}
     * @category Fetching
     */
    isUnfetched () {
        return this.fetchState() === "unfetched";
    }

    /**
     * @description Checks if content is currently being fetched.
     * @returns {Boolean}
     * @category Fetching
     */
    isFetching () {
        return this.fetchState() === "fetching";
    }

    /**
     * @description Checks if fetching resulted in an error.
     * @returns {Boolean}
     * @category Fetching
     */
    hasFetchError () {
        return this.fetchState() === "fetchError";
    }

    // --- Cloud Sync Helpers ---

    /**
     * @description Checks if local changes need to be pushed to cloud.
     * @returns {Boolean} True if localLastModified > cloudLastModified
     * @category Sync
     */
    needsCloudSync () {
        const local = this.localLastModified();
        const cloud = this.cloudLastModified();
        if (!cloud) {
            return true; // Not in cloud = needs sync
        }
        if (!local) {
            return false; // In cloud, but not locally modified
        }
        return local > cloud;
    }

    /**
     * @description Checks if this item exists in the cloud.
     * @returns {Boolean} True if cloudLastModified is set
     * @category Sync
     */
    existsInCloud () {
        return this.cloudLastModified() !== null;
    }

    /**
     * @description Marks the item as locally modified. Call when content changes.
     * @returns {SvSyncableJsonGroup} This instance
     * @category Sync
     */
    touchLocalModified () {
        this.setLocalLastModified(Date.now());
        return this;
    }

    /**
     * @description Called after successfully syncing TO the cloud.
     * @param {Number} [timestamp=Date.now()] - The sync timestamp
     * @returns {SvSyncableJsonGroup} This instance
     * @category Sync
     */
    didSyncToCloud (timestamp = Date.now()) {
        this.setCloudLastModified(timestamp);
        return this;
    }

    /**
     * @description Called after successfully syncing FROM the cloud.
     * Sets both timestamps to indicate local and cloud are in sync.
     * @param {Number} cloudTimestamp - The cloud's lastModified timestamp
     * @returns {SvSyncableJsonGroup} This instance
     * @category Sync
     */
    didSyncFromCloud (cloudTimestamp) {
        this.setCloudLastModified(cloudTimestamp);
        this.setLocalLastModified(cloudTimestamp);
        return this;
    }

    /**
     * @description Returns metadata for cloud storage.
     * Subclasses can override to include additional metadata.
     * @returns {Object} Metadata object with title, subtitle, type, lastModified
     * @category Sync
     */
    cloudMetadata () {
        return {
            type: this.svType(),
            title: this.title ? this.title() : this.jsonId(),
            subtitle: this.subtitle ? this.subtitle() : "",
            lastModified: Date.now()
        };
    }

    // --- Cloud JSON Serialization ---
    // Note: asCloudJson() is inherited from JsonGroup.
    // Filtering happens at the value level - each object's asCloudJson() decides what to include.

    /**
     * @description Sets state from cloud JSON data.
     * By default, calls setJson(). Subclasses can override to customize
     * how cloud data is applied (e.g., merge instead of replace).
     * @param {Object} json - The JSON data from cloud
     * @returns {SvSyncableJsonGroup} This instance
     * @category Sync
     */
    setCloudJson (json) {
        this.setJson(json);
        return this;
    }

    /**
     * @description Ensures content is fetched. If already fetched, returns immediately.
     * If unfetched, triggers fetch from contentSource.
     * @returns {Promise<SvSyncableJsonGroup>} This node after fetching completes
     * @category Fetching
     */
    async asyncEnsureFetched () {
        if (this.isFetched()) {
            return this;
        }

        if (this.isFetching()) {
            // Already fetching - wait for the existing promise
            return this._fetchPromise;
        }

        const source = this.contentSource();
        if (!source) {
            throw new Error("Cannot fetch: no contentSource set on " + this.svTypeId());
        }

        this.setFetchState("fetching");

        this._fetchPromise = (async () => {
            try {
                const json = await source.asyncFetchItem(this.jsonId());
                this.setCloudJson(json);
                this.setFetchState("fetched");
                // Notify that we synced from cloud
                if (this.didSyncFromCloud) {
                    const timestamp = this.cloudLastModified() || Date.now();
                    this.didSyncFromCloud(timestamp);
                }
                return this;
            } catch (error) {
                this.setFetchState("fetchError");
                console.error("Failed to fetch content for " + this.svTypeId() + ": " + error.message);
                debugger;

                // Handle incompatible cloud data format - notify user and delete cloud item
                if (source.handleCloudItemError) {
                    await source.handleCloudItemError(this.jsonId(), error);
                }
                throw error;
            }
        })();

        return this._fetchPromise;
    }

    /**
     * @description Called when this node is about to be accessed (e.g., opened in UI).
     * Triggers async fetch if content is unfetched.
     * @category Fetching
     */
    prepareToAccess () {
        super.prepareToAccess();
        // Trigger fetch if unfetched (fire-and-forget, view will update when done)
        if (this.isUnfetched() && this.contentSource()) {
            this.asyncEnsureFetched().catch(e => {
                console.error("Failed to fetch on access:", e.message);
            });
        }
    }

    // --- Mutation Tracking ---

    /**
     * @description Called when the node or any descendant changes.
     * Marks this item for cloud sync if it's been fetched.
     * @returns {Boolean} Whether the notification was posted
     * @category Sync
     */
    didUpdateNode () {
        // Only mark as locally modified if we're a fully fetched item
        // Don't track during fetch (would interfere with fetch completion check)
        // Don't track on unfetched stubs
        if (this.isFetched()) {
            this.touchLocalModified();
        }
        return super.didUpdateNode();
    }

    // --- Subtitle Override for Fetch State ---

    /**
     * @description Gets the subtitle, appending fetch state indicator when fetching.
     * @returns {String} The subtitle
     * @category Display
     */
    subtitle () {
        let result = super.subtitle() ?? "";
        if (this.isFetching()) {
            result += " (fetching)";
        }
        return result;
    }

}.initThisClass());
