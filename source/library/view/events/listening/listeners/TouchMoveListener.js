/**
 * @module library.view.events.listening.listeners.TouchMoveListener
 */

/**
 * @class TouchMoveListener
 * @extends EventSetListener
 * @classdesc Listens to touch move events.
 * Separated from TouchListeners for performance reasons.
 */
(class TouchMoveListener extends EventSetListener {
    
    /**
     * @description Initializes prototype slots
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the TouchMoveListener
     * @returns {TouchMoveListener} The initialized TouchMoveListener instance
     */
    init () {
        super.init()
        return this
    } 

    /**
     * @description Sets up the event listeners
     * @returns {TouchMoveListener} The TouchMoveListener instance
     */
    setupListeners () {
        this.addEventNameAndMethodName("touchmove",   "onTouchMove");
        return this
    }

}.initThisClass());