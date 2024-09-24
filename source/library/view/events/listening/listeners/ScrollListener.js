/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class ScrollListener
 * @extends EventSetListener
 * @classdesc Listens to scroll events.
 */
(class ScrollListener extends EventSetListener {
    
    /**
     * @description Initializes prototype slots for the ScrollListener.
     * @returns {void}
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the ScrollListener.
     * @returns {ScrollListener} The initialized ScrollListener instance.
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the event listeners for the ScrollListener.
     * @returns {ScrollListener} The ScrollListener instance with listeners set up.
     */
    setupListeners () {
        this.addEventNameAndMethodName("scroll",   "onScroll");
        return this
    }

}.initThisClass());