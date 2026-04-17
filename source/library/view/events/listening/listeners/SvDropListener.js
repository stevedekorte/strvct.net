"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvDropListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of events on a drop target.
 */
(class SvDropListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots for the SvDropListener class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvDropListener instance.
     * @returns {SvDropListener} The initialized SvDropListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up event listeners for drag and drop operations.
     * @returns {SvDropListener} The SvDropListener instance.
     * @category Event Management
     */
    setupListeners () {
        // fired on drop target
        this.addEventNameAndMethodName("dragover",  "onBrowserDragOver"); // must prevent default
        this.addEventNameAndMethodName("dragenter", "onBrowserDragEnter"); // must prevent default
        this.addEventNameAndMethodName("drop",      "onBrowserDrop");
        this.addEventNameAndMethodName("dragleave", "onBrowserDragLeave");
        return this;
    }

    /**
     * @description Starts the SvDropListener.
     * @returns {SvDropListener} The SvDropListener instance.
     * @category Lifecycle
     */
    start () {
        super.start();
        //this.listenTarget().__isListeningForDrop___ = true
        return this;
    }

    /**
     * @description Stops the SvDropListener.
     * @returns {SvDropListener} The SvDropListener instance.
     * @category Lifecycle
     */
    stop () {
        super.stop();
        //this.listenTarget().__isListeningForDrop___ = false // breaks if multiple drop listeners on same element
        return this;
    }

    /*
    onBeforeEvent (methodName, event) {
        this.logDebug(() => { return " onBeforeEvent " + methodName })
        return this
    }
    */

}.initThisClass());
