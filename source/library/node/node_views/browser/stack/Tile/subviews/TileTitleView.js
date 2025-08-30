"use strict";

/**
 * @module library.node.node_views.browser.stack.Tile.subviews
 * @class TileTitleView
 * @extends SvTextView
 * @classdesc A title element in a Tile. 
 * 
 * Reasons not to just use setElementClassName() on a SvTextView instead:
 * - to automatically get the full class hierarchy in the div name
 * - a place to (potentially) override interaction behaviors
 */
(class TileTitleView extends SvTextView {
    
    /**
     * @description Initializes prototype slots for the TileTitleView.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the prototype for the TileTitleView.
     * @category Initialization
     */
    initPrototype () {

    }

    /**
     * @description Initializes the TileTitleView instance.
     * @returns {TileTitleView} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        this.setDisplay("block")
        this.setPosition("relative")
        this.setMarginTop("0em")
        this.setMarginLeft("0em")
        this.setMinWidth("20px")
        this.setWidth("100%")
        this.setPaddingTop("2px")
        this.setPaddingBottom("2px")
        this.setTextAlign("left")
        this.setWhiteSpace("nowrap")
        this.setOverflow("hidden")
        this.setWordWrap("normal")
        return this
    }

    /*
    tile () {
        return this.parentView().parentView()
    }
    */

    /**
     * @description Selects the next key view.
     * @returns {boolean} Always returns true.
     * @category Navigation
     */
    selectNextKeyView () {
        /*
        this.logDebug(".selectNextKeyView()")
        const tile = this.parentView().parentView();
        const nextTile = this.row().column().selectNextTile()
        */
        return true
    }
    
}.initThisClass());