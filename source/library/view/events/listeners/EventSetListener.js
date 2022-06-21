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
    
    static initThisClass () {
        super.initThisClass()
        this.setClassVariable("_eventLevelCount", 0)
        this.setClassVariable("_hasReceivedEvent", false)
        return this
    }

    initPrototype () {
        this.newSlot("listenTarget", null)
        this.newSlot("delegate", null)
        this.newSlot("isListening", false)
        this.newSlot("eventsDict", null).setComment("should only write from within class & subclasses")
        this.newSlot("useCapture", false).setComment("whether event will be dispatched to listener before EventTarget beneath it in DOM tree")
        this.newSlot("methodSuffix", "")
    }

    static hasReceivedEvent () {
        return this._hasReceivedEvent
    }

    static setHasReceivedEvent (aBool) {
        assert(Type.isBoolean(aBool))
        this._hasReceivedEvent = aBool
        return this
    }

    static eventLevelCount () {
        return this._eventLevelCount
    }

    static setEventLevelCount (n) {
        assert(n > -1)
        this._eventLevelCount = n
        return this
    }

    static incrementEventLevelCount () {
        if (this.eventLevelCount() > 0) {
            console.warn("eventCountLevel = ", this.eventLevelCount())
            debugger;
        }
        this.setEventLevelCount(this.eventLevelCount() + 1)
        return this
    }

    static decrementEventLevelCount () {
        this.setEventLevelCount(this.eventLevelCount() - 1)
        return this
    }

    init () {
        super.init()
        this.setEventsDict({})
        this.setupEventsDict()
        return this
    }

    setupEventsDict () {
        // subclasses override to call addEventNameAndMethodName() for their events
        return this
    }

    /*
    view () {
        return this.element()._domView
    }
    */

    setListenTarget (t) {
        assert(t)
        this._listenTarget = t
        return this
    }

    listenTargetDescription () {
        return DomElement_description(this.listenTarget())
    }

    // --------------

    setUseCapture (v) {
        this._useCapture = v ? true : false;
        //this.setupEventsDict()

        if (this.isListening()) {
            this.stop()
            this.start()
        }

        return this
    }

    // ---

    fullMethodNameFor (methodName) {
        let suffix = ""

        if (this.useCapture()) {
            suffix = "Capture"
        }

        suffix += this.methodSuffix()
        return methodName + suffix
    }

    addEventNameAndMethodName (eventName, methodName, isUserInteraction) {
        this.eventsDict().atSlotPut(eventName, { 
            methodName: methodName, 
            handlerFunc: null,
            useCapture: this.useCapture(),
            isUserInteraction: isUserInteraction
        })
        return this
    }

    // ---

    setIsListening (aBool) {
        if (aBool) {
            this.start()
        } else {
            this.stop()
        }
        return this
    }

    forEachEventDict (func) {
        const eventsDict = this.eventsDict()
        this.eventsDict().ownForEachKV((eventName, eventDict) => {
            func(eventName, eventDict);
        })
        return this
    }

    assertHasListenTarget () {
        const t = this.listenTarget()
        assert(t !== null)
        assert(t !== undefined)
        return this
    }

    start () {
        if (this.isListening()) {
            return this
        }
        this._isListening = true; // can't use setter here as it would cause a loop

        this.assertHasListenTarget()

        this.eventsDict().ownForEachKV((eventName, dict) => {
            dict.handlerFunc = (event) => {
                return this.safeHandleEvent(event, dict)
            };
            dict.useCapture = this.useCapture()

            if (this.isDebugging()) {
                console.log("'" + this.listenTargetDescription() + ".addEventListener('" + eventName + "', handler, " + dict.useCapture + ") " + fullMethodName) 
            }

            this.listenTarget().addEventListener(eventName, dict.handlerFunc, dict.useCapture);
        })

        return this
    }

    safeHandleEvent (event, dict) {
        let result = undefined
        try { // ensure an exception doesn't cause us to skip the event level count decrement
            this.thisClass().incrementEventLevelCount()
            result = this.handleEvent(event, dict)
            this.thisClass().decrementEventLevelCount()
        } catch (e) {
            this.thisClass().decrementEventLevelCount()
            throw e
        }

        return result
    }

    handleEvent (event, dict) {
        const fullMethodName = this.fullMethodNameFor(dict.methodName)
        event._isUserInteraction = dict.isUserInteraction

        /*
        if (!event._id) {
            event._id = Math.floor(Math.random()*100000) // TODO: remove when not debugging
        }
        */

        const delegate = this.delegate()
        const method = delegate[fullMethodName]
        
        //console.log("fullMethodName = " + fullMethodName)

        /*
        if (Type.isNullOrUndefined(delegate) || Type.isNullOrUndefined(method)) {
            console.warn(" attempt to process '" + fullMethodName + "' event without a delegate")
            return 
        }
        */

        //try {
        let result = true
        if (method) {
            this.onBeforeEvent(fullMethodName, event)

            result = method.apply(delegate, [event]); 

            if (this.isDebugging()) {
                console.log("sent: " + delegate.type() + "." + fullMethodName, "(" + event.type + ") and returned " + result)
            }

            if (result === false) {
                event.stopPropagation()
                event.preventDefault()
            }

            this.onAfterEvent(fullMethodName, event)
        } else {
            if (this.isDebugging()) {
                console.log(this.listenTargetDescription() + " MISSING method: " + delegate.type() + "." + fullMethodName, "(" + event.type + ")" )
            }
        }

        // } catch (e) {

        //}


        return result
    }


    onBeforeEvent (methodName, event) {
        /*
        const a = methodName.contains("Capture") ||  methodName.contains("Focus") || methodName.contains("Move") || methodName.contains("Leave") || methodName.contains("Enter") || methodName.contains("Over")
        if (!a) {
            this.debugLog(" onBeforeEvent " + methodName)
        }
        */
        return this
    }

    onAfterEvent (methodName, event) {
        //console.log("event: ", methodName)
        if (!this.thisClass().hasReceivedEvent() && event._isUserInteraction) {
            // In normal web use, things like WebAudio context can't be created until 
            // we get first user interaction. So we send this event to let listeners know when
            // those APIs can be used. Would help if JS sent a special event for this.
            this.thisClass().setHasReceivedEvent(true)
            Broadcaster.shared().broadcastNameAndArgument("firstUserEvent", this) // need this for some JS APIs which can only be used after first input event
        }

        this.syncIfAppropriate()

        return this
    }

    syncIfAppropriate () {
        if (getGlobalThis().SyncScheduler) {
            /*
                run scheduled events here to ensure that a UI event won't occur
                before sync as that could leave the node and view out of sync
                e.g. 
                - edit view #1
                - sync to node
                - node posts didUpdateNode
                - edit view #2
                - view get didUpdateNode and does syncFromNode which overwrites view state #2
            */

            /*
            if (SyncScheduler.shared().actionCount()) {
                this.debugLog(" onAfterEvent " + methodName)
            }
            */
           assert(this.thisClass().eventLevelCount() > 0)
           if (this.thisClass().eventLevelCount() === 1) { 
                // we check event level count to ensure that we only 
                // sync when the stack fully unwinds back to the event loop.
                // This is not the case for some events like onblur which can be triggered by
                // removing a DOM element from a parent, and start an event callback before the
                // current event stack has unwound.
                console.log("--->>> sync scheduler running, eventLevelCount = " + this.thisClass().eventLevelCount())
                SyncScheduler.shared().fullSyncNow()
           }
        }
        return this
    }

    stop () {
        if (!this.isListening()) {
            return this
        }

        this._isListening = false;

        this.assertHasListenTarget()

        const t = this.listenTarget()
        this.eventsDict().ownForEachKV((eventName, dict) => {
            this.debugLog(() => this.delegate().typeId() + " will stop listening for " + dict.methodName)
            t.removeEventListener(eventName, dict.handlerFunc, dict.useCapture);
        })

        return this
    }   

}.initThisClass());

/*
    // globally track whether we are inside an event 

    setIsHandlingEvent () {
        DomView._isHandlingEvent = true
        return this
    }
	
    isHandlingEvent () {
        return DomView._isHandlingEvent
    }

    handleEventFunction (event, eventFunc) {
        //  a try gaurd to make sure isHandlingEvent has correct value
        //  isHandlingEvent is used to determine if view should inform node of changes
        //  - it should only while handling an event
		
        let error = null
		
        this.setIsHandlingEvent(true)
		
        try {
            eventFunc(event)
        } catch (e) {
            //console.log(e)
            e.show()
            //error = e
        }
		
        this.setIsHandlingEvent(false)
		
        if (error) {
            throw error
        }
    }
*/