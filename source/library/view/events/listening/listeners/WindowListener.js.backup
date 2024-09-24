"use strict";

/*
    WindowListener

    Listens to a set of Window related events.

    NOTE: the target of the event is the browser window and not a DOM element.

*/

(class WindowListener extends EventSetListener {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }

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

        //this.addEventNameAndMethodName("error", "onBrowserResourceLoadError");

        return this
    }

    listenTarget () {
        return window // we need to target the window and not the element asssociated with a View
    }
    
}.initThisClass());
