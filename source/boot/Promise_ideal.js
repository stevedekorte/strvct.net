"use strict";

/*

    Promise_ideal

    Some extra methods for the Javascript Promise primitive.

    Use:

    const promise = Promise.clone();

    ...
    promise.callResolveFunc();
    ...
    promise.callRejectFunc();

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

Object.defineSlot(Promise.prototype, "setOnAwaitFunc", function (aFunc) {
    this._onAwaitFunc = aFunc;
    return this;
});

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

Object.defineSlot(Promise.prototype, "setLabel", function (s) {
    this._label = s;
    return this;
});

Object.defineSlot(Promise.prototype, "label", function () {
    return this._label;
});

// timeouts

Object.defineSlot(Promise.prototype, "beginTimeout", function (ms) {
    assert(this.isPending());
    assert(this._timeoutId === null);
    this._timeoutMs = ms;
    this._timeoutId = setTimeout(() => { 
        this.onTimeout() 
    }, ms);
    return this;
});

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

Object.defineSlot(Promise.prototype, "onTimeout", function () { // private
    this.callRejectFunc(this.label() + " promise timeout of " + this._timeoutMs + "ms expired");
});

// resolve / reject

Object.defineSlot(Promise.prototype, "callResolveFunc", function (arg1, arg2, arg3) {
    assert(this._status !== "rejected");
    this._status = "resolved";
    this.clearAwaiterCount();
    this.cancelTimeout();
    return this._resolveFunc(arg1, arg2, arg3);
});

Object.defineSlot(Promise.prototype, "callRejectFunc", function (arg1, arg2, arg3) { 
    assert(this._status !== "resolved");
    this._status = "rejected";
    this.clearAwaiterCount();
    this.cancelTimeout();
    return this._rejectFunc(arg1, arg2, arg3);
});

// status

Object.defineSlot(Promise.prototype, "isResolved", function () { 
    return this._status === "resolved";
});

Object.defineSlot(Promise.prototype, "isRejected", function () { 
    return this._status === "rejected";
});

Object.defineSlot(Promise.prototype, "isPending", function () { 
    return this._status === "pending";
});

// awaiters

Object.defineSlot(Promise.prototype, "hasAwaiters", function () { 
    return this._awaiterCount !== 0;
});

Object.defineSlot(Promise.prototype, "clearAwaiterCount", function () { // private
    this._awaiterCount = 0;
});

Object.defineSlot(Promise.prototype, "originalThen", Promise.prototype.then); // private

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
