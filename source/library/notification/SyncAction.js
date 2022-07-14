"use strict";


/*

    SyncAction

    An action managed by the SyncScheduler.

*/

(class SyncAction extends ProtoClass {

    static ActionKeyForTargetAndMethod (target, method) {
        return target.typeId() + "." + method
    }

    initPrototype () {
        this.newSlot("target", null)
        this.newSlot("method", null)
        this.newSlot("order", 0)
        this.newSlot("args", null)
        this.newSlot("isUnscheduled", false)
    }

    init () {
        super.init()
        //this.setIsDebugging(true)
    }
	
    tryToSend () {
        try {
            this.send()
        } catch(error) {
            console.warn(this.typeId() + ".tryToSend(" + this.description() + ") caught exception: ")
            error.show()
            return error
        }
        return null
    }
	
    send () {
        this.debugLog("   <- sending " + this.description())
        const t = this.target()
        const m = this.method()
        const a = this.args()
        t[m].apply(t, a ? a : [])
        return null
    }
	
    actionsKey () {
        return SyncAction.ActionKeyForTargetAndMethod(this.target(), this.method())
    }
	
    equals (anAction) {
        return anAction !== null && 
               (this.target() === anAction.target()) && 
               (this.method() === anAction.method())
    }
	
    description () {
        const t = this.target() ? this.target().typeId() : "null"
        const o = this.order() === 0 ? "" : " order:" + this.order()
        return t + " " + this.method() + "" + o
    }

}.initThisClass());

