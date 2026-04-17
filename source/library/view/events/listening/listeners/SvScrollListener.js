/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvScrollListener
 * @extends SvEventSetListener
 * @classdesc Listens to scroll events.
 */
(class SvScrollListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots for the SvScrollListener.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvScrollListener.
     * @returns {SvScrollListener} The initialized SvScrollListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the event listeners for the SvScrollListener.
     * @returns {SvScrollListener} The SvScrollListener instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("scroll",   "onScroll");
        return this;
    }

}.initThisClass());
