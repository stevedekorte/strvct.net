"use strict";

/**
 * @module library.view.dom.SvDomView.subclasses
 */

/**
 * @class SvBadgeView
 * @extends SvTextView
 * @classdesc A small attention chip. Renders either a short string (e.g. a
 * count) or, when the string is empty/null, a small dot. Generic — consumers
 * position it (e.g. a companion tab or a tile overlay) and typically drive it
 * from the nodeViewShouldBadge()/nodeViewBadgeTitle() node protocol.
 *
 * Colors can be themed via CSS variables:
 *
 *     --SvBadge-bg
 *     --SvBadge-color
 */

(class SvBadgeView extends SvTextView {

    initPrototypeSlots () {
    }

    initPrototype () {
        this.setupCss();
    }

    setupCss () {
        SvWebDocument.shared().addStyleSheetString(`
            .SvBadgeView {
                animation: SvBadgeIn 0.3s ease-in-out;
            }

            @keyframes SvBadgeIn {
                from { opacity: 0; transform: scale(0.6); }
                to { opacity: 1; transform: scale(1); }
            }
        `);
    }

    /**
     * @description Initializes the SvBadgeView with chip styling.
     * @returns {SvBadgeView} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setElementClassName("SvBadgeView");
        this.setFontSize("0.6em");
        this.setLineHeight("1");
        this.setBorderRadius("0.33em");
        this.setBackgroundColor("var(--SvBadge-bg, rgb(240, 192, 0))");
        this.setColor("var(--SvBadge-color, #191919)");
        this.setWhiteSpace("nowrap");
        this.setTextAlign("center");
        this.setPointerEvents("none");
        this.turnOffUserSelect();
        this.setBadgeString(null);
        return this;
    }

    /**
     * @description Sets the badge content. An empty or null string renders as a small dot.
     * @param {string|null} aString - The badge text (e.g. a count), or null for a plain dot.
     * @returns {SvBadgeView} The current instance.
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
