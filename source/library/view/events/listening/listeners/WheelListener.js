"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class WheelListener
 * @extends EventSetListener
 * @classdesc Listens to a set of wheel (mouse or other wheel) events.
 */
(class WheelListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots for the class.

     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the instance.

     * @returns {WheelListener} The instance of the class.
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the event listeners for the class.

     * @returns {WheelListener} The instance of the class.
     */
    setupListeners () {
        this.addEventNameAndMethodName("wheel",   "onWheel");
        return this
    }

}.initThisClass());