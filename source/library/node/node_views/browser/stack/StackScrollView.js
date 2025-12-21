/** * @module library.node.node_views.browser.stack
 */

/** * @class StackScrollView
 * @extends ScrollView
 * @classdesc StackScrollView is a specialized ScrollView that can be configured for vertical or horizontal scrolling.
 
 
 */

/**

 */
"use strict";

(class StackScrollView extends ScrollView {

    /**
     * Initialize prototype slots for the StackScrollView.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * Initialize the StackScrollView.
     * @returns {StackScrollView} The initialized StackScrollView instance to be vertically scrollable.
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
     * Set the scroll direction of the StackScrollView.
     * @param {boolean} aBool - True for vertical scrolling, false for horizontal scrolling.
     * @returns {StackScrollView} The StackScrollView instance.
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
     * Configure the StackScrollView for vertical scrolling.
     * @returns {StackScrollView} The StackScrollView instance.
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
     * Configure the StackScrollView for horizontal scrolling.

     * @returns {StackScrollView} The StackScrollView instance.
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
