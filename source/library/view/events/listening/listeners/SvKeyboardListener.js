"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvKeyboardListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of keyboard events.
 */
(class SvKeyboardListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SvKeyboardListener instance.
     * @returns {SvKeyboardListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Sets up the event listeners for keyboard events.
     * @returns {SvKeyboardListener} The instance with setup listeners.
     * @category Event Setup
     */
    setupListeners () {
        this.addEventNameAndMethodName("keyup", "onKeyUp").setIsUserInteraction(true);
        this.addEventNameAndMethodName("keydown", "onKeyDown").setIsUserInteraction(true);
        //this.addEventNameAndMethodName("keypress", "onKeyPress"); // deprecated in modern browsers
        //this.addEventNameAndMethodName("change", "onChange");
        this.addEventNameAndMethodName("input", "onInput");
        // beforeinput reports the edit INTENT (event.inputType, e.g.
        // "insertParagraph") before the DOM changes. Software keyboards
        // (iOS Safari) don't reliably deliver Enter as keyCode 13 key events,
        // so intent-based handlers need this channel. Only delegates that
        // implement onBeforeInput are registered (delegateCanRespond).
        this.addEventNameAndMethodName("beforeinput", "onBeforeInput").setIsUserInteraction(true);
        return this;
    }

}.initThisClass());
