"use strict";

/** * @module library.node.nodes
 */

/** * @class Slot_promiseWrapper
 * @extends Slot
 * @classdesc Category of Slot class to add support for promise wrapped getters.
 * Their values (and the promise wrapper) can automatically be reset when another slot is updated.
 *
 * Notes on promise wrapped method pattern:

    Related ivars:
        this.newSimpleSlot("isPromiseWrapped", false);
        this.newSimpleSlot("promiseResetsOnChangeOfSlotName", null);

    Example usage:

        const slot = this.newSlot("publicUrl", null); // private
        slot.setIsPromiseWrapped(true);
        // - adds a asyncPublicUrl() method which does the promise wrapping and returns a promise
        // and calls asyncComputePublicUrl() method to compute the public url

        slot.setPromiseResetsOnChangeOfSlotName("dataUrl");
        // - adds an onDidChangeOfSlotName("dataUrl") method which resets the promise

 
 
 */

/**

 */


(class Slot_promiseWrapper extends Slot {

    asyncGetterName () {
        return "async" + this.name().capitalized();
    }

    computeMethodName () {
        return "asyncCompute" + this.name().capitalized();
    }

    promisePrivateName () {
        return this.privateName() + "Promise";
    }

    setupPromiseWrapperIfNeeded () {
        if (this.isPromiseWrapped()) {
            // set the promise wrapped getter
            this.owner()[this.asyncGetterName()] = this.newAsyncPromiseWrappedGetter();
        }
        this.setupPromiseResetMethodIdNeeded();
    }

    newAsyncPromiseWrappedGetter () {
        /*
        Example:
        for a publicUrl slot, we'd set up the following:

            _publicUrl // privateName
            _publicUrlPromise // promisePrivateName
            publicUrl() // getterName

            setPublicUrl(value) // setterName
            asyncPublicUrl() <--- asyncGetterName - this method returns the promise
            asyncComputePublicUrl() // computeMethodName

            didUpdate{DependencySlotName}

        */

        const slot = this;
        const privateName = this.privateName();
        const computeMethodName = this.computeMethodName();
        const promisePrivateName = this.promisePrivateName();

        return async function (...args) { // Example: asyncPublicUrl()
            assert(args.length === 0, "getter should not be called with arguments");

            // If we already have a value, return it (*ASSUME* null means it's not yet computed)?
            if (this[privateName] !== null) {
                return this[privateName];
            }

            // If we already have a promise, return it
            // so we don't do more requests while we're waiting for the first
            const promise = this[promisePrivateName];
            if (promise) {
                return promise;
            }

            const computeMethod = this[computeMethodName];
            assert(computeMethod, "compute method not found for promise wrapped slot " + slot.name());

            try {
                // call the compute method and set the value
                const value = await computeMethod.call(this);
                const setterMethod = this[slot.setterName()];
                setterMethod.call(this, value);
                slot.onInstanceSetValue(this, value);
                promise.callResolveFunc(value);
                return value;
            } catch (error) {
                promise.callRejectFunc(error);
                throw error;
            }
        };
    }

    setupPromiseResetMethodIdNeeded () {
        const resetSlotName = this.promiseResetsOnChangeOfSlotName();
        if (resetSlotName) {
            const slotName = "didUpdateSlot" + resetSlotName.capitalized();
            const existingMethod = this.owner()[slotName];
            assert(existingMethod === undefined, "method already defined for " + slotName);
            this.owner()[slotName] = this.newPromiseResetMethod();
        }
    }

    newPromiseResetMethod () {
        const slot = this;
        return function (/*oldValue, newValue*/) {
            // This is called when the slot on which our slot's value depends is changed.
            // We need to reset our slot's value and it's compute promise to null in order
            // to allow it to be recomputed when needed

            // reset the promise
            const promisePrivateName = slot.promisePrivateName();
            const promise = this[promisePrivateName];

            if (promise && !promise.isCompleted()) {
                // How do we deal with the case of reseting the promise if it's not completed? Reject it?
                promise.callRejectFunc(new Error("slot wrapped promise reset before completion"));
            }

            // reset the value
            this[slot.privateName()] = null;

            // reset the promise
            this[promisePrivateName] = null;
        };
    }

}.initThisCategory());
