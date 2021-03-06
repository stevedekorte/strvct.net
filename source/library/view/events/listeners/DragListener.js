"use strict"

/*
    DragListener

    Listens to a set of drag event on element being dragged.

*/

window.DragListener = class DragListener extends EventSetListener {
    
    initPrototype () {

    }

    init () {
        super.init()
        return this
    }

    setupEventsDict () {
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
    
}.initThisClass()