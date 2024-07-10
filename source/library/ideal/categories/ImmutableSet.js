"use strict";

/*

    ImmutableSet
    
*/

(class ImmutableSet extends Set {

    static emptySet () {
        if (this._emptySet === undefined) {
            this._emptySet = new this();
        }
        return this._emptySet;
    }

    add (v) {
        this.onMutationError("add");
    }

    clear () {
        this.onMutationError("clear");
    }

    delete (v) {
        this.onMutationError("delete");
    }

    onMutationError (methodName) {
        throw new Error("attempt to call mutation method '" + methodName + "' on ImmutableSet");
    }

}).initThisClass();
