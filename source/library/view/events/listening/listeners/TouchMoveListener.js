/**
 * @module library.view.events.listening.listeners
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
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the TouchMoveListener
     * @returns {TouchMoveListener} The initialized TouchMoveListener instance
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the event listeners
     * @returns {TouchMoveListener} The TouchMoveListener instance
     * @category Event Management
     */
    setupListeners () {
        this.addEventNameAndMethodName("touchmove",   "onTouchMove");
        return this;
    }

}.initThisClass());
