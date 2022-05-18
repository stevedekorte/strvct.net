"use strict";

/*
    TouchListener

    Listens to a set of touch events.

*/
 
(class TouchListener extends EventSetListener {
    
    initPrototype () {
    }

    init () {
        super.init()
        return this
    } 

    setupEventsDict () {
        this.addEventNameAndMethodName("touchstart",  "onTouchStart", true);
        this.addEventNameAndMethodName("touchmove",   "onTouchMove");
        this.addEventNameAndMethodName("touchcancel", "onTouchCancel");
        this.addEventNameAndMethodName("touchend",    "onTouchEnd");
        return this
    }

}.initThisClass());
