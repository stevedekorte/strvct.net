"use strict";

/**
 * @module library.node.blobs
 * @class SvCloudBlob
 * @extends SvBlobNode
 * @classdesc
 * SvCloudBlobNode extends SvBlobNode to handle storing blobs in Google Cloud Storage.
 */
(class SvCloudBlobNode extends SvBlobNode {

    /**
     * Initializes the prototype slots for the SvBlobNode class.
     */
    initPrototypeSlots () {

        // download url (may be private or public)
        {
            const slot = this.newSlot("downloadUrl", null); // should normally call asyncDownloadUrl() to get it
            slot.setIsInJsonSchema(true);
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
            slot.setIsInJsonSchema(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setCanInspect(true);
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncPushToCloud");
        }

        /// pull from cloud action
        {
            const slot = this.newSlot("pullFromCloudAction", null);
            slot.setIsInJsonSchema(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncPullFromCloudByDownloadUrl");
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

    hasPublicUrl () {
        return this.publicUrl() !== "";
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
        await SvApp.shared().asyncPublicUrlForBlob(blob);
    }

    pushToCloudActionInfo () {
        return {
            title: "Push to Cloud",
            isEnabled: this.hasBlobValue(),
            subtitle: this.hasBlobValue() ? null : "No blob value"
        };
    }

    // --- public url ---

    publicUrl () {
        const hash = this.valueHash();
        if (!hash) {
            return null;
        }
        return SvApp.shared().cloudStorageService().asyncPublicUrlForHash(hash);
    }

    // --- pull from cloud ---

    async asyncPullFromCloudByHash () {
        const hash = await this.asyncValueHash();
        assert(hash, "Hash is required");
        const blob = await SvApp.shared().asyncBlobForHash(hash);
        this.setBlobValue(blob);
    }

    async asyncPullFromCloudByDownloadUrl () {
        const downloadUrl = this.downloadUrl();
        assert(downloadUrl, "Download URL is required");
        const blob = await SvApp.shared().cloudStorageService().asyncBlobForDownloadUrl(downloadUrl);
        this.setBlobValue(blob);
    }

    pullFromCloudActionInfo () {
        return {
            title: "Pull from Cloud",
            isEnabled: this.hasPublicUrl(),
            subtitle: this.hasPublicUrl() ? null : "No public URL"
        };
    }

}.initThisClass());

