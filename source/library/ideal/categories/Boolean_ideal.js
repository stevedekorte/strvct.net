"use strict";

/*

    Boolean-ideal

*/

(class Boolean_ideal extends Boolean {

    duplicate () {
        return this
    }
 
    // logic

    negate () {
        return !this
    }

    and (v) {
        return this && v
    }

    or (v) {
        return this || v
    }

    xor (v) {
        return ( this && !v ) || ( !this && v )
    }

    // control flow

    ifTrue (aClosure) { // just a test
        if (this) {
            return aClosure()
        }
        return undefined
    }

}).initThisCategory();

/*
Object.defineSlots(Boolean.prototype, {

    duplicate: function () {
        return this
    },
 
    // logic

    negate: function () {
        return !this
    },

    and: function (v) {
        return this && v
    },

    or: function (v) {
        return this || v
    },

    xor: function (v) {
        return ( this && !v ) || ( !this && v )
    },

    // control flow

    ifTrue: function (aClosure) { // just a test
        if (this) {
            return aClosure()
        }
        return undefined
    },

});
*/
