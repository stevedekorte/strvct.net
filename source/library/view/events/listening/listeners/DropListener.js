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
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the DropListener instance.
     * @returns {DropListener} The initialized DropListener instance.
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up event listeners for drag and drop operations.
     * @returns {DropListener} The DropListener instance.
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
     */
    start () {
        super.start()
        //this.listenTarget().__isListeningForDrop___ = true
        return this
    }

    /**
     * @description Stops the DropListener.
     * @returns {DropListener} The DropListener instance.
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