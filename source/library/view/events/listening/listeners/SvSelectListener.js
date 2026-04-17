/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvSelectListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of select events on element.
 */
(class SvSelectListener extends SvEventSetListener {

    /**
     * @description Initializes the prototype slots.
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the SvSelectListener.
     * @returns {SvSelectListener} The initialized SvSelectListener instance.
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets the listen target for the SvSelectListener.
     * @param {Element} anElement - The element to set as the listen target.
     * @returns {SvSelectListener} The SvSelectListener instance.
     * @category Configuration
     */
    setListenTarget (anElement) {
        // is event only works on document or window?
        //assert(anElement === document || anElement === window)
        super.setListenTarget(anElement);
        return this;
    }

    /**
     * @description Sets up the listeners for select events.
     * @returns {SvSelectListener} The SvSelectListener instance.
     * @category Event Handling
     */
    setupListeners () {
        this.addEventNameAndMethodName("selectstart", "onSelectStart");
        this.addEventNameAndMethodName("selectionchange", "onSelectionChange"); // IMPORTANT: not widely supported
        return this;
    }

}.initThisClass());
