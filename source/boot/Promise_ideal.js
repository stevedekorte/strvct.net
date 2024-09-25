/**
 * @module boot
 */

"use strict";

/**
 * @class Promise
 * @classdesc Some extra methods for the Javascript Promise primitive.
 * 
 * Use:
 * 
 * const promise = Promise.clone();
 * 
 * ...
 * promise.callResolveFunc();
 * ...
 * promise.callRejectFunc();
 */

/**
 * @method clone
 * @memberof Promise
 * @description Clones a new Promise with additional methods and properties.
 * @returns {Promise} A new Promise instance with extended functionality.
 */
Object.defineSlot(Promise, "clone", function () { // add a class method
      let resolveFunc = null;
      let rejectFunc = null;
      const promise = new Promise((resolve, reject) => {
        resolveFunc = resolve;
        rejectFunc = reject;
      });
      promise._resolveFunc = resolveFunc;
      promise._rejectFunc = rejectFunc;
      promise._status = "pending";
      promise._awaiterCount = 0;
      promise._timeoutMs = null;
      promise._timeoutId = null;
      promise._onAwaitFunc = null;
      promise._hasCalledAwaitFunc = false;
      promise._label = "unlabed";
      return promise ;
});


// on await 

/**
 * @method setOnAwaitFunc
 * @memberof Promise
 * @description Sets a function to be called when the promise is awaited.
 * @param {Function} aFunc - The function to be called on await.
 * @returns {Promise} The promise instance.
 */
Object.defineSlot(Promise.prototype, "setOnAwaitFunc", function (aFunc) {
    this._onAwaitFunc = aFunc;
    return this;
});

/**
 * @method onAwait
 * @memberof Promise
 * @description Handles the await operation on the promise.
 */
Object.defineSlot(Promise.prototype, "onAwait", function () {
    if (this.isPending()) {
        this._awaiterCount ++;    
        
        if (!this._hasCalledAwaitFunc) {
            const f = this._onAwaitFunc;
            if (f) {
                f(this);
            }
        }
    } 
});

// label

/**
 * @method setLabel
 * @memberof Promise
 * @description Sets a label for the promise.
 * @param {string} s - The label to set.
 * @returns {Promise} The promise instance.
 */
Object.defineSlot(Promise.prototype, "setLabel", function (s) {
    this._label = s;
    return this;
});

/**
 * @method label
 * @memberof Promise
 * @description Gets the label of the promise.
 * @returns {string} The promise label.
 */
Object.defineSlot(Promise.prototype, "label", function () {
    return this._label;
});

// timeouts

/**
 * @method beginTimeout
 * @memberof Promise
 * @description Begins a timeout for the promise.
 * @param {number} ms - The timeout duration in milliseconds.
 * @returns {Promise} The promise instance.
 */
Object.defineSlot(Promise.prototype, "beginTimeout", function (ms) {
    assert(this.isPending());
    assert(this._timeoutId === null);
    this._timeoutMs = ms;
    this._timeoutId = setTimeout(() => { 
        this.onTimeout() 
    }, ms);
    return this;
});

/**
 * @method cancelTimeout
 * @memberof Promise
 * @description Cancels the timeout for the promise.
 * @returns {Promise} The promise instance.
 */
Object.defineSlot(Promise.prototype, "cancelTimeout", function () {
    const tid = this._timeoutId;
    if (tid) {
        clearTimeout(tid);
        //console.log("Promise cancelTimeout() label: ", this.label().clipWithEllipsis(40) );
        //debugger;
        this._timeoutId = null;
    }
    return this;
});

/**
 * @method onTimeout
 * @memberof Promise
 * @description Handles the timeout event for the promise.
 * @private
 */
Object.defineSlot(Promise.prototype, "onTimeout", function () { // private
    this.callRejectFunc(this.label() + " promise timeout of " + this._timeoutMs + "ms expired");
});

// resolve / reject

/**
 * @method callResolveFunc
 * @memberof Promise
 * @description Calls the resolve function of the promise.
 * @param {*} arg1 - First argument to pass to the resolve function.
 * @param {*} arg2 - Second argument to pass to the resolve function.
 * @param {*} arg3 - Third argument to pass to the resolve function.
 * @returns {*} The result of calling the resolve function.
 */
Object.defineSlot(Promise.prototype, "callResolveFunc", function (arg1, arg2, arg3) {
    assert(!this.isRejected(), "promise resolve call on already rejected promise");
    this._status = "resolved";
    this.clearAwaiterCount();
    this.cancelTimeout();
    return this._resolveFunc(arg1, arg2, arg3);
});

/**
 * @method callRejectFunc
 * @memberof Promise
 * @description Calls the reject function of the promise.
 * @param {*} arg1 - First argument to pass to the reject function.
 * @param {*} arg2 - Second argument to pass to the reject function.
 * @param {*} arg3 - Third argument to pass to the reject function.
 * @returns {*} The result of calling the reject function.
 */
Object.defineSlot(Promise.prototype, "callRejectFunc", function (arg1, arg2, arg3) { 
    assert(!this.isResolved(), "promise reject call on already resolved promise");
    this._status = "rejected";
    this.clearAwaiterCount();
    this.cancelTimeout();
    return this._rejectFunc(arg1, arg2, arg3);
});

// status

/**
 * @method isResolved
 * @memberof Promise
 * @description Checks if the promise is resolved.
 * @returns {boolean} True if the promise is resolved, false otherwise.
 */
Object.defineSlot(Promise.prototype, "isResolved", function () { 
    return this._status === "resolved";
});

/**
 * @method isRejected
 * @memberof Promise
 * @description Checks if the promise is rejected.
 * @returns {boolean} True if the promise is rejected, false otherwise.
 */
Object.defineSlot(Promise.prototype, "isRejected", function () { 
    return this._status === "rejected";
});

/**
 * @method isPending
 * @memberof Promise
 * @description Checks if the promise is pending.
 * @returns {boolean} True if the promise is pending, false otherwise.
 */
Object.defineSlot(Promise.prototype, "isPending", function () { 
    return this._status === "pending";
});

// awaiters

/**
 * @method hasAwaiters
 * @memberof Promise
 * @description Checks if the promise has any awaiters.
 * @returns {boolean} True if the promise has awaiters, false otherwise.
 */
Object.defineSlot(Promise.prototype, "hasAwaiters", function () { 
    return this._awaiterCount !== 0;
});

/**
 * @method clearAwaiterCount
 * @memberof Promise
 * @description Clears the awaiter count.
 * @private
 */
Object.defineSlot(Promise.prototype, "clearAwaiterCount", function () { // private
    this._awaiterCount = 0;
});

/**
 * @method originalThen
 * @memberof Promise
 * @description The original then method of the Promise prototype.
 * @private
 */
Object.defineSlot(Promise.prototype, "originalThen", Promise.prototype.then); // private

/**
 * @method then
 * @memberof Promise
 * @description Overrides the then method to include onAwait functionality.
 * @param {Function} onFulfilled - The function to execute if the promise is fulfilled.
 * @param {Function} onRejected - The function to execute if the promise is rejected.
 * @returns {Promise} A new Promise instance.
 */
Object.defineSlot(Promise.prototype, "then", function (onFulfilled, onRejected) { 
    this.onAwait();
    return this.originalThen(onFulfilled, onRejected);
});


/*
need to make Promise a subclass of Object first?

(class Promise_ideal extends Promise {

    resolveFunc () {
        return this._resolveFunc;
    }

    resolveFunc () {
        return this._rejectFunc;
    }
    
}).initThisCategory();
*/