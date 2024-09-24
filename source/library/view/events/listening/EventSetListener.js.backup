"use strict";

/*
    EventSetListener

    Manages registering a DOM element for a set of events which will be sent to a delegate
    using a (potentially different) method name. Subclasses override init to define the
    event set by calling this.addEventNameAndMethodName(...) for each event.

    Example use of:

        const mouseListener = MouseListener.clone().setListenTarget(element).setDelegate(anObject)

    will send onMouseDown(event), onMouseOver(event) etc to anObject when those events occur on the element.
    
    TODO: abstraction for eventsDict
*/

(class EventSetListener extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("listenTarget", null) // DOM Element (EventTarget)
            slot.setSlotType("Element");
        }
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("isListening", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("useCapture", false);
            slot.setComment("whether event will be dispatched to listener before EventTarget beneath it in DOM tree");
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("methodSuffix", "");
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("listenersMap", null) // Map of eventName -> EventListener entries
            slot.setSlotType("Map");
        }
    }

    init () {
        super.init();
        this.setListenersMap(new Map());
        this.setupListeners();
        return this;
    }

    setupListeners () {
        // subclasses override and set up event listeners by calling addEventNameAndMethodName()
    }

    /*
    view () {
        return this.listenTarget().domView()
    }
    */

    allEventListeners () {
        return this.listenersMap().valuesArray()
    }

    /* --- updates --- */

    didUpdateSlotDelegate () {
        this.resync()
        return this
    }

    didUpdateSlotListenTarget () {
        this.resync()
        return this
    }

    didUpdateSlotUseCapture () {
        this.resync()
        return this
    }

    didUpdateSlotMethodSuffix () {
        this.resync()
        return this
    }

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

    newListener () {
        const listener = EventListener.clone()
        this.syncToListener(listener)
        return listener
    }

    hasListenerForEventName (eventName) {
        return this.listenersMap().has(eventName)
    }

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

    syncToListener (aListener) {
        aListener.setListenTarget(this.listenTarget())
        aListener.setDelegate(this.delegate())
        aListener.setUseCapture(this.useCapture())
        aListener.setIsDebugging(this.isDebugging())
        return this
    }

    syncToListeners () {
        this.forEachListener(listener => this.syncToListener(listener))
        return this
    }

    forEachListener (fn) {
        this.listenersMap().forEachV(listener => fn(listener))
    }
    // --- listening ---

    setIsListening (aBool) {
        if (aBool) {
            this.start()
        } else {
            this.stop()
        }
        return this
    }

    start () {
        if (!this.isListening()) {
            this.syncToListeners()
            this.forEachListener(listener => listener.start())
            this._isListening = true; // can't use setter here as it would cause a loop
        }
        return this
    }

    stop () {
        if (this.isListening()) {
            this.forEachListener(listener => listener.stop())
            this._isListening = false; // can't use setter here as it would cause a loop
        }
        return this
    }   

}.initThisClass());
