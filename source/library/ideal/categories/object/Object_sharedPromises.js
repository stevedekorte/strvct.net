"use strict";

/** * @module library.ideal.object
 */

/**
 * @class Object_sharedPromises
 * @extends Object
 * @classdesc Object category for async work that several callers may ask for
 * at once. Each method names the work and gives a function that does it;
 * callers that ask for work already under way get its promise instead of
 * starting it again. Use these instead of a hand-kept `fooPromise` slot.
 *
 *     // ONCE: done one time for the life of this object. A failure is
 *     // forgotten, so the next call tries again.
 *     asyncLoad () {
 *         return this.sharedPromiseNamed("load", () => this.asyncLoadResource());
 *     }
 *
 *     // ONE AT A TIME: callers share the run in flight; once it settles,
 *     // the next call runs again.
 *     asyncReadSubnodes () {
 *         return this.inFlightPromiseNamed("read", () => this.asyncJustReadSubnodes());
 *     }
 *
 *     // FRESH: like one at a time, but a caller that arrives while a run is
 *     // in flight is promised the NEXT run, which starts when this one ends —
 *     // for work whose answer depends on when it started (a balance fetched
 *     // before a purchase is not the balance after it).
 *     update () {
 *         return this.freshPromiseNamed("update", () => this.asyncFetchBalance());
 *     }
 *
 * Shared by all three:
 *   - The function is called synchronously, and the promise is recorded
 *     first, so a failure before its first await is treated like any other.
 *   - Callers get the one promise for the run: nothing else is rejected, so a
 *     failure is unhandled only if no caller handles it.
 *   - forgetSharedPromiseNamed(name) abandons the work: the next call starts
 *     again. A run in flight keeps going but no longer counts — it cannot
 *     clear or replace a newer run. The function receives its run, and work
 *     that must not finish once abandoned (a connection it would then hold
 *     open) asks run.isCurrent() after its awaits.
 *   - They work on classes too (static methods), each class keeping its own.
 *
 * Names are per object and shared by the three kinds; use one kind per name.
 */
(class Object_sharedPromises extends Object {

    /**
     * @description This object's runs by name: name → { promise, isCurrent(), nextPromise }.
     * @returns {Map}
     * @private
     * @category Shared Promises
     */
    sharedPromiseRunsMap () {
        const slotName = "_sharedPromiseRunsMap";
        if (!Object.hasOwn(this, slotName)) {
            Object.defineSlot(this, slotName, new Map());
        }
        return this[slotName];
    }

    /**
     * @description Whether work by this name is under way, or was done once and kept.
     * @param {String} name
     * @returns {Boolean}
     * @category Shared Promises
     */
    hasSharedPromiseNamed (name) {
        return this.sharedPromiseRunsMap().has(name);
    }

    /**
     * @description The promise for the work by this name, if it is under way
     * or was done once and kept — for code that must wait on work it does
     * not start.
     * @param {String} name
     * @returns {Promise|null}
     * @category Shared Promises
     */
    existingSharedPromiseNamed (name) {
        const run = this.sharedPromiseRunsMap().get(name);
        return run ? run.promise : null;
    }

    /**
     * @description Abandons the work by this name (see the class notes).
     * @param {String} name
     * @returns {Object} this
     * @category Shared Promises
     */
    forgetSharedPromiseNamed (name) {
        this.sharedPromiseRunsMap().delete(name);
        return this;
    }

    /**
     * @description Starts a run: records it under the name, then calls the
     * function. When the run settles, `keepsRun(didFail)` decides whether it
     * stays recorded.
     * @param {String} name
     * @param {Function} fn - (run) => value or promise
     * @param {Function} keepsRun - (didFail) => Boolean: stay recorded after settling?
     * @returns {Promise} the run's promise
     * @private
     * @category Shared Promises
     */
    startSharedPromiseRun (name, fn, keepsRun) {
        const runs = this.sharedPromiseRunsMap();
        const run = { isCurrent: () => runs.get(name) === run };
        let resolve = null;
        run.promise = new Promise((r) => { resolve = r; });
        runs.set(name, run);
        const settle = (didFail) => {
            if (run.isCurrent() && !keepsRun(didFail)) {
                runs.delete(name);
            }
        };
        run.promise.then(() => settle(false), () => settle(true));
        try {
            resolve(fn(run)); // a returned promise is adopted
        } catch (error) {
            resolve(Promise.reject(error));
        }
        return run.promise;
    }

    /**
     * @description ONCE: the promise for work done one time. A failure is
     * forgotten so the next call tries again.
     * @param {String} name
     * @param {Function} fn - (run) => value or promise
     * @returns {Promise}
     * @category Shared Promises
     */
    sharedPromiseNamed (name, fn) {
        const run = this.sharedPromiseRunsMap().get(name);
        return run ? run.promise : this.startSharedPromiseRun(name, fn, (didFail) => !didFail);
    }

    /**
     * @description ONE AT A TIME: the promise for the run in flight, or a new
     * run if none is.
     * @param {String} name
     * @param {Function} fn - (run) => value or promise
     * @returns {Promise}
     * @category Shared Promises
     */
    inFlightPromiseNamed (name, fn) {
        const run = this.sharedPromiseRunsMap().get(name);
        return run ? run.promise : this.startSharedPromiseRun(name, fn, () => false);
    }

    /**
     * @description FRESH: a run that starts no earlier than this call. With
     * none in flight it starts now; otherwise every caller that arrives
     * during the run in flight shares the one that follows it.
     * @param {String} name
     * @param {Function} fn - (run) => value or promise
     * @returns {Promise}
     * @category Shared Promises
     */
    freshPromiseNamed (name, fn) {
        const run = this.sharedPromiseRunsMap().get(name);
        if (!run) {
            return this.inFlightPromiseNamed(name, fn);
        }
        if (!run.nextPromise) {
            // The run's own settle handler was registered first, so by the time
            // this one runs the name is free (or taken by a newer run, which
            // these callers then queue behind in turn).
            const startNext = () => this.freshPromiseNamed(name, fn);
            run.nextPromise = run.promise.then(startNext, startNext);
        }
        return run.nextPromise;
    }

}).initThisCategory();
