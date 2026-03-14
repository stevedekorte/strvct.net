"use strict";

/** * @module library.node.blobs
 */

/**
 * @class SvCloudBlobNode
 * @extends SvBlobNode
 * @classdesc SvCloudBlobNode extends SvBlobNode to handle storing blobs in Google Cloud Storage.
 */

/**

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
            slot.setActionMethodName("asyncPullFromCloudByHash");
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

    async asyncPullFromCloudByHash () {
        if (this.blobValue()) {
            return this.blobValue();
        }
        const hash = this.valueHash();
        if (!hash) {
            return null; // no hash to pull from cloud
        }
        try {
            const blob = await SvApp.shared().asyncBlobForHash(hash);
            if (blob) {
                this.setBlobValue(blob);
                this.setHasInCloud(true);
            }
            return this.blobValue();
        } catch (error) {
            console.warn("SvCloudBlobNode: Failed to pull blob from cloud (hash: " + hash.slice(0, 12) + "...):", error.message);
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

    async asyncBlobValue () {
        const blob = await this.blobValue();
        if (blob) {
            return blob;
        }

        const hash = this.valueHash();
        if (hash) {
            assert(hash.length === 64, "hash length is not 64 excepted for hex sha256");

            const localBlob = await this.asyncReadFromLocalStorage();
            if (localBlob) {
                return localBlob;
            }

            const cloudBlob = await this.asyncPullFromCloudByHash();
            if (cloudBlob) {
                return cloudBlob;
            }
        }

        return null;
    }

}.initThisClass());

