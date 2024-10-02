"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class FocusListener
 * @extends EventSetListener
 * @classdesc Listens to a set of focus events.
 */
(class FocusListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots for the FocusListener class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the FocusListener instance.
     * @returns {FocusListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the event listeners for focus-related events.
     * @returns {FocusListener} The instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("blur", "onBlur");
        this.addEventNameAndMethodName("focus", "onFocus");
        this.addEventNameAndMethodName("focusin", "onFocusIn");
        this.addEventNameAndMethodName("focusout", "onFocusOut"); 
        return this
    }

}.initThisClass());