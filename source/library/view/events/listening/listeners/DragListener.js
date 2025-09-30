/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class DragListener
 * @extends EventSetListener
 * @classdesc Listens to a set of drag events on element being dragged.
 */
(class DragListener extends EventSetListener {

    /**
     * @description Initializes prototype slots
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {

    }

    /**
     * @description Initializes the DragListener
     * @returns {DragListener} The initialized DragListener instance
     * @category Initialization
     */
    init () {
        super.init();
        return this;
    }

    /**
     * @description Sets up the drag event listeners
     * @returns {DragListener} The DragListener instance
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
     * @description Starts the DragListener
     * @returns {DragListener} The DragListener instance
     * @category Lifecycle
     */
    start () {
        super.start();
        //this.listenTarget().ondragstart = (e) => { console.log("--- ondragstart ---"); } // TODO: still needed?
        return this;
    }

}.initThisClass());
