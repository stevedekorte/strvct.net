"use strict";

/**
 * @module library.view.events.listening.listeners.TouchListener
 */

/**
 * @class TouchListener
 * @extends EventSetListener
 * @classdesc Listens to a set of touch events.
 */
(class TouchListener extends EventSetListener {
    
    /**
     * @description Initializes prototype slots.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the TouchListener instance.
     * @returns {TouchListener} The initialized TouchListener instance.
     */
    init () {
        super.init()
        return this
    } 

    /**
     * @description Sets up the touch event listeners.
     * @returns {TouchListener} The TouchListener instance.
     */
    setupListeners () {
        this.addEventNameAndMethodName("touchstart",  "onTouchStart").setIsUserInteraction(true)
        this.addEventNameAndMethodName("touchmove",   "onTouchMove");
        this.addEventNameAndMethodName("touchcancel", "onTouchCancel");
        this.addEventNameAndMethodName("touchend",    "onTouchEnd");
        return this
    }

}.initThisClass());