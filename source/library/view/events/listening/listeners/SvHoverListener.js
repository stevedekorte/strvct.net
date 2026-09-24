"use strict";

/**
 * @module library.view.events.listening.listeners
 */

/**
 * @class SvHoverListener
 * @extends SvEventSetListener
 * @classdesc Listens only for the pointer entering and leaving an element,
 * dispatching onHoverOver / onHoverLeave to its delegate. Unlike
 * SvMouseListener it forwards no clicks or presses, and its method names
 * can't collide with a view's own mouse handlers — so a view can watch
 * hover on elements it doesn't own (e.g. a subview's button).
 */
(class SvHoverListener extends SvEventSetListener {

    initPrototypeSlots () {
    }

    /**
     * @description Sets up the hover event listeners.
     * @returns {SvHoverListener} The current instance.
     * @category Event Setup
     */
    setupListeners () {
        this.addEventNameAndMethodName("mouseover", "onHoverOver"); // bubbles: also fires entering children
        this.addEventNameAndMethodName("mouseleave", "onHoverLeave"); // only when the pointer exits the element
        return this;
    }

}.initThisClass());
