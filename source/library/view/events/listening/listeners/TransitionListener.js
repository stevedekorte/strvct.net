"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class TransitionListener
 * @extends EventSetListener
 * @classdesc Listens to a set of animation transition events.
 */
(class TransitionListener extends EventSetListener {
    
    /**
     * @description Initializes prototype slots for the TransitionListener class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the TransitionListener instance.
     * @returns {TransitionListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the listeners for various transition events.
     * @returns {TransitionListener} The instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("transitionrun", "onTransitionRun");
        this.addEventNameAndMethodName("transitionstart", "onTransitionStart");
        this.addEventNameAndMethodName("transitioncancel", "onTransitionCancel");
        this.addEventNameAndMethodName("transitionend", "onTransitionEnd");
        return this
    }
    
}.initThisClass());