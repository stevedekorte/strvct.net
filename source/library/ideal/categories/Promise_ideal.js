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
      return promise 
});

Object.defineSlot(Promise.prototype, "callResolveFunc", function (arg1, arg2, arg3) { 
    return this._resolveFunc(arg1, arg2, arg3);
});

Object.defineSlot(Promise.prototype, "callRejectFunc", function (arg1, arg2, arg3) { 
    return this._rejectFunc(arg1, arg2, arg3);
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
