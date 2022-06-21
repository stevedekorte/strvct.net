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

        
*/


(class Object_timeouts extends Object {

        activeTimeoutIdSet () {
            if (Type.isNullOrUndefined(this._activeTimeoutIdSet)) {
                Object.defineSlot(this, "_activeTimeoutIdSet", new Set())
            }
            return this._activeTimeoutIdSet
        }
    
        addTimeout (aFunc, msDelay) {
            const tids = this.activeTimeoutIdSet()
            const tidInfo = {} // to capture tid in closure
            const tid = setTimeout(() => { 
                tids.delete(tidInfo.tid) 
                aFunc() // todo: put in EventManager wrapper
            }, msDelay)
            tidInfo.tid = tid
            this.activeTimeoutIdSet().add(tid)
            return tid
        }

        cancelTimeoutId (tid) {
            const tids = this.activeTimeoutIdSet()
            tids.delete(tid)
            clearTimeout(tid)
            return this
        }
    
        cancelAllTimeouts () {
            const tids = this.activeTimeoutIdSet()
            tids.forEach(tid => clearTimeout(tid))
            tids.clear()
            return this
        }

}).initThisCategory();
