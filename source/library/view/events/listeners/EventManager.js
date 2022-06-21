"use strict";

/*
    EventManager

    A singleton to manager tracking all events including:
    
        - user events
        - timers
        - other events (indexed db, etc)

    We need this in other to:
    
        - track the first user initiated event in order to wait 
          to request things like audio input or audio output access
        - do sync operators at the end of an event callback.

    Example use:


            EventManager.shared().safeWrapEvent(() => { ... })

*/

(class EventManager extends ProtoClass {

    initPrototype () {
        this.newSlot("eventLevelCount", 0)
        this.newSlot("hasReceivedEvent", false)
    }

    static setHasReceivedEvent (aBool) {
        assert(Type.isBoolean(aBool))
        this._hasReceivedEvent = aBool
        return this
    }

    setEventLevelCount (n) {
        assert(n > -1)
        this._eventLevelCount = n
        return this
    }

    incrementEventLevelCount () {
        if (this.eventLevelCount() > 0) {
            console.warn("eventCountLevel = ", this.eventLevelCount())
            debugger;
        }
        this.setEventLevelCount(this.eventLevelCount() + 1)
        return this
    }

    decrementEventLevelCount () {
        this.setEventLevelCount(this.eventLevelCount() - 1)
        return this
    }
    
    safeWrapEvent (callback) {
        let result = undefined
        this.incrementEventLevelCount()
        try {
            result = callback()
            this.decrementEventLevelCount()
        } catch (anError) {
            this.decrementEventLevelCount()
            throw anError
        }
        return result
    }

}.initThisClass());
