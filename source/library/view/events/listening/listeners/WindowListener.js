"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class WindowListener
 * @extends EventSetListener
 * @classdesc Listens to a set of Window related events.
 * NOTE: the target of the event is the browser window and not a DOM element.
 */
(class WindowListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots for the class.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the instance.
     * @returns {WindowListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the event listeners for various window-related events.
     * @returns {WindowListener} The instance with set up listeners.
     * @category Event Setup
     */
    setupListeners () {
        // See: https://developer.chrome.com/blog/page-lifecycle-api/

        // window events
        this.addEventNameAndMethodName("resize", "onWindowResize"); // Document specific

        this.addEventNameAndMethodName("pageshow", "onPageShow"); // Window specific
        this.addEventNameAndMethodName("pagehide", "onPageHide"); // Window specific

        this.addEventNameAndMethodName("beforeunload", "onDocumentBeforeUnload"); // Window specific?
        this.addEventNameAndMethodName("unload", "onDocumentUnload"); // Window specific?

        this.addEventNameAndMethodName("submit", "onFormSubmit"); // FormElement specific

        this.addEventNameAndMethodName("online", "onBrowserOnline"); // Window specific
        this.addEventNameAndMethodName("offline", "onBrowserOffline"); // Window specific

        this.addEventNameAndMethodName("error", "onWindowError");

        this.addEventNameAndMethodName("hashchange", "onHashChange"); // fires specifically when the hash portion of the URL changes
        this.addEventNameAndMethodName("popstate", "onPopState"); // fires when navigating through session history (back/forward buttons), but only for entries added with pushState() or replaceState()
        // For most hash-based navigation needs, hashchange is the simpler and more direct approach.

        return this
    }

    /**
     * @description Returns the target for the event listeners.
     * @returns {Window} The window object.
     * @category Event Handling
     */
    listenTarget () {
        return window // we need to target the window and not the element asssociated with a View
    }
    
}.initThisClass());