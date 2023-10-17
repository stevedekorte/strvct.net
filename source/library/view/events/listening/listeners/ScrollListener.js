"use strict";

/*
    ScrollListener

    Listens to scroll events.

*/

(class ScrollListener extends EventSetListener {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("scroll",   "onScroll");
        return this
    }

}.initThisClass());
