"use strict";


/*

    SyncAction

    An action managed by the SyncScheduler.

*/

(class SyncAction extends ProtoClass {

    static ActionKeyForTargetAndMethod (target, method) {
        return target.typeId() + "." + method;
    }

    initPrototypeSlots () {
        {
            const slot = this.newSlot("target", null);
            slot.setSlotType("Object");
        }
        {
            const slot = this.newSlot("method", null);
            slot.setSlotType("String");
        }
        {
            const slot = this.newSlot("order", 0);
            slot.setSlotType("Number");
        }
        {
            const slot = this.newSlot("args", null);
            slot.setSlotType("Array");
        }
        {
            const slot = this.newSlot("isUnscheduled", false);
            slot.setSlotType("Boolean");
        }
        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Error");
        }
    }

    initPrototype () {
    }
	
    tryToSend () {
        try {
            this.send();
        } catch(error) {
            console.warn(this.typeId() + ".tryToSend(" + this.description() + ") caught exception: ");
            error.show();
            this.setError(error);
            return error;
        }
        return null;
    }
	
    send () {
        //this.debugLog(() => "   <- sending " + this.description())
        const t = this.target();
        const m = this.method();
        const a = this.args();
        t[m].apply(t, a ? a : []);
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
        const t = this.target() ? this.target().debugTypeId() : "null"
        const o = this.order() === 0 ? "" : " order:" + this.order()
        return this.typeId() + " " + t + " " + this.method() + "" + o
    }

}.initThisClass());

