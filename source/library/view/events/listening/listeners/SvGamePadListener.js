"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvGamePadListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of gamepad events.
 */
(class SvGamePadListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvGamePadListener instance.
     * @returns {SvGamePadListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the event listeners for gamepad events.
     * @returns {SvGamePadListener} The current instance.
     * @category Event Management
     */
    setupListeners () {
        this.addEventNameAndMethodName("gamepadconnected",   "onGamePadConnected");
        this.addEventNameAndMethodName("gamepaddisconnected", "onGamePadDisconnected");
        return this;
    }

}.initThisClass());
