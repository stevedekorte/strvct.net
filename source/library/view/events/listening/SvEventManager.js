/**
 * @module library.view.events.listening
 */

"use strict";

/**
 * @class SvEventManager
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
 *     SvEventManager.shared().safeWrapEvent(() => { ... }, event) // we pass in event so we can access it globally
 *
 * Example of waiting on first user event:
 *
 *     await SvEventManager.shared().firstUserEventPromise();
 */
(class SvEventManager extends ProtoClass {

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
         * @member {Event|String|null} currentEvent - Can be Event object, string identifier, or null
         * @category State
         */
        {
            const slot = this.newSlot("currentEvent", null);
            // Don't set slot type - this slot accepts Event objects, strings, or null
            // Type validation would be too restrictive for this flexible slot
            slot.setSlotType("Object"); // Accept any object type (Event, String, or null)
            slot.setAllowsNullValue(true);
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

        {
            const slot = this.newSlot("userEventNames", new Set(["KeyboardEvent", "MouseEvent", "DragEvent", "TouchEvent", "PointerEvent", "WheelEvent", "InputEvent", "ClipboardEvent"]));
            slot.setSlotType("Set");
        }
        /**
         * @member {Object|null} lastEventStamp - { name, endTime, describe } of the last completed
         * outermost event, stamped regardless of duration. SvLongTaskMonitor uses it to attribute
         * longtask entries the browser won't attribute itself.
         * @category Performance Reporting
         */
        {
            const slot = this.newSlot("lastEventStamp", null);
            slot.setSlotType("Object");
            slot.setAllowsNullValue(true);
        }
        /**
         * @member {Number} longEventThresholdMs - Outermost wrapped events (handler + end-of-event
         * fullSyncNow) longer than this file a "long-event" report.
         * @category Performance Reporting
         */
        {
            const slot = this.newSlot("longEventThresholdMs", 1000);
            slot.setSlotType("Number");
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
        return this.userEventNames().has(this.currentEventName());
    }

    /**
     * @description Handles the reception of a user event
     * @returns {SvEventManager} The instance of SvEventManager
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
     * @returns {SvEventManager} The instance of SvEventManager
     * @category State Management
     */
    setEventLevelCount (n) {
        assert(n > -1);
        this._eventLevelCount = n;
        return this;
    }

    /**
     * @description Increments the event level count
     * @returns {SvEventManager} The instance of SvEventManager
     * @category State Management
     */
    incrementEventLevelCount () {
        const count = this.eventLevelCount();
        this.setEventLevelCount(count + 1);
        return this;
    }

    /**
     * @description Decrements the event level count
     * @returns {SvEventManager} The instance of SvEventManager
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
     * @param {Event} event - The event object (may be null/string in Node.js environments)
     * @param {Function|null} [describeFunc=null] - Lazily describes the handler
     * ("DelegateClass.onMethodName") for performance reports; only invoked when a report fires
     * @returns {*} The result of the callback function
     * @category Event Handling
     */
    safeWrapEvent (callback, event, describeFunc = null) {
        // In Node.js, XMLHttpRequest events may not be proper Event objects
        // Use a string identifier instead, which currentEventName() already handles
        if (!event && typeof process !== "undefined" && process.versions && process.versions.node) {
            event = "XhrEvent";
        }
        assert(event);
        this.setCurrentEvent(event);
        // Capture now — a nested safeWrapEvent nulls currentEvent when it completes
        const eventName = this.currentEventName();
        let result = undefined;
        let eventCountBefore = this.eventLevelCount();
        const isOutermost = (eventCountBefore === 0);
        const startTime = isOutermost ? performance.now() : 0;
        this.incrementEventLevelCount();
        result = callback();

        this.decrementEventLevelCount();
        assert(this.eventLevelCount() === eventCountBefore);

        this.syncIfAppropriate();
        if (isOutermost) {
            // After syncIfAppropriate so the duration includes the end-of-event fullSyncNow
            // (notification cascade + view construction), not just the handler
            this.recordCompletedEvent(eventName, startTime, describeFunc);
        }
        this.setCurrentEvent(null);
        return result;
    }

    /**
     * @description Stamps the last completed outermost event (for longtask attribution) and
     * files a "long-event" report if the wrapped turn crossed longEventThresholdMs.
     * @param {string|null} eventName - Constructor name (or string identifier) of the event
     * @param {Number} startTime - performance.now() at wrap entry
     * @param {Function|null} describeFunc - Lazy handler description, from the wrap caller
     * @returns {SvEventManager} The instance of SvEventManager
     * @category Performance Reporting
     */
    recordCompletedEvent (eventName, startTime, describeFunc) {
        const endTime = performance.now();
        this.setLastEventStamp({ name: eventName, endTime: endTime, describe: describeFunc });

        const duration = endTime - startTime;
        if (duration >= this.longEventThresholdMs() && SvGlobals.has("SvClientReport")) {
            const json = { durationMs: Math.round(duration), event: eventName };
            if (describeFunc) {
                json.handler = describeFunc();
            }
            SvClientReport.report("long-event", json);
        }
        return this;
    }

    /**
     * @description Syncs if appropriate based on the current event level
     * @returns {SvEventManager} The instance of SvEventManager
     * @category Synchronization
     */
    syncIfAppropriate () {
        if (SvGlobals.globals().SvSyncScheduler) {
            if (SvEventManager.shared().eventLevelCount() === 0) {
                SvSyncScheduler.shared().fullSyncNow();
            }
        }
        return this;
    }

}.initThisClass());
