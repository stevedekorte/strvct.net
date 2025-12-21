"use strict";

/** * @module library.ideal.proto
 */

/** * @class ProtoClass
 * @extends Object
 * @classdesc A place for adding Smalltalk-like features to the base object
 * that we don't want to add to all Object (and Object descendants) yet,
 * as I'm not sure how they might affect the rest of the system.
 
 
 */

/**

 */

(class SvTask extends ProtoClass {

    initPrototypeSlots () {
        {
            const slot = this.newSlot("target", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Object");
        }

        {
            const slot = this.newSlot("methodName", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("methodArgs", []);
            slot.setSlotType("Array");
        }

        {
            const slot = this.newSlot("methodArgs", []);
            slot.setSlotType("Array");
        }

        {
            const slot = this.newSlot("status", "");
            slot.setSlotType("String");
        }

        {
            const slot = this.newSlot("error", null);
            slot.setSlotType("Object");
        }

        {
            const slot = this.newSlot("completedPromise", null);
            slot.setAllowsNullValue(true);
            slot.setSlotType("Promise");
            //slot.setFinalInitProto(Promise);
        }

    }

    assertCanBegin () {
        assert(this.target() !== null, "target is null");
        assert(Type.isString(this.methodName()), "methodName is not a string");
        assert(Type.isArray(this.methodArgs()), "methodArgs is not an array");
        const method = this.target().methodNamed(this.methodName());
        assert(method, "method " + this.methodName() + " not found on " + this.target());
    }

    async begin () {
        assert(this.completedPromise() === null, "completedPromise should be null on begin");
        this.setCompletedPromise(Promise.clone());

        let result = null;
        this.setStatus("running");
        try {
            this.assertCanBegin();
            const method = this.target().methodNamed(this.methodName());
            result = await method.apply(this.target(), this.methodArgs());
        } catch (error) {
            this.setError(error);
            this.setStatus("error");
            throw error;
        }
        this.setStatus("complete");
        this.completedPromise().callResolveFunc(result);
        return result;
    }

    async awakeFromDeserialization () {
        this.assertCanBegin();
        if (this.completedPromise() === null) {
            this.setCompletedPromise(Promise.clone());
        }
    }

    setupCompletedPromise () {
        if (this.completedPromise() === null) {
            this.setCompletedPromise(Promise.clone());
        }
    }

}.initThisClass());
