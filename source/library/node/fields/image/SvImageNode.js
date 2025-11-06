"use strict";

/**
 * @module library.node.nodes
 * @class SvImageNode
 * @extends SvStorableNode
 * @classdesc SvImageNode class for handling image nodes.
 */
(class SvImageNode extends JsonGroup {

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

    initPrototypeSlots () {
        {

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
            const slot = this.newSlot("dataURL", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setFieldInspectorViewClassName("SvImageWellField");
            slot.setIsSubnodeField(true);
            slot.setDescription("Data URL of the image");

            //slot.setIsPromiseWrapped(true);
            //slot.setPromiseResetsOnChangeOfSlotName("publicUrl");
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
            slot.setDescription("Public URL of the image");
        }

        // public url promise
        {
            const slot = this.newSlot("publicUrlPromise", null); // private
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Promise");
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }

        // image object
        {
            const slot = this.newSlot("imageObject", null); // private
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Image");
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);

            //slot.setIsPromiseWrapped(true);
            //slot.setPromiseResetsOnChangeOfSlotName("publicUrl");
        }

        // image object promise
        {
            const slot = this.newSlot("imageObjectPromise", null); // private
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Promise");
            slot.setSyncsToView(true);
            slot.setCanEditInspection(false);
        }

        // mime type
        {
            const slot = this.newSlot("mimeType", null);
            slot.setIsInJsonSchema(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setIsSubnodeField(true);
            slot.setDescription("MIME type of the image");
        }

        {
            const slot = this.newSlot("hexSha256Hash", null);
            slot.setIsInJsonSchema(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setShouldStoreSlot(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(false);
            slot.setIsSubnodeField(true);
            slot.setDescription("Hex encoded SHA-256 hash of the image data");

            slot.setIsPromiseWrapped(true);
            //slot.setPromiseResetsOnChangeOfSlotName("dataURL"); // calls computeHexSha256Hash()
        }

        // compute hash action

        {
            const slot = this.newSlot("asyncComputeHexSha256HashAction", null);
            slot.setLabel("Compute Hash");
            slot.setShouldStoreSlot(false);
            slot.setSlotType("Action");
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true);
            slot.setIsSubnodeField(true);
            slot.setActionMethodName("asyncComputeHexSha256Hash");
        }
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
        if (this.dataURL()) {
            return this.dataURL();
        }
        if (this.publicUrl()) {
            return this.publicUrl();
        }
        return null;
    }

    async asyncPrepareForAsJson () {
        await this.asyncComputeHexSha256Hash();
        return this;
    }

    didUpdateSlotDataURL (oldValue, newValue) {
        if (oldValue && newValue) { // don't clear it if we're unserializing
            this.setPublicUrl(null);
            this.setImageObject(null);
            this.setHexSha256Hash(null);
            this.asyncComputeHexSha256Hash(); // intentional no await
        }
    }

    async asyncComputeHexSha256Hash () {
        if (this.dataURL() == null) {
            return this;
        }
        const dataUrlObj = SvDataUrl.clone().setDataUrlString(this.dataURL());
        this.setMimeType(dataUrlObj.mimeType());
        const decodedArrayBuffer = dataUrlObj.decodedArrayBuffer();
        const hash = await decodedArrayBuffer.asyncHexSha256();
        this.setHexSha256Hash(hash); // unneeded if we're using the promise wrapped slot
        return hash;
    }

    finalInit () {
        super.finalInit();
        this.setNodeViewClassName("SvImageWellView");
    }

    clear () {
        this.setDataURL(null);
        this.setPublicUrl(null);
        this.setImageObject(null);
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
        return this.dataURL();
    }

    setValue (value) {
        this.setDataURL(value);
        return this;
    }

    hasImage () {
        return this.dataURL() !== null || this.publicUrl() !== null;
    }

    async asyncImageObject () {
        if (this.imageObject()) {
            return this.imageObject();
        }

        const promise = Promise.clone();
        this.setImageObjectPromise(promise);

        try {
            const image = new Image();
            image.src = this.dataURL();
            image.onload = () => {
                this.setImageObject(image);
                promise.callResolveFunc(image);
            };
            image.onerror = (error) => {
                promise.callRejectFunc(error);
                throw error;
            };
            return image;
        } catch (error) {
            promise.callRejectFunc(error);
            throw error;
        }
    }

    async asyncPublicUrl () {
        if (this.dataUrlIsPublic()) {
            return this.dataURL();
        }

        // use it if we already have it
        if (this.publicUrl()) {
            return this.publicUrl();
        }

        // so we don't do more requests while we're waiting for the first one
        if (this.publicUrlPromise()) {
            return this.publicUrlPromise();
        }

        const promise = Promise.clone();
        this.setPublicUrlPromise(promise);

        try {
            const imageObject = await this.asyncImageObject();
            const blob = await imageObject.asyncAsBlob();
            const publicUrl = await SvApp.shared().asyncPublicUrlForBlob(blob);
            this.setPublicUrl(publicUrl);
            promise.callResolveFunc(publicUrl);
            return publicUrl;
        } catch (error) {
            promise.callRejectFunc(error);
            throw error;
        }
    }

    /*
    setDataURL (dataURL) {
        if (dataURL && dataURL.startsWith("http")) {
            throw new Error("setDataURL: dataURL is public");
        }
        this._dataURL = dataURL;
        return this;
    }
    */

    dataUrlIsPublic () {
        return this.dataURL() !== null && this.dataURL().startsWith("http");
    }


    asDataURL () {
        return this.dataURL();
    }


}.initThisClass());
