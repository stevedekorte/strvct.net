"use strict";

/**
 * @module library.node.json
 * @class SvSyncableJsonGroup
 * @extends JsonGroup
 * @classdesc A SvJsonGroup that supports cloud syncing and lazy loading.
 * Adds fetch state management, sync timestamps, and content source references.
 *
 * IMPORTANT: Only ROOT objects of documents that are synced to cloud should inherit
 * from this class (e.g., UoHostSession, UoCharacter). Child objects within those
 * documents should inherit from SvJsonGroup instead. The sync timestamps and dirty
 * tracking are managed at the document root level, not on every child object.
 *
 * Child objects can check if an ancestor is syncing via isAnySyncingFromCloud(),
 * which walks up the parent chain to find the root's isSyncingFromCloud flag.
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
     * Sets both timestamps to the same value so `needsCloudSync()`
     * (defined as `local > cloud`) reports false right after a sync.
     *
     * Suppresses the `touchLocalModified()` re-entry that would
     * otherwise fire from `didUpdateNode` when these slot setters
     * run — without the suppression, every successful save would
     * leave the model permanently dirty (driving the "Leave site?"
     * prompt loop and continuous auto-save thrashing).
     *
     * @param {Number} [timestamp=Date.now()] - The sync timestamp
     * @returns {SvSyncableJsonGroup} This instance
     * @category Sync
     */
    didSyncToCloud (timestamp = Date.now()) {
        this._suppressLocalModifiedTouch = true;
        try {
            this.setCloudLastModified(timestamp);
            this.setLocalLastModified(timestamp);
        } finally {
            this._suppressLocalModifiedTouch = false;
        }
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
        // Backend timestamp shapes vary (Firestore Timestamp, Date, millis) —
        // SvFsNode.lastModified is deliberately untyped — but these stamps are
        // Number slots. A raw Timestamp object failed slot validation and
        // nulled BOTH stamps on every manifest placeholder (prod 2026-07-10),
        // so normalize here, the single choke point for all callers.
        if (cloudTimestamp && typeof cloudTimestamp !== "number") {
            if (typeof cloudTimestamp.toMillis === "function") {
                cloudTimestamp = cloudTimestamp.toMillis();
            } else if (typeof cloudTimestamp.getTime === "function") {
                cloudTimestamp = cloudTimestamp.getTime();
            }
        }
        this._suppressLocalModifiedTouch = true;
        try {
            this.setCloudLastModified(cloudTimestamp);
            this.setLocalLastModified(cloudTimestamp);
        } finally {
            this._suppressLocalModifiedTouch = false;
        }
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

        const fetchStartTime = Date.now();

        this._fetchPromise = (async () => {
            try {
                const json = await source.asyncFetchItem(this.jsonId());

                // Check if local modifications occurred during the async fetch
                const localMod = this.localLastModified();
                if (localMod && localMod > fetchStartTime) {
                    // Local wins - user edited while fetch was in flight
                    this.isDebugging() && console.log("CLOUDSYNC [SvSyncableJsonGroup] Local modifications during fetch, skipping cloud data for:", this.svTypeId());
                    this.setFetchState("fetched");
                    return this;
                }

                if (json) {
                    this.setCloudJson(json);
                }
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
     * Note: During sync FROM cloud, didSyncFromCloud() is called AFTER deserialization,
     * which sets both timestamps equal, clearing any dirty state.
     * @returns {Boolean} Whether the notification was posted
     * @category Sync
     */
    didUpdateNode () {
        // Only mark as locally modified if we're a fully fetched item
        // (not unfetched stub or currently fetching). Skip the touch
        // when a `didSyncToCloud` / `didSyncFromCloud` is in progress
        // — those align the timestamps deliberately and shouldn't be
        // immediately re-dirtied by their own slot setters.
        if (this.isFetched() && !this._suppressLocalModifiedTouch) {
            if (SvObjectPool.isAnyPoolStoring()) {
                // Invariant: a didUpdateNode arriving during a store pass is a
                // side effect of recordForStore reading this subtree's getters,
                // not a real model change. touchLocalModified() writes the
                // STORED localLastModified slot, which would re-dirty this
                // object mid-pass and trip the pool's double-store guard. Skip
                // the touch; the warn's stack identifies the culprit getter.
                SvObjectPool.warnStorePassMutation(this);
            } else {
                this.touchLocalModified();
            }
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


    // --- Cloud JSON Serialization ---

    // HELPER METHODS

    asCloudJson () {
        return this.serializeToJson("Cloud", []);
    }

    setCloudJson (json) {
        this.deserializeFromJson(json, "Cloud", []);
        this.assertCloudJson(json);
        return this;
    }

    assertCloudJson (json) {
        // verify that the cloud json matches the json and show a diff and throw an error if they don't match
        let cloudJson = this.asCloudJson();
        const s1 = JSON.stableStringify(json);
        const s2 = JSON.stableStringify(cloudJson);
        if (s1 !== s2) {
            console.error("assertCloudJson failed");
            const diff = SvGlobals.get("jsondiffpatch").diff(json, cloudJson);
            const diffString = JSON.stringify(diff, null, 2);
            console.log("diff: " + diffString);
            throw new Error("assertCloudJson failed: " + diffString);
        }
        return this;
    }

}.initThisClass());
