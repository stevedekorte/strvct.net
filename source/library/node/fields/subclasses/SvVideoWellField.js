"use strict";

/**
 * @module library.node.fields.subclasses
 * @class SvVideoWellField
 * @extends SvField
 * @classdesc Represents a video well field in the application.
 * This class handles video-related operations and supports specific mime types.
 */

(class SvVideoWellField extends SvField {
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
     * @description Returns a set of supported MIME types for this video well field.
     * @returns {Set<string>} A set of supported MIME types.
     * @category Configuration
     */
    static supportedMimeTypes () {
        return new Set(["video/mp4", "video/webm", "video/ogg"]);
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
     * @returns {SvVideoWellField} A new instance of SvVideoWellField with the opened data.
     * @category Data Handling
     */
    static openMimeChunk (dataChunk) {
        const newNode = this.clone();
        newNode.setValue(dataChunk.dataUrl());
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
        /**
         * @member {boolean} hasControls
         * @description Determines if the video should display playback controls.
         * @category Video Settings
         */
        {
            const slot = this.newSlot("hasControls", true);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
        }
        /**
         * @member {boolean} autoplay
         * @description Determines if the video should autoplay when loaded.
         * @category Video Settings
         */
        {
            const slot = this.newSlot("autoplay", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
        }
        /**
         * @member {boolean} loop
         * @description Determines if the video should loop when finished playing.
         * @category Video Settings
         */
        {
            const slot = this.newSlot("loop", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
        }
        /**
         * @member {boolean} muted
         * @description Determines if the video should be muted.
         * @category Video Settings
         */
        {
            const slot = this.newSlot("muted", false);
            slot.setSlotType("Boolean");
            slot.setShouldStoreSlot(true);
        }
    }

    /**
     * @description Initializes the prototype with default values.
     * @category Initialization
     */
    initPrototype () {
        this.setKey("Video title");
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
