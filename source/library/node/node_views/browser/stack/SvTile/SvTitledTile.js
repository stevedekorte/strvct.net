/** * @module browser.stack.SvTile
 */

/** * @class SvTitledTile
 * @extends SvTile
 * @classdesc
 * SvTitledTile
 *
 * Adds a few subviews for typical tile functionality:
 *
 *     - titleView
 *     - subtitleView
 *     - noteView
 *     - noteIconView
 *     - thumbnailView
 *
 * Most of these can easily be disabled, if not needed.
 */

"use strict";

(class SvTitledTile extends SvTile {

    initPrototypeSlots () {
        /**
         * @member {SvDomView} titleView
         * @category UI
         */
        {
            const slot = this.newSlot("titleView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} subtitleView
         * @category UI
         */
        {
            const slot = this.newSlot("subtitleView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} noteView
         * @category UI
         */
        {
            const slot = this.newSlot("noteView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} noteIconView - created lazily
         * @category UI
         */
        {
            const slot = this.newSlot("noteIconView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {SvDomView} thumbnailView
         * @category UI
         */
        {
            const slot = this.newSlot("thumbnailView", null);
            slot.setSlotType("SvDomView");
        }
    }

    /**
     * @static
     * @description Returns the left padding for the title
     * @returns {string}
     * @category Layout
     */
    static titleLeftPadding () {
        return "30px";
    }

    /**
     * @description Returns the leading content area (holds the thumbnail).
     * @returns {SvDomView}
     * @category Layout
     */
    leadingContentArea () {
        return this.contentView().subviews().at(0);
    }

    /**
     * @description Returns the top content area (title/subtitle column).
     * @returns {SvDomView}
     * @category Layout
     */
    topContentArea () {
        let lv = this.contentView().subviews().at(1);
        return lv;
    }

    /**
     * @description Returns the bottom content area (trailing note/icon).
     * @returns {SvDomView}
     * @category Layout
     */
    bottomContentArea () {
        let lv = this.contentView().subviews().at(2);
        return lv;
    }

    /**
     * @description Initializes the SvTitledTile
     * @returns {SvTitledTile}
     * @category Initialization
     */
    init () {
        super.init();
        const cv = this.contentView();

        cv.setMinHeight("5em");
        cv.flexSplitIntoColumns(3);

        // Leading region: holds the thumbnail (created lazily). Stays
        // zero-width until a thumbnail is reserved/loaded, so tiles without
        // a thumbnail are unaffected.
        const leading = this.leadingContentArea();
        leading.setDisplay("flex");
        leading.setFlex("0 0 auto");
        leading.setAlignItems("center");
        leading.setJustifyContent("center");

        const lv = this.topContentArea();

        lv.setDisplay("flex");
        lv.setFlex("10");
        lv.setAlignItems("flex-start"); // alignment in direction of flex
        lv.setJustifyContent("center"); // alignment perpendicutal to flex
        lv.setFlexDirection("column");

        const tv = SvTileTitleView.clone();
        lv.addSubview(tv);
        this.setTitleView(tv);
        tv.setThemeClassName("TileTitle");
        tv.setUsesDoubleTapToEdit(true);
        //tv.setOverflow("visible")
        tv.setPaddingLeft("0em");
        tv.setWidth("fit-content");

        const st = SvTileSubtitleView.clone();
        lv.addSubview(st);
        this.setSubtitleView(st);
        st.setThemeClassName("TileSubtitle");
        st.setPaddingLeft("0em");
        st.setPaddingTop("0em");
        st.setOpacity(0.6);
        //st.setWidth("fit-content");


        const rv = this.bottomContentArea();
        rv.setDisplay("flex");
        rv.setAlignItems("center");
        this.setNoteView(rv.addSubview(SvTileNoteView.clone()));
        rv.setMinWidth("3em");
        rv.setJustifyContent("center");

        const icon = SvgIconView.clone();
        //icon.setElementClassName("NoteIconView")
        icon.setMinAndMaxWidth(12);
        icon.setMinAndMaxHeight(15);
        //icon.setFillColor("white")
        icon.setStrokeColor("white"); // use currentColor?
        icon.setOpacity(0.2);
        this.setNoteIconView(rv.addSubview(icon));

        this.updateSubviews();
        this.setIsSelectable(true);

        //this.registerForVisibility();
        return this;
    }

    /**
     * @description Sets up the thumbnail view if it doesn't exist
     * @returns {SvTitledTile}
     * @category UI
     */
    setupThumbnailViewIfAbsent () {
        if (!this.thumbnailView()) {
            // Leading thumbnail: a bare rounded frame rendered via CSS
            // background-image so wide/tall images are cropped/fit to fill the
            // square. The faint fill lets the empty frame read as a stand-in
            // (reserving space) before/without an image, keeping the
            // title/subtitle at a stable horizontal position.
            const tv = SvDomView.clone().setElementClassName("TileThumbnailView");
            // Explicit display so hideDisplay()/unhideDisplay() round-trips: those
            // save the current display() to restore on unhide and assert a truthy
            // saved value, so a view hidden while display() is null/"" would
            // crash on unhide. Set it up front (before any hide can run).
            tv.setDisplay("block");
            tv.setFlex("0 0 auto");
            tv.setMinAndMaxWidth(50);
            tv.setMinAndMaxHeight(50);
            // Match the gap to the tile content's left inset (the theme's
            // 22px paddingLeft in SvThemeState), so the space on each side of
            // the thumbnail is equal. px (not em): the inset and the frame are
            // both px, and em would drift with each tile's font size.
            tv.setMarginRight("22px");
            tv.setBorderRadiusPx(5);
            tv.setOverflow("hidden");
            tv.setBackgroundColor("rgba(255, 255, 255, 0.07)");
            tv.setBackgroundSize("cover");
            tv.setBackgroundPosition("center");

            this.setThumbnailView(tv);
            this.leadingContentArea().addSubview(tv);
        }
        return this;
    }

    /**
     * @description Checks if the tile has a subtitle
     * @returns {boolean}
     * @category State
     */
    hasSubtitle () {
        const node = this.node();

        if (node) {
            if (node.subtitle() !== null && node.subtitle() !== "") {
                return true;
            }

            if (node.nodeCanEditSubtitle()) {
                return true;
            }
        }

        return false;
    }

    /**
     * @description Updates the subviews of the tile
     * @returns {SvTitledTile}
     * @category UI
     */
    updateSubviews () {
        super.updateSubviews();

        const node = this.node();

        if (node) {
            this.titleView().setIsEditable(node.nodeCanEditTitle());
            this.subtitleView().setIsEditable(node.nodeCanEditSubtitle());
            this.subtitleView().setIsDisplayHidden(!this.hasSubtitle());

            if (node) {
                // Reserve the leading thumbnail frame synchronously when the
                // node expects a thumbnail (optional duck-typed method; absent
                // => false). This keeps the title/subtitle from shifting when
                // the image resolves asynchronously, and keeps tiles in a
                // column aligned whether or not each currently has an image.
                const expectsThumbnail = node.nodeExpectsThumbnail ? node.nodeExpectsThumbnail() : false;
                if (expectsThumbnail) {
                    this.setupThumbnailViewIfAbsent();
                    this.thumbnailView().unhideDisplay();
                } else if (this.thumbnailView()) {
                    this.thumbnailView().hideDisplay();
                }
                this.asyncUpdateThumbnailView(); // no await; fills the frame if an image exists

                // Note / note-icon live in the trailing region, independent of
                // the (now leading) thumbnail — so e.g. an option's "✓" is no
                // longer hidden when the option also has an image.
                if (node.noteIconName() && !node.noteIsSubnodeCount()) {
                    this.hideNoteView();
                    this.showNoteIconView();
                } else {
                    this.showNoteView();
                    this.hideNoteIconView();
                }
            }
        } else {
            this.titleView().setIsEditable(false);
            this.subtitleView().setIsEditable(false);
            this.subtitleView().setIsDisplayHidden(true);
        }

        this.syncStylesToSubviews();

        /*
        const state = this.currentThemeState()
        if (state) {
            state.applyToView(this.titleView())
            state.applyToView(this.subtitleView())
        }
        */

        return this;
    }

    async asyncUpdateThumbnailView () {
        const node = this.node();
        if (!node || !node.asyncNodeThumbnailUrl) {
            return this;
        }
        // A thumbnail is decorative and this runs fire-and-forget (see caller).
        // Every await below can reject — a missing/failed blob fetch, an image
        // that won't decode, or the view being torn down mid-await when the
        // user navigates (breadcrumb click). None of those may surface as a
        // global "Something Went Wrong": swallow and log. We also re-check the
        // tile's node after each await, since tiles are recycled across nodes
        // and a late result must not paint onto whatever node now owns the tile.
        try {
            // Loading affordance: shimmer the stand-in while the (possibly
            // cloud) fetch is in flight — a blank frame otherwise reads as
            // "no image", indistinguishable from an actual missing one. Only
            // when nothing is displayed yet: periodic re-syncs must not flash
            // placeholder over a visible thumbnail.
            if (node.nodeExpectsThumbnail && node.nodeExpectsThumbnail()) {
                this.setupThumbnailViewIfAbsent();
                this.startThumbnailShimmerIfNeeded();
            }
            const imageUrl = await node.asyncNodeThumbnailUrl();
            if (this.node() !== node) {
                this.stopThumbnailShimmer(); // recycled: the new node's own pass owns the state
                return this;
            }
            if (!imageUrl) {
                this.stopThumbnailShimmer();
                this.markThumbnailUnavailable(); // dev-only glyph; silent otherwise
                return this;
            }
            this.stopThumbnailShimmer();
            this.clearThumbnailUnavailable();
            this.setupThumbnailViewIfAbsent();
            const tv = this.thumbnailView();
            tv.unhideDisplay();
            // Image present: drop the stand-in's faint fill so nothing tints
            // behind the image (e.g. the letterbox of a "contain" tall image).
            tv.setBackgroundColor("transparent");
            tv.setBackgroundImageUrlPath(imageUrl);

            // Check aspect ratio: crop wide images to fill, fit tall images whole
            const img = new Image();
            img.src = imageUrl;
            await img.decode();
            if (this.node() !== node) {
                return this;
            }
            if (img.naturalWidth >= img.naturalHeight) {
                tv.setBackgroundSize("cover");
            } else {
                tv.setBackgroundSize("contain");
                tv.setBackgroundRepeat("no-repeat");
            }
        } catch (error) {
            this.stopThumbnailShimmer();
            this.markThumbnailUnavailable();
            console.warn(this.svType() + " asyncUpdateThumbnailView ignored error:", error);
        }
        return this;
    }

    // --- thumbnail loading / unavailable states ---

    /**
     * @description True when the thumbnail frame currently displays an image.
     * @returns {Boolean}
     * @category Thumbnail
     */
    thumbnailHasImage () {
        const tv = this.thumbnailView();
        if (!tv) {
            return false;
        }
        const bg = tv.element().style.backgroundImage;
        return !!bg && bg !== "none";
    }

    /**
     * @description Overlays the shared shimmer (same effect as image-message
     * loading) on the thumbnail stand-in while a fetch is in flight. No-op if
     * already shimmering or an image is already displayed.
     * @category Thumbnail
     */
    startThumbnailShimmerIfNeeded () {
        const tv = this.thumbnailView();
        if (!tv || this._thumbnailShimmer || this.thumbnailHasImage()) {
            return this;
        }
        tv.setPosition("relative"); // anchor the absolute overlay
        this._thumbnailShimmer = SvShimmerOverlayView.clone();
        tv.addSubview(this._thumbnailShimmer);
        return this;
    }

    stopThumbnailShimmer () {
        if (this._thumbnailShimmer) {
            const tv = this.thumbnailView();
            if (tv) {
                tv.removeSubview(this._thumbnailShimmer);
            }
            this._thumbnailShimmer = null;
        }
        return this;
    }

    /**
     * @description The fetch settled with no image. In developer mode, show a
     * faint "no image" glyph so a dead artwork reference is visibly
     * diagnosable instead of silently blank; for players the frame just
     * settles back to the quiet stand-in fill.
     * @category Thumbnail
     */
    markThumbnailUnavailable () {
        const tv = this.thumbnailView();
        if (!tv || this._thumbnailUnavailableGlyph || this.thumbnailHasImage()) {
            return this;
        }
        const devMode = (typeof SvApp !== "undefined") && SvApp.shared().developerMode && SvApp.shared().developerMode();
        if (!devMode) {
            return this;
        }
        const g = SvFlexDomView.clone();
        g.setPosition("absolute");
        g.setInset("0px");
        g.setDisplay("flex");
        g.setAlignItems("center");
        g.setJustifyContent("center");
        g.setColor("rgba(255, 255, 255, 0.18)");
        g.setFontSize("20px");
        g.setPointerEvents("none");
        g.setInnerHtml("&#8856;"); // ⊘ — image reference resolved to nothing
        this._thumbnailUnavailableGlyph = g;
        tv.setPosition("relative");
        tv.addSubview(g);
        return this;
    }

    clearThumbnailUnavailable () {
        if (this._thumbnailUnavailableGlyph) {
            const tv = this.thumbnailView();
            if (tv) {
                tv.removeSubview(this._thumbnailUnavailableGlyph);
            }
            this._thumbnailUnavailableGlyph = null;
        }
        return this;
    }

    /**
     * @description Synchronizes styles to subviews
     * @returns {SvTitledTile}
     * @category UI
     */
    syncStylesToSubviews () {
        //const b = this.isSelected()
        this.titleView().syncStateFrom(this);
        this.subtitleView().syncStateFrom(this);
        this.noteView().syncStateFrom(this);
        this.updateNoteViewStyle();
        /*
        this.titleView().setIsSelected(b)
        this.subtitleView().setIsSelected(b)
        this.noteView().setIsSelected(b)
        */
        return this;
    }

    /**
     * @description Shows the note view
     * @category UI
     */
    showNoteView () {
        const nv = this.noteView();
        nv.unhideDisplay();
        nv.setString(this.node().translatedValueOfSlotNamed("note"));
        // Clear any background image that might have been set (e.g. right arrow)
        nv.setBackgroundImageUrlPath(null);
        nv.setBackgroundSizeWH(null, null);
        nv.setWidth("fit-content");
        nv.setHeight("fit-content");
        nv.setMinAndMaxWidth(null);
        nv.setMinAndMaxHeight(null);
        this.hideNoteIconView();
    }

    updateNoteViewStyle () {
        const nv = this.noteView();
        const node = this.node();

        if (node && node.noteButtonInfo && this.noteView().innerHtml().length > 0) {
            const info = node.noteButtonInfo();
            if (info) {
                // set nv to look like a button
                if (info.color) {
                    nv.setColor(info.color);
                }
                if (info.backgroundColor) {
                    nv.setRealBackgroundColor(info.backgroundColor); // note overrides normal background color
                }
                if (info.opacity) {
                    nv.setOpacity(info.opacity);
                }
                nv.setPaddingLeft("1em");
                nv.setPaddingRight("1em");
                nv.setBorderRadius("0.33em");
            }
        } else {
            nv.setRealBackgroundColor(null);
            nv.setColor(null);
            nv.setOpacity(null);
            nv.setPaddingLeft(null);
            nv.setPaddingRight(null);
            nv.setBorderRadius(null);
        }
    }


    /**
     * @description Hides the note view
     * @category UI
     */
    hideNoteView () {
        this.noteView().hideDisplay();
    }


    /**
     * @description Shows the note icon view
     * @category UI
     */
    showNoteIconView () {
        const v = this.noteIconView();
        if (v.iconName() != this.node().noteIconName()) {
            v.unhideDisplay();
            v.setIconName(this.node().noteIconName());
            //v.setDoesMatchParentColor(true)

        }
        //const color = this.currentColor()
        const color = this.getComputedCssProperty("color");

        v.setColor(color);
        v.setFillColor(color);
        v.setOpacity(0.95);
        //console.log( this.node().title() + " - " + color)
        //v.updateAppearance()
    }

    /**
     * @description Hides the note icon view
     * @category UI
     */
    hideNoteIconView () {
        this.noteIconView().hideDisplay();
    }

    /**
     * @description Calculates the desired width of the tile
     * @returns {number}
     * @category Layout
     */
    desiredWidth () {
        /*
        const tw = this.titleView().calcWidth()
        const sw = this.subtitleView().calcWidth()
        let w = Math.max(sw, tw)
        //console.log("calcCssWidth of tile title '" + this.node().title() + "' = " + w)
        return w + 50
        */
        return this.calcWidth();
    }

    /**
     * @description Handles input events
     * @category Event
     */
    didInput () {
        this.scheduleSyncToNode();
    }

    /**
     * @description Handles edit events
     * @param {SvDomView} aView - The view that was edited
     * @category Event
     */
    onDidEdit (/*aView*/) {
        super.onDidEdit();
    }

    /**
     * @description Synchronizes the tile to its node
     * @returns {SvTitledTile}
     * @category Data
     */
    syncToNode () {
        //console.log("syncToNode")
        const node = this.node();
        node.setTitle(this.titleView().innerText());
        node.setSubtitle(this.subtitleView().innerText());
        return this;
    }

    /**
     * @description Synchronizes the tile from its node
     * @returns {SvTitledTile}
     * @category Data
     */
    syncFromNode () {
        super.syncFromNode();
        const node = this.node();
        this.titleView().setString(node.translatedValueOfSlotNamed("title"));
        this.subtitleView().setString(node.translatedValueOfSlotNamed("subtitle"));
        //this.noteView().setString(this.node().note())
        this.updateSubviews();

        this.setIsDisplayHidden(!node.isVisible());

        return this;
    }

    /**
     * @description Makes the note view a right arrow
     * @returns {SvTitledTile}
     * @category UI
     */
    makeNoteRightArrow () {

        const nv = this.noteView();

        nv.setBackgroundImageUrlPath(this.pathForIconName("right-gray"));
        nv.setBackgroundSizeWH(10, 10);
        nv.setBackgroundRepeat("no-repeat");

        nv.setMinAndMaxWidth(10);
        nv.setMinAndMaxHeight(10);
        return this;
    }

    /**
     * @description Handles the enter key up event
     * @param {Event} event - The keyboard event
     * @category Event
     */
    onEnterKeyUp (event) {
        //this.logDebug(".onEnterKeyUp()")

        if (this.titleView().isEditable()) {
            this.titleView().activate();
            event.stopPropagation();
        } else if (this.subtitleView().isEditable()) {
            this.subtitleView().activate();
            event.stopPropagation();
        } else {
            super.onEnterKeyUp(event);
        }
    }

}.initThisClass());
