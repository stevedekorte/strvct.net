"use strict";

/**
 * @module library.view.events.gesturing
 */

/**
 * @class GestureRecognizer
 * @extends ProtoClass
 * @description A class for recognizing gestures.

    This class:
     - listens for events 
     - uses logic to detect gestures
     - coordinates which gestures are active with a GestureManager
     - sends delegate messages for gesture state changes
    
    This class supports general gesture logic & helper methods
    and is intended to be sublclassed to implement particular gesture types. 
    See SlideGestureRecognizer, for an example subclass.

    Event Listeners

    Listeners are typically on a particular view's element. 
    document.body listeners are usually added once the gesture has begun, 
    in order to track events outside the element. 
    The document listeners are then removed once the gesture has ended or cancelled.

    Delegate Messages

    State change delegate messages are sent to the viewTarget. These are typically:
    
        accepts<GestureType>(aGesture)
        on<GestureType>Begin(aGesture)
        on<GestureType>Move(aGesture)
        on<GestureType>End(aGesture)
        on<GestureType>Cancel(aGesture)

    Simulating Touches with the Mouse

    Holding the SHIFT key and click-dragging the mouse can be used to simulate 2 finger 
    gestures on non-touch devices.

    State to track event semantics:

        downEvent - set onDownEvent *if* number of touchs is in correct range
        beginEvent - set when sending begin message - typically in onMove: 
        activePoints() - returns downEvent points for fingers contained in currentEvent
        upEvent - usually set on complete, not used much yet

    NOTES

    Browsers may implement their own touch gestures. To prevent these from 
    interfering with our own, be sure to call:

        aView.setTouchAction("none")

    On related views (or probably all views, to be safe) or set these in the CSS e.g.

        html * { touch-action: none; }

    TODO: 
    
    - rename methods to clearly identify Doc and View related methods
    - move visualizer to separate class?

    QUESTIONS:
    If a view has the active gesture control, and a decendent view requests becoming the active
    gesture, the GestureManager will detect this and let the child steal control.
    
*/

