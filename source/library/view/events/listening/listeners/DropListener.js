"use strict";

/*
    DropListener

    Listens to a set of events on a drop target.

*/

(class DropListener extends EventSetListener {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }

    setupListeners () {
        // fired on drop target
        this.addEventNameAndMethodName("dragover",  "onBrowserDragOver"); // must prevent default
        this.addEventNameAndMethodName("dragenter", "onBrowserDragEnter"); // must prevent default
        this.addEventNameAndMethodName("drop",      "onBrowserDrop");
        this.addEventNameAndMethodName("dragleave", "onBrowserDragLeave");
        return this
    }

    start () {
        super.start()
        //this.listenTarget().__isListeningForDrop___ = true
        return this
    }

    stop () {
        super.stop()
        //this.listenTarget().__isListeningForDrop___ = false // breaks if multiple drop listeners on same element
        return this
    }

    /*
    onBeforeEvent (methodName, event) {
        this.debugLog(() => { return " onBeforeEvent " + methodName })
        return this
    }
    */
    
}.initThisClass());
