"use strict";

/** * @module library.node.blobs
 */

/**
 * @class SvCloudBlobNode
 * @extends SvBlobNode
 * @classdesc SvCloudBlobNode extends SvBlobNode to handle storing blobs in Google Cloud Storage.
 */

(class SvCloudBlobNode extends SvBlobNode {

    /**
     * Initializes the prototype slots for the SvBlobNode class.
     */
    initPrototypeSlots () {

        // hasInCloud- set to yes if:
        // - we downloaded it from cloud storage or
        // - successfully pushed it to cloud storage
        // NOTE:
        // - it may be in cloud even if set to false (e.g. uploaded elsewhere)
        // - it may not be in cloud even if set to true (e.g. deleted elsewhere)
        {
            const slot = this.newSlot("hasInCloud", false);
            slot.setLabel("Has In Cloud");
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
        }

        // download url (may be private or public)
        {
            const slot = this.newSlot("downloadUrl", null); // should normally call asyncDownloadUrl() to get it
            slot.setIsInJsonSchema(false);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setIsSubnodeField(true);
            slot.setDescription("Download URL of the blob");
        }

        /// push to cloud action
        {
            const slot = this.newSlot("pushToCloudAction", null);
            slot.setLabel("Push to Cloud");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncPushToCloud");
        }

        // so multiple calls to push to cloud don't result in multiple promises
        {
            const slot = this.newSlot("pushToCloudPromise", null);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Promise");
            slot.setIsSubnodeField(false);
        }

        /// pull from cloud action
        {
            const slot = this.newSlot("pullFromCloudAction", null);
            slot.setLabel("Pull from Cloud");
            slot.setShouldStoreSlot(false);
            slot.setSyncsToView(true);
            slot.setSlotType("Action");
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncForcePullFromCloudByHash");
        }

        // auto-sync to cloud after local storage
        {
            const slot = this.newSlot("doesAutoSyncToCloud", false);
            slot.setLabel("Auto Sync to Cloud");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("Boolean");
            slot.setIsSubnodeField(true);
        }
    }

    /**
     * Initializes the prototype for the SvBlobNode class.
     */
    initPrototype () {
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setCanDelete(true);
    }

    clear () {
        super.clear();
        this.setHasInCloud(false);
        this.setDownloadUrl(null);
        return this;
    }

    hasPublicUrl () {
        return this.downloadUrl() !== null;
    }

    hasBlobValue () {
        return this.blobValue() !== null;
    }

    /**
     * @description Checks if the blob is available without downloading it.
     * Checks in-memory, local IndexedDB, and cloud storage existence.
     * @returns {Promise<boolean>}
     * @category Availability
     */
    async asyncHasBlob () {
        if (this.blobValue()) {
            return true;
        }

        const hash = this.valueHash();
        if (!hash) {
            return false;
        }

        // Check local blob pool (in-memory cache + IndexedDB, no download)
        const hasLocal = await this.defaultStore().blobPool().asyncHasBlob(hash);
        if (hasLocal) {
            return true;
        }

        // Check cloud storage existence (metadata only, no download)
        try {
            const file = await SvApp.shared().cloudStorageService().asyncPublicFileForHash(hash);
            return await file.asyncDoesExist();
        } catch (e) {
            return false;
        }
    }

    // --- auto-sync to cloud ---

    async asyncJustSetBlobValue (blob) { // private method, don't call directly, use asyncSetBlobValue instead
        await super.asyncJustSetBlobValue(blob);
        if (this.doesAutoSyncToCloud()) {
            this.schedulePushToCloud();
        }
        return this;
    }

    schedulePushToCloud () {
        if (this.pushToCloudPromise() || this.hasInCloud()) {
            return;
        }
        SvSyncScheduler.shared().scheduleTargetAndMethod(this, "onScheduledPushToCloud");
    }

    onScheduledPushToCloud () {
        this.asyncPushToCloud();
    }

    // --- push to cloud ---

    async asyncPushToCloud () {
        if (this.pushToCloudPromise()) {
            return this.pushToCloudPromise();
        }
        const blob = this.blobValue();
        if (!blob) {
            throw new Error(this.logPrefix() + " asyncPushToCloud: no blob value to push");
        }
        this.setPushToCloudPromise(Promise.clone());
        try {
            const publicUrl = await SvApp.shared().asyncPublicUrlForBlob(blob);
            this.setDownloadUrl(publicUrl);
            this.setHasInCloud(true);
            this.pushToCloudPromise().callResolveFunc();
            this.clearPushToCloudPromise();
            return publicUrl;
        } catch (error) {
            this.pushToCloudPromise().callRejectFunc(error);
            this.clearPushToCloudPromise();
            throw error;
        }
    }

    clearPushToCloudPromise () {
        this.setPushToCloudPromise(null);
        return this;
    }

    pushToCloudActionInfo () {
        return {
            title: "Push to Cloud",
            isEnabled: this.hasBlobValue(),
            subtitle: this.hasBlobValue() ? null : "No blob value"
        };
    }

    // --- public url ---

    isLocalhostUrl (url) {
        if (!url) {
            return false;
        }
        try {
            const hostname = new URL(url).hostname;
            return hostname === "localhost" || hostname === "127.0.0.1";
        } catch (e) {
            return false;
        }
    }

    async asyncPublicUrl () {
        const cachedUrl = this.publicUrl();
        if (cachedUrl && !this.isLocalhostUrl(cachedUrl)) {
            return cachedUrl;
        }

        // Clear stale localhost URLs
        if (cachedUrl) {
            this.setPublicUrl(null);
        }

        const hash = await this.asyncValueHash();
        if (!hash) {
            throw new Error(this.logPrefix() + " asyncPublicUrl(): no valueHash — blob may not have been stored");
        }

        if (this.hasInCloud()) {
            try {
                const url = await SvApp.shared().cloudStorageService().asyncPublicUrlForHash(hash);
                if (!this.isLocalhostUrl(url)) {
                    this.setPublicUrl(url);
                    return url;
                }
                // Got a localhost URL from cloud service — clear flag and re-upload
                console.warn(this.logPrefix() + " cloud returned localhost URL, will re-upload");
                this.setHasInCloud(false);
            } catch (error) {
                if (error.code === "storage/object-not-found") {
                    console.warn(this.logPrefix() + " cloud object not found, clearing hasInCloud flag");
                    this.setHasInCloud(false);
                } else {
                    throw error;
                }
            }
        }

        if (!this.hasBlobValue()) {
            throw new Error("Not Found");
        }

        await this.asyncPushToCloud();
        let url = this.downloadUrl();

        // If push returned a localhost URL, get the public URL via the storage service
        // (which may be overridden in local dev to use the correct GCS bucket)
        if (this.isLocalhostUrl(url)) {
            console.warn(this.logPrefix() + " asyncPushToCloud returned localhost URL, resolving via storage service");
            url = await SvApp.shared().cloudStorageService().asyncPublicUrlForHash(hash);
        }

        this.setPublicUrl(url);
        return url;
    }

    // --- pull from cloud ---

    // Session-scoped map of content hash → timestamp of the last definitive
    // miss (404 / object-not-found). Re-fetching a missing blob on every
    // render floods the network + console and can stall callers (e.g. a
    // generateImage tool call) on retry-limit-exceeded — which can hang the
    // AI response waiting on that blocking tool call.
    //
    // But "missing" is NOT always permanent: in multiplayer the host uploads
    // a finished image's blob moments after (or seconds before) the envelope
    // referencing it reaches guests, and a guest that pulls inside that
    // window gets a definitive 404 for a blob that exists shortly after.
    // A permanent cache turned that race into "images never render for
    // clients". So misses expire after a TTL: the flood becomes at most one
    // probe per TTL per hash, and late-arriving blobs heal on their own.
    // Transient failures (network / retry-limit / status 0) are never cached.
    static missingHashTtlMs () {
        return 60000;
    }

    static missingHashes () {
        if (!this._missingHashes) { this._missingHashes = new Map(); } // hash → last-miss ms timestamp
        return this._missingHashes;
    }

    static hashIsMarkedMissing (hash) {
        const missedAt = this.missingHashes().get(hash);
        if (missedAt === undefined) { return false; }
        if (Date.now() - missedAt > this.missingHashTtlMs()) {
            this.missingHashes().delete(hash); // expired — retryable again
            return false;
        }
        return true;
    }

    errorIsDefinitiveNotFound (error) {
        if (!error) { return false; }
        const code = error.code || "";
        if (code === "storage/object-not-found") { return true; }
        if (code === "storage/retry-limit-exceeded" || code === "storage/canceled") { return false; }
        const msg = (error.message || "").toLowerCase();
        // Transient — keep retryable.
        if (/retry-limit|network|timed out|timeout|aborted|status: 0|request failed/.test(msg)) { return false; }
        // Definitive — won't resolve by retrying.
        if (/object-not-found|not found|\b404\b|\b403\b/.test(msg)) { return true; }
        return false; // unknown → treat as transient (safer to allow retry)
    }

    async asyncForcePullFromCloudByHash () {
        return this.asyncPullFromCloudByHash(true);
    }

    async asyncPullFromCloudByHash (forceRetry = false) {
        if (this.blobValue()) {
            return this.blobValue();
        }
        const hash = this.valueHash();
        if (!hash) {
            return null; // no hash to pull from cloud
        }
        // Skip a hash that missed recently (unless the caller forces it).
        if (!forceRetry && SvCloudBlobNode.hashIsMarkedMissing(hash)) {
            return null;
        }
        try {
            const blob = await SvApp.shared().asyncBlobForHash(hash);
            if (blob) {
                this.setBlobValue(blob);
                this.setHasInCloud(true);
                SvCloudBlobNode.missingHashes().delete(hash); // it exists after all
            }
            return this.blobValue();
        } catch (error) {
            if (this.errorIsDefinitiveNotFound(error)) {
                if (!SvCloudBlobNode.missingHashes().has(hash)) {
                    console.warn("SvCloudBlobNode: blob not in cloud (won't re-fetch for " + (SvCloudBlobNode.missingHashTtlMs() / 1000) + "s unless forced) hash: " + hash.slice(0, 12) + "...");
                }
                SvCloudBlobNode.missingHashes().set(hash, Date.now());
            } else {
                console.warn("SvCloudBlobNode: transient failure pulling blob (will retry) hash: " + hash.slice(0, 12) + "...:", error.message);
            }
            return null;
        }
    }

    async asyncPullFromCloudByDownloadUrl () {
        const downloadUrl = this.downloadUrl();
        assert(downloadUrl, "Download URL is required");
        const blob = await SvApp.shared().cloudStorageService().asyncBlobForDownloadUrl(downloadUrl);
        this.setBlobValue(blob);
        this.setHasInCloud(true); // it's now in cloud storage
        return this.blobValue();
    }

    pullFromCloudActionInfo () {
        return {
            title: "Pull from Cloud",
            isEnabled: this.hasValueHash(),
            subtitle: this.hasValueHash() ? null : "No value hash"
        };
    }

    async asyncBlobValue (forceRetry = false) {
        const blob = await this.blobValue();
        if (blob) {
            return blob;
        }

        const hash = this.valueHash();
        if (hash) {
            assert(hash.length === 64, "hash length is not 64 excepted for hex sha256");

            // A hash already confirmed missing won't be on local disk or in the
            // cloud — short-circuit so a re-render doesn't re-run the lookup chain.
            if (!forceRetry && SvCloudBlobNode.missingHashes().has(hash)) {
                return null;
            }

            const localBlob = await this.asyncReadFromLocalStorage();
            if (localBlob) {
                return localBlob;
            }

            const cloudBlob = await this.asyncPullFromCloudByHash(forceRetry);
            if (cloudBlob) {
                return cloudBlob;
            }
            // asyncPullFromCloudByHash logs once when it confirms a miss; only
            // warn here for the not-yet-classified (e.g. transient) case.
            if (!SvCloudBlobNode.missingHashes().has(hash)) {
                console.warn(this.logPrefix() + " asyncBlobValue: blob not found anywhere for " + hash.substring(0, 12) + "...");
            }
        }

        return null;
    }

}.initThisClass());

