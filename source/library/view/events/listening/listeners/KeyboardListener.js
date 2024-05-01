"use strict";

/*
    KeyboardListener

    Listens to a set of keyboard events.

*/

(class KeyboardListener extends EventSetListener {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setIsDebugging(false)
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("keyup", "onKeyUp").setIsUserInteraction(true)
        this.addEventNameAndMethodName("keydown", "onKeyDown").setIsUserInteraction(true)
        //this.addEventNameAndMethodName("keypress", "onKeyPress"); // deprecated in modern browsers
        //this.addEventNameAndMethodName("change", "onChange");
        this.addEventNameAndMethodName("input", "onInput");
        return this
    }
    
}.initThisClass());
