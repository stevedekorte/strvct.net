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
     * @description True if the node opts into the progressive well protocol.
     * Feature-detected: the node may not implement these methods at all (e.g. a
     * bare SvImageNode acting as its own field does NOT extend SvImageWellField),
     * so every access is guarded — never assume the methods exist. Progressive
     * mode engages only when the node implements the protocol AND reports either
     * a non-null aspect ratio or that it is working.
     * @returns {Boolean}
     * @category Synchronization
     */
    nodeIsProgressive () {
        const field = this.node();
        if (!field || !field.imageWellAspectRatio) {
            return false;
        }
        const aspect = field.imageWellAspectRatio();
        const working = field.imageWellIsWorking ? field.imageWellIsWorking() : false;
        return aspect != null || working;
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

        // handle other details
        this.imageWellView().setIsEditable(field.valueIsEditable());

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
     * @description Progressive-mode sync: feed the reserved-box aspect ratio,
     * working flag, progress and per-node blur into the well, and keep the well
     * visible during work. The base tile / SvFieldTile hides the value view
     * while !keyIsComplete / !valueIsVisible; for a progressive well we want the
     * reserved box shown throughout so it never renders a blank tile. On a model
     * error, collapse the box so the surrounding error-status text lays out
     * normally.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    syncProgressiveFromNode () {
        const field = this.node();
        const well = this.imageWellView();

        // On failure: tear the reserved box down entirely and fall back to base
        // error-status text — no lingering empty frame.
        if (field.error && field.error()) {
            if (well.setAspectRatioString) {
                well.setAspectRatioString(null);
            }
            return this;
        }

        // Keep the reserved box visible throughout work.
        this.valueViewContainer().setDisplay("");
        well.setIsDisplayHidden(false);

        if (well.setBlurRadiusPx && field.imageWellBlurRadiusPx) {
            const blur = field.imageWellBlurRadiusPx();
            if (blur != null) {
                well.setBlurRadiusPx(blur);
            }
        }
        if (well.setAspectRatioString) {
            well.setAspectRatioString(field.imageWellAspectRatio());
        }
        if (well.setIsWorking) {
            well.setIsWorking(field.imageWellIsWorking ? field.imageWellIsWorking() : false);
        }
        if (well.setProgress) {
            well.setProgress(field.imageWellProgress ? field.imageWellProgress() : null);
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
     * data URLs and feeds them to the well's layers (crossfade). The base
     * single-image path (setImageDataUrl → removeAllSubviews) is skipped so it
     * can't destroy the stacked layers on every sync.
     * @returns {SvImageWellFieldTile}
     * @category Synchronization
     */
    async asyncSyncProgressiveFromNode () {
        const well = this.imageWellView();
        const field = this.node();

        // Apply the FINAL before the PREVIEW. At completion the node reports a
        // final image AND a null preview in the same sync pass; if we cleared
        // the preview first it would rip the blurred backdrop out from under the
        // slowly-fading-in final (a flash of the empty box). Setting the final
        // first lets setPreviewDataUrl(null) see a final in progress and keep the
        // backdrop — the final reveal removes it once its crossfade completes.

        // Final (sharp front layer) — same value()/asyncDataUrl path as base.
        let finalUrl = null;
        try {
            const value = field.value();
            if (value && value.asyncDataUrl) {
                finalUrl = await value.asyncDataUrl();
            } else if (typeof value === "string" && value.length > 0) {
                finalUrl = value;
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: failed to load final image:", error.message);
            finalUrl = null;
        }
        if (well.setFinalDataUrl) {
            well.setFinalDataUrl(finalUrl);
        }

        // Preview (blurred back layer).
        let previewUrl = null;
        try {
            const previewValue = field.imageWellPreviewValue ? field.imageWellPreviewValue() : null;
            if (previewValue && previewValue.asyncDataUrl) {
                previewUrl = await previewValue.asyncDataUrl();
            }
        } catch (error) {
            console.warn("SvImageWellFieldTile: failed to load preview image:", error.message);
            previewUrl = null;
        }
        if (well.setPreviewDataUrl) {
            well.setPreviewDataUrl(previewUrl);
        }

        return this;
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
        const node = this.node();
        this.valueView().setIsEditable(node.valueIsEditable());
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

        if (field.valueIsEditable()) {
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
