"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvImageWellField
 * @extends SvField
 * @classdesc Represents an image well field in the application.
 * This class handles image-related operations and supports specific mime types.
 */

(class SvImageWellField extends SvField {
    /**
     * @static
     * @description Indicates if this class is available as a node primitive.
     * @returns {boolean} True if available as a node primitive.
     * @category Initialization
     */
    static availableAsNodePrimitive () {
        return true;
    }

    /**
     * @static
     * @description Returns a set of supported MIME types for this image well field.
     * @returns {Set<string>} A set of supported MIME types.
     * @category Configuration
     */
    static supportedMimeTypes () {
        return new Set(["image/jpeg", "image/gif", "image/png"]);
    }

    /**
     * @static
     * @description Checks if the given MIME type is supported.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type is supported.
     * @category Validation
     */
    static canOpenMimeType (mimeType) {
        return this.supportedMimeTypes().has(mimeType);
    }

    /**
     * @static
     * @description Opens a data chunk with the given MIME type.
     * @param {Object} dataChunk - The data chunk to open.
     * @returns {SvImageWellField} A new instance of SvImageWellField with the opened data.
     * @category Data Handling
     */
    static openMimeChunk (dataChunk) {
        const newNode = this.clone();
        newNode.setValue(dataChunk.dataUrl());
        //newNode.setValue(dataChunk.decodedData())
        newNode.setKeyIsEditable(true);
        newNode.setValueIsEditable(true);
        newNode.setCanDelete(true);
        return newNode;
    }

    /**
     * @description Initializes the prototype slots for this class.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {boolean} onlyShowsKeyWhenEmpty
         * @description Determines if the key should only be shown when the field is empty.
         * @category Display
         */
        {
            const slot = this.newSlot("onlyShowsKeyWhenEmpty", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {boolean} isEditable
         * @description Determines if the field is editable.
         * @category Editing
         */
        {
            const slot = this.newSlot("isEditable", true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {*} nodeMinTileHeight
         * @description The minimum tile height for the node.
         * @category Display
         */
        {
            const slot = this.overrideSlot("nodeMinTileHeight");
            slot.setShouldStoreSlot(true);
        }
    }

    /**
     * @description Initializes the prototype with default values.
     * @category Initialization
     */
    initPrototype () {
        this.setKey("Image title");
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
        this.setNodeCanEditTileHeight(true);
    }

    /**
     * @description Returns a summary value for this field.
     * @returns {string} An empty string as the summary value.
     * @category Data Handling
     */
    summaryValue () {
        return "";
    }

}).initThisClass();

