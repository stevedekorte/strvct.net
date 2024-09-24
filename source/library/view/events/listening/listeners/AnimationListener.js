"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class AnimationListener
 * @extends EventSetListener
 * @classdesc Listens to a set of animation events.
 * 
 * See: https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
 * 
 * AnimationEvent contains:
 * - animationName
 * - elapsedTime
 * - pseudoElement 
 */
(class AnimationListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots for the AnimationListener class.
     * @returns {void}
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the AnimationListener instance.
     * @returns {AnimationListener} The initialized instance.
     */
    init () {
        super.init()
        this.setIsDebugging(false)
        return this
    }

    /**
     * @description Sets up the event listeners for animation events.
     * @returns {AnimationListener} The current instance.
     */
    setupListeners () {
        this.addEventNameAndMethodName("animationend", "onAnimationEnd");
        this.addEventNameAndMethodName("animationiteration", "onAnimationIteration");
        this.addEventNameAndMethodName("animationstart", "onAnimationStart");
        this.addEventNameAndMethodName("animationcancel", "onAnimationCancel");
        return this
    }

}.initThisClass());