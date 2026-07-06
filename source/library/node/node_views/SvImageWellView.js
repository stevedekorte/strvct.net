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
 * conforms to SvImageWellProgressiveProtocol (a stable, opt-in capability);
 * otherwise the well behaves byte-for-byte as before. In progressive mode the
 * box contains up to two absolutely-positioned, stacked layers plus optional
 * overlays:
 *
 *   - back layer  = a blurred preview image (e.g. a first/low-res image), shown
 *                   while work continues;
 *   - front layer = the sharp final image, starts at opacity 0 and crossfades
 *                   to opacity 1 when set;
 *   - shimmer     = a diagonal sheen sweeping across the box while working with
 *                   indeterminate progress;
 *
 * The box height is reserved with the padding-top percentage technique rather
 * than CSS `aspect-ratio`: the layers are position:absolute, so an intrinsic
 * height must come from somewhere. padding-top resolves against the box's own
 * width (which fills the column), so the box can never collapse to zero height
 * the way a bare `aspect-ratio` on a no-intrinsic-height flex child can.
 *
 * The view reads nothing from the model directly; it is driven entirely by the
 * setters the field tile calls (setAspectRatioString / setIsWorking /
 * setPreviewDataUrl / setFinalDataUrl). The view owns ALL
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
                0%   { background-position: 0% 50%; }
                100% { background-position: 100% 50%; }
            }
            .SvImageWellShimmerSheen {
                background-image: linear-gradient(115deg,
                    rgba(255,255,255,0) 0%,
                    rgba(255,255,255,0) 34%,
                    rgba(255,255,255,0.07) 44%,
                    rgba(255,255,255,0.13) 50%,
                    rgba(255,255,255,0.07) 56%,
                    rgba(255,255,255,0) 66%,
                    rgba(255,255,255,0) 100%);
                background-size: 250% 250%;
                animation: SvImageWellShimmer 3.4s ease-in-out infinite alternate;
                will-change: background-position;
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
         * @member {Number} finalFadeDurationMs - Duration (ms) of the final
         * image's focus-pull reveal (opacity + blur + scale). Longer than the
         * preview fade so the sharp image arrives gently rather than popping in.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("finalFadeDurationMs", 1800);
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
        /**
         * @member {Boolean} witnessedProgress - Whether THIS view instance has
         * actually displayed a non-terminal (working / shimmer / preview) state.
         * Views are created lazily and torn down freely, so a view may be built
         * with the final image already available (late join, reload, scroll-back
         * through recreated history) — it never witnessed the generation, so the
         * final must appear with NO reveal animation. Only a view that passed
         * through a placeholder plays the focus-pull reveal. Reset per instance
         * (default false); animation is a property of a transition the view saw,
         * not of a state that already existed.
         * @category Progressive Loading
         */
        {
            const slot = this.newSlot("witnessedProgress", false);
            slot.setSlotType("Boolean");
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
     * @description The final-image reveal duration in seconds, from finalFadeDurationMs.
     * @returns {Number} The final reveal duration in seconds.
     * @category Progressive Loading
     */
    finalFadeSeconds () {
        return this.finalFadeDurationMs() / 1000;
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
     * box. A "w:h" string reserves an aspect-ratio box; null means no reserved
     * box — the final image (if any) then renders at its natural size (see
     * restoreNaturalBox / setFinalDataUrl).
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
            this.restoreNaturalBox();
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
     * @description Drops the reserved-box reservation and restores natural
     * sizing so a final image can size the well to its own intrinsic aspect
     * (the "shown" terminal for a node that supplies no aspect ratio). Clears
     * any progressive layers/overlays first (there are normally none in natural
     * mode; defensive against a box→natural transition). Unlike the failed
     * teardown, this does NOT hide the well — it leaves room for the natural
     * image (setFinalDataUrl renders it via the base single-image path).
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    restoreNaturalBox () {
        this.clearBackLayer();
        this.clearFrontLayer();
        this.removeShimmer();
        this.setPaddingTop("0px");
        this.autoFitParentWidth();
        this.autoFitChildHeight(); // relative + fit-content, so a natural image sizes the well
        this.setMinHeight("0px");
        this.setMinHeightPx(0);
        this.setBorder("none");
        this.setBackgroundColor("transparent");
        return this;
    }

    /**
     * @description The FAILED terminal: generation ended in failure or was
     * interrupted. Stops the shimmer, clears every image layer (preview, final)
     * and the base image view, and collapses the reserved box to a zero-height,
     * transparent, borderless spacer so no blank frame lingers and the field's
     * key/error text lays out normally. Idempotent — safe to call on every sync
     * while the node reports failure.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    applyFailedState () {
        this.setIsWorking(false);
        this.clearBackLayer();
        this.clearFrontLayer();
        this.removeShimmer();
        if (this.imageView()) {
            this.removeSubview(this.imageView()); // willRemoveSubview nulls the slot
        }
        this.setPaddingTop("0px");
        this.setHeight("0px");
        this.setMinHeight("0px");
        this.setMinHeightPx(0);
        this.setBorder("none");
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
        if (aBool) {
            // We're about to display a non-terminal state (faint fill + shimmer),
            // so a later final reveal is a transition this view witnessed.
            this.setWitnessedProgress(true);
        }
        this.updateBackgroundFill();
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
            // Transition opacity, blur and scale together so the final reveal is
            // a focus-pull crossfade (see setFinalDataUrl), not an opacity-only
            // fade of an already-sharp image. Uses the longer finalFadeSeconds
            // and an ease-in-out curve so the image eases in gently rather than
            // popping over the preview.
            const s = this.finalFadeSeconds();
            v.setTransition("opacity " + s + "s ease-in-out, filter " + s + "s ease-in-out, transform " + s + "s ease-in-out");
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
            // Installing a blurred preview is a non-terminal state this view is
            // displaying, so a later final reveal is a transition it witnessed.
            this.setWitnessedProgress(true);
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
            // Preview cleared. Keep the visible blurred layer as a backdrop while
            // a final image is present/revealing (setFinalDataUrl removes it once
            // its crossfade completes) or while still working (a final is
            // imminent) — clearing it now would flash the empty box under the
            // slowly-fading-in final. Only clear outright when nothing else will.
            this._previewDataUrl = null;
            if (!this._finalDataUrl && !this._isWorking) {
                this.clearBackLayer();
            }
        }
        this.updateBackgroundFill();
        this.raiseOverlays(); // keep shimmer above the preview
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
     * @description Sets the sharp final (front layer) image data URL and reveals
     * it with a focus-pull crossfade: the final image starts blurred, slightly
     * scaled up and transparent, then animates opacity 0→1, blur → 0 and scale →
     * 1 simultaneously, so the image and its blur transition together (rather
     * than a sharp image snapping in over the preview). The deferred flip (after
     * a forced style flush) makes the CSS transition run reliably even when the
     * final arrives in the same frame the layer is configured. The blurred
     * preview stays fully opaque underneath during the reveal — so the reserved
     * box never shows through — and is removed once the crossfade completes.
     * The shimmer is removed once the final image is present.
     * @param {String|null} dataUrl - The data URL, or null to clear.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setFinalDataUrl (dataUrl) {
        // Natural-size terminal: no reserved box (null aspect ratio). Render the
        // final via the base single-image path — an SvImageView that sizes to
        // the image — exactly as a non-progressive well would. No reserved box,
        // no crossfade, no animation. This is the plain "shown" state for a node
        // that supplies no aspect ratio (e.g. a completed message that predates
        // the aspect slot).
        if (this.parsedAspectRatio(this.aspectRatioString()) === null) {
            this.setImageDataUrl(dataUrl);
            this._finalDataUrl = dataUrl;
            return this;
        }

        if (dataUrl === this._finalDataUrl) {
            return this;
        }
        this._finalDataUrl = dataUrl;
        if (dataUrl) {
            const front = this.frontLayer();
            front.setBackgroundImage("url(\"" + dataUrl + "\")");
            if (!this.witnessedProgress()) {
                // Cold completion: this view never displayed a placeholder for
                // this content (late join, reload, scroll-back through recreated
                // history), so there is no transition to animate — snap the final
                // in at full opacity, no blur, no timers. Disable the layer's
                // transition so the 0→1 flip doesn't animate.
                front.setTransition("none");
                front.setOpacity(1);
                front.setFilter("blur(0px)");
                front.setTransform("scale(1)");
                this.clearBackLayer();
                this.removeShimmer();
            } else {
                // Witnessed a placeholder → focus-pull reveal: start blurred,
                // scaled up and transparent, then animate opacity 0→1, blur → 0
                // and scale → 1 together.
                front.setOpacity(0);
                front.setFilter("blur(" + this.blurRadiusPx() + "px)"); // start blurred, matching the preview
                front.setTransform("scale(1.06)"); // hide blurred edges bleeding past the box
                front.element().offsetHeight; // force style flush so the transitions run
                this.addWeakTimeout(() => {
                    // Fade in while sharpening and settling — image + blur as one.
                    front.setOpacity(1);
                    front.setFilter("blur(0px)");
                    front.setTransform("scale(1)");
                }, 16);
                // After the reveal completes, drop the now-hidden blurred preview.
                this.addWeakTimeout(() => {
                    this.clearBackLayer();
                }, this.finalFadeDurationMs() + 100);
                // The final image is here: stop working indicators.
                this.removeShimmer();
            }
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
     * final image yet.
     * @returns {Boolean}
     * @category Progressive Loading
     */
    shouldShowShimmer () {
        return !!(this.shimmerEnabled() && this._isWorking && !this._finalDataUrl);
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
        // Full-bleed sheen: a large, soft diagonal highlight that drifts (and
        // gently reverses) across the whole box via background-position, so it
        // reads as flowing light rather than a band with edges marching past.
        // The gradient + animation live in the SvImageWellShimmerSheen class.
        const sheen = SvFlexDomView.clone();
        sheen.setPosition("absolute");
        sheen.setTop("0px");
        sheen.setBottom("0px");
        sheen.setLeft("0px");
        sheen.setRight("0px");
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

    /**
     * @description Re-adds the shimmer overlay after image layers were (re)added,
     * so it always stacks above the images. No-op when the overlay isn't
     * currently shown.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    raiseOverlays () {
        const shimmer = this.shimmerView();
        if (shimmer) {
            this.removeSubview(shimmer);
            this.addSubview(shimmer);
        }
        return this;
    }

}.initThisClass());
