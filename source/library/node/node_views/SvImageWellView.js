/**
 * @module library.node.node_views
 */

/**
 * @class SvImageWellView
 * @extends SvNodeView
 * @classdesc SvImageWellView
 *
 * - designed to contain an ImageView
 * - can have its own frame and decoration
 * - supports drag & drop of images
 *
 * PROGRESSIVE MODE (opt-in):
 *
 * In addition to the plain single-image behavior (setImageDataUrl / child
 * SvImageView), this view can render an aspect-ratio-reserved box that reveals
 * content progressively. The field tile engages this mode only when the node
 * opts in via the progressive protocol on SvImageWellField (a non-null aspect
 * ratio or a "working" flag); otherwise the well behaves byte-for-byte as
 * before. In progressive mode the box contains up to two absolutely-positioned,
 * stacked layers plus optional overlays:
 *
 *   - back layer  = a blurred preview image (e.g. a first/low-res image), shown
 *                   while work continues;
 *   - front layer = the sharp final image, starts at opacity 0 and crossfades
 *                   to opacity 1 when set;
 *   - shimmer     = a diagonal sheen sweeping across the box while working with
 *                   indeterminate progress;
 *   - progress    = a slim determinate progress bar shown only when a numeric
 *                   progress in [0, 1] is supplied.
 *
 * The box height is reserved with the padding-top percentage technique rather
 * than CSS `aspect-ratio`: the layers are position:absolute, so an intrinsic
 * height must come from somewhere. padding-top resolves against the box's own
 * width (which fills the column), so the box can never collapse to zero height
 * the way a bare `aspect-ratio` on a no-intrinsic-height flex child can.
 *
 * The view reads nothing from the model directly; it is driven entirely by the
 * setters the field tile calls (setAspectRatioString / setIsWorking /
 * setProgress / setPreviewDataUrl / setFinalDataUrl). The view owns ALL
 * blur / shimmer / animation decisions — a node only supplies data.
 */


"use strict";

