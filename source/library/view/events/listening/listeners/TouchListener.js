"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class TouchListener
 * @extends EventSetListener
 * @classdesc Listens to a set of touch events.
 */
(class TouchListener extends EventSetListener {

    /**
     * @description Initializes prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the TouchListener instance.
     * @returns {TouchListener} The initialized TouchListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the touch event listeners.
     * @returns {TouchListener} The TouchListener instance.
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
