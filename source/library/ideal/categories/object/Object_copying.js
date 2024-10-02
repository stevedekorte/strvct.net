"use strict";

/**
 * Custom error class for missing slots.
 * @module library.ideal.object
 * @class MissingSlotError
 * @extends Error
 */

getGlobalThis().MissingSlotError = (class MissingSlotError extends Error {
    constructor(message) {
      super(message);
      this.name = "MissingSlotError";
    }
});
  
/**
 * Adds copying related behaviors for Object class.
 * @module library.ideal.object
 * @class Object_copying
 * @extends Object
 */

(class Object_copying extends Object {

    /**
     * Creates a shallow copy of the object.
     * @returns {Object} A shallow copy of the object.
     * @category Copying
     */
    shallowCopy () {
        const copy = Object.assign({}, this);
        return copy
    }
 
    /**
     * Creates a deep copy of the object.
     * @returns {Object} A deep copy of the object.
     * @category Copying
     */
    duplicate () {
        if (this.constructor === Object) {
            // it's a dictionary!
            const deepCopyDict = JSON.parse(JSON.stringify(this)); // breaks for non-JSON!
            return deepCopyDict;
        } else {
            assert(this.isInstance());
            const instance = this.thisClass().clone().copyFrom(this);
            instance.duplicateSlotValuesFrom(this); // TODO: what about lazy slots?
            return instance;
        }
    }
 
    /**
     * Alias for duplicate method.
     * @returns {Object} A deep copy of the object.
     * @category Copying
     */
    copy () {
        return this.duplicate()
    }

    /**
     * Alias for copy method.
     * @returns {Object} A deep copy of the object.
     * @category Copying
     */
    deepCopy () {
        return this.copy();
    }
 
    /**
     * Copies values from another object, ignoring missing slots.
     * @param {Object} anObject - The object to copy from.
     * @returns {Object} This object after copying.
     * @category Copying
     */
    copyFromAndIgnoreMissingSlots (anObject) {
        return this.copyFrom(anObject, true) 
    }
    
    /**
     * Copies values from another object.
     * @param {Object} anObject - The object to copy from.
     * @param {boolean} [ignoreMissingSlots=false] - Whether to ignore missing slots.
     * @returns {Object} This object after copying.
     * @category Copying
     */
    copyFrom (anObject, ignoreMissingSlots = false) { 
        this.duplicateSlotValuesFrom(anObject, ignoreMissingSlots)
        return this
    }
 
    /**
     * Duplicates slot values from another object.
     * @param {Object} otherObject - The object to duplicate from.
     * @param {boolean} [ignoreMissingSlots=false] - Whether to ignore missing slots.
     * @returns {Object} This object after duplicating slot values.
     * @throws {MissingSlotError} If a slot is missing and ignoreMissingSlots is false.
     * @category Copying
     */
    duplicateSlotValuesFrom (otherObject, ignoreMissingSlots = false) {
        this.thisPrototype().allSlotsMap().forEachKV((slotName, mySlot) => {
            const otherSlot = otherObject.thisPrototype().slotNamed(slotName)
            const hasSlot = !Type.isNullOrUndefined(otherSlot)
            if (hasSlot) {
                const dop = otherSlot.duplicateOp()
                if (dop === "nop") {
                    // skip
                } else {
                    const v = otherSlot.onInstanceGetValue(otherObject) // TODO: what about lazy slots?
        
                    if (dop === "copyValue") {
                        mySlot.onInstanceSetValue(this, v)
                    } else if (dop === "duplicate") {
                        const dup = v === null ? v : v.duplicate()
                        mySlot.onInstanceSetValue(this, dup)
                    } else {
                        throw new Error("unsupported slot duplicate operation: '" +  dop + "'")
                    }
                }
            } else if (!ignoreMissingSlots) {
                throw new MissingSlotError()
            }
        })
        return this
    }
 
    /**
     * Copies slot values from another object.
     * @param {Object} otherObject - The object to copy from.
     * @returns {Object} This object after copying slot values.
     * @category Copying
     */
    copySlotValuesFrom (otherObject) {
        this.thisPrototype().allSlotsMap().forEachKV((slotName, mySlot) => {
            const otherSlot = otherObject.thisPrototype().slotNamed(slotName)
            const v = otherSlot.onInstanceGetValue(otherObject)
            mySlot.onInstanceSetValue(this, v)
        })
        return this
    }

}).initThisCategory();