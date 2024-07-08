
"use strict";

// ------------------------------------------------------------------

if (!String.prototype.capitalized) {
    String.prototype.capitalized = function () {
        return this.replace(/\b[a-z]/g, function (match) {
            return match.toUpperCase();
        });
    }
}

// ------------------------------------------------------------------

(class Base {
    // Base class with helpful methods for cloning and slot creation 

    constructor () {
    }

    setupPrototype () { 
        if (this.hasOwnProperty("initPrototypeSlots")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototypeSlots()
            this.initPrototypeSlots()
        }

        // this.initSlots();

        if (this.hasOwnProperty("initPrototype")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototype()
            this.initPrototype()
        }
    }

    static initThisClass () {
        this.prototype.setupPrototype();
        getGlobalThis()[this.type()] = this
        return this
    }

    static shared () {
        if (!Object.hasOwnProperty(this, "_shared")) {
            const obj = new this();
            this._shared = obj;
            obj.init();
        }
        return this._shared
    }

    /*
    static shared () {
        if (!this._shared) {
            this._shared = this.clone()
        }
        return this._shared
    }
    */

    static type () {
        return this.name
    }

    type () {
        return this.constructor.name
    }

    static clone () {
        const obj = new this()
        obj.init()
        return obj
    }
    
    init () {
        // subclasses should override to initialize
    }

    newSlot(slotName, initialValue) {
        if (typeof(slotName) !== "string") {
            throw new Error("slot name must be a string"); 
        }

        if (initialValue === undefined) { 
            initialValue = null;
        };

        const privateName = "_" + slotName;
        this[privateName] = initialValue;

        if (!this[slotName]) {
            this[slotName] = function () {
                return this[privateName];
            }
        }

        const setterName = "set" + slotName.capitalized();

        if (!this[setterName]) {
            this[setterName] = function (newValue) {
                this[privateName] = newValue;
                return this;
            }
        }

        return this;
    }

}.initThisClass());
