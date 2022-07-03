"use strict";

/*
    AnimationListener

    Listens to a set of animation events.

*/

(class AnimationListener extends EventSetListener {
    
    initPrototype () {

    }

    init () {
        super.init()
        this.setIsDebugging(true)
        return this
    }

    setupListeners () {
        this.addEventNameAndMethodName("animationend", "onAnimationEnd");
        this.addEventNameAndMethodName("animationiteration", "onAnimationIteration");
        this.addEventNameAndMethodName("animationstart", "onAnimationStart");
        this.addEventNameAndMethodName("animationcancel", "onAnimationCancel");
        return this
    }

}.initThisClass());
