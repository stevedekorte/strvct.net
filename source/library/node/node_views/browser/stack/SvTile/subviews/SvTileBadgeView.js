"use strict";

/** * @module library.node.node_views.browser.stack.SvTile.subviews
 */

/** * @class SvTileBadgeView
 * @extends SvTextView
 * @classdesc SvTileBadgeView is a small attention chip overlaid on a tile's content view.
 * It renders either a short string (e.g. a count) or, when the string is empty,
 * a small dot. Used by the SvTile_attention category to signal that the tile's
 * node has unseen changes worth inspecting.
 *
 * Colors can be themed by the application via CSS variables:
 *
 *     --SvTileBadge-bg
 *     --SvTileBadge-color
 */

(class SvTileBadgeView extends SvTextView {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setupCss();
    }

    setupCss () {
        SvWebDocument.shared().addStyleSheetString(`
            .SvTileBadgeView {
                animation: SvTileBadgeIn 0.3s ease-in-out;
            }

            @keyframes SvTileBadgeIn {
                from { opacity: 0; transform: scale(0.6); }
                to { opacity: 1; transform: scale(1); }
            }
        `);
    }

    /**
     * @description Initializes the SvTileBadgeView with chip styling.
     * @returns {SvTileBadgeView} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setElementClassName("SvTileBadgeView");
        this.setPosition("absolute");
        this.setTopPx(8);
        this.setRightPx(8);
        this.setZIndex(3);
        this.setFontSize("0.6em");
        this.setLineHeight("1");
        this.setBorderRadius("0.33em");
        this.setBackgroundColor("var(--SvTileBadge-bg, rgb(240, 192, 0))");
        this.setColor("var(--SvTileBadge-color, #191919)");
        this.setFontFamily("var(--SvTile-technical-font, inherit)");
        this.setWhiteSpace("nowrap");
        this.setPointerEvents("none");
        this.turnOffUserSelect();
        this.setBadgeString(null);
        return this;
    }

    /**
     * @description Sets the badge content. An empty or null string renders as a small dot.
     * @param {string|null} aString - The badge text (e.g. a count), or null for a plain dot.
     * @returns {SvTileBadgeView} The current instance.
     * @category Display
     */
    setBadgeString (aString) {
        const hasText = aString !== null && aString !== undefined && String(aString).length > 0;
        if (hasText) {
            this.setString(String(aString));
            this.setPadding("0.25em 0.45em");
            this.setMinAndMaxWidth(null);
            this.setMinAndMaxHeight(null);
        } else {
            this.setString("");
            this.setPadding("0em");
            this.setMinAndMaxWidth(7);
            this.setMinAndMaxHeight(7);
        }
        return this;
    }

}.initThisClass());
