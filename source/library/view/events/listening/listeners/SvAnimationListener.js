"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvAnimationListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of animation events.
 *
 * See: https://developer.mozilla.org/en-US/docs/Web/API/AnimationEvent
 *
 * AnimationEvent contains:
 * - animationName
 * - elapsedTime
 * - pseudoElement
 */
(class SvAnimationListener extends SvEventSetListener {

    /**
     * @description Initializes the prototype slots for the SvAnimationListener class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvAnimationListener instance.
     * @returns {SvAnimationListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Sets up the event listeners for animation events.
     * @returns {SvAnimationListener} The current instance.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("animationend", "onAnimationEnd");
        this.addEventNameAndMethodName("animationiteration", "onAnimationIteration");
        this.addEventNameAndMethodName("animationstart", "onAnimationStart");
        this.addEventNameAndMethodName("animationcancel", "onAnimationCancel");
        return this;
    }

}.initThisClass());
