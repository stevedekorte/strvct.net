/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SelectListener
 * @extends EventSetListener
 * @classdesc Listens to a set of select events on element.
 */
(class SelectListener extends EventSetListener {
    
    /**
     * @description Initializes the prototype slots.
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SelectListener.
     * @returns {SelectListener} The initialized SelectListener instance.
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets the listen target for the SelectListener.
     * @param {Element} anElement - The element to set as the listen target.
     * @returns {SelectListener} The SelectListener instance.
     */
    setListenTarget (anElement) {
        // is event only works on document or window?
        //assert(anElement === document || anElement === window)
        super.setListenTarget(anElement);
        return this;
    }

    /**
     * @description Sets up the listeners for select events.
     * @returns {SelectListener} The SelectListener instance.
     */
    setupListeners () {
        this.addEventNameAndMethodName("selectstart", "onSelectStart");
        this.addEventNameAndMethodName("selectionchange", "onSelectionChange"); // IMPORTANT: not widely supported
        return this;
    }
    
}.initThisClass());