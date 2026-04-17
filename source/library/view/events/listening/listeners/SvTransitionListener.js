"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvTransitionListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of animation transition events.
 */
(class SvTransitionListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots for the SvTransitionListener class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvTransitionListener instance.
     * @returns {SvTransitionListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the listeners for various transition events.
     * @returns {SvTransitionListener} The instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("transitionrun", "onTransitionRun");
        this.addEventNameAndMethodName("transitionstart", "onTransitionStart");
        this.addEventNameAndMethodName("transitioncancel", "onTransitionCancel");
        this.addEventNameAndMethodName("transitionend", "onTransitionEnd");
        return this;
    }

}.initThisClass());
