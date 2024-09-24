/**
 * @module library.view.events.listening
 */

"use strict";

/**
 * @class EventSetListener
 * @extends ProtoClass
 * @classdesc Manages registering a DOM element for a set of events which will be sent to a delegate
 * using a (potentially different) method name. Subclasses override init to define the
 * event set by calling this.addEventNameAndMethodName(...) for each event.
 *
 * Example use of:
 *
 *     const mouseListener = MouseListener.clone().setListenTarget(element).setDelegate(anObject)
 *
 * will send onMouseDown(event), onMouseOver(event) etc to anObject when those events occur on the element.
 * 
 * TODO: abstraction for eventsDict
 */
(class EventSetListener extends ProtoClass {

    initPrototypeSlots () {
        /**
         * @property {Element} listenTarget - DOM Element (EventTarget)
         */
        {
            const slot = this.newSlot("listenTarget", null)
            slot.setSlotType("Element");
        }
        /**
         * @property {Object} delegate
         */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }
        /**
         * @property {Boolean} isListening
         */
        {
            const slot = this.newSlot("isListening", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @property {Boolean} useCapture - whether event will be dispatched to listener before EventTarget beneath it in DOM tree
         */
        {
            const slot = this.newSlot("useCapture", false);
            slot.setComment("whether event will be dispatched to listener before EventTarget beneath it in DOM tree");
            slot.setSlotType("Boolean");
        }
        /**
         * @property {String} methodSuffix
         */
        {
            const slot = this.newSlot("methodSuffix", "");
            slot.setSlotType("String");
        }
        /**
         * @property {Map} listenersMap - Map of eventName -> EventListener entries
         */
        {
            const slot = this.newSlot("listenersMap", null)
            slot.setSlotType("Map");
        }
    }

    /**
     * @description Initializes the EventSetListener
     * @returns {EventSetListener}
     */
    init () {
        super.init();
        this.setListenersMap(new Map());
        this.setupListeners();
        return this;
    }

    /**
     * @description Sets up event listeners. Subclasses override and set up event listeners by calling addEventNameAndMethodName()
     */
    setupListeners () {
        // subclasses override and set up event listeners by calling addEventNameAndMethodName()
    }

    /*
    view () {
        return this.listenTarget().domView()
    }
    */

    /**
     * @description Returns an array of all event listeners
     * @returns {Array}
     */
    allEventListeners () {
        return this.listenersMap().valuesArray()
    }

    /* --- updates --- */

    /**
     * @description Updates the delegate and resyncs
     * @returns {EventSetListener}
     */
    didUpdateSlotDelegate () {
        this.resync()
        return this
    }

    /**
     * @description Updates the listen target and resyncs
     * @returns {EventSetListener}
     */
    didUpdateSlotListenTarget () {
        this.resync()
        return this
    }

    /**
     * @description Updates the use capture setting and resyncs
     * @returns {EventSetListener}
     */
    didUpdateSlotUseCapture () {
        this.resync()
        return this
    }

    /**
     * @description Updates the method suffix and resyncs
     * @returns {EventSetListener}
     */
    didUpdateSlotMethodSuffix () {
        this.resync()
        return this
    }

    /**
     * @description Resyncs the event listeners
     * @returns {EventSetListener}
     */
    resync () {
        if (this.isListening()) {
            console.warn(this.type() + " resyncing while listening")
            debugger;
            this.stop()
            this.syncToListeners()
            this.start()
        } else {
            this.syncToListeners()
        }
        return this
    }

    // --- listeners ---

    /**
     * @description Creates a new EventListener
     * @returns {EventListener}
     */
    newListener () {
        const listener = EventListener.clone()
        this.syncToListener(listener)
        return listener
    }

    /**
     * @description Checks if there's a listener for the given event name
     * @param {string} eventName - The name of the event
     * @returns {boolean}
     */
    hasListenerForEventName (eventName) {
        return this.listenersMap().has(eventName)
    }

    /**
     * @description Adds a new event listener for the given event name and method name
     * @param {string} eventName - The name of the event
     * @param {string} methodName - The name of the method to be called
     * @param {boolean} isUserInteraction - Whether this is a user interaction event
     * @returns {EventListener}
     */
    addEventNameAndMethodName (eventName, methodName, isUserInteraction) {
        assert(!isUserInteraction)
        assert(!this.isListening()) // TODO: handle this later
        // TODO: make sure there's not already a listener for this eventName

        assert(!this.hasListenerForEventName(eventName))

        const listener = this.newListener()
        listener.setEventName(eventName)
        listener.setMethodName(methodName)
        listener.setIsUserInteraction(isUserInteraction)
        this.listenersMap().set(eventName, listener)
        return listener
    }

    /**
     * @description Syncs the given listener with the current state
     * @param {EventListener} aListener - The listener to sync
     * @returns {EventSetListener}
     */
    syncToListener (aListener) {
        aListener.setListenTarget(this.listenTarget())
        aListener.setDelegate(this.delegate())
        aListener.setUseCapture(this.useCapture())
        aListener.setIsDebugging(this.isDebugging())
        return this
    }

    /**
     * @description Syncs all listeners
     * @returns {EventSetListener}
     */
    syncToListeners () {
        this.forEachListener(listener => this.syncToListener(listener))
        return this
    }

    /**
     * @description Executes a function for each listener
     * @param {Function} fn - The function to execute
     */
    forEachListener (fn) {
        this.listenersMap().forEachV(listener => fn(listener))
    }

    // --- listening ---

    /**
     * @description Sets the listening state
     * @param {boolean} aBool - Whether to start or stop listening
     * @returns {EventSetListener}
     */
    setIsListening (aBool) {
        if (aBool) {
            this.start()
        } else {
            this.stop()
        }
        return this
    }

    /**
     * @description Starts listening for events
     * @returns {EventSetListener}
     */
    start () {
        if (!this.isListening()) {
            this.syncToListeners()
            this.forEachListener(listener => listener.start())
            this._isListening = true; // can't use setter here as it would cause a loop
        }
        return this
    }

    /**
     * @description Stops listening for events
     * @returns {EventSetListener}
     */
    stop () {
        if (this.isListening()) {
            this.forEachListener(listener => listener.stop())
            this._isListening = false; // can't use setter here as it would cause a loop
        }
        return this
    }   

}.initThisClass());