(class GestureRecognizer extends ProtoClass {
    
    initPrototypeSlots () {
        /**
         * @member {DomView} viewTarget - the view that the gesture is recognized on
         */
        {
            const slot = this.newSlot("viewTarget", null);
            slot.setSlotType("DomView");
        }

        /**
         * @member {Boolean} shouldRemoveOnComplete - whether the gesture should be removed on completion
         */
        {
            const slot = this.newSlot("shouldRemoveOnComplete", false);
            slot.setSlotType("Boolean");
        }

        // listener classes

        /**
         * @member {Array} listenerClasses - the classes of listeners to use
         */
        {
            const slot = this.newSlot("listenerClasses", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Array} moveListenerClasses - the classes of listeners to use for move events
         */
        {
            const slot = this.newSlot("moveListenerClasses", ["MouseMoveListener", "TouchMoveListener"]);
            slot.setSlotType("Array");
        }

        /**
         * @member {Array} defaultListenerClasses - the classes of listeners to use for view events
         */
        {
            const slot = this.newSlot("defaultListenerClasses", ["MouseListener", "TouchListener"]);
            slot.setSlotType("Array");
        }

            // listeners

        /**
         * @member {Array} viewListeners - the listeners for view events
         */
        {
            const slot = this.newSlot("viewListeners", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Array} docListeners - the listeners for document events
         */
        {
            const slot = this.newSlot("docListeners", null);
            slot.setSlotType("Array");
        }

        // move listeners

        /**
         * @member {Array} viewMoveListeners - the listeners for view move events
         */
        {
            const slot = this.newSlot("viewMoveListeners", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Array} docMoveListeners - the listeners for document move events
         */
        {
            const slot = this.newSlot("docMoveListeners", null);
            slot.setSlotType("Array");
        }

        // events

        /**
         * @member {Event} overEvent - the over event
         */
        {
            const slot = this.newSlot("overEvent", null);
            slot.setSlotType("Event");
        }

        /**
         * @member {Event} leaveEvent - the leave event
         */
        {
            const slot = this.newSlot("leaveEvent", null);
            slot.setSlotType("Event");
        }

        /**
         * @member {Boolean} didBegin - whether the gesture did begin
         */
        {
            const slot = this.newSlot("didBegin", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Event} downEvent - the down event
         */
        {
            const slot = this.newSlot("downEvent", null);
            slot.setSlotType("Event");
        }

        /**
         * @member {Event} beginEvent - the begin event
         */
        {
            const slot = this.newSlot("beginEvent", null);
            slot.setSlotType("Event");
        }

        /**
         * @member {Event} currentEvent - the current event
         */
        {
            const slot = this.newSlot("currentEvent", null);
            slot.setSlotType("Event");
        }

        /**
         * @member {Event} lastEvent - the last event
         */
        {
            const slot = this.newSlot("lastEvent", null);
            slot.setSlotType("Event");
        }

        /**
         * @member {Event} upEvent - the up event
         */
        {
            const slot = this.newSlot("upEvent", null);
            slot.setSlotType("Event");
        }

        /**
         * @member {Event} cancelEvent - the cancel event
         */
        {
            const slot = this.newSlot("cancelEvent", null);
            slot.setSlotType("Event");
        }

        // standard messages

        /**
         * @member {String} gestureName - the name of the gesture
         */
        {
            const slot = this.newSlot("gestureName", null); // sets <GestureType> name used for messages
            slot.setSlotType("String");
        }

        /**
         * @member {String} acceptMessage - the accept message
         */
        {
            const slot = this.newSlot("acceptMessage", null);  //"accepts<GestureType>"
            slot.setSlotType("String");
        }

        /**
         * @member {String} beginMessage - the begin message
         */
        {
            const slot = this.newSlot("beginMessage", null); //"on<GestureType>Begin",
            slot.setSlotType("String");
        }

        /**
         * @member {String} moveMessage - the move message
         */
        {
            const slot = this.newSlot("moveMessage", null); //"on<GestureType>Move",
            slot.setSlotType("String");
        }

        /**
         * @member {String} requestCancelMessage - the request cancel message
         */
        {
            const slot = this.newSlot("requestCancelMessage", null); // "on<GestureType>RequestCancel"
            slot.setSlotType("String");
        }

        /**
         * @member {String} cancelledMessage - the cancelled message
         */
        {
            const slot = this.newSlot("cancelledMessage", null); // "on<GestureType>Cancelled",
            slot.setSlotType("String");
        }

        /**
         * @member {String} completeMessage - the complete message
         */
        {
            const slot = this.newSlot("completeMessage", null); // "on<GestureType>Complete",
            slot.setSlotType("String");
        }
        
        // debugging

        /**
         * @member {Boolean} isEmulatingTouch - whether the gesture is emulating touch
         */
        {
            const slot = this.newSlot("isEmulatingTouch", false); // assumes touch and mouse events aren't mixed
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} isVisualDebugging - whether the gesture is visual debugging
         */
        {
            const slot = this.newSlot("isVisualDebugging", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Map} fingerViewMap - the map of fingers to views
         */
        {
            const slot = this.newSlot("fingerViewMap", null);
            slot.setSlotType("Map");
        }

        // begin pressing 

        /**
         * @member {Boolean} isPressing - whether the gesture is pressing
         */
        {
            const slot = this.newSlot("isPressing", false);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Number} minFingersRequired - the minimum number of fingers required for the gesture
         */
        {
            const slot = this.newSlot("minFingersRequired", 2);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} maxFingersAllowed - the maximum number of fingers allowed for the gesture
         */
        {
            const slot = this.newSlot("maxFingersAllowed", 4);
            slot.setSlotType("Number");
        }

        /**
         * @member {Number} minDistToBegin - the minimum distance to begin the gesture
         */
        {
            const slot = this.newSlot("minDistToBegin", 10);
            slot.setSlotType("Number");
        }

        /**
         * @member {Boolean} allowsKeyboardKeys - whether the gesture allows keyboard keys
         */
        {
            const slot = this.newSlot("allowsKeyboardKeys", false);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Array} requiresKeyboardKeys - the keyboard keys required for the gesture
         */
        {
            const slot = this.newSlot("requiresKeyboardKeys", null);
            slot.setSlotType("Array");
        }

        /**
         * @member {Boolean} shouldRequestActivation - whether the gesture should request activation
         */
        {
            const slot = this.newSlot("shouldRequestActivation", true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} shouldAcceptCancelRequest - whether the gesture should accept cancel requests
         */
        {
            const slot = this.newSlot("shouldAcceptCancelRequest", true);
            slot.setSlotType("Boolean");
        }

        /**
         * @member {Boolean} isActive - whether the gesture is active
         */
        {
            const slot = this.newSlot("isActive", false); // only used if shouldRequestActivation === false
            slot.setSlotType("Boolean");
        }

        /*
        {
            const slot = this.newSlot("isDebugging", false);
            slot.setSlotType("Boolean");
        }
         */
    }

    init () {
        super.init()
        this.setListenerClasses([]) // subclasses override this in their

        this.setViewListeners([])
        this.setDocListeners([])

        this.setViewMoveListeners([])
        this.setDocMoveListeners([])

        //this.setGestureName(this.type().before("GestureRecognizer"))
        this.autoSetMessageNames()
        this.setIsEmulatingTouch(true)
        this.setFingerViewMap(new Map())

        this.setIsDebugging(false)
        //this.setIsVisualDebugging(true)
        return this
    }

 
    // -- event helpers --

    /**
     * @description Clears the events.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    clearEvents () {
        this.setDownEvent(null);
        this.setBeginEvent(null);
        this.setCurrentEvent(null);
        return this;
    }
    
    /**
     * @description Sets the current event.
     * @param {Event} event - The event to set.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    setCurrentEvent (event) {
        if (this._currentEvent !== event) {
            this.setLastEvent(this._currentEvent);
            this._currentEvent = event;
        }
        return this;
    }

    /**
     * @description Returns the current position.
     * @returns {Point} The current position.
     */
    currentPosition () {
        return this.pointsForEvent(this.currentEvent()).first();
    }

    /**
     * @description Returns the down position.
     * @returns {Point} The down position.
     */
    downPosition () {
        return this.pointsForEvent(this.downEvent()).first();
    }

    /**
     * @description Returns the begin position.
     * @returns {Point} The begin position.
     */
    beginPosition () {
        return this.pointsForEvent(this.beginEvent()).first();
    }

    /**
     * @description Returns the up position.
     * @returns {Point} The up position.
     */
    upPosition () {
        return this.pointsForEvent(this.upEvent()).first();
    }

    /**
     * @description Returns the number of fingers down.
     * @returns {Number} The number of fingers down.
     */
    numberOfFingersDown () {
        const points = this.pointsForEvent(this.currentEvent());
        return points.length;
    }

    /**
     * @description Checks if the current event is on the target view.
     * @returns {Boolean} Whether the current event is on the target view.
     */
    currentEventIsOnTargetView () {
        const points = this.pointsForEvent(this.currentEvent())
        const p = points.first()
        const view = this.viewTarget()
        return view.containsPoint(p)
        //return points.canDetect(p1 => !view.containsPoint(p1))
    }

    // --- listener classes ---

    /**
     * @description Sets the listener classes.
     * @param {Array} classNames - The class names to set.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    setListenerClasses (classNames) {
        this._listenerClasses = classNames
        this.filterListenerClassesForTouch()
        return this
    }

    /**
     * @description Filters the listener classes for touch events.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    filterListenerClassesForTouch () {
        // if we don't have a touch screen, avoid registering for touch events
        if (!TouchScreen.shared().isSupported()) {
            const results = this.listenerClasses().filter(name => !name.beginsWith("Touch"))
            this._listenerClasses = results
        }
    }

    // --- new listeners ---

    /**
     * @description Creates new listeners for the given classes.
     * @param {Array} classesArray - The class names to create listeners for.
     * @returns {Array} The new listeners.
     */
    newListenersForClasses (classesArray) {
        return classesArray.map((className) => {
            const proto = Object.getClassNamed(className);
            const listener = proto.clone();
            listener.setDelegate(this);
            return listener
        })
    }

    /**
     * @description Starts new view listeners for the given classes.
     * @param {Array} classesArray - The class names to create listeners for.
     * @returns {Array} The new listeners.
     */
    startNewViewListenersForClasses (classesArray) {
        const listeners = this.newListenersForClasses(classesArray)
        listeners.forEach(listener => {
            listener.setListenTarget(this.viewTarget().element())
            listener.setIsDebugging(this.isDebugging())
            listener.start()
        })
        return listeners
    }
    
    /**
     * @description Starts new document listeners for the given classes.
     * @param {Array} classesArray - The class names to create listeners for.
     * @returns {Array} The new listeners.
     */
    startNewDocListenersForClasses (classesArray) {
        const listeners = this.newListenersForClasses(classesArray)
        listeners.forEach(listener => {
            listener.setUseCapture(true)
            listener.setListenTarget(window)
            listener.setIsDebugging(this.isDebugging())
            listener.start()
        })
        return listeners
    }

    // --- view listeners ---

    /**
     * @description Starts the view listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    startViewListeners () {
        //debugger;
        this.stopViewListeners()
        this.setViewListeners(this.startNewViewListenersForClasses(this.listenerClasses()))
        return this
    }

    /**
     * @description Stops the view listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    stopViewListeners () {
        this.viewListeners().forEach(listener => listener.stop())
        this.viewListeners().clear()
        return this
    }

    // --- doc listeners ---

    /**
     * @description Starts the document listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    startDocListeners () {
        this.stopDocListeners()
        this.setDocListeners(this.startNewDocListenersForClasses(this.listenerClasses()))
        return this
    }

    /**
     * @description Stops the document listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    stopDocListeners () {
        this.docListeners().forEach(listener => listener.stop())
        this.docListeners().clear()
        return this
    }

    // -- special case for mouse and touch move events ---

    /**
     * @description Updates the slot is pressing.
     * @param {Boolean} oldValue - The old value.
     * @param {Boolean} newValue - The new value.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    didUpdateSlotIsPressing (oldValue, newValue) {
        if (newValue === true) {
            this.startViewMoveListeners()
            this.startDocMoveListeners() // is this correct?
        } else {
            this.stopViewMoveListeners()
            this.stopDocMoveListeners() // is this correct?
        }
    }

    // --- view move listeners ---

    /**
     * @description Returns the move listeners for the given classes.
     * @returns {Array} The move listeners.
     */
    newMoveListeners () {
        return this.listenersForClasses(this.moveListenerClasses())
    }

    /**
     * @description Stops the view move listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    stopViewMoveListeners () {
        this.viewMoveListeners().forEach(listener => listener.stop())
        this.viewMoveListeners().clear()
        return this
    }

    /**
     * @description Starts the view move listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    startViewMoveListeners () {
        //debugger;
        this.stopViewMoveListeners()
        this.setViewMoveListeners(this.startNewViewListenersForClasses(this.moveListenerClasses()))
        return this
    }

    // --- doc move listeners ---

    /**
     * @description Stops the document move listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    stopDocMoveListeners () {
        this.docMoveListeners().forEach(listener => listener.stop())
        this.docMoveListeners().clear()
        return this
    }

    /**
     * @description Starts the document move listeners.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    startDocMoveListeners () {
        this.stopDocMoveListeners()
        this.setDocMoveListeners(this.startNewDocListenersForClasses(this.moveListenerClasses()))
        return this
    }

    // ---------------------

    // condition helpers

    /**
     * @description Checks if the gesture has moved enough.
     * @returns {Boolean} Whether the gesture has moved enough.
     */
    hasMovedEnough () {
        // intended to be overridden by subclasses
        // e.g. a rotation recognizer might look at how much first two fingers have rotated
        const m = this.minDistToBegin()
        const d = this.currentPosition().distanceFrom(this.downPosition())
        return d >= m
    }

    /**
     * @description Checks if the gesture has an acceptable finger count.
     * @returns {Boolean} Whether the gesture has an acceptable finger count.
     */
    hasAcceptableFingerCount () {
        const n = this.numberOfFingersDown()
        return  n >= this.minFingersRequired() &&
                n <= this.maxFingersAllowed();
    }

    /**
     * @description Checks if the keyboard state is acceptable.
     * @returns {Boolean} Whether the keyboard state is acceptable.
     */
    hasAcceptableKeyboardState () {
        if (!this.allowsKeyboardKeys()) {
            if (SvKeyboard.shared().hasKeysDown()) {
                // make exception for shift key since we use it to emulate multi-touch
                if (SvKeyboard.shared().shiftKey().isOnlyKeyDown()) {
                    return true
                }
                return false
            }
        }
        return true
    }

    /**
     * @description Checks if the gesture can begin.
     * @returns {Boolean} Whether the gesture can begin.
     */
    canBegin () {
        return !this.isActive() && 
                this.hasMovedEnough() && 
                this.hasAcceptableFingerCount() &&
                this.hasAcceptableKeyboardState();
    }

    // --- start / stop ---

    /**
     * @description Starts the gesture recognizer.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    start () {
        this.startViewListeners()
        // We typically don't want to listen to document level events all the time.
        // Instead, some view events will start and stop the doc listeners.
        //this.startViewMoveListeners() 
        return this
    }

    /**
     * @description Stops the gesture recognizer.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    stop () {
        this.stopViewListeners()
        this.stopDocListeners()
        this.stopViewMoveListeners() // is this correct?
        this.stopDocMoveListeners() // is this correct?
        return this
    }

    /**
     * @description Returns all event listeners.
     * @returns {Array} The event listeners.
     */
    allEventListeners () {
        const sets = [this.viewListeners(), this.docListeners(), this.viewMoveListeners(), this.docMoveListeners()].flat()
        return sets.map(eventListenerSet => eventListenerSet.allEventListeners()).flat()
    }

    // active

    /**
     * @description Requests activation if needed.
     * @returns {Boolean} Whether the activation was requested.
     */
    requestActivationIfNeeded () {
        if (this.shouldRequestActivation()) {
            return GestureManager.shared().requestActiveGesture(this);
        }
        this.setIsActive(true)
        return true
    }

    /**
     * @description Checks if the gesture is active.
     * @returns {Boolean} Whether the gesture is active.
     */
    isActive () {
        if (this.shouldRequestActivation()) {
            return GestureManager.shared().activeGesture() === this
        }
        return this._isActive
    }

    /**
     * @description Deactivates the gesture.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    deactivate () {
        if (this.shouldRequestActivation()) {
            GestureManager.shared().deactivateGesture(this);
        }
        this.setIsActive(false)
        return this
    }

    // finish

    /**
     * @description Finishes the gesture.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    didFinish () {
        this.setDidBegin(false)
        GestureManager.shared().removeBegunGesture(this)

        // why do we do this with a delay?
        // is it needed now to prevent a move
        this.addTimeout(() => { 
            GestureManager.shared().removeBegunGesture(this)
            this.deactivate();
        }, 0)

        if (this.shouldRemoveOnComplete() && this.viewTarget()) {
            this.stop()
            this.viewTarget().removeGestureRecognizer(this)
        }

        this.removeFingerViews()
        return this
    }

    // subclass helpers

    /**
     * @description Sends a delegate message.
     * @param {String} methodName - The method name.
     * @param {Any} argument - The argument.
     * @returns {Any} The result.
     */
    sendDelegateMessage (methodName, argument) {
        let result = undefined
        assert(methodName !== null)
        const vt = this.viewTarget()

        if (this.isDebugging()) {
            console.log(this.shortTypeId() + " sending " + methodName + " to " + vt.typeId())
        }

        //try {
        if (vt) {
            if (vt[methodName]) {
                result = vt[methodName].call(vt, this, argument)
            } else {
                if (this.isDebugging()) {
                    console.log("gesture delegate missing method " + methodName)
                }
                result = false
            }
        }
        /*
        } catch(e) {
            console.error(this.typeId() + ".sendDelegateMessage(" + methodName + ") caught exception ", e.stack)
            result = false
            //this.cancel() // how to do this without potentially cause a loop?
            e.rethrow();
        }
        */

        return result
    }

    // points helper
    // maps mouse and touch events to a common list of points (with times and ids) format
    // so we can share the event handling code for both devices 

    /**
     * @description Returns the points for the event.
     * @param {Event} event - The event.
     * @returns {Array} The points.
     */
    pointsForEvent (event) {
        if (Type.isNullOrUndefined(event)) {
            throw new Error(this.type() + ".pointsForEvent(event) event is missing")
        }

        const eventClass = event.__proto__.constructor;

        if (eventClass === MouseEvent) {
            //this.logDebug(" got mouse")
            return Mouse.shared().pointsForEvent(event)
        } else if (eventClass === TouchEvent) {   
            //this.logDebug(" got touch")
            return TouchScreen.shared().pointsForEvent(event)
        }
        
        console.warn(this.type() + " can't handle this event type yet: ", event)

        return []
    }

    // all events hook

    /**
     * @description Handles the event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onEvent (event) {
        if (this.isVisualDebugging()) {
            this.updateOutlineView()
            this.updateFingerViews()
            //this.updateDebugTimer()
        }
    }

    // --- events ---

    /**
     * @description Handles the over event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onOver (event) {
        this.setOverEvent(event)
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    /**
     * @description Handles the down event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onDown (event) {
        this.setDownEvent(event)
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    /**
     * @description Handles the move event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMove (event) {
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    /**
     * @description Handles the up event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onUp (event) {
        this.setUpEvent(event)
        //this.setCurrentEvent(event) // on Windows, the up event may not have any positions
        this.onEvent(event)
    }

    /**
     * @description Handles the leave event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onLeave (event) {
        this.setLeaveEvent(event)
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    // --- mouse events ---

    /**
     * @description Checks if the event should be emulated.
     * @param {Event} event - The event.
     * @returns {Boolean} Whether the event should be emulated.
     */
    shouldEmulateEvent (event) {
        return this.isEmulatingTouch() && 
                event.shiftKey && 
                event.__proto__.constructor === MouseEvent &&
                this.pointsForEvent(event).length === 1;
    }

    /**
     * @description Emulates the down event if needed.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    emulateDownIfNeeded (event) {
        const p1 = this.pointsForEvent(event).first()

        if (this.shouldEmulateEvent(event)) {
            // make a duplicate of the down event point with a different id
            const p2 = p1.copy().setId("emulatedTouch")
            p2.setX(p2.x() + 10)
            p2.setY(p2.y() + 10)
            event.pushCachedPoint(p2)
        }
        return this
    }

    /**
     * @description Handles the down event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseDown (event) {      
        //debugger;  
        this.emulateDownIfNeeded(event)
        this.setDownEvent(event)
        this.onDown(event)
    }

    /**
     * @description Emulates the move event if needed.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    emulateMoveIfNeeded (event) {
        const p2 = this.pointsForEvent(event).first()

        if (this.shouldEmulateEvent(event) && this.downEvent()) {      
            // get down point and current point and add an emulated point on the other side
            const p1 = this.pointsForEvent(this.downEvent()).first()
            const v = p2.subtract(p1).negated()
            const emulatedPoint = p1.add(v).setId("emulatedTouch")
            event.pushCachedPoint(emulatedPoint)
        }

        return this
    }

    /**
     * @description Handles the move event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseMove (event) {
        this.emulateMoveIfNeeded(event)
        this.onMove(event)
    }

    /**
     * @description Handles the up event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseUp (event) {
        this.onUp(event)
    }

    /**
     * @description Handles the leave event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseLeave (event) {
        this.onLeave(event)
    }

    // mouse capture events

    /**
     * @description Handles the over capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseOverCapture (event) {
        this.onOver(event)
    }

    /**
     * @description Handles the down capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseDownCapture (event) {
        this.emulateDownIfNeeded(event)
        this.onDown(event)
    }

    /**
     * @description Handles the move capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseMoveCapture (event) {
        this.emulateMoveIfNeeded(event)
        this.onMove(event)
    }

    /**
     * @description Handles the up capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseUpCapture (event) {
        this.onUp(event)
    }

    /**
     * @description Handles the leave capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onMouseLeaveCapture (event) {
        this.onLeave(event)
    }

    // touch events

    /**
     * @description Handles the touch start event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchStart (event) {
        this.onDown(event)
    }

    /**
     * @description Handles the touch move event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchMove (event) {
        this.onMove(event)
    }

    /**
     * @description Handles the touch end event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchEnd (event) {
        this.onUp(event)
    }

    /**
     * @description Handles the touch cancel event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchCancel (event) { 
        //this.onUp(event)
        this.cancel()
    }
    
    // touch capture events

    /**
     * @description Handles the touch start capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchStartCapture (event) {
        this.onDown(event)
    }

    /**
     * @description Handles the touch move capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchMoveCapture (event) {
        this.onMove(event)
    }

    /**
     * @description Handles the touch end capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchEndCapture (event) {
        this.onUp(event)
    }

    /**
     * @description Handles the touch cancel capture event.
     * @param {Event} event - The event.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    onTouchCancelCapture (event) {
        //this.onUp(event)
        this.cancel()
    }

    // diff position helper

    /**
     * @description Calculates the difference between the current position and the begin position.
     * @returns {Point} The difference between the current position and the begin position.
     */
    diffPos () {
        return this.currentPosition().subtract(this.beginPosition()).floorInPlace() // floor here?
    }

    /**
     * @description Calculates the distance between the current position and the begin position.
     * @returns {Number} The distance between the current position and the begin position.
     */
    distance () {
        const dp = this.diffPos()
        const dx = Math.abs(dp.x())
        const dy = Math.abs(dp.y())
        const funcs = {
            left: (dx, dy) => dx,
            right: (dx, dy) => dx,
            up: (dx, dy) => dy,
            down: (dx, dy) => dy,
            x: (dx, dy) => dx,
            y: (dx, dy) => dy
        }
        return funcs[this.direction()](dx, dy)
    }

    /**
     * @description Sets the gesture name.
     * @param {String} aName - The gesture name.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    setGestureName (aName) {
        this._gestureName = aName
        this.autoSetMessageNames()
        return this
    }

    /**
     * @description Returns the gesture name.
     * @returns {String} The gesture name.
     */
    gestureName () {
        if (this._gestureName) {
            return this._gestureName
        }
        return this.type().before("GestureRecognizer")
    }

    /**
     * @description Returns the default message for a state.
     * @param {String} state - The state.
     * @returns {String} The default message for the state.
     */
    defaultMessageForState (state) {
        return "on" + this.gestureName() + state.capitalized()
    }

    /**
     * @description Automatically sets the message names.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    autoSetMessageNames () {
        this.setAcceptMessage("accepts" + this.gestureName())
        this.setBeginMessage(this.defaultMessageForState("Begin"))
        this.setMoveMessage(this.defaultMessageForState("Move"))
        this.setRequestCancelMessage("on" + this.gestureName() + "RequestCancel")
        this.setCancelledMessage(this.defaultMessageForState("Cancelled"))
        this.setCompleteMessage(this.defaultMessageForState("Complete"))
        return this
    }

    // sending delegate messages

    /**
     * @description Checks if the target accepts the gesture.
     * @returns {Boolean} Whether the target accepts the gesture.
     */
    doesTargetAccept () {

        // see if view accepts the gesture before we begin
        // for now, assume it accepts if it doesn't implement the accept<GestureType> method
        const vt = this.viewTarget()
        if (vt[this.acceptMessage()]) {
            if (!this.sendDelegateMessage(this.acceptMessage())) {
                this.cancel()
                return false
            }
        }

        return true
    }

    /**
     * @description Sends the begin message.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    sendBeginMessage () {
        if (!this.doesTargetAccept()) {
            return this
        }
        
        this.setDidBegin(true)
        this.setBeginEvent(this.currentEvent())
        this.sendDelegateMessage(this.beginMessage())
        GestureManager.shared().addBegunGesture(this)
        return this
    }

    /**
     * @description Sends the move message.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    sendMoveMessage () {
        this.sendDelegateMessage(this.moveMessage())
        //this.didMove()
        return this
    }

    /**
     * @description Sends the complete message.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    sendCompleteMessage () {
        this.sendDelegateMessage(this.completeMessage())
        this.didFinish()
        return this
    }

    /**
     * @description Sends the cancelled message.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    sendCancelledMessage () {
        this.sendDelegateMessage(this.cancelledMessage())
        this.didFinish()
        return this
    }

    /**
     * @description Requests to cancel the gesture.
     * @param {GestureRecognizer} byGesture - The gesture that requests the cancellation.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    requestCancel (byGesture) {
        if (this.shouldAcceptCancelRequest()) {
            this.cancel()
        }
        /*
        const shouldCancel = this.sendDelegateMessage(this.requestCancelMessage(), byGesture)
        //console.log("this.requestCancelMessage() =================== ", this.requestCancelMessage(), " -> ", shouldCancel)
        if (shouldCancel || Type.isUndefined(shouldCancel)) { 
            this.cancel()
        }
        */
    }

    /**
     * @description Cancels the gesture.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    cancel () {
        this.logDebug(" cancel")
        //this.willCancel()
        this.sendCancelledMessage()
        //this.didCancel()
    }

    /*\
    willCancel () {

    }

    didCancel () {
        //this.didFinish()
    }
    */

    // ---

    /**
     * @description Cleans up the gesture recognizer.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    cleanup () {
        this.setDownEvent(null)
        this.setCurrentEvent(null)
        this.setUpEvent(null)
        return this
    }

    /**
     * @description Checks if the visual debugger should be shown.
     * @returns {Boolean} Whether the visual debugger should be shown.
     */
    shouldShowVisualDebugger () {
        return this.hasDownPointsInView() || this.isActive() // || this.isPressing());
    }

    // ---  outline view for debugging ---

    /**
     * @description Creates a new outline view.
     * @returns {DomView} The new outline view.
     */
    newOutlineView () {
        const v = DomView.clone()
        v.setPointerEvents("none")
        v.setBorder("1px dashed white")
        v.setBackgroundColor("transparent")
        v.setPosition("absolute")
        v.setZIndex(10000)
        return v
    }

    /**
     * @description Returns the outline view.
     * @returns {DomView} The outline view.
     */
    outlineView () {
        if (!this._outlineView) {
            const v = this.newOutlineView()
            this._outlineView = v
        }
        return this._outlineView
    }

    /**
     * @description Updates the outline view.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    updateOutlineView () {
        /*
        if (this.shouldShowVisualDebugger()) {
            this.showOutlineView()
        } else {
            const v = this.outlineView()
            if (v.parentView()) {
                v.removeFromParentView()
            }
        }
        */
    }

    /**
     * @description Shows the outline view.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    showOutlineView () {
        const v = this.outlineView()
        if (!v.parentView()) {
            DocumentBody.shared().addSubview(v)
        }
        const vt = this.viewTarget()
        const bounds = vt.frameInDocument()

        v.setMinAndMaxHeight(bounds.height())
        v.setMinAndMaxWidth(bounds.width())
        v.setLeftPx(bounds.x())
        v.setTopPx(bounds.y())
    }



    // --- finger views for debugging ---

    /**
     * @description Creates a new finger view.
     * @returns {DomView} The new finger view.
     */
    newFingerView () {
        const v = DomView.clone()
        v.setPointerEvents("none")

        const size = 50
        v.setMinAndMaxHeight(size)
        v.setMinAndMaxWidth(size)
        v.setBorderRadiusPx(Math.round(size/2) + "px")
        v.setBorder("1px dashed white")
        //v.setBackgroundColor("rgba(255, 255, 255, 0.5)")
        v.setPosition("absolute")
        v.setTextAlign("center")
        v.setZIndex(10000)
        v.setInnerHtml(this.type())
        v.setPxFontSize(10)
        v.setColor("white")
        return v
    }

    /**
     * @description Returns the view for a finger ID.
     * @param {String} id - The finger ID.
     * @returns {DomView} The view for the finger ID.
     */
    viewForFingerId (id) {
        const fvs = this.fingerViewMap();
        let v = fvs.get(id);
        if (!v) {
            v = this.newFingerView();
            DocumentBody.shared().addSubview(v);
            fvs.atPut(id, v);
        }
        return v;
    }

    /**
     * @description Removes the finger views.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    removeFingerViews () {
        const map = this.fingerViewMap();
        map.keysArray().forEach((id) => {
            const fingerView = map.get(id);
            fingerView.removeFromParentView();
        })
        map.clear();
        return this;
    }

    /**
     * @description Returns the title for a finger number.
     * @param {Number} n - The finger number.
     * @returns {String} The title for the finger number.
     */
    titleForFingerNumber (n) {
        return "&nbsp;".repeat(26) + this.type() + "&nbsp;" + n + "&nbsp;of&nbsp;" + this.numberOfFingersDown() 
    }

    /**
     * @description Shows the finger views.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    showFingers () {
        const points = this.pointsForEvent(this.currentEvent());
        const idsToRemoveSet = this.fingerViewMap().keysSet(); 
        let count = 1

        points.forEach((point) => {
            const id = point.id();
            const v = this.viewForFingerId(id);
            idsToRemoveSet.delete(id);
            const nx = point.x() - v.clientWidth()/2;
            const ny = point.y() - v.clientHeight()/2;
            v.setLeftPx(nx);
            v.setTopPx(ny);
            v.setInnerHtml(this.titleForFingerNumber(count));
            v.setBorder("1px dashed white");
            if (this.isPressing()) {
                v.setBorder("1px solid white");
                v.setColor("white");
            } else {
                v.setBorder("1px dashed #888");
                v.setColor("#888");
            }
            count ++;
        })

        const fvd = this.fingerViewMap();
        idsToRemoveSet.forEach((id) => {
            const fingerView = fvd.get(id);
            assert(fingerView);
            fingerView.removeFromParentView();
            fvd.delete(id);
        })

        return this;
    }

    /**
     * @description Updates the finger views.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    updateFingerViews () {
        if (this.shouldShowVisualDebugger()) {
            this.showFingers();
        } else {            
            this.removeFingerViews();
        }

        return this;
    }

    /**
     * @description Updates the debugger.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    updateDebugger () {
        this.updateOutlineView();
        this.updateFingerViews();
        if (this.viewTarget()) {
            console.log(this.viewTarget().typeId() + ".updateDebugger");
        }
    }

    /**
     * @description Returns the name of the update debugger timeout.
     * @returns {String} The name of the update debugger timeout.
     */
    updateDebuggerTimeoutName () {
        return "updateDebugger";
    }

    /**
     * @description Returns the timeout seconds for the update debugger.
     * @returns {Number} The timeout seconds for the update debugger.
     */
    updateDebuggerTimeoutSeconds () {
        return 0.1;
    }

    /**
     * @description Updates the debug timer.
     * @returns {GestureRecognizer} The updated gesture recognizer.
     */
    updateDebugTimer () {
        const ms = this.updateDebuggerTimeoutSeconds() * 1000;
        this.addTimeout(() => this.updateDebugger(), ms, this.updateDebuggerTimeoutName());
        return this;
    }

    // down points

    /**
     * @description Checks if there are down points in the view.
     * @returns {Boolean} Whether there are down points in the view.
     */
    hasDownPointsInView () {
        if (!this.viewTarget()) {
            return false;
        }

        const view = this.viewTarget();
        const points = this.allDownPoints();
        //console.log("all points.length:", points.length, " has match:", match != null)
        return points.canDetect(p => view.containsPoint(p));
    }

    /**
     * @description Returns all points.
     * @returns {Array} All points.
     */
    allPoints () { // TODO: some better abstraction for Touch+Mouse?
        const points = [];
        points.appendItems(TouchScreen.shared().currentPoints());
        points.appendItems(Mouse.shared().currentPoints());
        return points;
    }

    /**
     * @description Returns all down points.
     * @returns {Array} All down points.
     */
    allDownPoints () { // TODO: some better abstraction for Touch+Mouse?
        return this.allPoints().select(p => p.isDown());
    }

    /**
     * @description Returns the short type ID.
     * @returns {String} The short type ID.
     */
    shortTypeId () {
        return this.typeId().replaceAll("GestureRecognizer", "");
    }

    /**
     * @description Returns the description.
     * @returns {String} The description.
     */
    description () {
        return this.shortTypeId() + " on " + (this.viewTarget() ? this.viewTarget().typeId() : "null view target");
    }
    
}.initThisClass());

