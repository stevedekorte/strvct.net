"use strict";

/*
    ClipboardListener

    Listens to a set of clip board events.

*/

(class ClipboardListener extends EventSetListener {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("copy", "onCopy");
        this.addEventNameAndMethodName("cut", "onCut");
        this.addEventNameAndMethodName("paste", "onPaste");
        return this
    }

}.initThisClass());
