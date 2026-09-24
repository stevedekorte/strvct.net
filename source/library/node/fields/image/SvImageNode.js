"use strict";

/**
 * @module library.node.nodes
 */

/**
 * @class SvImageNode
 * @extends SvStorableNode
 * @classdesc SvImageNode class for handling image nodes.
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

    serializeToJson (filterName, jsonPathComponents = []) {
        const json = super.serializeToJson(filterName, jsonPathComponents);
        if (this.valueHash()) {
            assert(json.valueHash === this.valueHash(), "valueHash in serialized json does not match valueHash");
        }
        return json;
    }

    initPrototypeSlots () {

        // image object
        {
            const slot = this.newSlot("imageNode", null); // self-referential slot to display the image well field tile
            slot.setShouldStoreSlot(false);
            slot.setSlotType("SvImageNode");
            slot.setSyncsToView(true);
            slot.setCanEditInspection(true); // dangerous! we need to make sure things stay in sync!
            slot.setIsSubnodeField(true);
            slot.setFieldInspectorClassName("SvImageWellField");

            //slot.setIsPromiseWrapped(true);
            //slot.setPromiseResetsOnChangeOfSlotName("publicUrl");
        }

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
        this.setDoesAutoSyncToCloud(true);
    }

    nodeThumbnailUrl () {
        console.log("WARNING: SvImageNode.nodeThumbnailUrl() - need to reimplement caller to use asyncNodeThumbnailUrl()");
        return null;
    }

    /**
     * @description The image as a data URL, or null when no bytes are
     * available.
     * @param {Object} [options] - Lookup options, passed to asyncBlobValue.
     * @param {Boolean} [options.force] - Bypass the missing-hash negative
     * caches and re-probe the cloud (for a caller that knows the hash should be
     * fetchable now — e.g. a view retrying a stalled fetch).
     * @returns {Promise<String|null>} The data URL, or null.
     * @category Image
     */
    async asyncDataUrl (options) {
        const hash = this.valueHash();
        const cached = hash ? SvImageNode.dataUrlCache().get(hash) : undefined;
        if (cached) {
            return cached;
        }
        const blob = await this.asyncBlobValue(options);
        if (!blob) {
            return null;
        }
        const url = await blob.asyncAsDataUrl();
        if (hash && url && hash === this.valueHash()) {
            SvImageNode.rememberDataUrl(hash, url);
        }
        return url;
    }

    /**
     * @description Data urls by content hash. A blob read back from storage is
     * a new Blob each time, so its own data-url cache missed and every call
     * re-encoded the image — tile thumbnails re-sync on every node update,
     * which re-encoded (and re-decoded) dozens of images per keystroke in
     * Safari (2026-09-24). A hash names immutable content, so an entry never
     * goes stale; the cache is bounded by total size (oldest out first).
     * @returns {Map<String, String>}
     * @category Caching
     */
    static dataUrlCache () {
        if (!this._dataUrlCache) { this._dataUrlCache = new Map(); }
        return this._dataUrlCache;
    }

    /**
     * @description Keeps a data url for its content hash, evicting the oldest
     * entries past dataUrlCacheMaxChars().
     * @param {String} hash
     * @param {String} url
     * @category Caching
     */
    static rememberDataUrl (hash, url) {
        const cache = this.dataUrlCache();
        cache.delete(hash);
        cache.set(hash, url);
        this._dataUrlCacheChars = (this._dataUrlCacheChars || 0) + url.length;
        for (const [oldHash, oldUrl] of cache) {
            if (this._dataUrlCacheChars <= this.dataUrlCacheMaxChars() || oldHash === hash) {
                break;
            }
            cache.delete(oldHash);
            this._dataUrlCacheChars -= oldUrl.length;
        }
    }

    /**
     * @description Upper bound on cached data-url characters (~64 MB of
     * strings) — room for every thumbnail in view.
     * @returns {Number}
     * @category Caching
     */
    static dataUrlCacheMaxChars () {
        return 64 * 1024 * 1024;
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

    nodeExpectsThumbnail () {
        return true;
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
     * @description Extends the base/cloud hooks (which clear the stale blob and
     * cloud bookkeeping on a non-null → different-non-null hash transition) to
     * also clear the cached publicUrl, which is defined on this subclass and
     * points at the OLD content. asyncPublicUrl() will recompute it for the new
     * hash on next access. Same both-non-null-and-different guard as the base,
     * so the null-on-one-side authoring sequence is left untouched.
     * @param {?string} oldValue - The previous hash (null if none).
     * @param {?string} newValue - The new hash (null if cleared).
     * @category Cloud Storage
     */
    didUpdateSlotValueHash (oldValue, newValue) {
        super.didUpdateSlotValueHash(oldValue, newValue);
        if (oldValue !== null && newValue !== null && oldValue !== newValue) {
            this.setPublicUrl(null); // old content's URL — recomputed on next asyncPublicUrl()
        }
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
        return this.publicUrl();
    }

    setValue (v) {
        if (typeof v === "string" && v.startsWith("data:")) {
            this.setBlobFromDataURL(v);
        }
        return this;
    }

    hasImage () {
        return this.hasContentReference(); // we either have the blob or can get it from the blob pool with the hash
    }

    async asyncImageObject () {
        const blob = await this.asyncBlobValue();
        if (!blob) {
            return null;
        }
        return await blob.asyncAsImageObject();
    }

    setBlobFromDataURL (dataURL) {
        if (!dataURL) {
            this.clear();
            return this;
        }
        if (dataURL.startsWith("http")) {
            throw new Error("setDataURL: dataURL is public");
        }
        // Set the blob synchronously so hasBlobValue() is true immediately
        // (SvFileToDownload.hasLoaded keys off that during the hash window),
        // then replace the Sv blob ref via the async path (hash, local store,
        // cloud push).
        const blob = Blob.fromDataUrl(dataURL);
        this.setBlobValue(blob);
        this.asyncSetBlobValue(blob).catch((error) => {
            console.error(this.svType() + ".setBlobFromDataURL failed to replace blob ref:", error);
        });
        return this;
    }

    setDataURL (dataURL) {
        if (dataURL) {
            this.setBlobFromDataURL(dataURL);
        }
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
