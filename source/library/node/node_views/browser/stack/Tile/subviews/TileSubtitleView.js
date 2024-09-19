"use strict";

/**
 * @module library.node.node_views.browser.stack.Tile.subviews
 * @class TileSubtitleView
 * @extends TextField
 * @classdesc TileSubtitleView is a specialized TextField for displaying subtitles in a Tile.
 */
(class TileSubtitleView extends TextField {
    
    /**
     * @description Initializes the prototype slots for the TileSubtitleView.
     * @method initPrototypeSlots
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype for the TileSubtitleView.
     * @method initPrototype
     */
    initPrototype () {
    }

    /**
     * @description Initializes the TileSubtitleView with default styles and properties.
     * @method init
     * @returns {TileSubtitleView} The initialized instance of TileSubtitleView.
     */
    init () {
        super.init()
        this.setDisplay("block")
        this.setMarginTop("3px")
        this.setMarginLeft("0px")
        this.setMarginBottom("3px")
        this.setFontSize("80%")
        this.setFontWeight("normal")
        this.setTextAlign("left")
        this.setOverflow("hidden")
        this.setMinWidth("2em")
        this.setWidth("100%")
        this.setWordWrap("break-word")
        this.setWhiteSpace("pre")
        return this
    }

}.initThisClass());