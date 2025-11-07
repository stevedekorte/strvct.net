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

        // download url (may be private)
        /*
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
        */

        // public url
        {
            const slot = this.newSlot("publicUrl", ""); // should normally call asyncPublicUrl() to get it
            slot.setIsInJsonSchema(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setIsSubnodeField(true);
            slot.setDescription("Public URL of the image");
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
            slot.setActionMethodName("asyncPullFromCloud");
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

    async asyncPushToCloud () {
        const blob = this.blobValue();
        if (!blob) {
            return;
        }
        const publicUrl = await SvApp.shared().asyncPublicUrlForBlob(blob);
        this.setPublicUrl(publicUrl);
    }

    pushToCloudActionInfo () {
        return {
            title: "Push to Cloud",
            isEnabled: this.hasBlobValue(),
            subtitle: this.hasBlobValue() ? null : "No blob value"
        };
    }

    async asyncPullFromCloud () {
        const url = this.publicUrl();
        if (!url) {
            throw new Error("No public URL available for pulling blob from cloud storage");
        }

        const svRequest = new SvRequest();
        svRequest.setUrl(url);
        svRequest.setMethod("GET");
        svRequest.setHeaders({
            "Accept": "application/octet-stream"
        });
        svRequest.setBody(null);
        svRequest.setResponseType("arraybuffer");
        svRequest.setResponseHeaders(true);
        await svRequest.asyncSend();

        if (svRequest.hasError()) {
            throw new Error(`Failed to pull blob from cloud storage: ${svRequest.error().message}`);
        }

        // Get content type from response headers or default to application/octet-stream
        const contentType = svRequest.responseHeaders().get("content-type") || "application/octet-stream";

        // Create blob with proper MIME type
        const arrayBuffer = svRequest.response();
        const blob = new Blob([arrayBuffer], { type: contentType });
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

