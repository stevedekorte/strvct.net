"use strict";

/*
    TouchListener

    Listens to a set of touch events.

*/
 
(class TouchListener extends EventSetListener {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        return this
    } 

    setupListeners () {
        this.addEventNameAndMethodName("touchstart",  "onTouchStart").setIsUserInteraction(true)
        this.addEventNameAndMethodName("touchmove",   "onTouchMove");
        this.addEventNameAndMethodName("touchcancel", "onTouchCancel");
        this.addEventNameAndMethodName("touchend",    "onTouchEnd");
        return this
    }

}.initThisClass());
