"use strict";

/*
    TransitionListener

    Listens to a set of animation transition events.

*/

(class TransitionListener extends EventSetListener {
    
    initPrototype () {

    }

    init () {
        super.init()
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("transitionrun", "onTransitionRun");
        this.addEventNameAndMethodName("transitionstart", "onTransitionStart");
        this.addEventNameAndMethodName("transitioncancel", "onTransitionCancel");
        this.addEventNameAndMethodName("transitionend", "onTransitionEnd");
        return this
    }
    
}.initThisClass());
