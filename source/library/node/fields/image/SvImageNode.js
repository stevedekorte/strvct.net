"use strict";

/** * @module library.node.nodes
 */

/** * @class SvImageNode
 * @extends SvStorableNode
 * @classdesc SvImageNode class for handling image nodes.
 
 
 */

/**

 */
(class SvImageNode extends SvCloudBlobNode {

    static jsonSchemaDescription () {
        return "An image node with a hash and public url for the image";
    }

    /**
     * @description Initializes the prototype slots for the SvImageNode.
     * @category Initialization
     */
    /**
     * @static
     * @description Checks if this class can open the given MIME type.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type is an image type.
     * @category MIME Handling
     */
    static canOpenMimeType (mimeType) {
        return mimeType.startsWith("image/");
    }

    /**
     * @static
     * @description Creates a new SvImageNode from a dropped data chunk.
     * @param {Object} dataChunk - The dropped data chunk containing image data.
     * @returns {SvImageNode} A new SvImageNode with the dropped image data.
     * @category MIME Handling
     */
    static openMimeChunk (dataChunk) {
        const node = this.clone();
        node.setDataURL(dataChunk.dataUrl());
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

        /**
         * @member {String} dataURL - The data URL of the image.
         * @category Data
         */
        /*       {
            const slot = this.newSlot("dataURL", null);
            slot.setShouldStoreSlot(false); // we don't store the data URL. This slot is only used to present the field inspector view
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setFieldInspectorClassName("SvImageWellField");
            slot.setIsSubnodeField(true);
            slot.setDescription("Data URL of the image");

            //slot.setIsPromiseWrapped(true);
            //slot.setPromiseResetsOnChangeOfSlotName("publicUrl");
        }
            */

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

        // image object
        {
            const slot = this.newSlot("imageNode", null); // private - hack to get the image node displayed via the image well field
            slot.setShouldStoreSlot(false);
            slot.setSlotType("SvImageNode");
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
            slot.setFieldInspectorClassName("SvImageWellField");

            //slot.setIsPromiseWrapped(true);
            //slot.setPromiseResetsOnChangeOfSlotName("publicUrl");
        }

    }

    imageNode () {
        return this;
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("Image");
        this.setSubtitle(null);
        this.setCanDelete(true);
        this.setNodeCanAddSubnode(true);
        this.setShouldStore(true);
        this.setShouldStoreSubnodes(false);
    }

    nodeThumbnailUrl () {
        console.log("WARNING: SvImageNode.nodeThumbnailUrl() - need to reimplement caller to use asyncNodeThumbnailUrl()");
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
        const url = await this.asyncDataUrl();
        return url;
    }

    finalInit () {
        super.finalInit();
        this.setNodeViewClassName("SvImageWellView");
    }

    clear () {
        super.clear();
        //this.setImageObject(null);
        return this;
    }

    /**
     * @description Handles the event when the node is edited.
     * @category Event Handling
     */
    onDidEditNode () {
        this.logDebug(" onDidEditNode");
    }

    /**
     * @description Creates a JSON archive of the node.
     * @returns {undefined}
     * @category Data Serialization
     */
    jsonArchive () {
        return undefined;
    }

    key () {
        return this.title();
    }

    value () {
        debugger;
        return this.dataURL();
        //return this.blobValue().asyncAsImageObject();
    }

    setValue (/*value*/) {
        debugger;
        //this.setDataURL(value);
        return this;
    }

    hasImage () {
        return this.valueHash() !== null || this.publicUrl() !== null; // we either have the blob or can get it from the blob pool with the hash
    }

    async asyncImageObject () {
        const blob = await this.asyncBlobValue();
        if (!blob) {
            return null;
        }
        return await blob.asyncAsImageObject();
    }

    setBlobFromDataURL (dataURL) {
        if (dataURL && dataURL.startsWith("http")) {
            throw new Error("setDataURL: dataURL is public");
        }
        const blob = Blob.fromDataUrl(dataURL);
        this.setValueHash(null);
        this.setBlobValue(blob);
        this.asyncValueHash(); // compute the hash
        return this;
    }

    setDataURL (/*dataURL*/) {
        debugger;
        /*
        const blob = Blob.fromDataUrl(dataURL);
        this.setValueHash(null);
        this.setBlobValue(blob);
        */
        return this;
    }

    async asyncDataURL () {
        const blob = this.blobValue();
        if (blob) {
            return await blob.asyncAsDataUrl(); // returns a string if already loaded
        }
        throw new Error("No blob value to get data URL from");
    }

}.initThisClass());
