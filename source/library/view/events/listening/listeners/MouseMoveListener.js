"use strict";

/*
    MouseMoveListener

    Listens to a set of mouse move events.
    This is separated from MouseListener because move events happen at such a high rate,
    that it's important for performance reasons to only listen for them when needed.

*/


(class MouseMoveListener extends EventSetListener {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("mousemove", "onMouseMove");
        return this
    }

}.initThisClass());
