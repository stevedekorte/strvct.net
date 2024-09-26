"use strict";

/**
 * @module library.node.fields.subclasses
 * @class BMImageWellField
 * @extends BMField
 * @classdesc Represents an image well field in the application.
 * This class handles image-related operations and supports specific mime types.
 */

class BMImageWellField extends BMField {
    /**
     * @static
     * @description Indicates if this class is available as a node primitive.
     * @returns {boolean} True if available as a node primitive.
     */
    static availableAsNodePrimitive() {
        return true
    }
    
    /**
     * @static
     * @description Returns a set of supported MIME types for this image well field.
     * @returns {Set<string>} A set of supported MIME types.
     */
    static supportedMimeTypes() {
        return new Set(["image/jpeg", "image/gif", "image/png"])
    }

    /**
     * @static
     * @description Checks if the given MIME type is supported.
     * @param {string} mimeType - The MIME type to check.
     * @returns {boolean} True if the MIME type is supported.
     */
    static canOpenMimeType(mimeType) {
        return this.supportedMimeTypes().has(mimeType)
    }

    /**
     * @static
     * @description Opens a data chunk with the given MIME type.
     * @param {Object} dataChunk - The data chunk to open.
     * @returns {BMImageWellField} A new instance of BMImageWellField with the opened data.
     */
    static openMimeChunk(dataChunk) {
        const newNode = this.clone()
        newNode.setValue(dataChunk.dataUrl())
        //newNode.setValue(dataChunk.decodedData())
        newNode.setKeyIsEditable(true)
        newNode.setValueIsEditable(true)
        newNode.setCanDelete(true)
        return newNode
    }

    /**
     * @description Initializes the prototype slots for this class.
     */
    initPrototypeSlots() {
        /**
         * @member {boolean} onlyShowsKeyWhenEmpty
         * @description Determines if the key should only be shown when the field is empty.
         */
        {
            const slot = this.newSlot("onlyShowsKeyWhenEmpty", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {boolean} isEditable
         * @description Determines if the field is editable.
         */
        {
            const slot = this.newSlot("isEditable", true);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {*} nodeMinTileHeight
         * @description The minimum tile height for the node.
         */
        {
            const slot = this.overrideSlot("nodeMinTileHeight");
            slot.setShouldStoreSlot(true);
        }
    }

    /**
     * @description Initializes the prototype with default values.
     */
    initPrototype() {
        this.setKey("Image title");
        this.setKeyIsEditable(false);
        this.setValueIsEditable(false);
        this.setNodeCanEditTileHeight(true);
    }

    /**
     * @description Returns a summary value for this field.
     * @returns {string} An empty string as the summary value.
     */
    summaryValue() {
        return ""
    }
   
}

BMImageWellField.initThisClass();