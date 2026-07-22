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
 * conforms to SvProgressiveImageSourceProtocol (a stable, opt-in capability);
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
     * @description Installs the shimmer stylesheet once at class-init time,
     * reusing the SvBadgeView.setupCss() idiom (initPrototype runs once per
     * class). addStyleSheetString is a no-op off-browser, so this is safe to
     * call headlessly — no runtime guard slot needed.
     * @category Initialization
     */
    initPrototype () {
        // (shimmer keyframes/sheen CSS moved to SvShimmerOverlayView — the
        // shared loading affordance used here and by tile thumbnails)
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

        // Null any slot that referenced the removed view so a subview wipe (the
        // base path's removeAllSubviews, or applyFailedState) can never leave a
        // dangling reference to a detached layer. Mirrors the imageView() case.
        if (aSubview === this.imageView()) {
            this.setImageView(null);
        }
        if (aSubview === this.backLayerView()) {
            this.setBackLayerView(null);
        }
        if (aSubview === this.outgoingBackLayerView()) {
            this.setOutgoingBackLayerView(null);
        }
        if (aSubview === this.frontLayerView()) {
            this.setFrontLayerView(null);
        }
        if (aSubview === this.shimmerView()) {
            this.setShimmerView(null);
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
     * image (applyFinalDataUrl renders it via the base single-image path).
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
     * @description The single explicit render state, derived from the well's own
     * slots, so presentation reads one source of truth instead of re-deriving it
     * from scattered slot cross-checks. One of:
     *   "natural"  - no reserved box (null aspect); final renders at natural size
     *   "revealed" - a final image is present
     *   "preview"  - a blurred preview is showing while work continues
     *   "working"  - working with nothing to show yet
     *   "idle"     - nothing to show
     * The FAILED terminal is driven by the node flag via applyFailedState(),
     * which clears every slot, so this reports "idle" once torn down.
     * @returns {String} The render state.
     * @category Progressive Loading
     */
    renderState () {
        if (this.parsedAspectRatio(this.aspectRatioString()) === null) {
            return "natural";
        }
        if (this.finalDataUrl()) {
            return "revealed";
        }
        if (this.previewDataUrl()) {
            return "preview";
        }
        if (this.isWorking()) {
            return "working";
        }
        return "idle";
    }

    /**
     * @description Reflects the working flag: a faint fill while there's no
     * image yet, transparent otherwise; also refreshes the shimmer overlay.
     * @param {Boolean} aBool - Whether work is in progress.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setIsWorking (aBool) {
        if (aBool === this._isWorking) {
            return this;
        }
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
     * image yet ("working" render state); transparent otherwise.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    updateBackgroundFill () {
        if (this.renderState() === "working") {
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
        // Fill the well's padding box. The box reserves its height with
        // padding-top (content-height is 0), so a layer sized with height:100%
        // would collapse to 0 — inset:0 stretches it to the full padded box.
        v.setInset("0px");
        v.makeBackgroundCover();
        v.makeBackgroundCentered();
        v.makeBackgroundNoRepeat();
        v.turnOffUserSelect();
        return v;
    }

    /**
     * @description The shared "force the transition to run" idiom: reading the
     * view's offsetHeight flushes the just-set starting style so the browser
     * commits it before the flip, then the change is applied on the next tick so
     * the CSS transition actually animates (even when the layer was created in
     * the same frame). Used by every layer fade-in / focus-pull reveal.
     * @param {Function} aFunc - The style change to apply after the flush.
     * @param {SvDomView} aView - The view whose layout to flush.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    flushStyleThen (aFunc, aView) {
        aView.element().offsetHeight; // force style flush so the transition runs
        this.addWeakTimeout(aFunc, 16);
        return this;
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
            // a focus-pull crossfade (see applyFinalDataUrl), not an opacity-only
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
    applyPreviewDataUrl (dataUrl) {
        if (dataUrl === this.previewDataUrl()) {
            return this;
        }
        this.setPreviewDataUrl(dataUrl);
        if (dataUrl) {
            // Installing a blurred preview counts as witnessed PROGRESS only
            // while generation is actually in flight (isWorking). A preview
            // covering mere fetch latency for an already-complete image
            // (reload, scroll-back, late join — the final's blob resolves a
            // sync later) is not a transition worth animating: the final must
            // snap in sharp, not play the focus-pull reveal.
            if (this.isWorking()) {
                this.setWitnessedProgress(true);
            }
            // Crossfade the new blurred layer in over the outgoing one (which
            // stays opaque underneath and is removed once the incoming fade
            // completes, so the box never shows through). removeOutgoingBackLayer
            // is null-safe, so the very first image takes this same path with no
            // previous layer.
            this.removeOutgoingBackLayer();
            const oldLayer = this.backLayerView();
            this.setOutgoingBackLayerView(oldLayer); // null on first image
            const newLayer = this.newPreviewLayerForUrl(dataUrl); // opacity 0, above oldLayer
            this.setBackLayerView(newLayer);
            this.flushStyleThen(() => {
                if (this.backLayerView() === newLayer) {
                    newLayer.setOpacity(1);
                }
            }, newLayer);
            this.addWeakTimeout(() => {
                if (this.outgoingBackLayerView() === oldLayer) {
                    this.removeOutgoingBackLayer();
                }
            }, this.fadeDurationMs() + 100);
        } else {
            // Preview cleared. Keep the visible blurred layer as a backdrop while
            // a final image is present/revealing (applyFinalDataUrl removes it
            // once its crossfade completes) or while still working (a final is
            // imminent) — clearing it now would flash the empty box under the
            // slowly-fading-in final. Only clear outright when nothing else will.
            if (!this.finalDataUrl() && !this.isWorking()) {
                this.clearBackLayer();
            }
        }
        this.updateBackgroundFill();
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
     * @description One idempotent render pass for the two progressive image
     * inputs. Applies the final and preview in the single always-correct order
     * (final first), so callers need not order their inputs — see the inline
     * note for why.
     * @param {String|null} finalUrl - The sharp final image data URL, or null.
     * @param {String|null} previewUrl - The blurred preview data URL, or null.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    applyProgressiveImageData (finalUrl, previewUrl) {
        // ONE idempotent render pass for the two image inputs. The final is
        // applied before the preview so a preview-clear arriving in the same pass
        // (completion reports a final AND a null preview together) sees a final
        // in progress and keeps the blurred backdrop until the reveal completes,
        // instead of flashing the empty box. Callers therefore need not order
        // their inputs — the one load-bearing ordering rule lives here.
        this.applyFinalDataUrl(finalUrl);
        this.applyPreviewDataUrl(previewUrl);
        return this;
    }

    /**
     * @description Renders the final image into the front layer as a real
     * <img> element (object-fit: cover, filling the layer) rather than a CSS
     * background-image, so the final keeps native media affordances — right-click
     * "Save image as…", drag-out, and mobile long-press-save. The reveal still
     * animates on the LAYER (opacity / blur / scale), so the <img> itself needs
     * no transition.
     * @param {String} dataUrl - The final image data URL.
     * @returns {SvImageWellView}
     * @category Progressive Loading
     */
    setFrontLayerImageUrl (dataUrl) {
        const layer = this.frontLayer();
        layer.removeAllSubviews(); // drop any prior <img>
        const image = new Image();
        image.src = dataUrl;
        const imgView = SvFlexDomView.clone().setElement(image);
        imgView.setPosition("absolute");
        imgView.setInset("0px");
        imgView.setWidth("100%");
        imgView.setHeight("100%");
        imgView.setObjectFit("cover");
        layer.addSubview(imgView);
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
    applyFinalDataUrl (dataUrl) {
        // Natural-size terminal: no reserved box (null aspect ratio). Render the
        // final via the base single-image path — an SvImageView that sizes to
        // the image — exactly as a non-progressive well would. No reserved box,
        // no crossfade, no animation. This is the plain "shown" state for a node
        // that supplies no aspect ratio (e.g. a completed message that predates
        // the aspect slot).
        if (this.parsedAspectRatio(this.aspectRatioString()) === null) {
            this.setImageDataUrl(dataUrl);
            this.setFinalDataUrl(dataUrl);
            return this;
        }

        if (dataUrl === this.finalDataUrl()) {
            return this;
        }
        this.setFinalDataUrl(dataUrl);
        if (dataUrl) {
            const front = this.frontLayer();
            this.setFrontLayerImageUrl(dataUrl);
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
                const revealedOverLayer = this.backLayerView();
                this.flushStyleThen(() => {
                    // Fade in while sharpening and settling — image + blur as one.
                    front.setOpacity(1);
                    front.setFilter("blur(0px)");
                    front.setTransform("scale(1)");
                }, front);
                // After the reveal completes, drop the preview we revealed over.
                // Re-validate first: a newer preview installed during the reveal
                // replaces backLayerView(), and must be left in place (otherwise
                // this stale timer would delete it).
                this.addWeakTimeout(() => {
                    if (this.backLayerView() === revealedOverLayer) {
                        this.clearBackLayer();
                    }
                }, this.finalFadeDurationMs() + 100);
                // The final image is here: stop working indicators.
                this.removeShimmer();
            }
        } else if (this.frontLayerView()) {
            this.frontLayerView().removeAllSubviews(); // drop the <img>
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
        this.setPreviewDataUrl(null);
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
        this.setFinalDataUrl(null);
        return this;
    }

    // --- Shimmer overlay ---

    /**
     * @description True when the shimmer should be shown: enabled and in a
     * non-terminal render state (working with nothing yet, or a preview showing
     * while work continues). A final image ("revealed") stops it.
     * @returns {Boolean}
     * @category Progressive Loading
     */
    shouldShowShimmer () {
        if (!this.shimmerEnabled()) {
            return false;
        }
        const state = this.renderState();
        return state === "working" || state === "preview";
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
     * the box via the shared SvShimmerOverlayView. It overlays whether or not a
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
        // The shared shimmer (SvShimmerOverlayView) — same sheen used by
        // tile thumbnails, so "loading an image" reads identically app-wide.
        const v = SvShimmerOverlayView.clone();
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

}.initThisClass());
