"use strict";

/*
    SelectListener

    Listens to a set of select events on element.

*/

(class SelectListener extends EventSetListener {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        return this
    }

    setListenTarget (anElement) {
        // is event only works on document or window?
        assert(anElement === document || anElement === window)
        super.setListenTarget(anElement)
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("selectstart", "onSelectStart");
        this.addEventNameAndMethodName("selectionchange", "onSelectionChange");
        return this
    }
    
}.initThisClass());