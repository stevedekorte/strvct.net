/** * @module library.node.node_views.browser.stack
 */

/** * @class SvStackScrollView
 * @extends SvScrollView
 * @classdesc SvStackScrollView is a specialized SvScrollView that can be configured for vertical or horizontal scrolling.
 
 
 */

/**

 */
"use strict";

(class SvStackScrollView extends SvScrollView {

    /**
     * Initialize prototype slots for the SvStackScrollView.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * Initialize the SvStackScrollView.
     * @returns {SvStackScrollView} The initialized SvStackScrollView instance to be vertically scrollable.
     * @category Initialization
     */
    init () {
        super.init();
        /*
        this.setDisplay("block")
        this.setPosition("relative")
        this.setTopPx(null)
        this.setMsOverflowStyle("none") // removes scrollbars on IE 10+
        this.setOverflow("-moz-scrollbars-none") // removes scrollbars on Firefox
        this.setBackgroundColor("transparent")
        //this.setBorder("1px solid purple")
        */
        this.makeVertical();
        return this;
    }

    /**
     * Set the scroll direction of the SvStackScrollView.
     * @param {boolean} aBool - True for vertical scrolling, false for horizontal scrolling.
     * @returns {SvStackScrollView} The SvStackScrollView instance.
     * @category Configuration
     */
    setIsVertical (aBool) {
        if (aBool) {
            this.makeVertical();
        } else {
            this.makeHorizontal();
        }
        return this;
    }

    /**
     * Configure the SvStackScrollView for vertical scrolling.
     * @returns {SvStackScrollView} The SvStackScrollView instance.
     * @category Configuration
     */
    makeVertical () {
        this.setWidth("100%");
        this.setFlexGrow(1);
        this.setOverflowY("scroll"); // has to be scroll, not auto, for touch scroll momentum to work
        this.setOverflowX("hidden");
        return this;
    }

    /**
     * Configure the SvStackScrollView for horizontal scrolling.

     * @returns {SvStackScrollView} The SvStackScrollView instance.
     * @category Configuration
     */
    makeHorizontal () {
        this.setWidth("null");
        this.setHeight("100%");
        this.setFlexGrow(1);
        this.setOverflowY("hidden");
        this.setOverflowX("scroll"); // has to be scroll, not auto, for touch scroll momentum to work
        return this;
    }


}.initThisClass());
