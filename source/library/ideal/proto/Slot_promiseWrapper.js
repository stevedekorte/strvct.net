"use strict";

/** * @module library.node.nodes
 */

/** * @class Slot_promiseWrapper
 * @extends Slot
 * @classdesc Category of Slot adding promise-wrapped getters: a slot whose
 * value is computed asynchronously, once, however many callers ask for it.
 *
 *     const slot = this.newSlot("publicUrl", null);
 *     slot.setIsPromiseWrapped(true);
 *     slot.setPromiseResetsOnChangeOfSlotName("dataUrl"); // optional
 *
 * gives the class:
 *
 *     asyncPublicUrl()         returns THE promise for the value. The first call
 *                              starts asyncComputePublicUrl(); every later call,
 *                              during the computation or after it, gets that same
 *                              promise. The class implements asyncComputePublicUrl().
 *     didUpdateSlotDataUrl()   resets the value when dataUrl changes.
 *
 * The contract:
 *   - The promise is the cache, so a computed null is a value like any other
 *     and is not computed again.
 *   - A failed computation rejects the callers waiting on it and is forgotten:
 *     the next call computes again.
 *   - A reset while computing does not reject anyone. The stale computation's
 *     result is dropped, a new one starts, and the callers already waiting get
 *     the new value from the promise they hold.
 *   - A value set with the setter (loaded, or assigned) is the value:
 *     asyncPublicUrl() resolves to it without computing.
 *
 * Per-instance state, beside the slot's own ivar (_publicUrl):
 *     _publicUrlPromise   the promise callers share (a Promise.clone()), or null
 *     _publicUrlRun       counts computations, so a superseded one is ignored
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

    runPrivateName () {
        return this.privateName() + "Run";
    }

    setupPromiseWrapperIfNeeded () {
        if (this.isPromiseWrapped()) {
            this.owner()[this.asyncGetterName()] = this.newAsyncPromiseWrappedGetter();
        }
        this.setupPromiseResetMethodIdNeeded();
    }

    newAsyncPromiseWrappedGetter () {
        const slot = this;
        return function (...args) { // Example: asyncPublicUrl()
            assert(args.length === 0, "getter should not be called with arguments");
            return slot.wrappedPromiseOn(this);
        };
    }

    /**
     * @description The promise for the instance's value: the one already
     * shared if it still stands, else a new one — settled at once when the
     * value was set directly, otherwise computing.
     * @param {Object} instance
     * @returns {Promise}
     * @category Promise Wrapper
     */
    wrappedPromiseOn (instance) {
        const promiseName = this.promisePrivateName();
        if (this.wrappedPromiseIsCurrentOn(instance)) {
            return instance[promiseName];
        }
        const promise = Promise.clone();
        instance[promiseName] = promise;
        const value = instance[this.privateName()];
        if (value !== null) {
            this.resolveWrappedPromise(promise, value); // set with the setter: nothing to compute
        } else {
            this.asyncComputeForWrappedPromise(instance, promise);
        }
        return promise;
    }

    /**
     * @description Whether the instance's shared promise still answers for
     * its value: it is pending, or it resolved to the value the slot holds
     * now (the setter may have replaced the value since).
     * @param {Object} instance
     * @returns {Boolean}
     * @category Promise Wrapper
     */
    wrappedPromiseIsCurrentOn (instance) {
        const promise = instance[this.promisePrivateName()];
        if (!promise) {
            return false;
        }
        return !promise.isCompleted() || promise._wrappedValue === instance[this.privateName()];
    }

    resolveWrappedPromise (promise, value) {
        promise._wrappedValue = value;
        promise.callResolveFunc(value);
    }

    /**
     * @description Runs the instance's compute method and settles the promise
     * its callers share. Each run takes a number; a run that is no longer the
     * latest when it finishes (the value was reset meanwhile) is ignored,
     * result or error. A failure of the latest run rejects the callers and
     * clears the promise, so the next call computes again.
     * @param {Object} instance
     * @param {Promise} promise - the shared promise, made with Promise.clone()
     * @returns {Promise}
     * @category Promise Wrapper
     */
    async asyncComputeForWrappedPromise (instance, promise) {
        const runName = this.runPrivateName();
        const run = (instance[runName] || 0) + 1;
        instance[runName] = run;
        try {
            const computeMethod = instance[this.computeMethodName()];
            assert(computeMethod, "compute method not found for promise wrapped slot " + this.name());
            const value = await computeMethod.call(instance);
            if (instance[runName] === run) {
                instance[this.setterName()].call(instance, value);
                this.resolveWrappedPromise(promise, value);
            }
        } catch (error) {
            if (instance[runName] === run) {
                instance[this.promisePrivateName()] = null; // let the next call retry
                promise.callRejectFunc(error);
            }
        }
    }

    /**
     * @description Forgets the instance's value so it is computed again. If a
     * computation is running, its callers keep waiting on the promise they
     * hold and a new computation starts for it; otherwise the next call to
     * the async getter computes.
     * @param {Object} instance
     * @category Promise Wrapper
     */
    resetWrappedPromiseOn (instance) {
        const promiseName = this.promisePrivateName();
        const promise = instance[promiseName];
        instance[this.privateName()] = null;
        if (promise && !promise.isCompleted()) {
            this.asyncComputeForWrappedPromise(instance, promise); // supersedes the running one
        } else {
            instance[promiseName] = null; // nothing is running: the next call computes
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
        return function (/*oldValue, newValue*/) { // the slot our value depends on changed
            slot.resetWrappedPromiseOn(this);
        };
    }

}.initThisCategory());
