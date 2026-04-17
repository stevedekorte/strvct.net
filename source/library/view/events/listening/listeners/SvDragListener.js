/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvDragListener
 * @extends SvEventSetListener
 * @classdesc Listens to a set of drag events on element being dragged.
 */
(class SvDragListener extends SvEventSetListener {

    /**
     * @description Initializes prototype slots
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the SvDragListener
     * @returns {SvDragListener} The initialized SvDragListener instance
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the drag event listeners
     * @returns {SvDragListener} The SvDragListener instance
     * @category Event Setup
     */
    setupListeners () {
        // fired on draggable element
        this.addEventNameAndMethodName("dragstart", "onBrowserDragStart");
        this.addEventNameAndMethodName("drag",      "onBrowserDrag");
        this.addEventNameAndMethodName("dragend",   "onBrowserDragEnd");
        return this;
    }

    /**
     * @description Starts the SvDragListener
     * @returns {SvDragListener} The SvDragListener instance
     * @category Lifecycle
     */
    start () {
        super.start();
        //this.listenTarget().ondragstart = (e) => { console.log("--- ondragstart ---"); } // TODO: still needed?
        return this;
    }

}.initThisClass());
