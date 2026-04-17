/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvClipboardListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of clipboard events.
 */
(class SvClipboardListener extends SvEventSetListener {

    /**
     * @description Initializes the prototype slots for the SvClipboardListener class.
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvClipboardListener instance.
     * @returns {SvClipboardListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the listeners for clipboard events.
     * @returns {SvClipboardListener} The instance with setup listeners.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("copy", "onCopy");
        this.addEventNameAndMethodName("cut", "onCut");
        this.addEventNameAndMethodName("paste", "onPaste");
        return this;
    }

}.initThisClass());
