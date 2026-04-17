"use strict";

/** * @module library.node.node_views.browser.stack.SvTile.subviews
 */

/** * @class SvTileSubtitleView
 * @extends SvTextView
 * @classdesc SvTileSubtitleView is a specialized SvTextView for displaying subtitles in a SvTile.
 
 
 */

/**

 */
(class SvTileSubtitleView extends SvTextView {

    /**
     * @description Initializes the prototype slots for the SvTileSubtitleView.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype for the SvTileSubtitleView.
     * @category Initialization
     */
    initPrototype () {
    }

    /**
     * @description Initializes the SvTileSubtitleView with default styles and properties.
     * @returns {SvTileSubtitleView} The initialized instance of SvTileSubtitleView.
     * @category Initialization
     */
    init () {
        super.init();
        this.setDisplay("block");
        this.setMarginTop("3px");
        this.setMarginLeft("0px");
        this.setMarginBottom("3px");
        this.setFontSize("80%");
        this.setFontWeight("normal");
        this.setTextAlign("left");
        this.setOverflow("hidden");
        this.setMinWidth("2em");
        this.setWidth("100%");
        this.setWordWrap("break-word");
        this.setWhiteSpace("pre");
        return this;
    }

}.initThisClass());
