/** * @module library.node.node_views.browser.stack.SvTile.field_tiles
 */

/** * @class SvImageWellFieldTile
 * @extends SvFieldTile
 * @classdesc Represents an image well field tile in the browser stack.


 */

"use strict";

/**
    @class SvImageWellFieldTile
    @extends SvFieldTile
    @classdesc Represents an image well field tile in the browser stack.
*/

(class SvImageWellFieldTile extends SvFieldTile {

    /**
     * @description Checks if the given mime type can be opened.
     * @param {string} mimeType - The mime type to check.
     * @returns {boolean} True if the mime type can be opened, false otherwise.
     * @category File Handling
     */
    canOpenMimeType (mimeType) {
        // TODO: add checks for browser supported image types?
        return mimeType.startsWith("image/");
    }

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} progressiveSyncEpoch - Monotonic token bumped at the
         * start of each progressive async sync pass. After awaiting the image
         * data URLs, a pass compares the current epoch to the one it claimed and
         * bails if a newer pass has started — so a stale pass can never re-apply
         * image data over newer state.
         * @category Synchronization
         */
        {
            const slot = this.newSlot("progressiveSyncEpoch", 0);
            slot.setSlotType("Number");
        }
    }

    /**
     * @description Initializes the SvImageWellFieldTile.
     * @returns {SvImageWellFieldTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.valueViewContainer().flexCenterContent();
        this.valueViewContainer().setPaddingTop("0px").setPaddingBottom("0px");
        this.valueView().setPaddingTop("0px").setPaddingBottom("0px");

        //this.keyView().setElementClassName("SvImageWellKeyField");
        //this.valueView().setIsEditable(false);
        this.turnOffUserSelect();
        this.keyView().setTransition("color 0.3s");
        //this.valueViewContainer().setPadding("0px");
        return this;
    }

    /**
     * @description Creates and returns a value view.
     * @returns {SvImageWellView} The created image well view.
     * @category View Creation
     */
    createValueView () {
        /*
            Note: if we drop an image on the SvImageWellView, it will send a didUpdateImageWellView to it's parents
            which we respond to and use to call setValue
        */
        const imageWellView = SvImageWellView.clone();
        //imageWellView.setDelegate(this);
        //imageWellView.setWidth("100%").setHeight("fit-content");
        return imageWellView;
    }

    /**
     * @deprecated Use syncToNode flow instead.
     */
    setDataUrl (dataUrl) {
        this.setValue(dataUrl);
        return this;
    }

    /**
     * @description Returns the image well view.
     * @returns {SvImageWellView} The image well view.
     * @category View Access
     */
    imageWellView () {
        return this.valueView();
    }

    /**
     * @description True if the node opts into progressive rendering. This is a
     * STABLE CAPABILITY check — conformance to SvImageWellProgressiveProtocol is
     * declared once (via addProtocol) and never changes for a node's lifetime —
     * NOT a check of mutable runtime state. Gating on live state (e.g. "aspect
     * != null || working") re-decides the code path per sync: a well could flip
     * from the progressive path into the destructive single-image path
     * (setImageDataUrl → removeAllSubviews) mid-generation and tear down its own
     * layers. Keying off the protocol keeps a node on exactly one path forever.
     * A node that doesn't conform (a plain SvImageWellField, or a bare
     * SvImageNode acting as its own field) takes the original single-image path.
     * @returns {Boolean}
     * @category Synchronization
     */
    nodeIsProgressive () {
        const field = this.node();
        return !!(field && field.conformsToProtocol && field.conformsToProtocol(SvImageWellProgressiveProtocol));
    }

    /**
     * @description Synchronizes the tile from the node.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncFromNode () {
        super.syncFromNode();

        const field = this.node();
        this.setMaxWidth("100em"); // get this from node instead?

        this.applyStyles(); // normally this would happen in updateSubviews

        // handle other details (nodeValueIsEditable folds in the editability cascade)
        this.imageWellView().setIsEditable(this.nodeValueIsEditable());

        if (this.nodeIsProgressive()) {
            this.syncProgressiveFromNode();
        } else {
            // ORIGINAL non-progressive path — byte-for-byte as before.
            // Hide the value view if we're still generating (showing dots in key)
            if (field.keyIsComplete && !field.keyIsComplete()) {
                this.valueViewContainer().setDisplay("none");
            } else {
                this.valueViewContainer().setDisplay("");
            }
        }

        // handle image values
        this.asyncSyncFromNode(); // no await

        return this;
    }

    /**
     * @description Progressive-mode sync: feed the reserved-box aspect ratio and
     * working flag into the well, and keep the well visible during work. The
     * base tile / SvFieldTile hides the value view while !keyIsComplete /
     * !valueIsVisible; for a progressive well we want the reserved box shown
     * throughout so it never renders a blank tile.
     *
     * On the FAILED terminal (imageWellHasFailed — a cloud-durable flag, unlike
     * the host-only `error` slot, so guests see it too) the well is torn down:
     * shimmer stopped, preview/final layers cleared and the reserved box
     * collapsed, so no permanent blank spacer remains and the field's key/error
     * text lays out normally.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    syncProgressiveFromNode () {
        const field = this.node();
        const well = this.imageWellView();

        if (field.imageWellHasFailed && field.imageWellHasFailed()) {
            this.valueViewContainer().setDisplay("");
            if (well.applyFailedState) {
                well.applyFailedState();
            }
            return this;
        }

        // Keep the reserved box visible throughout work.
        this.valueViewContainer().setDisplay("");
        well.setIsDisplayHidden(false);

        if (well.setAspectRatioString) {
            well.setAspectRatioString(field.imageWellAspectRatio());
        }
        if (well.setIsWorking) {
            well.setIsWorking(field.imageWellIsWorking ? field.imageWellIsWorking() : false);
        }
        return this;
    }

    async asyncSyncFromNode () {
        if (this.nodeIsProgressive()) {
            return await this.asyncSyncProgressiveFromNode();
        }

        const imageWellView = this.imageWellView();
        const field = this.node();
        let value = field.value();
        try {
            if (value === null || value === undefined) {
                value = null;
            } else if (value.asyncDataUrl) {
                value = await value.asyncDataUrl();
            } else {
                assert(typeof value === "string", "value is not a string");
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: Failed to load image data:", error.message);
            value = null;
        }
        imageWellView.setImageDataUrl(value);
        return this;
    }

    /**
     * @description Progressive-mode async sync: resolves the preview + final
     * data URLs and feeds them to the well as one idempotent pass. The base
     * single-image path (setImageDataUrl → removeAllSubviews) is skipped so it
     * can't destroy the stacked layers on every sync.
     *
     * A sequence guard makes overlapping passes safe: each pass claims a fresh
     * epoch up front, and after awaiting the (independent, so Promise.all'd)
     * image data URLs it re-checks the epoch and bails if a newer pass has
     * started — so a completion sync landing inside an earlier pass's await can
     * never let the stale pass re-install a layer over the newer state. The
     * FINAL-before-PREVIEW ordering is no longer load-bearing here: it lives
     * inside well.applyProgressiveImageData().
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    async asyncSyncProgressiveFromNode () {
        const well = this.imageWellView();
        const field = this.node();

        // Failed terminal: the (sync) syncProgressiveFromNode already tore the
        // well down. Don't resolve/re-apply preview or final images — that would
        // rebuild the very layers applyFailedState() just cleared.
        if (field.imageWellHasFailed && field.imageWellHasFailed()) {
            return this;
        }

        this.setProgressiveSyncEpoch(this.progressiveSyncEpoch() + 1);
        const epoch = this.progressiveSyncEpoch();

        // Resolve final + preview concurrently (independent); application order
        // is enforced inside the well.
        const [finalUrl, previewUrl] = await Promise.all([
            this.asyncResolveFinalUrl(),
            this.asyncResolvePreviewUrl()
        ]);

        if (this.progressiveSyncEpoch() !== epoch) {
            return this; // a newer pass superseded this one mid-await
        }

        if (well.applyProgressiveImageData) {
            well.applyProgressiveImageData(finalUrl, previewUrl);
        }
        return this;
    }

    /**
     * @description Resolves the FINAL image data URL from the node's value —
     * same value()/asyncDataUrl path as the base single-image sync.
     * @returns {Promise<String|null>} The data URL, or null.
     * @category Synchronization
     */
    async asyncResolveFinalUrl () {
        try {
            const value = this.node().value();
            if (value && value.asyncDataUrl) {
                return await value.asyncDataUrl();
            }
            if (typeof value === "string" && value.length > 0) {
                return value;
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: failed to load final image:", error.message);
        }
        return null;
    }

    /**
     * @description Resolves the PREVIEW (blurred back layer) data URL from the
     * node's imageWellPreviewValue().
     * @returns {Promise<String|null>} The data URL, or null.
     * @category Synchronization
     */
    async asyncResolvePreviewUrl () {
        try {
            const field = this.node();
            const previewValue = field.imageWellPreviewValue ? field.imageWellPreviewValue() : null;
            if (previewValue && previewValue.asyncDataUrl) {
                return await previewValue.asyncDataUrl();
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: failed to load preview image:", error.message);
        }
        return null;
    }

    /**
     * @description Syncs the value from the node. For progressive nodes the base
     * path (setValue → setImageDataUrl → removeAllSubviews) is skipped because it
     * would destroy the well's stacked preview/final layers on every sync; the
     * progressive image plumbing flows through asyncSyncProgressiveFromNode()
     * instead. Non-progressive nodes get unchanged base behavior.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncValueFromNode () {
        if (!this.nodeIsProgressive()) {
            return super.syncValueFromNode();
        }
        this.valueView().setIsEditable(this.nodeValueIsEditable());
        return this;
    }

    /**
     * @description Synchronizes the tile to the node.
     * @returns {SvImageWellFieldTile} The synchronized instance.
     * @category Synchronization
     */
    syncToNode () {
        const field = this.node();

        field.setKey(this.keyView().value());

        if (this.nodeIsProgressive()) {
            // Progressive wells are display-driven FROM the node: finals flow
            // through the front layer, not setImageDataUrl, so the well's
            // imageDataUrl() is null. Writing it back would clobber the node's
            // value. Never write back for progressive nodes (the base
            // removeAllSubviews drop/edit path is likewise inert here — such
            // nodes report valueIsEditable() false, and willRemoveSubview keeps
            // the well's layer slots consistent if a wipe ever happens).
            return this;
        }

        if (this.nodeValueIsEditable()) { // cascade included: read-only-in-context wells never write back
            const dataUrl = this.imageWellView().imageDataUrl();
            const value = field.value();

            if (value && value.setBlobFromDataURL) {
                // Value is an SvImageNode or similar blob-backed object
                value.setBlobFromDataURL(dataUrl);
            } else {
                field.setValue(dataUrl);
            }
        }

        return this;
    }

    /**
     * @description Returns the data URL of the image.
     * @returns {string|null} The data URL of the image.
     * @category Data Access
     */
    dataUrl () {
        return this.imageWellView().imageDataUrl();
    }

    /**
     * @description Checks if the image well is empty.
     * @returns {boolean} True if empty, false otherwise.
     * @category State Check
     */
    isEmpty () {
        return Type.isNull(this.dataUrl());
    }

    /**
     * @description Handles the update of the image well view.
     * @param {SvImageWellView} anImageWell - The updated image well view.
     * @returns {SvImageWellFieldTile} The current instance.
     * @category Event Handling
     */
    didUpdateImageWellView (/*anImageWell*/) {
        //this.logDebug(".didUpdateImageWellView()");
        this.scheduleSyncToNode();
        return this;
    }

}.initThisClass());
