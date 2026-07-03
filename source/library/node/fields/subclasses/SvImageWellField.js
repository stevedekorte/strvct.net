"use strict";

/** * @module library.node.fields.subclasses
 */

/** * @class SvImageWellField
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
        return new Set(["image/jpeg", "image/gif", "image/png", "image/webp"]);
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

    async asyncDataUrl () {
        const value = await this.asyncValue();
        if (!value) {
            return null;
        }

        if (value instanceof String) {
            return value;
        }

        if (value.asyncDataUrl) {
            return await value.asyncDataUrl();
        }
        return null;
    }

    async asyncNodeThumbnailUrl () {
        return await this.asyncDataUrl();
    }

    setValue (value) {
        super.setValue(value);
    }

    // --- Progressive image-well protocol (opt-in) ---
    //
    // These methods let a node opt this well into progressive rendering: an
    // aspect-ratio-reserved box that shows a shimmer while working, an optional
    // blurred preview image, an optional determinate progress bar, and a
    // crossfade to the final image. They are DATA ONLY — a node supplies an
    // aspect string, booleans, numbers and image nodes; it never references a
    // view. Every method defaults to "off" so existing wells are unchanged: the
    // tile only engages progressive mode when a node returns a non-null aspect
    // ratio or reports it is working (see SvImageWellFieldTile). Nodes that do
    // not implement these methods (e.g. a bare SvImageNode acting as its own
    // field) take the original single-image path.

    /**
     * @description Progressive protocol (opt-in): the target aspect ratio for
     * the reserved placeholder box, as a "w:h" string (e.g. "5:3"). A non-null
     * value opts this node into progressive rendering. Defaults to null (off).
     * @returns {String|null} The aspect-ratio string, or null.
     * @category Progressive Loading
     */
    imageWellAspectRatio () {
        return null;
    }

    /**
     * @description Progressive protocol (opt-in): the current preview value to
     * show blurred behind the final image while working — an object responding
     * to asyncDataUrl(), or null when there is no preview. Defaults to null.
     * @returns {Object|null} An object with asyncDataUrl(), or null.
     * @category Progressive Loading
     */
    imageWellPreviewValue () {
        return null;
    }

    /**
     * @description Progressive protocol (opt-in): whether work is in progress
     * (drives the shimmer / working indicator in the view). Defaults to false.
     * @returns {Boolean} True while working.
     * @category Progressive Loading
     */
    imageWellIsWorking () {
        return false;
    }

    /**
     * @description Progressive protocol (opt-in): determinate progress as a
     * number in [0, 1], or null for indeterminate (shimmer). Defaults to null.
     * @returns {Number|null} Progress in [0, 1], or null.
     * @category Progressive Loading
     */
    imageWellProgress () {
        return null;
    }

    /**
     * @description Progressive protocol (opt-in): a per-node blur radius (px)
     * override for the preview layer, or null to use the view's default blur.
     * Defaults to null.
     * @returns {Number|null} A blur radius in px, or null.
     * @category Progressive Loading
     */
    imageWellBlurRadiusPx () {
        return null;
    }

}).initThisClass();
