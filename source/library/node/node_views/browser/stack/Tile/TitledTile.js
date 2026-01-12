/** * @module browser.stack.Tile
 */

/** * @class TitledTile
 * @extends Tile
 * @classdesc
 * TitledTile
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

/**

 */
"use strict";

(class TitledTile extends Tile {

    initPrototypeSlots () {
        /**
         * @member {DomView} titleView
         * @category UI
         */
        {
            const slot = this.newSlot("titleView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} subtitleView
         * @category UI
         */
        {
            const slot = this.newSlot("subtitleView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} noteView
         * @category UI
         */
        {
            const slot = this.newSlot("noteView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} noteIconView - created lazily
         * @category UI
         */
        {
            const slot = this.newSlot("noteIconView", null);
            slot.setSlotType("DomView");
        }
        /**
         * @member {DomView} thumbnailView
         * @category UI
         */
        {
            const slot = this.newSlot("thumbnailView", null);
            slot.setSlotType("DomView");
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
     * @description Returns the top content area
     * @returns {DomView}
     * @category Layout
     */
    topContentArea () {
        let lv = this.contentView().subviews().at(0);
        return lv;
    }

    /**
     * @description Returns the bottom content area
     * @returns {DomView}
     * @category Layout
     */
    bottomContentArea () {
        let lv = this.contentView().subviews().at(1);
        return lv;
    }

    /**
     * @description Initializes the TitledTile
     * @returns {TitledTile}
     * @category Initialization
     */
    init () {
        super.init();
        const cv = this.contentView();

        cv.setMinHeight("5em");
        cv.flexSplitIntoColumns(2);

        const lv = this.topContentArea();

        lv.setDisplay("flex");
        lv.setFlex("10");
        lv.setAlignItems("flex-start"); // alignment in direction of flex
        lv.setJustifyContent("center"); // alignment perpendicutal to flex
        lv.setFlexDirection("column");

        const tv = TileTitleView.clone();
        lv.addSubview(tv);
        this.setTitleView(tv);
        tv.setThemeClassName("TileTitle");
        tv.setUsesDoubleTapToEdit(true);
        //tv.setOverflow("visible")
        tv.setPaddingLeft("0em");
        tv.setWidth("fit-content");

        const st = TileSubtitleView.clone();
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
        this.setNoteView(rv.addSubview(TileNoteView.clone()));
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
     * @returns {TitledTile}
     * @category UI
     */
    setupThumbnailViewIfAbsent () {
        if (!this.thumbnailView()) {
            // Create thumbnail container
            const tv = DomView.clone().setElementClassName("TileThumbnailView");
            tv.setDisplay("flex");
            tv.setAlignItems("center");
            tv.setJustifyContent("center");
            tv.setFlex("0 0 auto");
            tv.setMinWidth("60px");
            tv.setMaxWidth("60px");
            tv.setPadding("5px");
            //tv.setBackgroundColor("rgba(0, 0, 0, 0.1)");
            tv.setBackgroundColor("transparent");

            // Create ImageView subview to hold the actual image
            const imageView = SvImageView.clone();
            imageView.setDisplay("block");
            imageView.setWidth("50px");
            imageView.setHeight("50px");
            imageView.setObjectFit("cover");
            imageView.setBorderRadiusPx(5);
            tv.addSubview(imageView);

            this.setThumbnailView(tv);
            this.bottomContentArea().addSubview(tv);
            //this.contentView().addSubview(tv);
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
     * @returns {TitledTile}
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
                this.asyncUpdateThumbnailView(); // no await
                /*
                const imageUrl = node.nodeThumbnailUrl();
                if (imageUrl) {
                    this.setupThumbnailViewIfAbsent();
                    const imageView = this.thumbnailView().subviews().first();
                    if (imageView) {
                        imageView.setFromDataURL(imageUrl);
                    }

                    this.hideNoteView();
                    this.hideNoteIconView();
                } else {
                */
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
        const imageUrl = await node.asyncNodeThumbnailUrl();
        if (imageUrl) {
            this.setupThumbnailViewIfAbsent();
            const imageView = this.thumbnailView().subviews().first();
            if (imageView) {
                imageView.setFromDataURL(imageUrl);
            }

            this.hideNoteView();
            this.hideNoteIconView();
        }
        return this;
    }

    /**
     * @description Synchronizes styles to subviews
     * @returns {TitledTile}
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
        nv.setString(this.node().note());
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
     * @param {DomView} aView - The view that was edited
     * @category Event
     */
    onDidEdit (/*aView*/) {
        super.onDidEdit();
    }

    /**
     * @description Synchronizes the tile to its node
     * @returns {TitledTile}
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
     * @returns {TitledTile}
     * @category Data
     */
    syncFromNode () {
        super.syncFromNode();
        const node = this.node();
        this.titleView().setString(node.title());
        this.subtitleView().setString(node.subtitle());
        //this.noteView().setString(this.node().note())
        this.updateSubviews();

        this.setIsDisplayHidden(!node.isVisible());

        return this;
    }

    /**
     * @description Makes the note view a right arrow
     * @returns {TitledTile}
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
