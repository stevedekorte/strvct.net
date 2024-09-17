"use strict";

/**
 * @module ideal
 * @class Boolean_ideal
 * @extends Boolean
 * @description Extended Boolean class with additional utility methods.
 */
(class Boolean_ideal extends Boolean {

    /**
     * @returns {boolean} Returns the boolean value itself.
     */
    duplicate () {
        return this
    }
 
    // logic

    /**
     * @returns {boolean} Returns the negation of the boolean value.
     */
    negate () {
        return !this
    }

    /**
     * Performs a logical AND operation with another boolean value.
     * @param {boolean} v - The boolean value to AND with.
     * @returns {boolean} The result of the AND operation.
     */
    and (v) {
        return this && v
    }

    /**
     * Performs a logical OR operation with another boolean value.
     * @param {boolean} v - The boolean value to OR with.
     * @returns {boolean} The result of the OR operation.
     */
    or (v) {
        return this || v
    }

    /**
     * Performs a logical XOR operation with another boolean value.
     * @param {boolean} v - The boolean value to XOR with.
     * @returns {boolean} The result of the XOR operation.
     */
    xor (v) {
        return ( this && !v ) || ( !this && v )
    }

    // control flow

    /**
     * Executes the provided closure if the boolean value is true.
     * @param {Function} aClosure - The function to execute if the boolean is true.
     * @returns {*} The result of the closure if executed, otherwise undefined.
     */
    ifTrue (aClosure) { // just a test
        if (this) {
            return aClosure()
        }
        return undefined
    }

}).initThisCategory();
