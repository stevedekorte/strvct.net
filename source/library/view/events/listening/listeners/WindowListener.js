"use strict";

/*
    WindowListener

    Listens to a set of Window related events.

*/

(class WindowListener extends EventSetListener {
    
    initPrototype () {

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

        this.addEventNameAndMethodName("submit", "onSubmit"); // FormElement specific

        this.addEventNameAndMethodName("online", "onBrowserOnline"); // Window specific
        this.addEventNameAndMethodName("offline", "onBrowserOffline"); // Window specific

        //this.addEventNameAndMethodName("error", "onBrowserResourceLoadError");

        return this
    }

    listenTarget () {
        // 
        return window // is this the best way to handle this?
    }
    
}.initThisClass());