(class SvImageWellView extends SvNodeView {

    /**
     * @description Injects the shimmer @keyframes once per document. Guarded by
     * a class slot so repeated view construction doesn't append duplicate style
     * elements (addStyleSheetString is not idempotent).
     * @category Initialization
     */
    static initClass () {
        this.newClassSlot("didInstallShimmerCss", false);
    }

    /**
     * @description Installs the shimmer keyframes stylesheet exactly once.
     * @returns {SvImageWellView} The class.
     * @category Styling
     */
    static installShimmerCssIfNeeded () {
        if (this.didInstallShimmerCss()) {
            return this;
        }
        SvWebDocument.shared().addStyleSheetString(`
            @keyframes SvImageWellShimmer {
                0% { transform: translateX(-180%) rotate(20deg); }
                100% { transform: translateX(280%) rotate(20deg); }
            }
            .SvImageWellShimmerSheen {
                animation: SvImageWellShimmer 1.4s ease-in-out infinite;
            }
        `);
        this.setDidInstallShimmerCss(true);
        return this;
    }

    /**
     * @description Initializes prototype slots for the SvImageWellView.
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {ImageView} imageView - The image view contained within this well.
         * @category View Management
         */
        {
            const slot = this.newSlot("imageView", null);
            slot.setSlotType("SvImageView");
        }
        /**
         * @member {Boolean} isEditable - Determines if the image well is editable.
         * @category State Management
         */
        {
            const slot = this.newSlot("isEditable", true);
            slot.setSlotType("Boolean");
        }

        // --- Progressive-mode presentation slots (settable, sensible defaults) ---

        /**
         * @member {Number} blurRadiusPx - Blur radius (px) applied to the preview
         * back layer. All preview blur derives from this. Read at layer-creation
         * time, so set it before the first preview is shown.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("blurRadiusPx", 16);
            slot.setSlotType("Number");
        }
        /**
         * @member {Number} fadeDurationMs - Fade/crossfade duration (ms) driving
         * all layer transitions and the crossfade / drop-back-layer timeouts.
         * Read at layer-creation time (layers are created lazily), so set it
         * before the first image is shown; the default 1000 guarantees this.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("fadeDurationMs", 1000);
            slot.setSlotType("Number");
        }
        /**
         * @member {Boolean} shimmerEnabled - Whether the shimmer sheen is shown
         * while working with indeterminate progress.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("shimmerEnabled", true);
            slot.setSlotType("Boolean");
        }

        // --- Progressive-mode internal state ---

        /**
         * @member {String} aspectRatioString - "w:h" (e.g. "5:3"); null → plain
         * base behavior (no reserved box).
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("aspectRatioString", null);
            slot.setSlotType("String");
        }
        /**
         * @member {Boolean} isWorking - Whether work is in progress.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("isWorking", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Number} progress - Determinate progress in [0, 1], or null
         * for indeterminate (shimmer).
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("progress", null);
            slot.setSlotType("Number");
        }
        /**
         * @member {SvFlexDomView} backLayerView - Current (topmost) blurred preview layer.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("backLayerView", null);
            slot.setSlotType("SvFlexDomView");
        }
        /**
         * @member {SvFlexDomView} outgoingBackLayerView - The previous blurred
         * preview layer during a preview→preview crossfade: it stays fully opaque
         * underneath the incoming layer and is removed only once the incoming
         * fade completes. Tracked so a rapid subsequent swap (or a mid-swap
         * teardown) never leaks it.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("outgoingBackLayerView", null);
            slot.setSlotType("SvFlexDomView");
        }
        /**
         * @member {SvFlexDomView} frontLayerView - The sharp final image layer.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("frontLayerView", null);
            slot.setSlotType("SvFlexDomView");
        }
        /**
         * @member {SvFlexDomView} shimmerView - The animated shimmer overlay.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("shimmerView", null);
            slot.setSlotType("SvFlexDomView");
        }
        /**
         * @member {SvFlexDomView} progressTrackView - The determinate progress bar track.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("progressTrackView", null);
            slot.setSlotType("SvFlexDomView");
        }
        /**
         * @member {SvFlexDomView} progressFillView - The determinate progress bar fill.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("progressFillView", null);
            slot.setSlotType("SvFlexDomView");
        }
        /**
         * @member {String} previewDataUrl - The current blurred preview data URL.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("previewDataUrl", null);
            slot.setSlotType("String");
        }
        /**
         * @member {String} finalDataUrl - The current sharp final data URL.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("finalDataUrl", null);
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the SvImageWellView.
     * @returns {SvImageWellView} The initialized SvImageWellView instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("flex");
        this.setPosition("relative");
        this.setJustifyContent("center");
        this.setAlignItems("center");
        this.setMinHeight("10em");
        this.setMinWidth("10em");
        this.setOverflowX("hidden");
        this.setOverflowY("hidden");
        this.setBorder("1px solid #444");
        this.setColor("white");
        this.setBackgroundColor("transparent");

        this.setIsRegisteredForBrowserDrop(true);
        this.dragUnhighlight();
        this.turnOffUserSelect();
        this.autoFitParentWidth();
        this.autoFitChildHeight();
        this.setMinHeightPx(100);
        this.setPadding("0px");
        return this;
    }

    /**
     * @description Synchronizes the view with its associated node.
     * @returns {SvImageWellView} The current SvImageWellView instance.
     * @category Synchronization
     */
    syncToNode () {
        super.syncToNode();
        const node = this.node();
        if (this.imageView() && node) {
            const dataUrl = this.imageView().dataURL();
            if (node.setBlobFromDataURL) {
                node.setBlobFromDataURL(dataUrl);
            }
        }
        this.tellParentViews("didUpdateImageWellView", this);
        return this;
    }

    /**
     * @description Checks if the image well is editable.
     * @returns {Boolean} True if editable, false otherwise.
     * @category State Management
     */
    isEditable () {
        // we need this to override the normal isContentEditable return value
        return this._isEditable;
    }

    /**
     * @description Sets the editable state of the image well.
     * @param {Boolean} aBool - The new editable state.
     * @returns {SvImageWellView} The current SvImageWellView instance.
     * @category State Management
     */
    setIsEditable (aBool) {
        this._isEditable = aBool;
        if (this.imageView()) {
            this.imageView().setIsEditable(aBool);
        }
        return this;
    }

    /**
     * @description Highlights the image well during drag operations.
     * @category Visual Feedback
     */
    dragHighlight () {
        this.setBackgroundColor("rgba(128, 128, 128, 0.5)");
    }

    /**
     * @description Removes the highlight from the image well after drag operations.
     * @category Visual Feedback
     */
    dragUnhighlight () {
        this.setBackgroundColor("transparent");
    }

    /**
     * @description Checks if the image well is full (contains an image).
     * @returns {Boolean} True if full, false otherwise.
     * @category State Management
     */
    isFull () {
        //console.log("this.imageView().dataURL()  = ", this.imageView().dataURL() );
        return this.subviews().length > 0;
    }

    /**
     * @description Determines if the image well accepts drops.
     * @param {Event} event - The drop event.
     * @returns {Boolean} Always returns true in this implementation.
     * @category Drag and Drop
     */
    acceptsDrop (/*event*/) {
        //return true;
        return this.isEditable();
    }

    /*
    onBrowserDrop (event) {
        return super.onBrowserDrop(event);
    }

    onBrowserDragOver (event) {
        const r =  super.onBrowserDragOver(event);
        //console.log(this.svDebugId() + " onBrowserDragOver() -> " + r);
        return r;
    }
    */

    /**
     * @description Sets the value of the image well (its image data URL).
     * @param {string} aValue - The image data URL.
     * @returns {SvImageWellView} The current SvImageWellView instance.
     * @category Data Management
     */
    setValue (aValue) {
        this.setImageDataUrl(aValue);
        return this;
    }

    /**
     * @description Gets the value of the image well (its image data URL).
     * @returns {string|null} The image data URL or null if not set.
     * @category Data Management
     */
    value () {
        return this.imageDataUrl();
    }

    /**
     * @description Sets the image data URL for the image well.
     * @param {string} dataURL - The image data URL.
     * @returns {SvImageWellView} The current SvImageWellView instance.
     * @category Data Management
     */
    setImageDataUrl (dataURL) {
        assert(!Type.isArray(dataURL));

        if (this.hasImageUrl(dataURL)) {
            return this;
        }

        this.removeAllSubviews();

        const v = SvImageView.clone();
        this.setImageView(v);
        this.addSubview(v);

        if (!Type.isNullOrUndefined(dataURL) && Type.isString(dataURL) && dataURL.length > 0) {
            /*
            const v = SvImageView.clone();
            this.setImageView(v);
            this.addSubview(v);
            */

            v.asyncFetchDataURLFromSrc(dataURL);
            v.autoFitChildHeight();
            v.autoFitParentWidth();
        }

        return this;
    }

    /**
     * @description Checks if the image well already has the given image URL.
     * @param {string} url - The URL to check.
     * @returns {Boolean} True if the image well has the URL, false otherwise.
     * @category Data Management
     */
    hasImageUrl (url) {
        const v = this.imageView();
        if (v) {
            if (url === v.dataURL() || url === v.srcUrl()) {
                return true;
            }
        }
        return false;
    }

    /**
     * @description Gets the current image data URL.
     * @returns {string|null} The image data URL or null if not set.
     * @category Data Management
     */
    imageDataUrl () {
        const v = this.imageView();
        if (v && v.dataURL()) {
            return v.dataURL();
        }
        return null;
    }


    // need these as method name is constructed from MIME type

    /**
     * @description Handles browser drop of JPEG images.
     * @param {Object} dataChunk - The dropped image data.
     * @category Drag and Drop
     */
    onBrowserDropImageJpeg (dataChunk) {
        this.droppedImageData(dataChunk);
    }

    /**
     * @description Handles browser drop of GIF images.
     * @param {Object} dataChunk - The dropped image data.
     * @category Drag and Drop
     */
    onBrowserDropImageGif (dataChunk) {
        this.droppedImageData(dataChunk);
    }

    /**
     * @description Handles browser drop of PNG images.
     * @param {Object} dataChunk - The dropped image data.
     * @category Drag and Drop
     */
    onBrowserDropImagePng (dataChunk) {
        this.droppedImageData(dataChunk);
    }

    /**
     * @description Handles browser drop of WebP images.
     * @param {Object} dataChunk - The dropped image data.
     * @category Drag and Drop
     */
    onBrowserDropImageWebp (dataChunk) {
        this.droppedImageData(dataChunk);
    }

    // image data chunk

    /**
     * @description Processes dropped image data.
     * @param {Object} dataChunk - The dropped image data.
     * @returns {SvImageWellView} The current SvImageWellView instance.
     * @category Drag and Drop
     */
    droppedImageData (dataChunk) {
        this.setImageDataUrl(dataChunk.dataUrl());
        this.scheduleSyncToNode();
        return this;
    }

    /**
     * @description Called before removing a subview.
     * @param {Object} aSubview - The subview being removed.
     * @returns {SvImageWellView} The current SvImageWellView instance.
     * @category View Management
     */
    willRemoveSubview (aSubview) {
        super.willRemoveSubview(aSubview);

        if (aSubview === this.imageView()) {
            this.setImageView(null);
        }
        return this;
    }

    // ===================================================================
    // Progressive mode (opt-in). None of the below runs unless the tile
    // calls these setters — the plain single-image path above is unchanged.
    // ===================================================================

    /**
     * @description The fade duration in seconds, derived from fadeDurationMs.
     * @returns {Number} The fade duration in seconds.
     * @category Progressive Loading
     */
    fadeSeconds () {
        return this.fadeDurationMs() / 1000;
    }

    /**
     * @description Parses a "w:h" string into a numeric [w, h] pair, or null.
     * @param {String} str - The aspect-ratio string.
     * @returns {Array|null} [w, h] or null if unparseable.
     * @category Progressive Loading
     */
    parsedAspectRatio (str) {
        if (!str || typeof str !== "string") {
            return null;
        }
        const parts = str.split(":");
        if (parts.length !== 2) {
            return null;
        }
        const w = Number(parts[0]);
        const h = Number(parts[1]);
        if (!(w > 0) || !(h > 0)) {
            return null;
        }
        return [w, h];
    }

    /**
     * @description Sets the target aspect-ratio string and (re)configures the
     * box. Passing null collapses the reservation and restores plain base
     * behavior (used for the error-teardown path).
     * @param {String|null} str - A "w:h" string, or null.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setAspectRatioString (str) {
        if (str === this._aspectRatioString) {
            return this;
        }
        this._aspectRatioString = str;
        const wh = this.parsedAspectRatio(str);
        if (wh) {
            this.applyAspectRatioBox(wh[0], wh[1]);
        } else {
            this.collapseAspectRatioBox();
        }
        return this;
    }

    /**
     * @description Configures this well as an aspect-ratio-reserved box using
     * the padding-top percentage technique. Relaxes the base min-height /
     * autoFitChildHeight so the box height is driven by the aspect ratio.
     * @param {Number} w - Width ratio component.
     * @param {Number} h - Height ratio component.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    applyAspectRatioBox (w, h) {
        this.autoFitParentWidth(); // width fills the column
        this.setMinHeight("0px");
        this.setMinHeightPx(0);
        this.setMinWidth("0px");
        this.setHeight("0px"); // height comes entirely from padding-top
        this.setPadding("0px");
        this.setPaddingTop((100 * h / w) + "%"); // reserve the box; % resolves against width
        this.setPosition("relative");
        this.setOverflow("hidden");
        this.setBorder("none"); // no frame around a reserved placeholder
        this.setBorderRadius("0.4em");
        this.updateBackgroundFill();
        return this;
    }

    /**
     * @description Tears the reserved box down: drops all layers/overlays and
     * restores the well to a zero-height, transparent, non-reserving state so
     * the base (or the surrounding error-status text) lays out normally.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    collapseAspectRatioBox () {
        this.clearBackLayer();
        this.clearFrontLayer();
        this.removeShimmer();
        this.removeProgressBar();
        this.setPaddingTop("0px");
        this.setHeight("0px");
        this.setBorderRadius("0px");
        this.setBackgroundColor("transparent");
        return this;
    }

    /**
     * @description Reflects the working flag: a faint fill while there's no
     * image yet, transparent otherwise; also refreshes the shimmer overlay.
     * @param {Boolean} aBool - Whether work is in progress.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setIsWorking (aBool) {
        this._isWorking = aBool;
        this.updateBackgroundFill();
        this.updateShimmer();
        return this;
    }

    /**
     * @description Sets determinate progress in [0, 1], or null for
     * indeterminate. Refreshes the progress bar and shimmer.
     * @param {Number|null} aNumber - Progress in [0, 1], or null.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setProgress (aNumber) {
        this._progress = aNumber;
        this.updateProgressBar();
        this.updateShimmer();
        return this;
    }

    /**
     * @description Applies the faint placeholder fill only while working with no
     * image yet; transparent otherwise.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    updateBackgroundFill () {
        const hasAnyImage = !!(this._previewDataUrl || this._finalDataUrl);
        if (this._isWorking && !hasAnyImage) {
            this.setBackgroundColor("rgba(255, 255, 255, 0.05)");
        } else {
            this.setBackgroundColor("transparent");
        }
        return this;
    }

    /**
     * @description Lazily builds a full-bleed, absolutely-positioned layer view.
     * @returns {SvFlexDomView}
     * @category Progressive Loading
     */
    newLayerView () {
        const v = SvFlexDomView.clone();
        v.setPosition("absolute");
        // Stretch to fill the well's padding box via all four offsets. The box
        // reserves its height with padding-top (content-height is 0), so a
        // layer sized with height:100% would collapse to 0 — top/bottom/left/
        // right:0 stretch it to the full padded box instead. NOTE: don't use
        // setInset — in this framework it (mis)maps to the `position` property.
        v.setTop("0px");
        v.setLeft("0px");
        v.setRight("0px");
        v.setBottom("0px");
        v.makeBackgroundCover();
        v.makeBackgroundCentered();
        v.makeBackgroundNoRepeat();
        v.turnOffUserSelect();
        return v;
    }

    /**
     * @description Builds a fully-configured blurred preview layer for the given
     * data URL, adds it as a subview, and returns it. Shared by the first-image
     * path and the crossfade swap so the two can't drift. The layer starts at
     * opacity 0 (callers fade it up) with the background image already set, blur
     * from blurRadiusPx(), scale(1.06) to hide blurred edges bleeding past the
     * box, and a transition on opacity + filter (preview swaps fade; blur
     * dissolves under the final). zIndex 0 keeps it below the sharp front layer
     * (zIndex 1); layers added later stack above earlier ones at the same
     * zIndex.
     * @param {String} dataUrl - The data URL to show in the layer.
     * @returns {SvFlexDomView}
     * @category Progressive Loading
     */
    newPreviewLayerForUrl (dataUrl) {
        const v = this.newLayerView();
        v.setFilter("blur(" + this.blurRadiusPx() + "px)");
        v.setTransform("scale(1.06)"); // hide blurred edges bleeding past the box
        const s = this.fadeSeconds();
        v.setTransition("opacity " + s + "s, filter " + s + "s");
        v.setOpacity(0); // callers fade it in
        v.setZIndex(0);
        v.setBackgroundImage("url(\"" + dataUrl + "\")");
        this.addSubview(v);
        return v;
    }

    /**
     * @description Lazily creates the sharp front (final) layer.
     * @returns {SvFlexDomView}
     * @category Progressive Loading
     */
    frontLayer () {
        if (!this.frontLayerView()) {
            const v = this.newLayerView();
            v.setOpacity(0);
            v.setTransition("opacity " + this.fadeSeconds() + "s");
            v.setZIndex(1);
            this.setFrontLayerView(v);
            this.addSubview(v);
        }
        return this.frontLayerView();
    }

    /**
     * @description Sets the blurred preview (back layer) image data URL. The
     * first image fades up from the faint working fill. Replacing an existing
     * image is a TRUE crossfade: a new blurred layer for the new url is added ON
     * TOP of the outgoing layer (which stays fully opaque underneath) and faded
     * in; the outgoing layer is removed only after the incoming fade completes,
     * so the box is never revealed between images. A rapid subsequent swap snaps
     * away any still-animating outgoing layer first so layers can't leak.
     * @param {String|null} dataUrl - The data URL, or null to clear.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setPreviewDataUrl (dataUrl) {
        if (dataUrl === this._previewDataUrl) {
            return this;
        }
        const hadImage = !!this._previewDataUrl;
        this._previewDataUrl = dataUrl;
        if (dataUrl) {
            if (hadImage) {
                // Crossfade: fade a new blurred layer in over the outgoing one.
                this.removeOutgoingBackLayer();
                const oldLayer = this.backLayerView();
                this.setOutgoingBackLayerView(oldLayer); // stays opaque underneath
                const newLayer = this.newPreviewLayerForUrl(dataUrl); // opacity 0, above oldLayer
                this.setBackLayerView(newLayer);
                newLayer.element().offsetHeight; // force style flush so the transition runs
                this.addWeakTimeout(() => {
                    if (this.backLayerView() === newLayer) {
                        newLayer.setOpacity(1);
                    }
                }, 16);
                // Remove the outgoing layer only after the incoming fade completes.
                this.addWeakTimeout(() => {
                    if (this.outgoingBackLayerView() === oldLayer) {
                        this.removeOutgoingBackLayer();
                    }
                }, this.fadeDurationMs() + 100);
            } else {
                // First image: fade up from the faint working fill.
                const newLayer = this.newPreviewLayerForUrl(dataUrl);
                this.setBackLayerView(newLayer);
                newLayer.element().offsetHeight; // force style flush so the transition runs
                this.addWeakTimeout(() => {
                    if (this.backLayerView() === newLayer) {
                        newLayer.setOpacity(1);
                    }
                }, 16);
            }
        } else {
            this.clearBackLayer();
        }
        this.updateBackgroundFill();
        this.raiseOverlays(); // keep shimmer/progress above the preview
        return this;
    }

    /**
     * @description Removes the outgoing preview layer (if any) from a crossfade.
     * Guarded so it's safe to call when the layer is already gone (teardown /
     * repeated swaps).
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    removeOutgoingBackLayer () {
        const v = this.outgoingBackLayerView();
        if (v) {
            this.removeSubview(v);
            this.setOutgoingBackLayerView(null);
        }
        return this;
    }

    /**
     * @description Sets the sharp final (front layer) image data URL and
     * crossfades it in. The opacity flip is deferred (after a forced style
     * flush) so the CSS transition reliably animates even when the final
     * arrives through a scheduler-driven sync in the same frame the layer is
     * configured. While the front fades in, the blurred back layer's blur
     * animates to 0 so the reveal reads as the blur dissolving; the back layer
     * is dropped once the crossfade completes. Shimmer/progress are removed once
     * the final image is present.
     * @param {String|null} dataUrl - The data URL, or null to clear.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setFinalDataUrl (dataUrl) {
        if (dataUrl === this._finalDataUrl) {
            return this;
        }
        this._finalDataUrl = dataUrl;
        if (dataUrl) {
            const front = this.frontLayer();
            front.setBackgroundImage("url(\"" + dataUrl + "\")");
            front.setOpacity(0);
            front.element().offsetHeight; // force style flush so the opacity flip transitions
            this.addWeakTimeout(() => {
                front.setOpacity(1);
                if (this.backLayerView()) {
                    this.backLayerView().setFilter("blur(0px)"); // blur dissolves under the fade
                }
            }, 16);
            // After the crossfade completes, drop the now-hidden blurred layer.
            this.addWeakTimeout(() => {
                this.clearBackLayer();
            }, this.fadeDurationMs() + 100);
            // The final image is here: stop working indicators.
            this.removeShimmer();
            this.removeProgressBar();
        } else if (this.frontLayerView()) {
            this.frontLayerView().setBackgroundImage(null);
            this.frontLayerView().setOpacity(0);
        }
        this.updateBackgroundFill();
        return this;
    }

    /**
     * @description Removes ALL blurred preview layers — the current back layer
     * and any outgoing layer still present from an in-flight crossfade — so
     * nothing lingers under the final image or after an error/clear.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    clearBackLayer () {
        const v = this.backLayerView();
        if (v) {
            this.removeSubview(v);
            this.setBackLayerView(null);
        }
        this.removeOutgoingBackLayer();
        this._previewDataUrl = null;
        return this;
    }

    /**
     * @description Removes the sharp front (final) layer.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    clearFrontLayer () {
        const v = this.frontLayerView();
        if (v) {
            this.removeSubview(v);
            this.setFrontLayerView(null);
        }
        this._finalDataUrl = null;
        return this;
    }

    // --- Shimmer overlay ---

    /**
     * @description True when the shimmer should be shown: enabled, working, no
     * final image yet, and progress is indeterminate (null).
     * @returns {Boolean}
     * @category Progressive Loading
     */
    shouldShowShimmer () {
        return !!(this.shimmerEnabled() && this._isWorking && !this._finalDataUrl && this._progress == null);
    }

    /**
     * @description Adds or removes the shimmer overlay to match shouldShowShimmer().
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    updateShimmer () {
        if (this.shouldShowShimmer()) {
            this.ensureShimmer();
        } else {
            this.removeShimmer();
        }
        return this;
    }

    /**
     * @description Lazily builds the diagonal shimmer sheen overlay. The sheen
     * is a wide, slightly-transparent white gradient band that animates across
     * the box via the SvImageWellShimmer keyframes. It overlays whether or not a
     * preview image is present (it sits above both the empty box and the blurred
     * preview) and ignores pointer events. zIndex 2 keeps it above the front
     * layer (zIndex 1).
     * @returns {SvFlexDomView}
     * @category Progressive Loading
     */
    ensureShimmer () {
        if (this.shimmerView()) {
            return this.shimmerView();
        }
        SvImageWellView.installShimmerCssIfNeeded();
        const v = SvFlexDomView.clone();
        v.setPosition("absolute");
        v.setTop("0px");
        v.setLeft("0px");
        v.setRight("0px");
        v.setBottom("0px");
        v.setZIndex(2);
        v.setOverflow("hidden");
        v.setPointerEvents("none");
        v.turnOffUserSelect();
        // Inner sheen band that translates across the box.
        const sheen = SvFlexDomView.clone();
        sheen.setPosition("absolute");
        sheen.setTop("-50%");
        sheen.setBottom("-50%");
        sheen.setWidth("60%");
        sheen.setLeft("0px");
        sheen.setBackgroundImage("linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0) 100%)");
        sheen.setElementClassName("SvImageWellShimmerSheen"); // drives the SvImageWellShimmer animation
        v.addSubview(sheen);
        this.setShimmerView(v);
        this.addSubview(v);
        return v;
    }

    /**
     * @description Removes the shimmer overlay if present.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    removeShimmer () {
        const v = this.shimmerView();
        if (v) {
            this.removeSubview(v);
            this.setShimmerView(null);
        }
        return this;
    }

    // --- Determinate progress bar ---

    /**
     * @description Adds/updates or removes the slim determinate progress bar to
     * match the current progress value (shown only when progress != null).
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    updateProgressBar () {
        if (this._progress == null || this._finalDataUrl) {
            this.removeProgressBar();
            return this;
        }
        this.ensureProgressBar();
        const clamped = Math.max(0, Math.min(1, this._progress));
        this.progressFillView().setWidth((clamped * 100) + "%");
        return this;
    }

    /**
     * @description Lazily builds the slim, unobtrusive determinate progress bar
     * pinned to the bottom edge of the box (a faint track with a lighter fill).
     * zIndex 3 keeps it above the shimmer and layers. Ignores pointer events.
     * @returns {SvFlexDomView}
     * @category Progressive Loading
     */
    ensureProgressBar () {
        if (this.progressTrackView()) {
            return this.progressTrackView();
        }
        const track = SvFlexDomView.clone();
        track.setPosition("absolute");
        track.setLeft("0px");
        track.setRight("0px");
        track.setBottom("0px");
        track.setHeight("3px");
        track.setZIndex(3);
        track.setBackgroundColor("rgba(255, 255, 255, 0.12)");
        track.setPointerEvents("none");
        track.turnOffUserSelect();

        const fill = SvFlexDomView.clone();
        fill.setPosition("absolute");
        fill.setLeft("0px");
        fill.setTop("0px");
        fill.setBottom("0px");
        fill.setWidth("0%");
        fill.setBackgroundColor("rgba(255, 255, 255, 0.75)");
        fill.setTransition("width 0.3s ease");
        track.addSubview(fill);

        this.setProgressFillView(fill);
        this.setProgressTrackView(track);
        this.addSubview(track);
        return track;
    }

    /**
     * @description Removes the determinate progress bar if present.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    removeProgressBar () {
        const track = this.progressTrackView();
        if (track) {
            this.removeSubview(track);
            this.setProgressTrackView(null);
            this.setProgressFillView(null);
        }
        return this;
    }

    /**
     * @description Re-adds the shimmer and progress overlays after image layers
     * were (re)added, so they always stack above the images. No-op when the
     * overlays aren't currently shown.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    raiseOverlays () {
        const shimmer = this.shimmerView();
        if (shimmer) {
            this.removeSubview(shimmer);
            this.addSubview(shimmer);
        }
        const track = this.progressTrackView();
        if (track) {
            this.removeSubview(track);
            this.addSubview(track);
        }
        return this;
    }

}.initThisClass());
