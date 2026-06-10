"use strict";

/** * @module library.node.node_views.browser.stack.SvTile
 */

/** * @class SvPortraitTile
 * @extends SvTitledTile
 * @classdesc A read-only tile showing a small square portrait image to the left
 * of the title and subtitle:
 *
 *     [ (portrait)  title          note ]
 *     [             subtitle            ]
 *
 * The portrait is loaded from the node's existing asyncNodeThumbnailUrl()
 * protocol (already implemented by image-bearing nodes). While no image is
 * available, the portrait area shows the first letter of the title as a
 * placeholder.
 *
 * Unlike SvImageWellFieldTile, this tile is display-only: no drag-drop,
 * no editing, no writeback.
 *
 * Nodes select this tile with setNodeTileClassName("SvPortraitTile").
 */

(class SvPortraitTile extends SvTitledTile {

    initPrototypeSlots () {
        /**
         * @member {SvDomView} portraitView - square image view left of the title
         * @category UI
         */
        {
            const slot = this.newSlot("portraitView", null);
            slot.setSlotType("SvDomView");
        }
        /**
         * @member {String} portraitUrl - the last applied image url
         * @category State
         */
        {
            const slot = this.newSlot("portraitUrl", null);
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the SvPortraitTile, inserting the portrait view
     * before the title content area.
     * @returns {SvPortraitTile} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();

        const pv = SvTextView.clone().setElementClassName("SvPortraitTileImage");
        pv.setDisplay("flex");
        pv.setFlex("0 0 auto");
        pv.setMinAndMaxWidth(40);
        pv.setMinAndMaxHeight(40);
        pv.setCssProperty("align-self", "center");
        pv.setMarginLeft("0.8em");
        pv.setBackgroundSize("cover");
        pv.setBackgroundPosition("center");
        pv.setBorder("1px solid rgba(255, 255, 255, 0.1)");
        pv.setOverflow("hidden");
        pv.setAlignItems("center");
        pv.setJustifyContent("center");
        pv.setColor("rgba(255, 255, 255, 0.3)");
        pv.setFontSize("1.2em");
        pv.turnOffUserSelect();

        this.setPortraitView(pv);
        this.contentView().atInsertSubview(0, pv);

        return this;
    }

    /**
     * @description Loads the node's thumbnail into the portrait view instead of
     * the inherited right-side thumbnail. Falls back to an initial-letter placeholder.
     * @returns {SvPortraitTile} The current instance.
     * @category UI
     */
    async asyncUpdateThumbnailView () {
        const node = this.node();
        if (!node) {
            return this;
        }

        const pv = this.portraitView();

        let imageUrl = null;
        if (node.asyncNodeThumbnailUrl) {
            imageUrl = await node.asyncNodeThumbnailUrl();
        }

        if (imageUrl) {
            if (imageUrl !== this.portraitUrl()) {
                this.setPortraitUrl(imageUrl);
                pv.setString("");
                pv.setBackgroundImageUrlPath(imageUrl);
            }
        } else {
            this.setPortraitUrl(null);
            pv.setBackgroundImageUrlPath(null);
            pv.setString(this.portraitPlaceholderString());
        }

        return this;
    }

    /**
     * @description The placeholder shown when no portrait image is available.
     * Nodes may override via a nodePortraitPlaceholderString() method.
     * @returns {string}
     * @category UI
     */
    portraitPlaceholderString () {
        const custom = this.getFromNodeDelegate("nodePortraitPlaceholderString");
        if (typeof (custom) === "string" && custom.length > 0) {
            return custom;
        }
        const node = this.node();
        const title = node && node.title ? node.title() : null;
        if (title && title.length > 0) {
            return title.charAt(0).toUpperCase();
        }
        return "?";
    }

}.initThisClass());
