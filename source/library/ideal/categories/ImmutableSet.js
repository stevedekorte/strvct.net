"use strict";

/**
 * @module library.ideal
 * @class ImmutableSet
 * @extends Set
 * @description An immutable version of the JavaScript Set primitive with additional methods
 */

(class ImmutableSet extends Set {

    /**
     * Returns an empty ImmutableSet instance
     * @returns {ImmutableSet} An empty ImmutableSet
     * @category Creation
     */
    static emptySet () {
        if (this._emptySet === undefined) {
            this._emptySet = new this();
        }
        return this._emptySet;
    }

    /**
     * Creates a new ImmutableSet
     * @param {Iterable} [values] - The initial values for the set
     * @category Creation
     */
    constructor (values) {
        const self = super(values);
        self._isImmutable = true;
    }

    /**
     * Attempts to add a value to the set (throws an error if immutable)
     * @param {*} v - The value to add
     * @throws {Error} If the set is immutable
     * @category Modification
     */
    add (v) {
        if (this._isImmutable) {
            this.onMutationError("add");
        } else {
            return super.add(v);
        }
    }

    /**
     * Attempts to clear the set (throws an error if immutable)
     * @throws {Error} If the set is immutable
     * @category Modification
     */
    clear () {
        if (this._isImmutable) {
            this.onMutationError("clear");
        } else {
            return super.clear();
        }
    }

    /**
     * Attempts to delete a value from the set (throws an error if immutable)
     * @param {*} v - The value to delete
     * @throws {Error} If the set is immutable
     * @category Modification
     */
    delete (v) {
        if (this._isImmutable) {
            this.onMutationError("delete");
        } else {
            return super.add(v);
        }
    }

    /**
     * Throws an error when a mutation method is called on an immutable set
     * @param {string} methodName - The name of the method that was called
     * @throws {Error} Always throws an error
     * @private
     * @category Error Handling
     */
    onMutationError (methodName) {
        throw new Error("attempt to call mutation method '" + methodName + "' on ImmutableSet");
    }

    /**
     * Runs a self-test to ensure the immutability of the set
     * @throws {Error} If the self-test fails
     * @category Testing
     */
    static selfTest () {
        let didThrow = false;
        try {
            const set = new ImmutableSet(new Set([1, 2, 3]));
            set.clear(); // should throw Error: attempt to call mutation method 'clear' on ImmutableSet
        } catch (e) {
            didThrow = true;
        }
        assert(didThrow);
    }

}).initThisClass();

//ImmutableSet.selfTest();