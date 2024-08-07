"use strict";

/*

    TouchScreen

    Global shared instance that tracks current touch state in window coordinates.
    Registers for capture events on document.body.

    Example use:

        const hasTouch = TouchScreen.shared().isSupported()

*/

(class TouchScreen extends Device {

    static initClass () {
        this.setIsSingleton(true)
    }
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("currentEvent", null);
            slot.setSlotType("TouchEvent");
        }
        {
            const slot = this.newSlot("lastEvent", null);
            slot.setSlotType("TouchEvent");
        }
        {
            const slot = this.newSlot("touchListener", null);
            slot.setSlotType("TouchListener");
        }
        {
            const slot = this.newSlot("isSupported", null);
            slot.setSlotType("Boolean");
        }
        /*
        {
            const slot = this.newSlot("isVisualDebugging", false);
            slot.setSlotType("Boolean");
        }
        */
    }

    isSupported () {
        if (this._isSupported === null) {
            this._isSupported = this.calcIsSupported();
        }
        return this._isSupported;
    }

    calcIsSupported () {
        // return WebBrowserWindow.isTouchDevice()
        let result = false;
        
        if ("ontouchstart" in window) { 
            // works on most browsers 
            result = true; 
        }

        if (navigator.maxTouchPoints) {
            // works on IE10/11 and Surface	
            result = true; 
        } 

        return result
    }

    init () {
        super.init()
        this.startListening()
        this.setIsDebugging(false)
        if (this.isDebugging()) {
            this.debugLog(".init()")
        }
        return this
    }

    setCurrentEvent (event) {
        if (this._currentEvent !== event) {
            this.setLastEvent(this._currentEvent)
            this._currentEvent = event
            if (this.isDebugging()) {
                console.log(this.type() + " touch count: " + this.currentPoints().length)
            }
            //Devices.shared().setCurrentEvent(event)
        }
        return this
    }

    startListening () {
        this.setTouchListener(TouchListener.clone().setUseCapture(true).setListenTarget(document.body).setDelegate(this))
        this.touchListener().setIsListening(true)
        return this
    }

    // events

    onTouchBeginCapture (event) {
        if (this.isDebugging()) {
            console.log(this.type() + ".onTouchBeginCapture()")
        }
        this.setCurrentEvent(event)
        //this.handleLeave(event)
        return true
    }

    /*
    elementsForEvent (event) {
        const elements = [];
        const points = this.pointsForEvent(event)
        points.forEach((point) => {
            const e = document.elementFromPoint(p.x(), p.y());
            if (e) {
                elements.push(e)
            }
        })
        return elements
    }
    */

    lastPointForId (id) {
        const lastPoints = this.pointsForEvent(this.lastEvent())
        return lastPoints.detect(p => p.id() === id)
    }

    currentPointForId (id) {
        const currentPoints = this.pointsForEvent(this.currentEvent())
        return currentPoints.detect(p => p.id() === id)
    }

    onTouchMoveCapture (event) {
        this.setCurrentEvent(event)
        //this.handleLeave(event)
        return true
    }

    onTouchEndCapture (event) {
        this.setCurrentEvent(event)
        //this.handleLeave(event)
        return true
    }

    pointForTouch (touch) {
        assert(event.__proto__.constructor === TouchEvent)
        const p = EventPoint.clone()
        p.setId(touch.identifier)
        p.setTarget(touch.target)
        p.set(touch.pageX, touch.pageY)  // document position
        p.setTimeToNow()
        p.setIsDown(true)
        p.setEvent(touch)
        //p.findOverview()
        return p
    }

    justPointsForEvent (event) {
        //if (this.isDebugging()) {
        //  console.log("touches.length = ", event.touches.length)
        //}

        const points = []
        // event.touches isn't a proper array, so we can't enumerate it normally
        const touches = event.touches // all current touches
        for (let i = 0; i < touches.length; i++) {
            const touch = touches[i]
            const p = this.pointForTouch(touch)
            points.append(p)
        }

        return points
    }


    pointsForEvent (event) {
        if (!event.hasCachedPoints()) {
            event.preventDefault() // needed to prevent browser from handling touches?

            const points = this.justPointsForEvent(event)
            event.setCachedPoints(points)
        }

        return event.cachedPoints(event)
    }

    currentPoints () {
        if (this.currentEvent()) {
            return this.pointsForEvent(this.currentEvent())
        }
        return []
    }

    // There are no standard onTouchLeave & onTouchOver events,
    // so this is an attempt to add them. Only really need them
    // for visual gesture debugging at the moment though.
    
    /*
    sendEventToView (eventName, event, aView) {
        // send to listeners instead?
        aView.gestureRecognizers().forEach((gr) => {
            gr[eventName].call(gr, event)
        })
        return this
    }

    handleLeave (event) {
        // an attempt to add onTouchLeave and onTouchOver events
        const currentPoints = this.pointsForEvent(this.currentEvent())

        currentPoints.forEach((cp) => {
            const lp = this.lastPointForId(cp.id())
            if (lp) {
                const lastView    = lp.overview()
                const currentView = cp.overview()

                // check if overView is the same
                if (lastView !== currentView) {
                    this.sendEventToView("onTouchLeave", event, lastView)
                    this.sendEventToView("onTouchOver", event, currentView)
                }
            } else {
                // this is a new finger
            }
        })

        return this
    }
    */
   
}.initThisClass());
