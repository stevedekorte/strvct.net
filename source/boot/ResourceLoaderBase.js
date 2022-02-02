"use strict";



Object.defineSlot = function(obj, slotName, slotValue) {
    //if (!Object.hasOwnSlot(obj, slotName, slotValue)) {
    const descriptor = {
        configurable: true,
        enumerable: false,
        value: slotValue,
        writable: true,
    }
    Object.defineProperty(obj, slotName, descriptor)
    //}
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

// --- ResourceLoaderBase ---------------------------------------------------

(class ResourceLoaderBase {

    isInBrowser() {
        return (typeof(document) !== 'undefined')
    }

    static type() {
        return this.name
    }

    static initThisClass () {
        window[this.type()] = this
        return this
    }

    static shared() {
        if (!this._shared) {
            this._shared = this.clone()
        }
        return this._shared
    }

    type() {
        return this.constructor.name
    }

    static clone() {
        const obj = new this()
        obj.init()
        return obj
    }
    
    init() {
        // subclasses should override to initialize
    }

    newSlot(slotName, initialValue) {
        if (typeof(slotName) !== "string") {
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
}.initThisClass())
