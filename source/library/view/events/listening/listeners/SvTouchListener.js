"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvTouchListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of touch events.
 */
(class SvTouchListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SvTouchListener instance.
     * @returns {SvTouchListener} The initialized SvTouchListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the touch event listeners.
     * @returns {SvTouchListener} The SvTouchListener instance.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("touchstart",  "onTouchStart").setIsUserInteraction(true);
        this.addEventNameAndMethodName("touchmove",   "onTouchMove");
        this.addEventNameAndMethodName("touchcancel", "onTouchCancel");
        this.addEventNameAndMethodName("touchend",    "onTouchEnd");
        return this;
    }

}.initThisClass());
