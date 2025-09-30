"use strict";

/**
 * @module library.view.dom.DomView
 */

/**
 * ListenerDomView
 *
 * Dealing with EventListeners
 *
 * @class ListenerDomView
 * @extends SubviewsDomView
 * @classdesc Handles event listeners for DOM views
 */
(class ListenerDomView extends SubviewsDomView {

    initPrototypeSlots () {
        /**
         * @member {Map} eventListenersMap - Map to store event listeners
         */
        {
            const slot = this.newSlot("eventListenersMap", null);
            slot.setSlotType("Map");
        }
    }

    /**
     * @description Initializes the ListenerDomView
     * @returns {ListenerDomView} The initialized instance
     */
    init () {
        super.init();
        //this.setEventListenersMap(new Map())
        return this;
    }

    /**
     * @description Gets or creates the event listeners map
     * @returns {Map} The event listeners map
     */
    eventListenersMap () {
        if (!this._eventListenersMap) {
            this.setEventListenersMap(new Map());
        }
        return this._eventListenersMap;
    }

    // --- event listener management ---

    /**
     * @description Gets all event listeners
     * @returns {Array} Array of all event listeners
     */
    eventListeners () {
        return this.eventListenersMap().valuesArray().map(v => v.allEventListeners()).flat();
    }

    /**
     * @description Removes all listeners
     * @returns {ListenerDomView} The current instance
     */
    removeAllListeners () {
        const map = this.eventListenersMap();
        map.forEachKV((k, listener) => {
            listener.setIsListening(false);
        });
        map.clear();
        return this;
    }

    /**
     * @description Checks if a listener with the given name exists
     * @param {string} className - The name of the listener class
     * @returns {boolean} True if the listener exists, false otherwise
     */
    hasListenerNamed (className) {
        const map = this.eventListenersMap();
        return map.has(className);
    }

    /**
     * @description Gets or creates a listener with the given name
     * @param {string} className - The name of the listener class
     * @returns {Object} The listener instance
     */
    listenerNamed (className) {
        const map = this.eventListenersMap();
        if (!map.has(className)) {
            const proto = Object.getClassNamed(className);
            assert(!Type.isNullOrUndefined(proto));
            const instance = proto.clone().setListenTarget(this.element()).setDelegate(this);
            map.set(className, instance);
        }
        return map.get(className);
    }

    // --- specific event listeners ---

    /**
     * @description Gets the animation listener
     * @returns {Object} The animation listener instance
     */
    animationListener () {
        return this.listenerNamed("AnimationListener");
    }

    /**
     * @description Gets the clipboard listener
     * @returns {Object} The clipboard listener instance
     */
    clipboardListener () {
        return this.listenerNamed("ClipboardListener");
    }

    /**
     * @description Gets the window listener
     * @returns {Object} The window listener instance
     */
    windowListener () {
        return this.listenerNamed("WindowListener"); // listen target will be the window
    }

    /**
     * @description Gets the document listener
     * @returns {Object} The document listener instance
     */
    documentListener () {
        return this.listenerNamed("DocumentListener"); // listen target will be the window
    }

    /**
     * @description Gets the browser drag listener
     * @returns {Object} The browser drag listener instance
     */
    browserDragListener () {
        return this.listenerNamed("DragListener");
    }

    /**
     * @description Gets the drop listener
     * @returns {Object} The drop listener instance
     */
    dropListener () {
        return this.listenerNamed("DropListener");
    }

    /**
     * @description Gets the focus listener
     * @returns {Object} The focus listener instance
     */
    focusListener () {
        return this.listenerNamed("FocusListener");
    }

    /**
     * @description Gets the mouse listener
     * @returns {Object} The mouse listener instance
     */
    mouseListener () {
        return this.listenerNamed("MouseListener");
    }

    /**
     * @description Gets the mouse move listener
     * @returns {Object} The mouse move listener instance
     */
    mouseMoveListener () {
        return this.listenerNamed("MouseMoveListener");
    }

    /**
     * @description Gets the keyboard listener
     * @returns {Object} The keyboard listener instance
     */
    keyboardListener () {
        return this.listenerNamed("KeyboardListener");
    }

    /**
     * @description Gets the scroll listener
     * @returns {Object} The scroll listener instance
     */
    scrollListener () {
        return this.listenerNamed("ScrollListener");
    }

    /**
     * @description Gets the select listener
     * @returns {Object} The select listener instance
     */
    selectListener () {
        return this.listenerNamed("SelectListener");
    }

    /**
     * @description Gets the touch listener
     * @returns {Object} The touch listener instance
     */
    touchListener () {
        return this.listenerNamed("TouchListener");
    }

    /**
     * @description Gets the transition listener
     * @returns {Object} The transition listener instance
     */
    transitionListener () {
        return this.listenerNamed("TransitionListener");
    }

    // --- invoking event handler methods ---

    /**
     * @description Invokes a method for a given event
     * @param {string} methodName - The name of the method to invoke
     * @param {Event} event - The event object
     * @returns {boolean} True if the event should continue propagation, false otherwise
     */
    invokeMethodNameForEvent (methodName, event) {
        //this.logDebug(".invokeMethodNameForEvent('" + methodName + "')")
        //console.log(this.svTypeId() + ".invokeMethodNameForEvent('" + methodName + "')")
        if (this[methodName]) {
            //console.log(this.svTypeId() + ".invokeMethodNameForEvent('" + methodName + "')")
            const continueProp = this[methodName].apply(this, [event]);
            if (continueProp === false) {
                //event.preventDefault()
                event.stopPropagation();
                return false;
            }
        }

        return true;
    }

    // --- register window resize events ---

    /**
     * @description Checks if the view is registered for window resize events
     * @returns {boolean} True if registered, false otherwise
     */
    isRegisteredForWindowResize () {
        return this.windowListener().isListening();
    }

    /**
     * @description Sets whether the view is registered for window resize events
     * @param {boolean} aBool - True to register, false to unregister
     * @returns {ListenerDomView} The current instance
     */
    setIsRegisteredForWindowResize (aBool) {
        this.windowListener().setIsListening(aBool);
        return this;
    }

    // --- handle window resize events ---

    /**
     * @description Handles window resize events
     * @param {Event} event - The resize event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onWindowResize (/*event*/) {
        return true;
    }

    // --- register onClick events ---

    /**
     * @description Checks if the view is registered for click events
     * @returns {boolean} True if registered, false otherwise
     */
    isRegisteredForClicks () {
        //return this.mouseListener().isListening()
        return this.defaultTapGesture().isListening();
    }

    /**
     * @description Sets whether the view is registered for click events
     * @param {boolean} aBool - True to register, false to unregister
     * @returns {ListenerDomView} The current instance
     */
    setIsRegisteredForClicks (aBool) {
        //this.mouseListener().setIsListening(aBool)
        this.setHasDefaultTapGesture(aBool); // use tap gesture instead of mouse click

        if (aBool) {
            this.makeCursorPointer();
        } else {
            this.makeCursorDefault();
        }

        return this;
    }


    // --- registering for mouse events ---
    /*
        NOTE: onTap... is now used instead?
    */

    /**
     * @description Checks if the view is registered for mouse events
     * @returns {boolean} True if registered, false otherwise
     */
    isRegisteredForMouse () {
        return this.mouseListener().isListening();
    }

    /**
     * @description Sets whether the view is registered for mouse events
     * @param {boolean} aBool - True to register, false to unregister
     * @param {boolean} useCapture - Whether to use event capture
     * @returns {ListenerDomView} The current instance
     */
    setIsRegisteredForMouse (aBool, useCapture) {
        this.mouseListener().setUseCapture(useCapture).setIsListening(aBool);
        return this;
    }

    // --- mouse events ---

    /*
    // avoid declaring these as it will cause all views registered for mouse events to register for mousemove

    onMouseMove (event) {
        return true
    }

    onMouseOver (event) {
        return true
    }

    onMouseLeave (event) {
        return true
    }

    onMouseOver (event) {
        return true
    }
    */

    /**
     * @description Handles mouse down events
     * @param {Event} event - The mouse down event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onMouseDown (event) {
        const methodName = Mouse.shared().downMethodNameForEvent(event);
        if (methodName !== "onMouseDown") {
            this.logDebug(".onMouseDown calling: ", methodName);
            this.invokeMethodNameForEvent(methodName, event);
        }
        return true;
    }

    /**
     * @description Handles mouse up events
     * @param {Event} event - The mouse up event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onMouseUp (event) {
        const methodName = Mouse.shared().upMethodNameForEvent(event);
        if (methodName !== "onMouseUp") {
            this.logDebug(".onMouseUp calling: ", methodName);
            this.invokeMethodNameForEvent(methodName, event);
        }
        return true;
    }

    // --- registering for keyboard events ---

    /**
     * @description Checks if the view is registered for keyboard events
     * @returns {boolean} True if registered, false otherwise
     */
    isRegisteredForKeyboard () {
        return this.keyboardListener().isListening();
    }

    /**
     * @description Sets whether the view is registered for keyboard events
     * @param {boolean} aBool - True to register, false to unregister
     * @param {boolean} useCapture - Whether to use event capture
     * @returns {ListenerDomView} The current instance
     */
    setIsRegisteredForKeyboard (aBool, useCapture = false) {
        this.keyboardListener().setUseCapture(useCapture).setIsListening(aBool);

        const e = this.element();
        if (aBool) {
            DomView.setTabCount(DomView.tabCount() + 1);
            e.tabIndex = DomView.tabCount();  // need this in order for focus to work on BrowserColumn?
            //this.setCssProperty("outline", "none"); // needed?
        } else {
            delete e.tabindex;
        }

        return this;
    }

    // --- keyboard events ---

    /**
     * @description Handles key down events
     * @param {Event} event - The key down event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onKeyDown (event) {
        //SvKeyboard.shared().showEvent(event)
        // expand the method name to include combinations of meta keys (e.g. shift, function, control, option, command, etc)
        const methodName = SvKeyboard.shared().downMethodNameForEvent(event);
        //console.log(" onKeyDown ", methodName);
        //assert(methodName !== "onKeyDown");
        const result = this.invokeMethodNameForEvent(methodName, event);
        /*
        if (event.repeat) { // should this be a different method name?
            this.forceRedisplay() // can't tell if this works without disabling color transitions on tiles
        }
        */

        return result;
    }

    /**
     * @description Handles key up events
     * @param {Event} event - The key up event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onKeyUp (event) {
        let shouldPropogate = true;
        //this.logDebug(" onKeyUp ", event._id)
        const methodName = SvKeyboard.shared().upMethodNameForEvent(event);
        //console.log(this.svTypeId() + " onKeyUp methodName: ", methodName)
        shouldPropogate = this.invokeMethodNameForEvent(methodName, event);
        return shouldPropogate;
    }

    // --- registering for focus / blur events ---

    /**
     * @description Checks if the view is registered for focus events
     * @returns {boolean} True if registered, false otherwise
     */
    isRegisteredForFocus () {
        return this.focusListener().isListening();
    }

    /**
     * @description Sets whether the view is registered for focus events
     * @param {boolean} aBool - True to register, false to unregister
     * @returns {ListenerDomView} The current instance
     */
    setIsRegisteredForFocus (aBool) {
        if (aBool === false && !this.hasListenerNamed("FocusListener")) { // todo: clean this up
            return;
        }
        this.focusListener().setIsListening(aBool);
        return this;
    }

    // --- focus events ---

    /**
     * @description Handles focus in events
     * @param {Event} event - The focus in event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onFocusIn (/*event*/) {
        return true;
    }

    /**
     * @description Handles focus out events
     * @param {Event} event - The focus out event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onFocusOut (/*event*/) {
        return true;
    }

    /**
     * @description Handles focus events
     * @param {Event} event - The focus event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onFocus (/*event*/) {
        //console.log(this.svTypeId() + " onFocus")
        this.willAcceptFirstResponder();
        // subclasses can override
        //this.logDebug(" onFocus")
        return true;
    }

    /**
     * @description Handles blur events
     * @param {Event} event - The blur event object
     * @returns {boolean} True to continue event propagation, false otherwise
     */
    onBlur (/*event*/) {
        //console.log(this.svTypeId() + " onBlur")
        this.didReleaseFirstResponder();
        // subclasses can override
        //this.logDebug(" onBlur")
        return true;
    }

    // --- registering for clipboard events ---

    /**
     * @description Checks if the view is registered for clipboard events.
     * @returns {boolean} True if registered, false otherwise.
     */
    isRegisteredForClipboard () {
        return this.clipboardListener().isListening();
    }

    /**
     * @description Sets whether the view is registered for clipboard events.
     * @param {boolean} aBool - True to register, false to unregister.
     * @returns {ListenerDomView} The current instance.
     */
    setIsRegisteredForClipboard (aBool) {
        this.clipboardListener().setIsListening(aBool);
        return this;
    }

}.initThisClass());
