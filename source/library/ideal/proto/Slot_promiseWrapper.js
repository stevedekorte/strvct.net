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
        const promisePrivateName = this.promisePrivateName();

        return function (...args) { // Example: asyncPublicUrl()
            assert(args.length === 0, "getter should not be called with arguments");

            // If we already have a value, return it (*ASSUME* null means it's not yet computed)?
            if (this[privateName] !== null) {
                return Promise.resolve(this[privateName]);
            }

            // One computation at a time: callers that arrive while it runs share its promise
            if (!this[promisePrivateName]) {
                const promise = Promise.clone();
                this[promisePrivateName] = promise;
                slot.asyncFulfillWrappedPromise(this, promise);
            }
            return this[promisePrivateName];
        };
    }

    /**
     * @description Runs the instance's compute method and settles the promise
     * its callers share. A failure rejects those callers and clears the cached
     * promise, so the next call computes again instead of returning the same
     * rejection for the life of the object. If the promise was reset while
     * computing (a dependency changed), the stale result is dropped: the
     * reset already rejected it.
     * @param {Object} instance
     * @param {Promise} promise - made with Promise.clone()
     * @returns {Promise}
     * @category Promise Wrapper
     */
    async asyncFulfillWrappedPromise (instance, promise) {
        const promisePrivateName = this.promisePrivateName();
        try {
            const computeMethod = instance[this.computeMethodName()];
            assert(computeMethod, "compute method not found for promise wrapped slot " + this.name());
            const value = await computeMethod.call(instance);
            if (instance[promisePrivateName] === promise) {
                instance[this.setterName()].call(instance, value);
                promise.callResolveFunc(value);
            }
        } catch (error) {
            if (instance[promisePrivateName] === promise) {
                instance[promisePrivateName] = null; // let the next call retry
                promise.callRejectFunc(error);
            }
        }
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
