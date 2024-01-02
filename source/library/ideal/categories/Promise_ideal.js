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
      return promise ;
});

Object.defineSlot(Promise.prototype, "callResolveFunc", function (arg1, arg2, arg3) {
    assert(this._status !== "rejected");
    this._status = "resolved";
    return this._resolveFunc(arg1, arg2, arg3);
});

Object.defineSlot(Promise.prototype, "callRejectFunc", function (arg1, arg2, arg3) { 
    assert(this._status !== "resolved");
    this._status = "rejected";
    return this._rejectFunc(arg1, arg2, arg3);
});

Object.defineSlot(Promise.prototype, "isResolved", function () { 
    return this._status === "resolved";
});

Object.defineSlot(Promise.prototype, "isRejected", function () { 
    return this._status === "rejected";
});

Object.defineSlot(Promise.prototype, "isPending", function () { 
    return this._status === "pending";
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
