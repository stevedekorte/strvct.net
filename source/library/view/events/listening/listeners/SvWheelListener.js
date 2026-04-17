"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvWheelListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of wheel (mouse or other wheel) events.
 */
(class SvWheelListener extends SvEventSetListener {

    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the instance.
     * @category Initialization
     * @returns {SvWheelListener} The instance of the class.
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the event listeners for the class.
     * @category Event Handling
     * @returns {SvWheelListener} The instance of the class.
     */
    setupListeners () {
        this.addEventNameAndMethodName("wheel",   "onWheel");
        return this;
    }

}.initThisClass());
