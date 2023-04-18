
"use strict";

// ------------------------------------------------------------------

Object.defineSlot = function (obj, slotName, slotValue) {
    const descriptor = {
        configurable: true,
        enumerable: false,
        value: slotValue,
        writable: true,
    }

    if (typeof(slotValue) === "function") {
        slotValue.displayName = slotName
    }
    
    Object.defineProperty(obj, slotName, descriptor)
}

if (!String.prototype.capitalized) {
    Object.defineSlot(String.prototype, "capitalized",
        function () {
            return this.replace(/\b[a-z]/g, function (match) {
                return match.toUpperCase();
            });
        }
    )
}
// ------------------------------------------------------------------
// a quick and dirty base class used for bootstrapping a more
// full featured ProtoClass base class & Object categories
// ------------------------------------------------------------------

(class Base {
    // Base class with helpful methods for cloning and slot creation 

    static isInBrowser () {
        return (typeof (document) !== 'undefined')
    }

    isInBrowser () {
        return (typeof (document) !== 'undefined')
    }

    static shared () {
        if (!this._shared) {
            this._shared = this.clone()
        }
        return this._shared
    }

    static type () {
        return this.name
    }

    static initThisClass () {
        
        if (this.prototype.hasOwnProperty("initPrototypeSlots")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototypeSlots()
            this.prototype.initPrototypeSlots()
        }

        if (this.prototype.hasOwnProperty("initPrototype")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototype()
            this.prototype.initPrototype()
        }

        getGlobalThis()[this.type()] = this
        return this
    }

    static type () {
        return this.name
    }

    type () {
        return this.constructor.name
    }

    static clone () {
        const obj = new this()
        obj.init(arguments) 
        return obj
    }

    initPrototype () {
        this.newSlot("isDebugging", false)
    }

    init () {
        // subclasses should override to initialize
    }

    newSlot (slotName, initialValue) {
        if (typeof (slotName) !== "string") {
            throw new Error("slot name must be a string");
        }

        if (initialValue === undefined) {
            initialValue = null
        };

        const privateName = "_" + slotName;
        this[privateName] = initialValue;

        if (!this[slotName]) {
            this[slotName] = function () {
                return this[privateName];
            }
        }

        const setterName = "set" + slotName.capitalized()

        if (!this[setterName]) {
            this[setterName] = function (newValue) {
                this[privateName] = newValue;
                return this;
            }
        }

        return this;
    }

    /*
    debugLog (s) {
        if (this.isDebugging()) {
            if (typeof(s) === "function") {
                s = s()
            }
            console.log(s)
        }
    }
    */

    debugTypeId () {
        return this.type()
    }

    debugLog (s) {
        if (this.isDebugging()) {
            if (typeof(s) === "function") {
                s = s()
            }
            if (arguments.length == 1) {
                console.log(this.debugTypeId() + " " + s)
            } else {
                console.log(this.debugTypeId() + " ", arguments[0], arguments[1])
            }
        }
        return this
    }

}.initThisClass());

getGlobalThis().assert = function (v) {
    if (!Boolean(v)) {
        throw new Error("assert failed - false value")
    }
    return v
}