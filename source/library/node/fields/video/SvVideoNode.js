"use strict";

/** * @module library.node.nodes
 */

/** * @class SvVideoNode
 * @extends SvCloudBlobNode
 * @classdesc SvVideoNode class for handling video nodes.
 */

/**

 */
(class SvVideoNode extends SvCloudBlobNode {

    static jsonSchemaDescription () {
        return "A video node with a hash and public url for the video";
    }

    /**
     * @description Initializes the prototype slots for the SvVideoNode.
     * @category Initialization
     */
    /**
     * @static
     * @description Checks if this class can open the given MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type is a video type.
     * @category MIME Handling
     */
    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("video/");
    }

    /**
     * @static
     * @description Creates a new SvVideoNode from a dropped data chunk.
     * @param {Object} dataChunk - The dropped data chunk containing video data.
     * @returns {SvVideoNode} A new SvVideoNode with the dropped video data.
     * @category MIME Handling
     */
    static openMimeChunk (dataChunk) {
        const node = this.clone();
        node.setBlobFromDataURL(dataChunk.dataUrl());
        return node;
    }

    asJson () {
        const json = super.asJson();
        if (this.valueHash()) {
            assert(json.valueHash === this.valueHash(), "valueHash mismatch");
        }

        return json;
    }

    initPrototypeSlots () {

        //override title slot to make it a editable subnode field
        {
            const slot = this.overrideSlot("title", null);
            slot.setLabel("Title");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
        }

        // same for subtitle
        {
            const slot = this.overrideSlot("subtitle", null);
            slot.setInspectorPath("");
            slot.setLabel("Subtitle");
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
        }

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
            slot.setDescription("Public URL of the video");
        }

        // video object - hack to get the video node displayed via the video well field
        {
            const slot = this.newSlot("videoNode", null);
            slot.setShouldStoreSlot(false);
            slot.setSlotType("SvVideoNode");
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setFieldInspectorClassName("SvVideoWellField");
        }

    }

    videoNode () {
        return this;
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("Video");
        this.setSubtitle(null);
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
        this.setDoesAutoSyncToCloud(true);
    }

    nodeThumbnailUrl () {
        console.log("WARNING: SvVideoNode.nodeThumbnailUrl() - need to reimplement caller to use asyncNodeThumbnailUrl()");
        return null;
    }

    async asyncDataUrl () {
        const blob = await this.asyncBlobValue();
        if (blob) {
            return await blob.asyncAsDataUrl();
        }
        return null;
    }

    onVisibility () {
        this.logDebug(this.nodePathString() + " onVisibility");
        // async load resources only needed for to present the view
        return super.onVisibility();
    }

    async asyncNodeThumbnailUrl () {
        // Videos don't have a simple thumbnail URL
        // Could potentially implement video frame extraction later
        return null;
    }

    finalInit () {
        super.finalInit();
        this.setNodeViewClassName("SvVideoWellView");
    }

    clear () {
        super.clear();
        return this;
    }

    /**
     * @description Handles the event when the node is edited.
     * @category Event Handling
     */
    onDidEditNode () {
        this.logDebug(" onDidEditNode");
    }

    key () {
        return this.title();
    }

    value () {
        debugger;
        return this.dataURL();
    }

    setValue (/*value*/) {
        debugger;
        return this;
    }

    hasVideo () {
        return this.valueHash() !== null || this.publicUrl() !== null;
    }

    setBlobFromDataURL (dataURL) {
        if (dataURL && dataURL.startsWith("http")) {
            throw new Error("setBlobFromDataURL: dataURL is public");
        }
        const blob = Blob.fromDataUrl(dataURL);
        this.setValueHash(null);
        this.setBlobValue(blob);
        this.asyncValueHash(); // compute the hash
        return this;
    }

    setDataURL (/*dataURL*/) {
        debugger;
        return this;
    }

    async asyncDataURL () {
        const blob = this.blobValue();
        if (blob) {
            return await blob.asyncAsDataUrl();
        }
        throw new Error("No blob value to get data URL from");
    }

}.initThisClass());
