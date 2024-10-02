/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class DocumentListener
 * @extends EventSetListener
 * @classdesc Listens to a set of document related events.
 */
(class DocumentListener extends EventSetListener {
    
    /**
     * @description Initializes prototype slots for the DocumentListener class.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the DocumentListener instance.
     * @returns {DocumentListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the event listeners for the DocumentListener.
     * @returns {DocumentListener} The instance with setup listeners.
     * @category Event Handling
     */
    setupListeners () {
        // See: https://developer.chrome.com/blog/page-lifecycle-api/

        this.addEventNameAndMethodName("visibilitychange", "onDocumentVisibilityChange");

        this.addEventNameAndMethodName("freeze", "onDocumentFreeze"); // Document specific
        this.addEventNameAndMethodName("resume", "onDocumentResume"); // Document specific
        this.addEventNameAndMethodName("fullscreenerror", "onDocumentFullScreenError"); // Document specific

        // See: DOMElement requestFullscreen method
        //this.addEventNameAndMethodName("fullscreenchange", "onBrowserFullScreenChange"); // Document specific
        //this.addEventNameAndMethodName("fullscreenerror", "onBrowserFullScreenError"); // Document specific

        return this
    }

    /**
     * @description Returns the target for the event listener.
     * @returns {Document} The document object.
     * @category Event Handling
     */
    listenTarget () {
        return document // is this the best way to handle this?
    }
    
}.initThisClass());