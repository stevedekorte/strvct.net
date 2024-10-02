"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class DropListener
 * @extends EventSetListener
 * @classdesc Listens to a set of events on a drop target.
 */
(class DropListener extends EventSetListener {
    
    /**
     * @description Initializes prototype slots for the DropListener class.
     * @returns {void}
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the DropListener instance.
     * @returns {DropListener} The initialized DropListener instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up event listeners for drag and drop operations.
     * @returns {DropListener} The DropListener instance.
     * @category Event Management
     */
    setupListeners () {
        // fired on drop target
        this.addEventNameAndMethodName("dragover",  "onBrowserDragOver"); // must prevent default
        this.addEventNameAndMethodName("dragenter", "onBrowserDragEnter"); // must prevent default
        this.addEventNameAndMethodName("drop",      "onBrowserDrop");
        this.addEventNameAndMethodName("dragleave", "onBrowserDragLeave");
        return this
    }

    /**
     * @description Starts the DropListener.
     * @returns {DropListener} The DropListener instance.
     * @category Lifecycle
     */
    start () {
        super.start()
        //this.listenTarget().__isListeningForDrop___ = true
        return this
    }

    /**
     * @description Stops the DropListener.
     * @returns {DropListener} The DropListener instance.
     * @category Lifecycle
     */
    stop () {
        super.stop()
        //this.listenTarget().__isListeningForDrop___ = false // breaks if multiple drop listeners on same element
        return this
    }

    /*
    onBeforeEvent (methodName, event) {
        this.debugLog(() => { return " onBeforeEvent " + methodName })
        return this
    }
    */
    
}.initThisClass());