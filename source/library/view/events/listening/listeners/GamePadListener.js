"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class GamePadListener
 * @extends EventSetListener
 * @classdesc Listens to a set of gamepad events.
 */
(class GamePadListener extends EventSetListener {

    /**
     * @description Initializes prototype slots.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the GamePadListener instance.
     * @returns {GamePadListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the event listeners for gamepad events.
     * @returns {GamePadListener} The current instance.
     * @category Event Management
     */
    setupListeners () {
        this.addEventNameAndMethodName("gamepadconnected",   "onGamePadConnected");
        this.addEventNameAndMethodName("gamepaddisconnected", "onGamePadDisconnected");
        return this;
    }

}.initThisClass());
