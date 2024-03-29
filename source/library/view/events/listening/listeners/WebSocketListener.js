"use strict";

/*
    WebSocketListener

    Listens to a set of web socket events.

    NOTES:
    
    MessageEvent contains:
    - data
    - origin
    - lastEventId 
    - source 
    - ports
*/

(class WebSocketListener extends EventSetListener {
    
    initPrototypeSlots () {

    }

    init () {
        super.init()
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("open", "onOpen");
        this.addEventNameAndMethodName("close", "onClose");
        this.addEventNameAndMethodName("error", "onError");
        this.addEventNameAndMethodName("message", "onMessage");
        return this
    }

}.initThisClass());
