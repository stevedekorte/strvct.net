"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class KeyboardListener
 * @extends EventSetListener
 * @classdesc Listens to a set of keyboard events.
 */
(class KeyboardListener extends EventSetListener {

    /**
     * @description Initializes prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the KeyboardListener instance.
     * @returns {KeyboardListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Sets up the event listeners for keyboard events.
     * @returns {KeyboardListener} The instance with setup listeners.
     * @category Event Setup
     */
    setupListeners () {
        this.addEventNameAndMethodName("keyup", "onKeyUp").setIsUserInteraction(true);
        this.addEventNameAndMethodName("keydown", "onKeyDown").setIsUserInteraction(true);
        //this.addEventNameAndMethodName("keypress", "onKeyPress"); // deprecated in modern browsers
        //this.addEventNameAndMethodName("change", "onChange");
        this.addEventNameAndMethodName("input", "onInput");
        return this;
    }

}.initThisClass());
