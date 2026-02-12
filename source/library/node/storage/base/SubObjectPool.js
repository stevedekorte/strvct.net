"use strict";

/**
 * @module library.node.storage.base
 */

/**
 * @class SubObjectPool
 * @extends ObjectPool
 * @description
 *
 *      A specialized ObjectPool for cloud sync of session data.
 *      Uses a regular AtomicMap and serializes the complete object graph.
 *      Validates that certain classes (like UoApp, PersistentObjectPool) are not serialized.
 *
 *      Key features:
 *      - Banned class validation during serialization
 *      - Session-based cloud path construction
 *      - Lock management for concurrent access control
 *      - No scheduled store (manual save via asyncSaveToCloud)
 *
 */

(class SubObjectPool extends ObjectPool {

    /**
     * @description Initialize the prototype slots
     * @returns {void}
     */
    initPrototypeSlots () {
        /**
         * @member {Array} bannedClasses
         * @description Array of class type names that cannot be serialized to cloud
         */
        {
            const slot = this.newSlot("bannedClasses", null);
            slot.setSlotType("Array");
            slot.setDescription("Class type names that cannot be serialized");
        }

        /**
         * @member {String} lockClientId
         * @description The client ID holding the lock
         */
        {
            const slot = this.newSlot("lockClientId", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setDescription("Client ID holding the lock");
        }

        /**
         * @member {Number} lockTime
         * @description Timestamp when lock was acquired
         */
        {
            const slot = this.newSlot("lockTime", null);
            slot.setSlotType("Number");
            slot.setAllowsNullValue(true);
            slot.setDescription("Timestamp when lock was acquired");
        }

        /**
         * @member {String} sessionId
         * @description Session ID for cloud path construction
         */
        {
            const slot = this.newSlot("sessionId", null);
            slot.setSlotType("String");
            slot.setAllowsNullValue(true);
            slot.setDescription("Session ID for cloud path construction");
        }

        /**
         * @member {SvCloudSyncSource} cloudSyncSource
         * @description Reference to the cloud sync source for uploads/downloads
         */
        {
            const slot = this.newSlot("cloudSyncSource", null);
            slot.setSlotType("SvCloudSyncSource");
            slot.setAllowsNullValue(true);
            slot.setDescription("Cloud sync source for uploads/downloads");
        }

        /**
         * @member {Object} lastSyncedSnapshot
         * @description Snapshot of kvMap state after last successful cloud upload (puuid -> jsonString)
         */
        {
            const slot = this.newSlot("lastSyncedSnapshot", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
            slot.setDescription("Snapshot of kvMap state after last successful upload");
        }
    }

    initPrototype () {
    }

    /**
     * @description Initialize the SubObjectPool
     * @returns {SubObjectPool}
     */
    init () {
        super.init();
        this.setBannedClasses([
            "UoApp",
            "UoModel",
            "UoServices",
            "PersistentObjectPool",
            "ProxyServers"
        ]);
        return this;
    }

    // --- Override scheduleStore to be a no-op ---

    /**
     * @description Override scheduleStore to be a no-op.
     * SubObjectPool uses manual save via asyncSaveToCloud instead of automatic scheduling.
     * @returns {SubObjectPool}
     */
    scheduleStore () {
        // No-op - SubObjectPool does not auto-schedule stores
        // Use asyncSaveToCloud() for manual saves
        return this;
    }

    // --- Banned class validation ---

    /**
     * @description Check if a class type name is banned from serialization
     * @param {String} typeName - The class type name to check
     * @returns {Boolean}
     */
    isBannedClass (typeName) {
        return this.bannedClasses().includes(typeName);
    }

    /**
     * @description Override jsonStringForObject to validate banned classes
     * @param {Object} obj - The object to serialize
     * @returns {String} JSON string representation
     * @throws {Error} If object's class is banned
     */
    jsonStringForObject (obj) {
        const typeName = obj.svType();
        if (this.isBannedClass(typeName)) {
            throw new Error("SubObjectPool: Cannot serialize banned class '" + typeName + "'");
        }
        return super.jsonStringForObject(obj);
    }

    // --- Initialization from root ---

    /**
     * @description Initialize the pool from a root object.
     * Sets the root and stores all dirty objects.
     * @param {Object} rootObj - The root object to initialize from
     * @returns {SubObjectPool}
     */
    async initializeFromRoot (rootObj) {
        assert(rootObj, "rootObj is required");
        this.kvMap().open();

        // Set the root object - this adds it as active and dirty
        this._rootObject = rootObj;
        this.addActiveObject(rootObj);
        this.addDirtyObject(rootObj);

        // Store all dirty objects (this will recursively store referenced objects)
        await this.kvMap().promiseBegin();
        this.storeDirtyObjects();
        await this.kvMap().promiseCommit();

        return this;
    }

    // --- Close/Cleanup ---

    /**
     * @description Close and cleanup the pool
     * @returns {SubObjectPool}
     */
    close () {
        this.stopLockRefreshTimer();
        super.close();
        this.setCloudSyncSource(null);
        this.setSessionId(null);
        this.setLockClientId(null);
        this.setLockTime(null);
        this.setLastSyncedSnapshot(null);
        return this;
    }

    // --- Delta Tracking Constants ---

    /**
     * @description Threshold ratio of changes to total records above which a full upload is used instead of a delta.
     * @returns {Number}
     */
    static fullUploadThreshold () {
        return 0.5;
    }

    /**
     * @description Maximum number of delta files before compaction triggers.
     * @returns {Number}
     */
    static compactionThreshold () {
        return 20;
    }

    // --- Delta Tracking ---

    /**
     * @description Compares current kvMap state against lastSyncedSnapshot to produce a delta.
     * Returns null if no snapshot exists (full upload needed) or changes exceed threshold.
     * Returns an object with empty writes/deletes if nothing changed.
     * @returns {Object|null} Delta object {writes, deletes, timestamp} or null for full upload
     */
    collectDelta () {
        const snapshot = this.lastSyncedSnapshot();

        // No snapshot means first save or snapshot was cleared - do full upload
        if (!snapshot) {
            console.log("CLOUDSYNC [SubObjectPool] No snapshot - full upload needed");
            return null;
        }

        const writes = {};
        const deletes = [];
        const currentJson = this.asJson();

        // Find writes: keys in current that are new or changed
        const currentKeys = Object.keys(currentJson);
        for (const key of currentKeys) {
            if (!Object.hasOwn(snapshot, key) || snapshot[key] !== currentJson[key]) {
                writes[key] = currentJson[key];
            }
        }

        // Find deletes: keys in snapshot that are no longer in current
        const snapshotKeys = Object.keys(snapshot);
        for (const key of snapshotKeys) {
            if (!Object.hasOwn(currentJson, key)) {
                deletes.push(key);
            }
        }

        const totalChanges = Object.keys(writes).length + deletes.length;

        // If no changes, return empty delta
        if (totalChanges === 0) {
            console.log("CLOUDSYNC [SubObjectPool] No changes detected - skipping upload");
            return { writes: {}, deletes: [], timestamp: Date.now(), isEmpty: true };
        }

        // If changes exceed threshold, prefer full upload
        const totalRecords = currentKeys.length;
        if (totalRecords > 0 && totalChanges / totalRecords > this.thisClass().fullUploadThreshold()) {
            console.log("CLOUDSYNC [SubObjectPool] Changes (" + totalChanges + "/" + totalRecords + ") exceed threshold - full upload");
            return null;
        }

        console.log("CLOUDSYNC [SubObjectPool] Delta collected: " + Object.keys(writes).length + " writes, " + deletes.length + " deletes");

        return {
            writes: writes,
            deletes: deletes,
            timestamp: Date.now()
        };
    }

    /**
     * @description Copies the current kvMap state to lastSyncedSnapshot.
     * @returns {SubObjectPool}
     */
    updateLastSyncedSnapshot () {
        this.setLastSyncedSnapshot(Object.assign({}, this.asJson()));
        return this;
    }

    // --- Cloud Save ---

    /**
     * @async
     * @description Save the pool to cloud storage using delta optimization.
     * Uploads only changes when possible, falls back to full upload when needed.
     * @returns {Promise<Boolean>} True if data was uploaded, false if no changes
     */
    async asyncSaveToCloud () {
        const cloudSource = this.cloudSyncSource();
        const sessionId = this.sessionId();

        assert(cloudSource, "cloudSyncSource is required for asyncSaveToCloud");
        assert(sessionId, "sessionId is required for asyncSaveToCloud");

        // Store any pending dirty objects first
        if (this.hasDirtyObjects()) {
            await this.kvMap().promiseBegin();
            this.storeDirtyObjects();
            await this.kvMap().promiseCommit();
        }

        // Collect delta to determine upload strategy
        const delta = this.collectDelta();

        if (delta === null) {
            // Full upload needed (no snapshot, or changes too large)
            console.log("CLOUDSYNC [SubObjectPool] Performing full upload for session:", sessionId);
            const poolJson = this.asJson();
            await cloudSource.asyncUploadPoolJson(sessionId, poolJson);

            // Clean up any existing deltas since we just did a full snapshot
            await cloudSource.asyncDeleteAllDeltas(sessionId);
        } else if (delta.isEmpty) {
            // No changes - skip upload entirely
            return false;
        } else {
            // Delta upload
            console.log("CLOUDSYNC [SubObjectPool] Performing delta upload for session:", sessionId);
            await cloudSource.asyncUploadDelta(sessionId, delta);

            // Check if compaction is needed
            const deltaCount = await cloudSource.asyncCountDeltas(sessionId);
            if (deltaCount >= this.thisClass().compactionThreshold()) {
                console.log("CLOUDSYNC [SubObjectPool] Delta count (" + deltaCount + ") exceeds threshold, compacting...");
                await this.asyncCompactToCloud();
            }
        }

        // Update snapshot after successful upload
        this.updateLastSyncedSnapshot();
        return true;
    }

    /**
     * @async
     * @description Compacts by uploading full snapshot and deleting all deltas.
     * @returns {Promise<void>}
     */
    async asyncCompactToCloud () {
        const cloudSource = this.cloudSyncSource();
        const sessionId = this.sessionId();

        const poolJson = this.asJson();
        await cloudSource.asyncUploadPoolJson(sessionId, poolJson);
        await cloudSource.asyncDeleteAllDeltas(sessionId);

        console.log("CLOUDSYNC [SubObjectPool] Compaction complete for session:", sessionId);
    }

    // --- Lock Management ---

    /**
     * @description Get the browser client ID (unique per tab)
     * @returns {String}
     */
    static browserClientId () {
        if (typeof sessionStorage !== "undefined") {
            let clientId = sessionStorage.getItem("subObjectPoolClientId");
            if (!clientId) {
                clientId = "client-" + Date.now() + "-" + Math.random().toString(36).substring(2, 15);
                sessionStorage.setItem("subObjectPoolClientId", clientId);
            }
            return clientId;
        }
        // Fallback for non-browser environments
        return "server-" + Date.now();
    }

    /**
     * @async
     * @description Acquire or refresh a lock on the session
     * @returns {Promise<Boolean>} True if lock acquired/refreshed, false otherwise
     */
    async asyncAcquireOrRefreshLock () {
        const cloudSource = this.cloudSyncSource();
        const sessionId = this.sessionId();

        assert(cloudSource, "cloudSyncSource is required for lock management");
        assert(sessionId, "sessionId is required for lock management");

        const clientId = this.thisClass().browserClientId();

        try {
            const result = await cloudSource.asyncAcquireLock(sessionId, clientId);
            if (result.success) {
                this.setLockClientId(clientId);
                this.setLockTime(Date.now());
                this.startLockRefreshTimer();
                console.log("SubObjectPool: Lock acquired for session:", sessionId);
                return true;
            }
            console.error("SubObjectPool: Lock acquisition failed:", result.error || result);
            return false;
        } catch (error) {
            console.error("SubObjectPool: Failed to acquire lock:", error);
            return false;
        }
    }

    /**
     * @async
     * @description Release the lock on the session
     * @returns {Promise<Boolean>} True if lock released, false otherwise
     */
    async asyncReleaseLock () {
        const cloudSource = this.cloudSyncSource();
        const sessionId = this.sessionId();

        if (!cloudSource || !sessionId) {
            return false;
        }

        const clientId = this.lockClientId();
        if (!clientId) {
            return false;
        }

        try {
            this.stopLockRefreshTimer();
            await cloudSource.asyncReleaseLock(sessionId, clientId);
            this.setLockClientId(null);
            this.setLockTime(null);
            return true;
        } catch (error) {
            console.error("SubObjectPool: Failed to release lock:", error);
            return false;
        }
    }

    /**
     * @description Check if lock needs refresh (older than 1 minute)
     * @returns {Boolean}
     */
    lockNeedsRefresh () {
        const lockTime = this.lockTime();
        if (!lockTime) {
            return true;
        }
        const elapsed = Date.now() - lockTime;
        return elapsed > 60000; // 1 minute
    }

    // --- Lock Refresh Timer ---

    /**
     * @description Starts a periodic timer to refresh the lock before TTL expires.
     * Should be called after a lock is acquired.
     * @returns {SubObjectPool}
     */
    startLockRefreshTimer () {
        this.stopLockRefreshTimer();

        this._lockRefreshTimerId = setInterval(() => {
            if (this.hasLock() && this.lockNeedsRefresh()) {
                console.log("SubObjectPool: Auto-refreshing lock for session:", this.sessionId());
                this.asyncAcquireOrRefreshLock().catch(error => {
                    console.error("SubObjectPool: Lock auto-refresh failed:", error);
                });
            }
        }, 60000); // Check every 60 seconds

        return this;
    }

    /**
     * @description Stops the lock refresh timer.
     * @returns {SubObjectPool}
     */
    stopLockRefreshTimer () {
        if (this._lockRefreshTimerId) {
            clearInterval(this._lockRefreshTimerId);
            this._lockRefreshTimerId = null;
        }
        return this;
    }

    /**
     * @description Check if we currently hold the lock
     * @returns {Boolean}
     */
    hasLock () {
        return this.lockClientId() === this.thisClass().browserClientId();
    }


}.initThisClass());
