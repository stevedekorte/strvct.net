"use strict";

/*
    EventListener

    Listener for single event. Should only be used by EventSetListener class.

    For full list of events, see:

    https://developer.mozilla.org/en-US/docs/Web/Events

*/

let listenCount = 0;

(class EventListener extends ProtoClass {

    static initClass () {
        this.newClassSlot("activeListeners", new Set()) // tmp debugging
    }

    static activeListenersForOwner (owner) { // tmp debugging
        return this.activeListeners().filter(v => v.owner() === owner)
    }

    static activeOwners () { // tmp debugging
        const owners = new Set()
        this.activeListeners().forEach(v => owners.add(v.owner()))
        return owners
    }

    static showActive () { // tmp debugging
        const owners = this.activeOwners()
        console.log("--- EventListener " + owners.size + " active owners ---")
        /*
        owners.forEach((owner) => {
            const listeners = this.activeListenersForOwner(owner)

            console.log("  " + owner.typeId() + ": " + listeners.length)
            //this.showActiveForOwner(owner)
        })
        */
        console.log("-------------------------------------")
    }

    static showActiveForOwner (owner) { // tmp debugging
        const listeners = this.activeListenersForOwner(owner)
        listeners.forEach(listener => {
            console.log("    " + listener.delegate().typeId() + " " + listener.fullMethodName())
        })
    }

    initPrototypeSlots () {
        //this.newSlot("listenerSet", null) // possible owner

        this.newSlot("listenTarget", null)
        this.newSlot("delegate", null)
        this.newSlot("isListening", false)

        this.newSlot("eventName", null)
        this.newSlot("methodName", null)
        this.newSlot("fullMethodName", null) // calculated when methodName is set, and cached in ivar
        this.newSlot("handlerFunc", null)
        this.newSlot("isUserInteraction", null) // set to match eventName
        this.newSlot("useCapture", false).setComment("whether event will be dispatched to listener before EventTarget beneath it in DOM tree")
        this.newSlot("methodSuffix", "")
    }

    init () {
        super.init()
        this.setHandlerFunc(event => this.safeHandleEvent(event))
        //this.setHandlerFunc(event => this.handleEvent(event))
        return this
    }

    // NOTE: atm, we leave restarting the event listeners up to the event set so we don't do extra restart

    didUpdateSlotMethodName () {
        this.clearFullMethodName()
    }

    didUpdateSlotMethodSuffix () {
        this.clearFullMethodName()
    }

    didUpdateSlotUseCapture () {
        this.clearFullMethodName()
    }

    setListenTarget (t) {
        if (this.isListening()) {
            assert(t)
        }
        this._listenTarget = t
        return this
    }

    listenTargetDescription () {
        return this.listenTarget().description()
    }

    // ---

    clearFullMethodName () {
        this.setFullMethodName(null)
    }

    calcFullMethodName () {
        let suffix = ""

        if (this.useCapture()) {
            suffix = "Capture"
        }

        suffix += this.methodSuffix()
        return this.methodName() + suffix
    }

    fullMethodName () {
        if (!this._fullMethodName) {
            this._fullMethodName = this.calcFullMethodName()
        }
        return this._fullMethodName
    }

    // ---------------------------------------------------------

    setIsListening (aBool) {
        if (aBool) {
            this.start()
        } else {
            this.stop()
        }
        return this
    }

    assertHasListenTarget () {
        assert(!Type.isNullOrUndefined(this.listenTarget()))
    }

    isValid () {
        const hasListenTarget = !Type.isNullOrUndefined(this.listenTarget())
        const hasEventName    = !Type.isNullOrUndefined(this.eventName())
        const hasMethodName   = !Type.isNullOrUndefined(this.methodName())
        return hasMethodName && hasEventName && hasListenTarget
    }
    
    // listener key

    listenerKey () {
        let key = null
        if (this.owner().node) {
             key = this.owner().typeId() + " " + this.owner().node().title() + " " + this.delegate().typeId() + " " + this.fullMethodName()
        } else {
            key = this.owner().typeId() + " " + this.delegate().typeId() + " " + this.fullMethodName()
        }
        return key
    }
    
    incrementListenCount () {
        listenCount++
        //EventListener.activeListeners().add(this)
        //console.log(this.listenerKey() + " START")
    }

    decrementListenCount () {
        listenCount--
        //EventListener.activeListeners().delete(this)
        //console.log(this.listenerKey() + " STOP")
    }

    // ---------------------------------------------------------

    start () {
        if (this.delegateCanRespond()) {
            if (!this.isListening()) {
                this.incrementListenCount()

                //this.debugLog(() => this.delegate().typeId() + " will start listening for " + this.eventName() + " -> " + this.methodName())
                assert(this.isValid())
                this._isListening = true; // can't use setter here as it would cause a loop
                this.listenTarget().addEventListener(this.eventName(), this.handlerFunc(), this.useCapture());
            }
        } else {
            //console.log(this.delegate().debugTypeId() + " doesn't respond to " + this.fullMethodName() + " so we won't listen for " + this.eventName())
            //debugger;
        }
        return this
    }

    owner () {
        const d = this.delegate()
        if (d.viewTarget) {
            return d.viewTarget()
        }
        return d
    }

    ownerDescription () {
        const d = this.delegate()
        
        if (d.viewTarget) {
            //return d.viewTarget().debugTypeId() + "->" + d.type().before("GestureRecognizer") 
            return d.viewTarget().typeId() + " ->" + d.type().before("GestureRecognizer") 
        }

        return d.typeId()
    }

    /*
    descriptionForEvent (event) {
        const e = event.currentTarget
        let label = undefined
        if (e.domView) {
            label = e.domView().type()
        } else {
            label = e.constructor.name
        }
    }
    */

    safeHandleEvent (event) {
        const result =  EventManager.shared().safeWrapEvent(() => {
            //if (this.methodName() === "onMouseDown") {
            if (this.fullMethodName() === "onMouseDown") {
                console.log("on event: ", this.listenerKey())
                //EventListener.showActive()
                //MemoryUsage.shared().takeSnapshot()
            }

            this.handleEvent(event)
        })

        /*
        // tmp debugging code
        if (this.methodName() === "onMouseDown") {
            console.log("on event: ", this.listenerKey())
            EventListener.showActive()
            //MemoryUsage.shared().takeSnapshot()
        }
        */
        
        return result
    }

    delegateCanRespond () {
        if (Type.isNullOrUndefined(this.delegate())) {
            return false
        }
        const method = this.delegate()[this.fullMethodName()]
        const canRespond = Type.isFunction(method)
        return canRespond
    }

    handleEvent (event) {
        const fullMethodName = this.fullMethodName()
        //event._isUserInteraction = this.isUserInteraction() // unused

        const delegate = this.delegate()
        const method = delegate[fullMethodName]


        let result = true
        if (method) {
            this.onBeforeEvent(event)

            result = method.call(delegate, event); 

            if (this.isDebugging()) {
                console.log("sent: " + delegate.type() + "." + fullMethodName, "(" + event.type + ") and returned " + result)
            }

            if (result === false) {
                event.stopPropagation()
                if (event.cancelable) {
                    event.preventDefault() // do we want this?
                }
            }

            this.onAfterEvent(event)
        } else {
            if (this.isDebugging()) {
                console.log(this.listenTargetDescription() + " MISSING method: " + delegate.type() + "." + fullMethodName, "(" + event.type + ")" )
            }
        }

        return result
    }

    onBeforeEvent (event) {
        return this
    }

    onAfterEvent (event) {
        if (this.isUserInteraction()) {
            EventManager.shared().onReceivedUserEvent()
        }
        return this
    }

    stop () {
        if (this.isListening()) {
            this.assertHasListenTarget()

            const t = this.listenTarget()

            this.decrementListenCount()

            //this.debugLog(() => this.delegate().typeId() + " will stop listening for " + this.methodName())
            t.removeEventListener(this.eventName(), this.handlerFunc(), this.useCapture());
            this._isListening = false; // can't use setter here as it would cause a loop
        }

        return this
    }   

}.initThisClass());

