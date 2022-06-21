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

            this.addTimeout(aFunc, ms) // returns timer id

    TODO: decide if exception should be raised when cancelling timeout not in _activeTimeoutsDict
        
*/


(class Object_timeouts extends Object {

        activeTimeoutsDict () {
            const slotName = "_activeTimeoutsDict"
            if (Type.isNullOrUndefined(this[slotName])) {
                Object.defineSlot(this, slotName, {})
            }
            return this[slotName]
        }
    
        addTimeout (aFunc, msDelay, optionalName) {
            const tids = this.activeTimeoutsDict()
            const tidInfo = {} // so we can capture returned tid in timeout closure
            const tid = setTimeout(() => { 
                this.removeTimeoutId(tidInfo.tid)
                //aFunc() // todo: put in EventManager wrapper
                EventManager.shared().safeWrapEvent(aFunc)
            }, msDelay)
            tidInfo.tid = tid
            this.activeTimeoutsDict()[tid] = optionalName
            return tid
        }

        removeTimeoutId (tid) {
            const tids = this.activeTimeoutsDict()
            delete tids[tid]
            return this
        }

        clearTimeout (tid) {
            this.removeTimeoutId(tid)
            clearTimeout(tid)
            return this
        }

        clearTimeoutNamed (name) {
            const tid = this.timeoutForName(name)
            this.clearTimeout(tid)
            return this
        }
    
        cancelAllTimeouts () {
            const tids = this.activeTimeoutsDict()
            const keys = Reflect.ownKeys(tids)
            keys.forEach(tid => this.cancelTimeoutId(tid))
            return this
        }

        timeoutForName (name) {
            // could move to nameToTid dict, but probably not worth it given relatively (time) infrequent use
            const tids = this.activeTimeoutsDict()
            const keys = Reflect.ownKeys(tids)
            for (let i = 0; i < keys.length; i ++) {
                const k = keys[i]
                if (tids[k] === name) {
                    return k
                }
            }
            return undefined
        }

}).initThisCategory();
