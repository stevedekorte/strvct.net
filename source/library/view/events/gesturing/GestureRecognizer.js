"use strict";

/*
    GestureRecognizer

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
        {
            const slot = this.newSlot("viewTarget", null);
            slot.setSlotType("DomeView");
        }
        {
            const slot = this.newSlot("shouldRemoveOnComplete", false);
            slot.setSlotType("Boolean");
        }

        // listener classes

        {
            const slot = this.newSlot("listenerClasses", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("moveListenerClasses", ["MouseMoveListener", "TouchMoveListener"]);
            slot.setSlotType("Array");
        }

        {
            const slot = this.newSlot("defaultListenerClasses", ["MouseListener", "TouchListener"]);
            slot.setSlotType("Array");
        }

        // listeners

        {
            const slot = this.newSlot("viewListeners", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("docListeners", null);
            slot.setSlotType("Array");
        }

        // move listeners

        {
            const slot = this.newSlot("viewMoveListeners", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("docMoveListeners", null);
            slot.setSlotType("Array");
        }

        // events

        {
            const slot = this.newSlot("overEvent", null);
            slot.setSlotType("Event");
        }
        {
            const slot = this.newSlot("leaveEvent", null);
            slot.setSlotType("Event");
        }
        {
            const slot = this.newSlot("didBegin", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("downEvent", null);
            slot.setSlotType("Event");
        }
        {
            const slot = this.newSlot("beginEvent", null);
            slot.setSlotType("Event");
        }
        {
            const slot = this.newSlot("currentEvent", null);
            slot.setSlotType("Event");
        }
        {
            const slot = this.newSlot("lastEvent", null);
            slot.setSlotType("Event");
        }
        {
            const slot = this.newSlot("upEvent", null);
            slot.setSlotType("Event");
        }

        // standard messages

        {
            const slot = this.newSlot("gestureName", null); // sets <GestureType> name used for messages
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("acceptMessage", null);  //"accepts<GestureType>"
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("beginMessage", null); //"on<GestureType>Begin",
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("moveMessage", null); //"on<GestureType>Move",
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("requestCancelMessage", null); // "on<GestureType>RequestCancel"
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("cancelledMessage", null); // "on<GestureType>Cancelled",
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("completeMessage", null); // "on<GestureType>Complete",
            slot.setSlotType("String");
        }
        
        // debugging

        {
            const slot = this.newSlot("isEmulatingTouch", false); // assumes touch and mouse events aren't mixed
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isVisualDebugging", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("fingerViewMap", null);
            slot.setSlotType("Map");
        }

        // begin pressing 

        {
            const slot = this.newSlot("isPressing", false);
            slot.setDoesHookSetter(true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("minFingersRequired", 2);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("maxFingersAllowed", 4);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("minDistToBegin", 10);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("allowsKeyboardKeys", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("requiresKeyboardKeys", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("shouldRequestActivation", true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("shouldAcceptCancelRequest", true);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("isActive", false); // only used if shouldRequestActivation === false
            slot.setSlotType("Boolean");
        }
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

    clearEvents () {
        this.setDownEvent(null);
        this.setBeginEvent(null);
        this.setCurrentEvent(null);
        return this;
    }
    
    setCurrentEvent (event) {
        if (this._currentEvent !== event) {
            this.setLastEvent(this._currentEvent);
            this._currentEvent = event;
        }
        return this;
    }

    currentPosition () {
        return this.pointsForEvent(this.currentEvent()).first();
    }

    downPosition () {
        return this.pointsForEvent(this.downEvent()).first();
    }

    beginPosition () {
        return this.pointsForEvent(this.beginEvent()).first();
    }

    upPosition () {
        return this.pointsForEvent(this.upEvent()).first();
    }

    numberOfFingersDown () {
        const points = this.pointsForEvent(this.currentEvent());
        return points.length;
    }

    currentEventIsOnTargetView () {
        const points = this.pointsForEvent(this.currentEvent())
        const p = points.first()
        const view = this.viewTarget()
        return view.containsPoint(p)
        //return points.canDetect(p1 => !view.containsPoint(p1))
    }

    // --- listener classes ---

    setListenerClasses (classNames) {
        this._listenerClasses = classNames
        this.filterListenerClassesForTouch()
        return this
    }

    filterListenerClassesForTouch () {
        // if we don't have a touch screen, avoid registering for touch events
        if (!TouchScreen.shared().isSupported()) {
            const results = this.listenerClasses().filter(name => !name.beginsWith("Touch"))
            this._listenerClasses = results
        }
    }

    // --- new listeners ---

    newListenersForClasses (classesArray) {
        return classesArray.map((className) => {
            const proto = Object.getClassNamed(className);
            const listener = proto.clone();
            listener.setDelegate(this);
            return listener
        })
    }

    startNewViewListenersForClasses (classesArray) {
        const listeners = this.newListenersForClasses(classesArray)
        listeners.forEach(listener => {
            listener.setListenTarget(this.viewTarget().element())
            listener.setIsDebugging(this.isDebugging())
            listener.start()
        })
        return listeners
    }
    
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

    startViewListeners () {
        //debugger;
        this.stopViewListeners()
        this.setViewListeners(this.startNewViewListenersForClasses(this.listenerClasses()))
        return this
    }

    stopViewListeners () {
        this.viewListeners().forEach(listener => listener.stop())
        this.viewListeners().clear()
        return this
    }

    // --- doc listeners ---

    startDocListeners () {
        this.stopDocListeners()
        this.setDocListeners(this.startNewDocListenersForClasses(this.listenerClasses()))
        return this
    }

    stopDocListeners () {
        this.docListeners().forEach(listener => listener.stop())
        this.docListeners().clear()
        return this
    }

    // -- special case for mouse and touch move events ---

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

    newMoveListeners () {
        return this.listenersForClasses(this.moveListenerClasses())
    }

    stopViewMoveListeners () {
        this.viewMoveListeners().forEach(listener => listener.stop())
        this.viewMoveListeners().clear()
        return this
    }

    startViewMoveListeners () {
        //debugger;
        this.stopViewMoveListeners()
        this.setViewMoveListeners(this.startNewViewListenersForClasses(this.moveListenerClasses()))
        return this
    }

    // --- doc move listeners ---

    stopDocMoveListeners () {
        this.docMoveListeners().forEach(listener => listener.stop())
        this.docMoveListeners().clear()
        return this
    }

    startDocMoveListeners () {
        this.stopDocMoveListeners()
        this.setDocMoveListeners(this.startNewDocListenersForClasses(this.moveListenerClasses()))
        return this
    }

    // ---------------------

    // condition helpers

    hasMovedEnough () {
        // intended to be overridden by subclasses
        // e.g. a rotation recognizer might look at how much first two fingers have rotated
        const m = this.minDistToBegin()
        const d = this.currentPosition().distanceFrom(this.downPosition())
        return d >= m
    }

    hasAcceptableFingerCount () {
        const n = this.numberOfFingersDown()
        return  n >= this.minFingersRequired() &&
                n <= this.maxFingersAllowed();
    }

    hasAcceptableKeyboardState () {
        if (!this.allowsKeyboardKeys()) {
            if (BMKeyboard.shared().hasKeysDown()) {
                // make exception for shift key since we use it to emulate multi-touch
                if (BMKeyboard.shared().shiftKey().isOnlyKeyDown()) {
                    return true
                }
                return false
            }
        }
        return true
    }

    canBegin () {
        return !this.isActive() && 
                this.hasMovedEnough() && 
                this.hasAcceptableFingerCount() &&
                this.hasAcceptableKeyboardState();
    }

    // --- start / stop ---

    start () {
        this.startViewListeners()
        // We typically don't want to listen to document level events all the time.
        // Instead, some view events will start and stop the doc listeners.
        //this.startViewMoveListeners() 
        return this
    }

    stop () {
        this.stopViewListeners()
        this.stopDocListeners()
        this.stopViewMoveListeners() // is this correct?
        this.stopDocMoveListeners() // is this correct?
        return this
    }

    allEventListeners () {
        const sets = [this.viewListeners(), this.docListeners(), this.viewMoveListeners(), this.docMoveListeners()].flat()
        return sets.map(eventListenerSet => eventListenerSet.allEventListeners()).flat()
    }

    // active

    requestActivationIfNeeded () {
        if (this.shouldRequestActivation()) {
            return GestureManager.shared().requestActiveGesture(this);
        }
        this.setIsActive(true)
        return true
    }

    isActive () {
        if (this.shouldRequestActivation()) {
            return GestureManager.shared().activeGesture() === this
        }
        return this._isActive
    }

    deactivate () {
        if (this.shouldRequestActivation()) {
            GestureManager.shared().deactivateGesture(this);
        }
        this.setIsActive(false)
        return this
    }

    // finish

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

    pointsForEvent (event) {
        if (Type.isNullOrUndefined(event)) {
            throw new Error(this.type() + ".pointsForEvent(event) event is missing")
        }

        const eventClass = event.__proto__.constructor;

        if (eventClass === MouseEvent) {
            //this.debugLog(" got mouse")
            return Mouse.shared().pointsForEvent(event)
        } else if (eventClass === TouchEvent) {   
            //this.debugLog(" got touch")
            return TouchScreen.shared().pointsForEvent(event)
        }
        
        console.warn(this.type() + " can't handle this event type yet: ", event)

        return []
    }

    // all events hook

    onEvent (event) {
        if (this.isVisualDebugging()) {
            this.updateOutlineView()
            this.updateFingerViews()
            //this.updateDebugTimer()
        }
    }

    // --- events ---

    onOver (event) {
        this.setOverEvent(event)
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    onDown (event) {
        this.setDownEvent(event)
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    onMove (event) {
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    onUp (event) {
        this.setUpEvent(event)
        //this.setCurrentEvent(event) // on Windows, the up event may not have any positions
        this.onEvent(event)
    }

    onLeave (event) {
        this.setLeaveEvent(event)
        this.setCurrentEvent(event)
        this.onEvent(event)
    }

    // --- mouse events ---

    shouldEmulateEvent (event) {
        return this.isEmulatingTouch() && 
                event.shiftKey && 
                event.__proto__.constructor === MouseEvent &&
                this.pointsForEvent(event).length === 1;
    }

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

    onMouseDown (event) {      
        //debugger;  
        this.emulateDownIfNeeded(event)
        this.setDownEvent(event)
        this.onDown(event)
    }

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

    onMouseMove (event) {
        this.emulateMoveIfNeeded(event)
        this.onMove(event)
    }

    onMouseUp (event) {
        this.onUp(event)
    }

    onMouseLeave (event) {
        this.onLeave(event)
    }

    // mouse capture events

    onMouseOverCapture (event) {
        this.onOver(event)
    }

    onMouseDownCapture (event) {
        this.emulateDownIfNeeded(event)
        this.onDown(event)
    }

    onMouseMoveCapture (event) {
        this.emulateMoveIfNeeded(event)
        this.onMove(event)
    }

    onMouseUpCapture (event) {
        this.onUp(event)
    }

    onMouseLeaveCapture (event) {
        this.onLeave(event)
    }

    // touch events

    onTouchStart (event) {
        this.onDown(event)
    }

    onTouchMove (event) {
        this.onMove(event)
    }

    onTouchEnd (event) {
        this.onUp(event)
    }

    onTouchCancel (event) { 
        //this.onUp(event)
        this.cancel()
    }
    
    // touch capture events

    onTouchStartCapture (event) {
        this.onDown(event)
    }

    onTouchMoveCapture (event) {
        this.onMove(event)
    }

    onTouchEndCapture (event) {
        this.onUp(event)
    }

    onTouchCancelCapture (event) {
        //this.onUp(event)
        this.cancel()
    }

    // diff position helper

    diffPos () {
        return this.currentPosition().subtract(this.beginPosition()).floorInPlace() // floor here?
    }

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

    setGestureName (aName) {
        this._gestureName = aName
        this.autoSetMessageNames()
        return this
    }

    gestureName () {
        if (this._gestureName) {
            return this._gestureName
        }
        return this.type().before("GestureRecognizer")
    }

    defaultMessageForState (state) {
        return "on" + this.gestureName() + state.capitalized()
    }

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

    sendMoveMessage () {
        this.sendDelegateMessage(this.moveMessage())
        //this.didMove()
        return this
    }

    sendCompleteMessage () {
        this.sendDelegateMessage(this.completeMessage())
        this.didFinish()
        return this
    }

    sendCancelledMessage () {
        this.sendDelegateMessage(this.cancelledMessage())
        this.didFinish()
        return this
    }

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

    cancel () {
        this.debugLog(" cancel")
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

    cleanup () {
        this.setDownEvent(null)
        this.setCurrentEvent(null)
        this.setUpEvent(null)
        return this
    }

    shouldShowVisualDebugger () {
        return this.hasDownPointsInView() || this.isActive() // || this.isPressing());
    }

    // ---  outline view for debugging ---

    newOutlineView () {
        const v = DomView.clone()
        v.setPointerEvents("none")
        v.setBorder("1px dashed white")
        v.setBackgroundColor("transparent")
        v.setPosition("absolute")
        v.setZIndex(10000)
        return v
    }

    outlineView () {
        if (!this._outlineView) {
            const v = this.newOutlineView()
            this._outlineView = v
        }
        return this._outlineView
    }

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

    removeFingerViews () {
        const map = this.fingerViewMap();
        map.keysArray().forEach((id) => {
            const fingerView = map.get(id);
            fingerView.removeFromParentView();
        })
        map.clear();
        return this;
    }

    titleForFingerNumber (n) {
        return "&nbsp;".repeat(26) + this.type() + "&nbsp;" + n + "&nbsp;of&nbsp;" + this.numberOfFingersDown() 
    }

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

    updateFingerViews () {
        if (this.shouldShowVisualDebugger()) {
            this.showFingers();
        } else {            
            this.removeFingerViews();
        }

        return this;
    }

    updateDebugger () {
        this.updateOutlineView();
        this.updateFingerViews();
        if (this.viewTarget()) {
            console.log(this.viewTarget().typeId() + ".updateDebugger");
        }
    }

    updateDebuggerTimeoutName () {
        return "updateDebugger";
    }

    updateDebuggerTimeoutSeconds () {
        return 0.1;
    }

    updateDebugTimer () {
        const ms = this.updateDebuggerTimeoutSeconds() * 1000;
        this.addTimeout(() => this.updateDebugger(), ms, this.updateDebuggerTimeoutName());
        return this;
    }

    // down points

    hasDownPointsInView () {
        if (!this.viewTarget()) {
            return false;
        }

        const view = this.viewTarget();
        const points = this.allDownPoints();
        //console.log("all points.length:", points.length, " has match:", match != null)
        return points.canDetect(p => view.containsPoint(p));
    }

    allPoints () { // TODO: some better abstraction for Touch+Mouse?
        const points = [];
        points.appendItems(TouchScreen.shared().currentPoints());
        points.appendItems(Mouse.shared().currentPoints());
        return points;
    }

    allDownPoints () { // TODO: some better abstraction for Touch+Mouse?
        return this.allPoints().select(p => p.isDown());
    }

    shortTypeId () {
        return this.typeId().replaceAll("GestureRecognizer", "");
    }

    description () {
        return this.shortTypeId() + " on " + (this.viewTarget() ? this.viewTarget().typeId() : "null view target");
    }
    
}.initThisClass());

