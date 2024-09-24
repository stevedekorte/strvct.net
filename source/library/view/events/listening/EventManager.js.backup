"use strict";

/*
    EventManager

    A singleton to manager tracking all events including:
    
        - user events
        - timers
        - other events (indexed db, etc) - eventually

    We need this in other to:
    
        - do sync operators at the end of an event callback.

        - track the first user initiated event in order to wait 
          to request things like audio input or audio output access

    Example use:

            EventManager.shared().safeWrapEvent(() => { ... }, event) // we pass in event so we can access it globally
 

    Example of waiting on first user event:

    await EventManager.shared().firstUserEventPromise();
    
*/

(class EventManager extends ProtoClass {

    static initClass () {
        this.setIsSingleton(true)
    }
    
    initPrototypeSlots () {
        {
            const slot = this.newSlot("eventLevelCount", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("hasReceivedUserEvent", false); // we only care about this for user events, but event manager handles timeouts too
            slot.setSlotType("Boolean");
        }
        /*
        {
            const slot = this.newSlot("beginUserEventDate", null);
            slot.setSlotType("Date");
        }
        */
        {
            const slot = this.newSlot("currentEvent", null);
            slot.setSlotType("Event");
        }
        {
            const slot = this.newSlot("firstUserEventPromise", null);
            slot.setSlotType("Promise");
            slot.setAllowsNullValue(true);
        }
    }

    init () {
        super.init();
        this.setFirstUserEventPromise(Promise.clone());
    }

    currentEventName () {
        const e = this.currentEvent();
        if (e === null) {
            return null;
        } else if (Type.isString(e)) {
            return e;
        }
        return e.constructor.name;
    }

    currentEventIsUserInput () {
        const userEventNames = ["KeyboardEvent", "MouseEvent"];
        return userEventNames.includes(this.currentEventName());
    }

    onReceivedUserEvent () { // sent by event listeners if event is user interaction (like click) that browser waits for to enable things like audio/video use
        if (!this.hasReceivedUserEvent()) {
            // In normal web use, things like WebAudio context can't be created until 
            // we get first user interaction. So we send this event to let listeners know when
            // those APIs can be used. Would help if JS sent a special event for this.
            this.setHasReceivedUserEvent(true)
            Broadcaster.shared().broadcastNameAndArgument("firstUserEvent", this) // need this for some JS APIs which can only be used after first input event
            //this.postNoteNamed("onFirstUserEvent") // we may only need one of these - added this to make it easier to listen for
            this.firstUserEventPromise().callResolveFunc();
        }
        
        return this
    }

    setEventLevelCount (n) {
        assert(n > -1)
        this._eventLevelCount = n
        return this
    }

    incrementEventLevelCount () {
        const count = this.eventLevelCount()
        this.setEventLevelCount(count + 1)
        //console.warn("<".repeat(count) + " incremented event " + count)
        return this
    }

    decrementEventLevelCount () {
        const count = this.eventLevelCount()
        //let stack = new Error().stack
        //console.warn("<".repeat(count) + " decrementing event " + count)
        this.setEventLevelCount(count - 1)
        return this
    }
    
    /*
    safeWrapEvent (callback, event) {
        let result = undefined
        this.incrementEventLevelCount()
        try {
            result = callback()
            this.decrementEventLevelCount()
        } catch (anError) {
            console.error(anError.stack);
            this.decrementEventLevelCount()
            throw anError
        } //finally {
        //    this.decrementEventLevelCount()
        //}
        this.syncIfAppropriate() 
        return result
    }
    */

    safeWrapEvent (callback, event) {
        assert(event)
        this.setCurrentEvent(event)
        //ThrashDetector.shared().beginFrame()
        //Perf.shared().beginFrame()
        let result = undefined
        let eventCountBefore = this.eventLevelCount()
        this.incrementEventLevelCount()
        //const t1 = Date.now()
        result = callback()
        /*
        //const t2 = Date.now()
        //const dt = (t2-t1)
        if (dt) {
            const m = "" + dt + "ms"
            App.shared().mainWindow().setTitle(m)
            console.log(m)
        }
        */

        this.decrementEventLevelCount()
        assert(this.eventLevelCount() === eventCountBefore)

        this.syncIfAppropriate() // TODO: is this the best spot?
        this.setCurrentEvent(null) // wait until after sync so our sync code can access the event
        //Perf.shared().endFrame()
        //ThrashDetector.shared().endFrame()
        return result
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
           //assert(EventManager.shared().eventLevelCount() > 0)
           if (EventManager.shared().eventLevelCount() === 0) { 
                // we check event level count to ensure that we only 
                // sync when the stack fully unwinds back to the event loop.
                // This is not the case for some events like onblur which can be triggered by
                // removing a DOM element from a parent, and start an event callback before the
                // current event stack has unwound.
                //console.log("--->>> fullSyncNow <<<---")
                SyncScheduler.shared().fullSyncNow()

                /*
                if (this.beginUserEventDate()) {
                    const now = Date.now()
                    const dt = now - this.beginUserEventDate()
                    App.shared().mainWindow().setTitle("usr event dt:" + (dt) + "ms")
                }
                this.setBeginUserEventDate(null)
                */
           }
        }
        return this
    }

}.initThisClass());
