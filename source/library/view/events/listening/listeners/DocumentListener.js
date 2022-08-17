"use strict";

/*
    DocumentListener

    Listens to a set of document related events.

*/

(class DocumentListener extends EventSetListener {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }

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

    listenTarget () {
        return document // is this the best way to handle this?
    }
    
}.initThisClass());
