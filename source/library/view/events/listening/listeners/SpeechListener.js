"use strict";

/*
    SpeechListener

    Listens to events on a SpeechSynthesisUtterance instance.

*/

(class SpeechListener extends EventSetListener {
    
    initPrototypeSlots () {
    }

    init () {
        super.init()
        this.setIsDebugging(false)
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("boundary", "onBoundary");
        this.addEventNameAndMethodName("end", "onEnd");
        this.addEventNameAndMethodName("error", "onError");
        this.addEventNameAndMethodName("mark", "onMark");
        this.addEventNameAndMethodName("pause", "onPause");
        this.addEventNameAndMethodName("resume", "onResume");
        this.addEventNameAndMethodName("start", "onStart");
        return this
    }

}.initThisClass());
