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

    // --- push to cloud ---

    async asyncPushToCloud () {
        const blob = this.blobValue();
        if (!blob) {
            return;
        }
        const publicUrl = await SvApp.shared().asyncPublicUrlForBlob(blob);
        this.setDownloadUrl(publicUrl);
        this.setHasInCloud(true);
        return publicUrl;
    }

    pushToCloudActionInfo () {
        return {
            title: "Push to Cloud",
            isEnabled: this.hasBlobValue(),
            subtitle: this.hasBlobValue() ? null : "No blob value"
        };
    }

    // --- public url ---

    async asyncPublicUrl () {
        if (this.publicUrl()) {
            // we assume this is set to null when appropriate
            return this.publicUrl();
        }

        const hash = await this.asyncValueHash();
        if (!hash) {
            throw new Error(this.logPrefix(), ".asyncPublicUrl(): no hash");
        }

        if (this.hasInCloud()) {
            return await SvApp.shared().cloudStorageService().asyncPublicUrlForHash(hash);
        }
        await this.asyncPushToCloud();
        return this.downloadUrl();
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
        const blob = await SvApp.shared().asyncBlobForHash(hash);
        this.setBlobValue(blob);
        this.setHasInCloud(true); // it's now in cloud storage
        return this.blobValue();
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

