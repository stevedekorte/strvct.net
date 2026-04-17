"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvFocusListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of focus events.
 */
(class SvFocusListener extends SvEventSetListener {

    /**
     * @description Initializes the prototype slots for the SvFocusListener class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvFocusListener instance.
     * @returns {SvFocusListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the event listeners for focus-related events.
     * @returns {SvFocusListener} The instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("blur", "onBlur");
        this.addEventNameAndMethodName("focus", "onFocus");
        this.addEventNameAndMethodName("focusin", "onFocusIn");
        this.addEventNameAndMethodName("focusout", "onFocusOut");
        return this;
    }

}.initThisClass());
