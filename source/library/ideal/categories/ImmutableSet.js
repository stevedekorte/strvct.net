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

    constructor (values) {
        const self = super(values);
        self._isImmutable = true;
    }

    add (v) {
        if (this._isImmutable) {
            this.onMutationError("add");
        } else {
            return super.add(v);
        }
    }

    clear () {
        if (this._isImmutable) {
            this.onMutationError("clear");
        } else {
            return super.clear();
        }
    }

    delete (v) {
        if (this._isImmutable) {
            this.onMutationError("delete");
        } else {
            return super.add(v);
        }
    }

    onMutationError (methodName) {
        throw new Error("attempt to call mutation method '" + methodName + "' on ImmutableSet");
    }

    static selfTest () {
        let didThrow = false;
        try {
            const set = new ImmutableSet(new Set([1, 2, 3]));
            set.clear(); // throws Error: attempt to call mutation method 'clear' on ImmutableSet
        } catch (e) {
            didThrow = true;
        }
        assert(didThrow);
    }

}).initThisClass();

//ImmutableSet.selfTest();