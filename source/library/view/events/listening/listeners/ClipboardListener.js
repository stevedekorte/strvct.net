/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class ClipboardListener
 * @extends EventSetListener
 * @classdesc Listens to a set of clipboard events.
 */
(class ClipboardListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots for the ClipboardListener class.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the ClipboardListener instance.
     * @returns {ClipboardListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the listeners for clipboard events.
     * @returns {ClipboardListener} The instance with setup listeners.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("copy", "onCopy");
        this.addEventNameAndMethodName("cut", "onCut");
        this.addEventNameAndMethodName("paste", "onPaste");
        return this
    }

}.initThisClass());