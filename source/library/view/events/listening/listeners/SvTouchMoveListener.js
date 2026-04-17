/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvTouchMoveListener
 * @extends SvEventSetListener
 * @classdesc Listens to touch move events.
 * Separated from TouchListeners for performance reasons.
 */
(class SvTouchMoveListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SvTouchMoveListener
     * @returns {SvTouchMoveListener} The initialized SvTouchMoveListener instance
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the event listeners
     * @returns {SvTouchMoveListener} The SvTouchMoveListener instance
     * @category Event Management
     */
    setupListeners () {
        this.addEventNameAndMethodName("touchmove",   "onTouchMove");
        return this;
    }

}.initThisClass());
