"use strict";

/*

    Object_timeouts

        Sometimes we can't use the SyncScheduler as we have to make sure 
        something happens *after* the current event loop ends (and control is returned to the browser),
        but scheduler runs while still in (but at the end of) the current event.
        Also, we sometimes need timeout delays.

    Example use:

        replace:

            setTimeout(aFunc, ms) // returns timer id

        with:

            this.addTimeout(aFunc, ms, optionalName) // returns timer id

    Note:

        If the optionalName argument is used, any active timer with the same name on this object will
        be cleared first, and a new timeout with the name will be added.

    TODO: decide if exception should be raised when cancelling timeout not in _timeoutNameToIdMap
        
*/


(class Object_timeouts extends Object {

        timeoutNameToIdMap () { // the name will be the timeoutId if no name is provided
            const slotName = "_timeoutNameToIdMap"
            if (Type.isNullOrUndefined(this[slotName])) {
                Object.defineSlot(this, slotName, new Map())
            }
            return this[slotName]
        }
    
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
                EventManager.shared().safeWrapEvent(aFunc)
            }, msDelay)
            tidInfo[0] = optionalName ? optionalName : tid
            tidInfo[1] = tid
            this.timeoutNameToIdMap().set(optionalName, tid)
            return tid
        }

        removeTimeoutNamed (name) {
            const tids = this.timeoutNameToIdMap()
            tids.delete(name)
            return this
        }

        clearTimeout (tid) { 
            // IMPORTANT: (for now) we assume a given timeouts is either referred to by name or tid, but not both
            // in which case, if the tid is called here, it was used at the key in the timeoutNameToIdMap
            this.removeTimeoutNamed(tid)
            clearTimeout(tid)
            return this
        }

        clearTimeoutNamed (name) {
            const tids = this.timeoutNameToIdMap()
            if (tids.has(name)) {
                const tid = tids.get(name)
                this.clearTimeout(tid)
            }
            return this
        }

        hasTimeoutNamed (name) {
            const tids = this.timeoutNameToIdMap()
            return tids.has(name)
        }
    
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
