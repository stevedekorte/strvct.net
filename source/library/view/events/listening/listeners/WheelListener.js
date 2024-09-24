"use strict";

/**
 * @module library.view.events.listening.listeners.WheelListener
 */

/**
 * @class WheelListener
 * @extends EventSetListener
 * @classdesc Listens to a set of wheel (mouse or other wheel) events.
 */
(class WheelListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots for the class.
     * @method initPrototypeSlots
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the instance.
     * @method init
     * @returns {WheelListener} The instance of the class.
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the event listeners for the class.
     * @method setupListeners
     * @returns {WheelListener} The instance of the class.
     */
    setupListeners () {
        this.addEventNameAndMethodName("wheel",   "onWheel");
        return this
    }

}.initThisClass());