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

        // public url
        {
            const slot = this.newSlot("publicUrl", null); // should normally call asyncPublicUrl() to get it
            slot.setIsInJsonSchema(true);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setIsSubnodeField(true);
            slot.setDescription("Public URL of the image");
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

    bucketName () {
        return SvApp.shared().cloudStorageService().bucketName();
    }

    firebasePublicUrlFromHash () {
        const hash = this.valueHash();
        if (!hash) {
            return null;
        }
        const bucket = this.bucketName();
        const encodedPath = encodeURIComponent(hash);
        return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodedPath}?alt=media`; // no trailing slash
    }

    async asyncPushToCloudStorage () {
        const blob = this.blobValue();
        if (!blob) {
            return;
        }
        SvApp.shared().cloudStorageService().asyncPushBlob(blob);
    }

    async asyncPullFromCloudStorage () {
        const svRequest = new SvRequest();
        svRequest.setUrl(this.firebasePublicUrlFromHash());
        svRequest.setMethod("GET");
        svRequest.setHeaders({
            "Accept": "application/octet-stream"
        });
        svRequest.setBody(null);
        svRequest.setResponseType("blob");
        svRequest.setResponseEncoding("base64");
        svRequest.setResponseHeaders(true);
        await svRequest.asyncSend();
        if (svRequest.hasError()) {
            throw new Error(`Failed to pull blob from cloud storage: ${svRequest.error().message}`);
        }
        const arrayBuffer = svRequest.response();
        const blob = new Blob([arrayBuffer]);
        this.setBlobValue(blob);
    }

}.initThisClass());

//SvBlobNode.testHash()
