"use strict";

/**
 * Extends Object with timeout functionality.
 * Sometimes we can't use the SyncScheduler as we have to make sure 
 * something happens *after* the current event loop ends (and control is returned to the browser),
 * but scheduler runs while still in (but at the end of) the current event.
 * Also, we sometimes need timeout delays.
 *
 * @module library.ideal.object
 * @class Object_timeouts
 * @extends Object
 */
(class Object_timeouts extends Object {

    /**
     * Gets or creates a Map to store timeout names and their corresponding IDs.
     * @returns {Map} A Map of timeout names to timeout IDs.
     */
    timeoutNameToIdMap () { // the name will be the timeoutId if no name is provided
        const slotName = "_timeoutNameToIdMap";
        if (Type.isNullOrUndefined(this[slotName])) {
            Object.defineSlot(this, slotName, new Map());
        }
        return this[slotName];
    }
    
    /**
     * Adds a timeout function to be executed after a specified delay.
     * @param {Function} aFunc - The function to be executed.
     * @param {number} msDelay - The delay in milliseconds before the function is executed.
     * @param {string} [optionalName] - An optional name for the timeout.
     * @returns {number} The timeout ID.
     */
    addTimeout (aFunc, msDelay, optionalName) { 
        // if no optionalName given, use the timeoutId for the name,
        // as timeout ids should be unique
        const tids = this.timeoutNameToIdMap()

        if (optionalName && tids.has(optionalName)) {
            // clear existing timeout with this name, if there is one
            this.clearTimeoutNamed(optionalName)
        }

        const tidInfo = new Array(2) // will store [timeoutName, timeoutId] so we can capture returned tid in timeout closure
        const tid = setTimeout(() => { 
            this.removeTimeoutNamed(tidInfo[0])
            EventManager.shared().safeWrapEvent(aFunc, "TimeoutEvent")
        }, msDelay)
        tidInfo[0] = optionalName ? optionalName : tid
        tidInfo[1] = tid
        this.timeoutNameToIdMap().set(optionalName, tid)
        return tid
    }

    /**
     * Removes a named timeout from the timeout map.
     * @param {string} name - The name of the timeout to remove.
     * @returns {Object_timeouts} This object.
     */
    removeTimeoutNamed (name) {
        const tids = this.timeoutNameToIdMap()
        tids.delete(name)
        return this
    }

    /**
     * Clears a timeout by its ID.
     * @param {number} tid - The timeout ID to clear.
     * @returns {Object_timeouts} This object.
     */
    clearTimeout (tid) { 
        // IMPORTANT: (for now) we assume a given timeouts is either referred to by name or tid, but not both
        // in which case, if the tid is called here, it was used at the key in the timeoutNameToIdMap
        this.removeTimeoutNamed(tid)
        clearTimeout(tid)
        return this
    }

    /**
     * Clears a named timeout.
     * @param {string} name - The name of the timeout to clear.
     * @returns {Object_timeouts} This object.
     */
    clearTimeoutNamed (name) {
        const tids = this.timeoutNameToIdMap()
        if (tids.has(name)) {
            const tid = tids.get(name)
            this.clearTimeout(tid)
        }
        return this
    }

    /**
     * Checks if a named timeout exists.
     * @param {string} name - The name of the timeout to check.
     * @returns {boolean} True if the named timeout exists, false otherwise.
     */
    hasTimeoutNamed (name) {
        const tids = this.timeoutNameToIdMap()
        return tids.has(name)
    }
    
    /**
     * Cancels all timeouts associated with this object.
     * @returns {Object_timeouts} This object.
     */
    cancelAllTimeouts () {
        const tids = this.timeoutNameToIdMap()
        tids.forEachKV((name, tid) => this.clearTimeout(tid))
        return this
    }

    /*
    timeoutForName (name) {
        const tids = this.timeoutNameToIdMap()
        return tids.get(name)
    }
    */

}).initThisCategory();
