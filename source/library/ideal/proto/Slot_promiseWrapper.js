"use strict";

/**
 * @module library.node.nodes
 * @class Slot_promiseWrapper
 * @extends Slot
 * @classdesc Category of Slot class to add support for promise wrapped getters.
 * Their values (and the promise wrapper) can automatically be reset when another slot is updated.
 *
 * Notes on promise wrapped method pattern:

this.newSimpleSlot("isPromiseWrapped", false);
this.newSimpleSlot("promiseResetsOnChangeOfSlotName", null);

    // exampe:

    const slot = this.newSlot("publicUrl", null); // private
    slot.setIsPromiseWrapped(true);
    // - adds a asyncPublicUrl() method which does the promise wrapping and returns a promise
    // and calls asyncComputePublicUrl() method to compute the public url

    slot.setPromiseResetsOnChangeOfSlotName("dataUrl");
    // - adds an onDidChangeOfSlotName("dataUrl") method which resets the promise

 */


(class Slot_promiseWrapper extends Slot {

    setupPromiseWrapperIfNeeded () {
        if (this.isPromiseWrapped()) {
            // set the promise wrapped getter
            this.owner()[this.name()] = this.newAsyncPromiseWrappedGetter();
        }
        this.setupPromiseResetMethodIdNeeded();
    }

    newAsyncPromiseWrappedGetter () {
        /*
        Example:
        for a publicUrl slot, we'd set up the following:

            _publicUrl
            _publicUrlPromise
            publicUrl()

            setPublicUrl(value)
            asyncPublicUrl() <--- this method returns the promise
            asyncComputePublicUrl()

            didUpdate{DependencySlotName}

        */

        const slot = this;
        const slotName = this.name();
        const privateName = this.privateName();

        return async function (...args) { // Example: asyncPublicUrl()
            assert(args.length === 0, "getter should not be called with arguments");

            // already have a value, return it (*ASSUME* null means it's not yet computed)
            if (this[privateName] !== null) {
                return this[privateName];
            }

            // return the promise if we already have one
            // so we don't do more requests while we're waiting for the first one
            const promisePrivateName = privateName + "Promise";
            const promise = this[promisePrivateName];
            if (promise) {
                return promise;
            }

            // compute the value
            const computeMethodName = this[slotName + "Compute"];
            const computeMethod = this[computeMethodName];
            assert(computeMethod, "compute method not found for promise wrapped slot " + slotName);

            try {
                const value = await computeMethod.call(this);
                const setterMethod = this[slot.setterName()];
                setterMethod.call(this, value);
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
            const promisePrivateName = resetSlotName + "Promise";
            const promise = this[promisePrivateName];

            // how do we deal with the case of reseting the promise if it's not completed?
            if (promise && !promise.isCompleted()) {
                promise.callRejectFunc(new Error("slot wrapped promise reset before completion"));
            }

            // reset the value
            this[slot.name()] = null;

            // reset the promise
            this[promisePrivateName] = null;
        };
    }

}.initThisClass());
