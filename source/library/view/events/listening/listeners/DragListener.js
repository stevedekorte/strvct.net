"use strict";

/*
    DragListener

    Listens to a set of drag event on element being dragged.

*/

(class DragListener extends EventSetListener {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }

    setupListeners () {
        // fired on draggable element
        this.addEventNameAndMethodName("dragstart", "onBrowserDragStart");
        this.addEventNameAndMethodName("drag",      "onBrowserDrag");
        this.addEventNameAndMethodName("dragend",   "onBrowserDragEnd");
        return this
    }

    start () {
        super.start()
        //this.listenTarget().ondragstart = (e) => { console.log("--- ondragstart ---"); } // TODO: still needed?
        return this
    }
    
}.initThisClass());