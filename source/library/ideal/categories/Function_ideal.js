"use strict";

/** 
 * @module library.ideal
 * @class Function_ideal
 * @extends Function
 * @description Some extra methods for the Javascript Function primitive
*/

/*
(class Function_ideal extends Function {

    static isKindOf (superclass) {
        if (typeof superclass !== 'function') return false; // Ensure superclass is a valid constructor
    
        let current = this;
        while (current) {
            if (current === superclass) return true;
            current = Object.getPrototypeOf(current);
        }
        return false;
    }

}).initThisCategory();
*/

Function.isKindOf = function(superclass) {
    if (typeof superclass !== 'function') {
        return false;
    }

    let proto = this.prototype;
    while (proto) {
        if (proto === superclass.prototype) {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
};

/*
Function.isKindOf = function(superclass) {
    if (typeof superclass !== 'function') {
        return false; // Ensure superclass is a valid constructor
    }

    let current = this;
    while (current) {
        if (current === superclass) {
            return true;
        }

        if (current.name === superclass.name) {
            // ran into case of Event instance class being a Function not the Event class
            // so we need to check the name
            return true;
        }

        if (current.constructor !== current) {
            current = current.constructor;
        } else {
            current = null;
        }
    }
    return false;
};
*/

Function.prototype.isKindOf = function(superclass) {
    if (typeof superclass !== 'function') return false;
    let proto = this.prototype;
    while (proto) {
        if (proto === superclass.prototype) return true;
        proto = Object.getPrototypeOf(proto);
    }
    return false;
};