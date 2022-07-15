"use strict";

/*

    Object_copying
    
    copying related behavior 

*/

(class Object_copying extends Object {

    // --- copying ---

    shallowCopy () {
        const copy = Object.assign({}, this);
        return copy
    }
 
    duplicate () {
        assert(this.isInstance())
        const instance = this.thisClass().clone().copyFrom(this)
        instance.duplicateSlotValuesFrom(this) // TODO: what about lazy slots?
        return instance
    }
 
    copy () {
        return this.duplicate()
    }
 
    copyFrom (anObject) {
        // WARNING: subclasses will need to customize this
        this.duplicateSlotValuesFrom(anObject)
        return this
    }
 
    duplicateSlotValuesFrom (otherObject) {
        // TODO: add a type check of some kind?
 
        this.thisPrototype().allSlots().ownForEachKV((slotName, mySlot) => {
            const otherSlot = otherObject.thisPrototype().slotNamed(slotName)
            const v = otherSlot.onInstanceGetValue(otherObject) // TODO: what about lazzy slots?
            const dop = otherSlot.duplicateOp()
 
            if (dop === "copyValue") {
                mySlot.onInstanceSetValue(this, v)
            } else if (dop === "duplicate" && v && v.duplicate) {
                const dup = v.duplicate()
                mySlot.onInstanceSetValue(this, dup)
            }
        })
        return this
    }
 
    copySlotValuesFrom (otherObject) {
        this.thisPrototype().allSlots().ownForEachKV((slotName, mySlot) => {
            const otherSlot = otherObject.thisPrototype().slotNamed(slotName)
            const v = otherSlot.onInstanceGetValue(otherObject)
            mySlot.onInstanceSetValue(this, v)
        })
        return this
    }

}).initThisCategory();

