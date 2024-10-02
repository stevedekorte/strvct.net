"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class MouseMoveListener
 * @extends EventSetListener
 * @classdesc Listens to a set of mouse move events.
 * This is separated from MouseListener because move events happen at such a high rate,
 * that it's important for performance reasons to only listen for them when needed.
 */
(class MouseMoveListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /*
    init () {
        super.init()
        return this
    }
    */

    /**
     * @description Sets up the event listeners for mouse move events.
     * @returns {MouseMoveListener} The current instance of the MouseMoveListener.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("mousemove", "onMouseMove");
        return this
    }

}.initThisClass());