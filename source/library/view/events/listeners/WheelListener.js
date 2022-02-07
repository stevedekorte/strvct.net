"use strict";

/*
    WheelListener

    Listens to a set of wheel (mouse or other wheel) events.

*/

(class WheelListener extends EventSetListener {
    
    initPrototype () {

    }

    init () {
        super.init()
        return this
    }

    setupEventsDict () {
        this.addEventNameAndMethodName("wheel",   "onWheel");
        return this
    }

}.initThisClass());
