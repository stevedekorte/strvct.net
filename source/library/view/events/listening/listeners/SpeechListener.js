"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SpeechListener
 * @extends EventSetListener
 * @classdesc Listens to events on a SpeechSynthesisUtterance instance.
 */
(class SpeechListener extends EventSetListener {

    /**
     * @description Initializes prototype slots.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SpeechListener instance.
     * @returns {SpeechListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        this.setIsDebugging(false);
        return this;
    }

    /**
     * @description Sets up event listeners for speech synthesis events.
     * @returns {SpeechListener} The instance with listeners set up.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("boundary", "onBoundary");
        this.addEventNameAndMethodName("end", "onEnd");
        this.addEventNameAndMethodName("error", "onError");
        this.addEventNameAndMethodName("mark", "onMark");
        this.addEventNameAndMethodName("pause", "onPause");
        this.addEventNameAndMethodName("resume", "onResume");
        this.addEventNameAndMethodName("start", "onStart");
        return this;
    }

}.initThisClass());
