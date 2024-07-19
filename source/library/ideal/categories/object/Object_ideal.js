//"use strict";

/*

    Object_ideal
    
    Some added state and behavior on Object prototype. 

    NOTES:

    Object keys always get turned into strings.

*/

(class Object_ideal extends Object {
    
    // ---- prototype ---
 
    initPrototypeSlots () {
        Object.defineSlot(this, "_hasDoneInit", false); // so object's can distinguish changes from deserialization
        Object.defineSlot(this, "_shouldScheduleDidInit", false);
        Object.defineSlot(this, "_mutationObservers", null);
        Object.defineSlot(this, "_shouldStore", true);
    }

    isKindOf (aClass) {
        return this.thisClass().isKindOf(aClass);
    }

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
 
    fullTypeName () {
        return this.type() + " " + this.typeCategory();
    }
 
    // --- perform ---
 
    perform (methodName, arg1, arg2, arg3) {
        const f = this[methodName];
        if (f) {
            return f.call(this, arg1, arg2, arg3);
        }
        throw new Error(this.typeId() + " does not respond to '" + methodName + "'");
    }
 
    performIfResponding (methodName, arg1, arg2, arg3) {
        const f = this[methodName];
        if (f) {
            return f.call(this, arg1, arg2, arg3);
        }
    }
 
    // --- slots ---

    // normal at() etc names would conflict with Array etc

    atSlot (key) {
        return this[key];
    }
 
    atSlotPut (key, value) {
        this[key] = value;
        return this;
    }
 
    removeSlotAt (key) {
        delete this[key];
        return this;
    }
    
    // --- enumeration ---
 
    ownKVMap (fn) {
        return Object.entries(this).map(entry => fn(entry[0], entry[1]));
    }
 
    ownForEachValue (fn) {
        Object.entries(this).forEach(entry => fn(entry[1])); 
        return this;
    }
 
    ownForEachKey(fn) {
        Object.entries(this).forEach(entry => fn(entry[0])); 
        return this;
    }
 
    ownForEachKV (fn) {
        Object.entries(this).forEach(entry => fn(entry[0], entry[1])); 
        return this;
    }
 
    // --- equality ---
    
    isEqual (anObject) {
        // compare like we would two dictionaries
        // only checks enumerable properties
        // for ProtoClass, we'll compare slot values instead
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
 
    getOwnProperty (key) {
        if (this.hasOwnProperty(key)) {
            return this[key];
        }
        return undefined;
    }
 
    // --- debugging helpers ---
 
    slotValuePath (slotName, entries = []) { // for debugging serialization/deserialization
        const entry = [this.fullTypeName(), this.getOwnProperty(slotName)];
        entries.push(entry);
 
        const proto = this.__proto__;
        if (proto) { // Object.prototype.__proto__ = null
            //proto.constructor.name !== "") {
            return proto.slotValuePath.apply(proto, [slotName, entries]);
        }
 
        return entries;
    }

    // --- scheduling ---

    scheduleMethod (methodName, priority) {
        // send at end of event loop
        // methods with the same name and target will only be sent once
        return SyncScheduler.shared().scheduleTargetAndMethod(this, methodName, priority);
    }

}).initThisCategory();

Object.prototype.initPrototypeSlots()
