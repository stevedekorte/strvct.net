/**
 * @module library.view.events.listening
 */

"use strict";

/**
 * @class EventManager
 * @extends ProtoClass
 * @classdesc
 * A singleton to manage tracking all events including:
 * 
 * - user events
 * - timers
 * - other events (indexed db, etc) - eventually
 * 
 * We need this in order to:
 * 
 * - do sync operators at the end of an event callback.
 * - track the first user initiated event in order to wait 
 *   to request things like audio input or audio output access
 * 
 * Example use:
 * 
 *     EventManager.shared().safeWrapEvent(() => { ... }, event) // we pass in event so we can access it globally
 * 
 * Example of waiting on first user event:
 * 
 *     await EventManager.shared().firstUserEventPromise();
 */
(class EventManager extends ProtoClass {

    /**
     * @static
     * @description Initializes the class as a singleton
     * @category Initialization
     */
    static initClass () {
        this.setIsSingleton(true);
    }
    
    /**
     * @description Initializes the prototype slots
     * @category Initialization
     */
    initPrototypeSlots () {
        /**
         * @member {Number} eventLevelCount
         * @category State
         */
        {
            const slot = this.newSlot("eventLevelCount", 0);
            slot.setSlotType("Number");
        }
        /**
         * @member {Boolean} hasReceivedUserEvent
         * @category State
         */
        {
            const slot = this.newSlot("hasReceivedUserEvent", false);
            slot.setSlotType("Boolean");
        }
        /**
         * @member {Event} currentEvent
         * @category State
         */
        {
            const slot = this.newSlot("currentEvent", null);
            slot.setSlotType("Event");
        }
        /**
         * @member {Promise} firstUserEventPromise
         * @category State
         */
        {
            const slot = this.newSlot("firstUserEventPromise", null);
            slot.setSlotType("Promise");
            slot.setAllowsNullValue(true);
        }
    }

    /**
     * @description Initializes the instance
     * @category Initialization
     */
    init () {
        super.init();
        this.setFirstUserEventPromise(Promise.clone());
    }

    /**
     * @description Gets the name of the current event
     * @returns {string|null} The name of the current event or null
     * @category Event Handling
     */
    currentEventName () {
        const e = this.currentEvent();
        if (e === null) {
            return null;
        } else if (Type.isString(e)) {
            return e;
        }
        return e.constructor.name;
    }

    /**
     * @description Checks if the current event is a user input event
     * @returns {boolean} True if the current event is a user input event, false otherwise
     * @category Event Handling
     */
    currentEventIsUserInput () {
        const userEventNames = ["KeyboardEvent", "MouseEvent"];
        return userEventNames.includes(this.currentEventName());
    }

    /**
     * @description Handles the reception of a user event
     * @returns {EventManager} The instance of EventManager
     * @category Event Handling
     */
    onReceivedUserEvent () {
        if (!this.hasReceivedUserEvent()) {
            this.setHasReceivedUserEvent(true);
            SvBroadcaster.shared().broadcastNameAndArgument("firstUserEvent", this);
            this.firstUserEventPromise().callResolveFunc();
        }
        
        return this;
    }

    /**
     * @description Sets the event level count
     * @param {number} n - The new event level count
     * @returns {EventManager} The instance of EventManager
     * @category State Management
     */
    setEventLevelCount (n) {
        assert(n > -1);
        this._eventLevelCount = n;
        return this;
    }

    /**
     * @description Increments the event level count
     * @returns {EventManager} The instance of EventManager
     * @category State Management
     */
    incrementEventLevelCount () {
        const count = this.eventLevelCount();
        this.setEventLevelCount(count + 1);
        return this;
    }

    /**
     * @description Decrements the event level count
     * @returns {EventManager} The instance of EventManager
     * @category State Management
     */
    decrementEventLevelCount () {
        const count = this.eventLevelCount();
        this.setEventLevelCount(count - 1);
        return this;
    }

    /**
     * @description Safely wraps an event callback
     * @param {Function} callback - The callback function to wrap
     * @param {Event} event - The event object
     * @returns {*} The result of the callback function
     * @category Event Handling
     */
    safeWrapEvent (callback, event) {
        assert(event);
        this.setCurrentEvent(event);
        let result = undefined;
        let eventCountBefore = this.eventLevelCount();
        this.incrementEventLevelCount();
        result = callback();

        this.decrementEventLevelCount();
        assert(this.eventLevelCount() === eventCountBefore);

        this.syncIfAppropriate();
        this.setCurrentEvent(null);
        return result;
    }

    /**
     * @description Syncs if appropriate based on the current event level
     * @returns {EventManager} The instance of EventManager
     * @category Synchronization
     */
    syncIfAppropriate () {
        if (SvGlobals.globals().SyncScheduler) {
           if (EventManager.shared().eventLevelCount() === 0) { 
                SyncScheduler.shared().fullSyncNow();
           }
        }
        return this;
    }

}.initThisClass());