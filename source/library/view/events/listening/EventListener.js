"use strict";

/*
    EventListener

    Listener for single event. Should only be used by EventSetListener class.

*/

(class EventListener extends ProtoClass {

    initPrototype () {
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
        return this
    }

    didUpdateSlotMethodName () {
        this.setFullMethodName(this.calcFullMethodName())
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

    // --------------

    setUseCapture (v) {
        this._useCapture = v ? true : false;
        //this.setupListeners()

        if (this.isListening()) {
            this.stop()
            this.start()
        }

        return this
    }

    // ---

    calcFullMethodName () {
        let suffix = ""

        if (this.useCapture()) {
            suffix = "Capture"
        }

        suffix += this.methodSuffix()
        return this.methodName() + suffix
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

    assertHasListenTarget () {
        return !Type.isNullOrUndefined(this.listenTarget())
    }

    start () {
        if (this.isListening()) {
            return this
        }
        this._isListening = true; // can't use setter here as it would cause a loop

        this.assertHasListenTarget()

        this.listenTarget().addEventListener(this.eventName(), this.handlerFunc(), this.useCapture());

        return this
    }

    safeHandleEvent (event) {
        return EventManager.shared().safeWrapEvent(() =>  this.handleEvent(event))
    }

    handleEvent (event) {
        const fullMethodName = this.fullMethodName()
        event._isUserInteraction = this.isUserInteraction()

        const delegate = this.delegate()
        const method = delegate[fullMethodName]


        let result = true
        if (method) {
            this.onBeforeEvent(event)

            result = method.apply(delegate, [event]); 

            if (this.isDebugging()) {
                console.log("sent: " + delegate.type() + "." + fullMethodName, "(" + event.type + ") and returned " + result)
            }

            if (result === false) {
                event.stopPropagation()
                event.preventDefault()
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
        if (!this.isListening()) {
            return this
        }

        this.assertHasListenTarget()

        const t = this.listenTarget()
        this.debugLog(() => this.delegate().typeId() + " will stop listening for " + this.methodName())
        t.removeEventListener(this.eventName(), this.handlerFunc(), this.useCapture());
        this._isListening = false; // can't use setter here as it would cause a loop

        return this
    }   

}.initThisClass());

