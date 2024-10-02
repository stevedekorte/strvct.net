"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class MouseListener
 * @extends EventSetListener
 * @classdesc Listens to a set of mouse events.
 */
(class MouseListener extends EventSetListener {
    
    /**
     * @description Initializes prototype slots.
     * @private
     * @category Initialization
     */
    initPrototypeSlots () {
    }

    /**
     * @description Initializes the MouseListener instance.
     * @returns {MouseListener} The initialized instance.
     * @category Initialization
     */
    init () {
        super.init()
        return this
    }

    /**
     * @description Sets up the mouse event listeners.
     * @returns {MouseListener} The current instance.
     * @category Event Setup
     */
    setupListeners () {
        this.addEventNameAndMethodName("mousedown", "onMouseDown").setIsUserInteraction(true)
        this.addEventNameAndMethodName("mouseup",   "onMouseUp").setIsUserInteraction(true)

        this.addEventNameAndMethodName("mouseover",  "onMouseOver");  // triggered only when mouse enters element
        this.addEventNameAndMethodName("mouseleave", "onMouseLeave"); // triggered only when mouse exits element

        //this.addEventNameAndMethodName("mousemove", "onMouseMove");

        // NOTE: don't see a good use case for these, so commenting out for now
        //this.addEventNameAndMethodName("mouseout",   "onMouseOut");   // triggered when mouse exits any child element        
        //this.addEventNameAndMethodName("mouseenter", "onMouseEnter"); // triggered when mouse enters any child element

        this.addEventNameAndMethodName("click",    "onClick").setIsUserInteraction(true)
        this.addEventNameAndMethodName("dblclick", "onDoubleClick").setIsUserInteraction(true) // is this valid?

        this.addEventNameAndMethodName("contextmenu", "onContextMenu"); // occurs on right mouse click on element
        return this
    }

}.initThisClass());