//"use strict";

/**
 * Some added state and behavior on Object prototype.
 * 
 * Note:Object keys always get turned into strings.
 * 
 * @module ideal.object
 * @class Object_ideal
 * @extends Object
 * 
 */

(class Object_ideal extends Object {
    
    /**
     * Initializes prototype slots.
     */
    initPrototypeSlots () {
        Object.defineSlot(this, "_hasDoneInit", false); // so object's can distinguish changes from deserialization
        Object.defineSlot(this, "_shouldScheduleDidInit", false);
        Object.defineSlot(this, "_mutationObservers", null);
        Object.defineSlot(this, "_shouldStore", true);
    }

    /**
     * Checks if this object is a kind of the given class.
     * @param {Function} aClass - The class to check against.
     * @returns {boolean} True if this object is a kind of aClass, false otherwise.
     */
    isKindOf (aClass) {
        return this.thisClass().isKindOf(aClass);
    }

    /**
     * Returns the type category of this object.
     * @returns {string} The type category ("instance", "prototype", or "class").
     * @throws {Error} If unable to identify the type category.
     */
    typeCategory () {
        if (this.isInstance()) {
            return "instance";
        } else if (this.isPrototype()) {
            return "prototype";
        } else if (this.isClass()) {
            return "class";
        }
        throw new Error("unable to identify");
    }
 
    /**
     * Returns the full type name of this object.
     * @returns {string} The full type name.
     */
    fullTypeName () {
        return this.type() + " " + this.typeCategory();
    }
 
    /**
     * Performs a method on this object.
     * @param {string} methodName - The name of the method to perform.
     * @param {*} arg1 - The first argument to pass to the method.
     * @param {*} arg2 - The second argument to pass to the method.
     * @param {*} arg3 - The third argument to pass to the method.
     * @returns {*} The result of the method call.
     * @throws {Error} If the object does not respond to the given method.
     */
    perform (methodName, arg1, arg2, arg3) {
        const f = this[methodName];
        if (f) {
            return f.call(this, arg1, arg2, arg3);
        }
        throw new Error(this.typeId() + " does not respond to '" + methodName + "'");
    }
 
    /**
     * Performs a method on this object if it responds to it.
     * @param {string} methodName - The name of the method to perform.
     * @param {*} arg1 - The first argument to pass to the method.
     * @param {*} arg2 - The second argument to pass to the method.
     * @param {*} arg3 - The third argument to pass to the method.
     * @returns {*} The result of the method call, or undefined if the method doesn't exist.
     */
    performIfResponding (methodName, arg1, arg2, arg3) {
        const f = this[methodName];
        if (f) {
            return f.call(this, arg1, arg2, arg3);
        }
    }
 
    /**
     * Gets the value of a slot.
     * @param {string|symbol} key - The key of the slot.
     * @returns {*} The value of the slot.
     */
    atSlot (key) {
        return this[key];
    }
 
    /**
     * Sets the value of a slot.
     * @param {string|symbol} key - The key of the slot.
     * @param {*} value - The value to set.
     * @returns {Object_ideal} This object.
     */
    atSlotPut (key, value) {
        this[key] = value;
        return this;
    }
 
    /**
     * Removes a slot from this object.
     * @param {string|symbol} key - The key of the slot to remove.
     * @returns {Object_ideal} This object.
     */
    removeSlotAt (key) {
        delete this[key];
        return this;
    }
    
    /**
     * Maps over the object's own key-value pairs.
     * @param {Function} fn - The function to call for each key-value pair.
     * @returns {Array} The results of calling the function on each key-value pair.
     */
    ownKVMap (fn) {
        return Object.entries(this).map(entry => fn(entry[0], entry[1]));
    }
 
    /**
     * Iterates over the object's own values.
     * @param {Function} fn - The function to call for each value.
     * @returns {Object_ideal} This object.
     */
    ownForEachValue (fn) {
        Object.entries(this).forEach(entry => fn(entry[1])); 
        return this;
    }
 
    /**
     * Iterates over the object's own keys.
     * @param {Function} fn - The function to call for each key.
     * @returns {Object_ideal} This object.
     */
    ownForEachKey(fn) {
        Object.entries(this).forEach(entry => fn(entry[0])); 
        return this;
    }
 
    /**
     * Iterates over the object's own key-value pairs.
     * @param {Function} fn - The function to call for each key-value pair.
     * @returns {Object_ideal} This object.
     */
    ownForEachKV (fn) {
        Object.entries(this).forEach(entry => fn(entry[0], entry[1])); 
        return this;
    }
 
    /**
     * Checks if this object is equal to another object.
     * @param {Object} anObject - The object to compare with.
     * @returns {boolean} True if the objects are equal, false otherwise.
     */
    isEqual (anObject) {
        const entries = Object.entries(this);
        const otherEntries = Object.entries(anObject);
        if (entries.length !== otherEntries.length) {
            return false;
        }
 
        return entries.canDetect(entry => {
            const k = entry[0];
            const v = entry[1];
            return v !== anObject.getOwnProperty(k);
        });
    }
 
    /**
     * Gets the value of an own property.
     * @param {string|symbol} key - The key of the property.
     * @returns {*} The value of the property, or undefined if it doesn't exist.
     */
    getOwnProperty (key) {
        if (this.hasOwnProperty(key)) {
            return this[key];
        }
        return undefined;
    }
 
    /**
     * Gets the slot value path for debugging serialization/deserialization.
     * @param {string} slotName - The name of the slot.
     * @param {Array} [entries=[]] - The array to store entries.
     * @returns {Array} The slot value path.
     */
    slotValuePath (slotName, entries = []) {
        const entry = [this.fullTypeName(), this.getOwnProperty(slotName)];
        entries.push(entry);
 
        const proto = this.__proto__;
        if (proto) {
            return proto.slotValuePath.apply(proto, [slotName, entries]);
        }
 
        return entries;
    }

    /**
     * Schedules a method to be called at the end of the event loop.
     * @param {string} methodName - The name of the method to schedule.
     * @param {number} priority - The priority of the scheduled method.
     * @returns {*} The result of scheduling the method.
     */
    scheduleMethod (methodName, priority) {
        return SyncScheduler.shared().scheduleTargetAndMethod(this, methodName, priority);
    }

}).initThisCategory();

Object.prototype.initPrototypeSlots()
