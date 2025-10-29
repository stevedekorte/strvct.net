"use strict";

/**
 * @module library.node.nodes
 * @class SvImageNode
 * @extends SvStorableNode
 * @classdesc SvImageNode class for handling image nodes.
 */
(class SvImageNode extends SvStorableNode {

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


            //slot.setIsPromiseWrapped(true);
            //slot.setPromiseResetsOnChangeOfSlotName("publicUrl");
        }

        // public url
        {
            const slot = this.newSlot("publicUrl", null); // should normally call asyncPublicUrl() to get it
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setCanInspect(true);
            slot.setCanEditInspection(true);
            slot.setIsSubnodeField(true);
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

        /*
        {
            const slot = this.newSlot("note", null);
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
            slot.setIsSubnodeField(true);
        }
        */
    }

    /**
     * @description Initializes the prototype with default settings.
     * @category Initialization
     */
    initPrototype () {
        this.setNodeCanEditTitle(true);
        this.setNodeCanEditSubtitle(false);
        this.setTitle("Untitled");
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

    didUpdateSlotDataURL (oldValue, newValue) {
        if (oldValue && newValue) { // don't clear it if we're unserializing
            this.setPublicUrl(null);
            this.setImageObject(null);
        }
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
            const publicUrl = await SvApp.shared().asyncPublicUrlForImageObject(imageObject);
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
