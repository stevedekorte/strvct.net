"use strict";

/*
    SpeechListener

    Listens to events on a SpeechSynthesisUtterance instance.

*/

(class SpeechListener extends EventSetListener {
    
    initPrototype () {
    }

    init () {
        super.init()
        this.setIsDebugging(true)
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
