"use strict";

/**
 * @module library.view.events.listening.EventListener
 */

/**
 * @class EventListener
 * @extends ProtoClass
 * @classdesc Listener for single event. Should only be used by EventSetListener class.
 * 
 * For full list of events, see:
 * https://developer.mozilla.org/en-US/docs/Web/Events
 */

let listenCount = 0;

(class EventListener extends ProtoClass {

    /**
     * @static
     * @description Initializes the class.
     */
    static initClass () {
        /**
         * @static
         * @property {Set} activeListeners - Set of active listeners (tmp debugging).
         */
        this.newClassSlot("activeListeners", new Set()) // tmp debugging
    }

    /**
     * @static
     * @description Gets active listeners for a specific owner.
     * @param {Object} owner - The owner object.
     * @returns {Array} Array of active listeners for the owner.
     */
    static activeListenersForOwner (owner) { // tmp debugging
        return this.activeListeners().filter(v => v.owner() === owner)
    }

    /**
     * @static
     * @description Gets all active owners.
     * @returns {Set} Set of active owners.
     */
    static activeOwners () { // tmp debugging
        const owners = new Set()
        this.activeListeners().forEach(v => owners.add(v.owner()))
        return owners
    }

    /**
     * @static
     * @description Shows active listeners (for debugging).
     */
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

    /**
     * @static
     * @description Shows active listeners for a specific owner (for debugging).
     * @param {Object} owner - The owner object.
     */
    static showActiveForOwner (owner) { // tmp debugging
        const listeners = this.activeListenersForOwner(owner)
        listeners.forEach(listener => {
            console.log("    " + listener.delegate().typeId() + " " + listener.fullMethodName())
        })
    }

    /**
     * @description Initializes the prototype slots.
     */
    initPrototypeSlots () {
        //this.newSlot("listenerSet", null); // possible owner

        /**
         * @property {Object} listenTarget - The target to listen to.
         */
        {
            const slot = this.newSlot("listenTarget", null);
            slot.setSlotType("Object");
        }
        /**
         * @property {Object} delegate - The delegate object.
         */
        {
            const slot = this.newSlot("delegate", null);
            slot.setSlotType("Object");
        }
        /**
         * @property {Boolean} isListening - Whether the listener is currently active.
         */
        {
            const slot = this.newSlot("isListening", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @property {String} eventName - The name of the event to listen for.
         */
        {
            const slot = this.newSlot("eventName", null);
            slot.setSlotType("String");
        }
        /**
         * @property {String} methodName - The name of the method to call when the event occurs.
         */
        {
            const slot = this.newSlot("methodName", null);
            slot.setSlotType("String");
        }
        /**
         * @property {String} fullMethodName - The full name of the method (calculated and cached).
         */
        {
            const slot = this.newSlot("fullMethodName", null); // calculated when methodName is set, and cached in ivar
            slot.setSlotType("String");
        }
        /**
         * @property {Function} handlerFunc - The function to handle the event.
         */
        {
            const slot = this.newSlot("handlerFunc", null);
            slot.setSlotType("Function");
            slot.setAllowsNullValue(true);
        }
        /**
         * @property {Boolean} isUserInteraction - Whether the event is a user interaction.
         */
        {
            const slot = this.newSlot("isUserInteraction", null); // set to match eventName
            slot.setSlotType("Boolean");
        }
        /**
         * @property {Boolean} useCapture - Whether the event will be dispatched to the listener before reaching the event target.
         */
        {
            const slot = this.newSlot("useCapture", false);
            slot.setComment("whether event will be dispatched to listener before EventTarget beneath it in DOM tree");
            slot.setSlotType("Boolean");
        }
        /**
         * @property {String} methodSuffix - The suffix to add to the method name.
         */
        {
            const slot = this.newSlot("methodSuffix", "");
            slot.setSlotType("String");
        }
    }

    /**
     * @description Initializes the EventListener.
     * @returns {EventListener} The initialized EventListener.
     */
    init () {
        super.init()
        this.setHandlerFunc(event => this.safeHandleEvent(event))
        //this.setHandlerFunc(event => this.handleEvent(event))
        return this
    }

    /**
     * @description Called when the methodName slot is updated.
     */
    didUpdateSlotMethodName () {
        this.clearFullMethodName()
    }

    /**
     * @description Called when the methodSuffix slot is updated.
     */
    didUpdateSlotMethodSuffix () {
        this.clearFullMethodName()
    }

    /**
     * @description Called when the useCapture slot is updated.
     */
    didUpdateSlotUseCapture () {
        this.clearFullMethodName()
    }

    /**
     * @description Sets the listen target.
     * @param {Object} t - The listen target.
     * @returns {EventListener} The EventListener instance.
     */
    setListenTarget (t) {
        if (this.isListening()) {
            assert(t)
        }
        this._listenTarget = t
        return this
    }

    /**
     * @description Gets the description of the listen target.
     * @returns {String} The description of the listen target.
     */
    listenTargetDescription () {
        return this.listenTarget().description()
    }

    /**
     * @description Clears the full method name.
     */
    clearFullMethodName () {
        this.setFullMethodName(null)
    }

    /**
     * @description Calculates the full method name.
     * @returns {String} The full method name.
     */
    calcFullMethodName () {
        let suffix = ""

        if (this.useCapture()) {
            suffix = "Capture"
        }

        suffix += this.methodSuffix()
        return this.methodName() + suffix
    }

    /**
     * @description Gets the full method name.
     * @returns {String} The full method name.
     */
    fullMethodName () {
        if (!this._fullMethodName) {
            this._fullMethodName = this.calcFullMethodName()
        }
        return this._fullMethodName
    }

    /**
     * @description Sets whether the listener is listening.
     * @param {Boolean} aBool - Whether to start or stop listening.
     * @returns {EventListener} The EventListener instance.
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
     * @description Asserts that the listener has a listen target.
     */
    assertHasListenTarget () {
        assert(!Type.isNullOrUndefined(this.listenTarget()))
    }

    /**
     * @description Checks if the listener is valid.
     * @returns {Boolean} Whether the listener is valid.
     */
    isValid () {
        const hasListenTarget = !Type.isNullOrUndefined(this.listenTarget())
        const hasEventName    = !Type.isNullOrUndefined(this.eventName())
        const hasMethodName   = !Type.isNullOrUndefined(this.methodName())
        return hasMethodName && hasEventName && hasListenTarget
    }
    
    /**
     * @description Gets the listener key.
     * @returns {String} The listener key.
     */
    listenerKey () {
        let key = null
        if (this.owner().node) {
             key = this.owner().typeId() + " " + this.owner().node().title() + " " + this.delegate().typeId() + " " + this.fullMethodName()
        } else {
            key = this.owner().typeId() + " " + this.delegate().typeId() + " " + this.fullMethodName()
        }
        return key
    }
    
    /**
     * @description Increments the listen count.
     */
    incrementListenCount () {
        listenCount++
        //EventListener.activeListeners().add(this)
        //console.log(this.listenerKey() + " START")
    }

    /**
     * @description Decrements the listen count.
     */
    decrementListenCount () {
        listenCount--
        //EventListener.activeListeners().delete(this)
        //console.log(this.listenerKey() + " STOP")
    }

    /**
     * @description Starts the listener.
     * @returns {EventListener} The EventListener instance.
     */
    start () {
        if (this.delegateCanRespond()) {
            if (!this.isListening()) {
                this.incrementListenCount()

                this.debugLog(() => this.delegate().typeId() + " will start listening for " + this.eventName() + " -> " + this.methodName())
                assert(this.isValid())
                this._isListening = true; // can't use setter here as it would cause a loop
                this.listenTarget().addEventListener(this.eventName(), this.handlerFunc(), this.useCapture());
                /*
                if (this.useCapture()) {
                    debugger;
                }
                */
            }
        } else {
            //console.log(this.delegate().debugTypeId() + " doesn't respond to " + this.fullMethodName() + " so we won't listen for " + this.eventName())
            //debugger;
        }
        return this
    }

    /**
     * @description Gets the owner of the listener.
     * @returns {Object} The owner object.
     */
    owner () {
        const d = this.delegate()
        if (d.viewTarget) {
            return d.viewTarget()
        }
        return d
    }

    /**
     * @description Gets the description of the owner.
     * @returns {String} The description of the owner.
     */
    ownerDescription () {
        const d = this.delegate()
        
        if (d.viewTarget) {
            //return d.viewTarget().debugTypeId() + "->" + d.type().before("GestureRecognizer") 
            return d.viewTarget().typeId() + " ->" + d.type().before("GestureRecognizer") 
        }

        return d.typeId()
    }

    /**
     * @description Safely handles the event.
     * @param {Event} event - The event to handle.
     * @returns {*} The result of handling the event.
     */
    safeHandleEvent (event) {
        const result =  EventManager.shared().safeWrapEvent(() => {
            //console.log("on event: ", this.listenerKey())

            /*
            //if (this.methodName() === "onMouseDown") {
            if (this.fullMethodName() === "onMouseDown") {
                console.log("on event: ", this.listenerKey())
                //EventListener.showActive()
                //MemoryUsage.shared().takeSnapshot()
            }
            */

            return this.handleEvent(event)
        }, event);
        
        return result
    }

    /**
     * @description Checks if the delegate can respond to the event.
     * @returns {Boolean} Whether the delegate can respond.
     */
    delegateCanRespond () {
        if (Type.isNullOrUndefined(this.delegate())) {
            return false
        }
        const method = this.delegate()[this.fullMethodName()]
        const canRespond = Type.isFunction(method)
        return canRespond
    }

    /**
     * @description Handles the event.
     * @param {Event} event - The event to handle.
     * @returns {*} The result of handling the event.
     */
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

    /**
     * @description Called before handling the event.
     * @param {Event} event - The event being handled.
     * @returns {EventListener} The EventListener instance.
     */
    onBeforeEvent (event) {
        return this
    }

    /**
     * @description Called after handling the event.
     * @param {Event} event - The event that was handled.
     * @returns {EventListener} The EventListener instance.
     */
    onAfterEvent (event) {
        if (this.isUserInteraction()) {
            EventManager.shared().onReceivedUserEvent()
        }
        return this
    }

    /**
     * @description Stops the listener.
     * @returns {EventListener} The EventListener instance.
     */
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