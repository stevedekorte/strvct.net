/**
 * @module boot
 */

"use strict";

/**
 * @class Promise_ideal
 * @extends Promise
 * @classdesc Some extra methods for the Javascript Promise primitive.
 * 
 * Example usage:
 * 
 * const promise = Promise.clone();
 * 
 * ...
 * promise.callResolveFunc();
 * ...
 * promise.callRejectFunc();
 */


(class Promise_ideal extends Promise {

    /**
     * @method initThisCategory
     * @static
     * @description The original then method of the Promise prototype. We need this in order to be able to override the 'then' method without losing the original method.
     * @category initialization
     * @returns {Promise_ideal} The Promise_ideal class.
     */
    static initThisCategory () {
        Object.defineSlot(Promise.prototype, "originalThen", Promise.prototype.then); // private
        delete Promise.prototype.then; // so initThisCategory() can set it
        super.initThisCategory();
        return this;
    }

    /**
     * @static
     * @description Clones a new Promise with additional methods and properties.
     * @returns {Promise} A new Promise instance with extended functionality.
     * @category Creation
     */
    static clone () { // add a class method
        let resolveFunc = null;
        let rejectFunc = null;
        const promise = new Promise((resolve, reject) => {
            resolveFunc = resolve; // sets the outer resolve function
            rejectFunc = reject; // sets the outer reject function
        });
        promise._resolveFunc = resolveFunc; // record the resolve function so the promise can access it 
        promise._rejectFunc = rejectFunc; // record the reject function so the promise can access it
        promise._status = "pending"; 
        promise._awaiterCount = 0; 
        promise._timeoutMs = null;
        promise._timeoutId = null;
        promise._onAwaitFunc = null;
        promise._hasCalledAwaitFunc = false;
        promise._label = "unlabed";
        return promise ;
    }

    /**
     * @method setOnAwaitFunc
     * @memberof Promise
     * @description Sets a function to be called when the promise is awaited.
     * @param {Function} aFunc - The function to be called on await.
     * @returns {Promise} The promise instance.
     * @category Await
     */
    setOnAwaitFunc (aFunc) {
        this._onAwaitFunc = aFunc;
        return this;
    }

    /**
     * @method onAwait
     * @memberof Promise
     * @description Handles the await operation on the promise.
     * @category Await
     */
    onAwait () {
        if (this.isPending()) {
            this._awaiterCount ++;    
        
        if (!this._hasCalledAwaitFunc) {
            const f = this._onAwaitFunc;
            if (f) {
                f(this);
            }
        }
        } 
    }

// label

/**
 * @method setLabel
 * @memberof Promise
 * @description Sets a label for the promise.
 * @param {string} s - The label to set.
 * @returns {Promise} The promise instance.
 * @category Labeling
 */
    setLabel (s) {
        this._label = s;
        return this;
    }

/**
 * @method label
 * @memberof Promise
 * @description Gets the label of the promise.
 * @returns {string} The promise label.
 * @category Labeling
 */
    label () {
        return this._label;
    }

// timeouts

/**
 * @method beginTimeout
 * @memberof Promise
 * @description Begins a timeout for the promise.
 * @param {number} ms - The timeout duration in milliseconds.
 * @returns {Promise} The promise instance.
 * @category Timeout
 */
    beginTimeout (ms) {
        assert(this.isPending());
        assert(this._timeoutId === null);
        this._timeoutMs = ms;
        this._timeoutId = setTimeout(() => { 
            this.onTimeout();
        }, ms);
        return this;
    }

/**
 * @method cancelTimeout
 * @memberof Promise
 * @description Cancels the timeout for the promise.
 * @returns {Promise} The promise instance.
 * @category Timeout
 */
    cancelTimeout () {
        const tid = this._timeoutId;
        if (tid) {
            clearTimeout(tid);
            //console.log("Promise cancelTimeout() label: ", this.label().clipWithEllipsis(40) );
            //debugger;
            this._timeoutId = null;
        }
        return this;
    }

/**
 * @method onTimeout
 * @memberof Promise
 * @description Handles the timeout event for the promise.
 * @private
 * @category Timeout
 */
    onTimeout () { // private
        this.callRejectFunc(this.label() + " promise timeout of " + this._timeoutMs + "ms expired");
    }


// resolve / reject

/**
 * @method callResolveFunc
 * @memberof Promise
 * @description Calls the resolve function of the promise with variable arguments.
 * @param {...*} args - Arguments to pass to the resolve function.
 * @returns {*} The result of calling the resolve function.
 * @category Resolution
 */
    callResolveFunc (...args) {
        assert(!this.isRejected(), "promise resolve call on already rejected promise");
        this._status = "resolved";
        this.clearAwaiterCount();
        this.cancelTimeout();
        if (this._resolveFunc) {
            return this._resolveFunc(...args);
        }
        debugger;
        throw new Error("Promise resolved with no resolve function provided");
    }

/**
 * @method callRejectFunc
 * @memberof Promise
 * @description Calls the reject function of the promise with variable arguments.
 * If no reject function exists (e.g., promise not created via Promise.clone()), 
 * rethrows the first argument as an exception.
 * @param {...*} args - Arguments to pass to the reject function.
 * @returns {*} The result of calling the reject function.
 * @throws {*} The first argument if no reject function exists.
 * @category Resolution
 */
    callRejectFunc (...args) { 
        assert(!this.isResolved(), "promise reject call on already resolved promise");
        this._status = "rejected";
        this.clearAwaiterCount();
        this.cancelTimeout();
        if (this._rejectFunc) {
            return this._rejectFunc(...args);
        }
        // If no reject function exists, rethrow the error/exception
        if (args.length > 0) {
            const error = args[0];
            // Ensure we always throw an Error object, not a DOM Event or other non-Error
            if (error instanceof Error) {
                throw error;
            } else if (typeof Event !== 'undefined' && error instanceof Event) {
                // DOM Event - create a proper Error
                throw new Error(`Promise rejected with DOM Event: ${error.type}`);
            } else if (typeof error === 'string') {
                throw new Error(error);
            } else {
                throw new Error(`Promise rejected with: ${String(error)}`);
            }
        }
        throw new Error("Promise rejected with no reject function and no error provided");
    }

// status

/**
 * @method isResolved
 * @memberof Promise
 * @description Checks if the promise is resolved.
 * @returns {boolean} True if the promise is resolved, false otherwise.
 * @category Status
 */
    isResolved () { 
        return this._status === "resolved";
    }

/**
 * @method isRejected
 * @memberof Promise
 * @description Checks if the promise is rejected.
 * @returns {boolean} True if the promise is rejected, false otherwise.
 * @category Status
 */
    isRejected () { 
        return this._status === "rejected";
    }

/**
 * @method isPending
 * @memberof Promise
 * @description Checks if the promise is pending.
 * @returns {boolean} True if the promise is pending, false otherwise.
 * @category Status
 */
    isPending () { 
        return this._status === "pending";
    }

// awaiters

/**
 * @method hasAwaiters
 * @memberof Promise
 * @description Checks if the promise has any awaiters.
 * @returns {boolean} True if the promise has awaiters, false otherwise.
 * @category Await
 */
    hasAwaiters () { 
        return this._awaiterCount !== 0;
    }

/**
 * @method clearAwaiterCount
 * @memberof Promise
 * @description Clears the awaiter count.
 * @private
 * @category Await
 */
    clearAwaiterCount () { // private
        this._awaiterCount = 0;
    }

/**
 * @method then
 * @memberof Promise
 * @description Overrides the then method to include onAwait functionality.
 * @param {Function} onFulfilled - The function to execute if the promise is fulfilled.
 * @param {Function} onRejected - The function to execute if the promise is rejected.
 * @returns {Promise} A new Promise instance.
 * @category Chaining
 */
    then (onFulfilled, onRejected) { 
        this.onAwait();
        return this.originalThen(onFulfilled, onRejected);
    }
    
}).initThisCategory();

