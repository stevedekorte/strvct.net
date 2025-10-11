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
            slot.setCanEditInspection(true);
            slot.setFieldInspectorViewClassName("SvImageWellField");
        }

        // public url
        {
            const slot = this.newSlot("publicUrl", null); // should normally call asyncPublicUrl() to get it
            slot.setShouldStoreSlot(true);
            slot.setSlotType("String");
            slot.setSyncsToView(true);
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

    async asyncImageObject () {
        if (this.imageObject()) {
            return this.imageObject();
        }
        this.setImageObjectPromise(Promise.clone());

        const image = new Image();
        image.src = this.dataURL();
        await new Promise((resolve, reject) => {
            image.onload = resolve;
            image.onerror = reject;
        });
        this.setImageObject(image);
        this.imageObjectPromise().resolve(image);
        return image;
    }

    async asyncPublicUrl () {
        // use it if we already have it
        if (this.publicUrl()) {
            return this.publicUrl();
        }

        // so we don't do more requests while we're waiting for the first one
        if (this.publicUrlPromise()) {
            return this.publicUrlPromise();
        }
        this.setPublicUrlPromise(Promise.clone());

        const imageObject = await this.asyncImageObject();
        const publicUrl = await SvApp.shared().asyncPublicUrlForImageObject(imageObject);
        this.setPublicUrl(publicUrl);
        this.publicUrlPromise().resolve(publicUrl);
        return publicUrl;
    }

}.initThisClass());
