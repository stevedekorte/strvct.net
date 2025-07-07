"use strict";

/**
 * @module boot
 * @class Base
 * @extends Object
 * @description Base class with helpful methods for cloning and slot creation.
 */
    

/**
 * Base class with helpful methods for cloning and slot creation.
 */
(class Base extends Object {

    /**
     * @returns {string} The JSON type for an Object which is "object", unless the type method is defined.
     */
    static jsonType () {
        /// check if type is a function
        if (typeof this.type === "function") {
            return this.type();
        }
        return "object";
    }

    /**
     * Checks if the code is running in a browser environment.
     * @returns {boolean} True if running in a browser, false otherwise.
     * @category Environment
     */
    static isInBrowser () {
        return (typeof (document) !== 'undefined')
    }

    /**
     * Instance method to check if running in a browser environment.
     * @returns {boolean} True if running in a browser, false otherwise.
     * @category Environment
     */
    isInBrowser () {
        return (typeof (document) !== 'undefined')
    }

    /**
     * Returns a shared instance of the class.
     * @returns {Base} The shared instance of the class.
     * @category Instance Management
     */
    static shared () {
        if (!Object.hasOwn(this, "_shared")) {
            const obj = new this();
            this._shared = obj;
            obj.init();
        }
        return this._shared
    }

    /**
     * Returns the name of the class.
     * @returns {string} The name of the class.
     * @category Reflection
     */
    static type () {
        return this.name
    }

    static defineStringCapitalized () {
        if (!String.prototype.capitalized) {
            Object.defineSlot(String.prototype, "capitalized",
                function () {
                    return this.replace(/\b[a-z]/g, function (match) {
                        return match.toUpperCase();
                    });
                }
            )
        }
        return this;
    }

    /**
     * Sets up the Object.defineSlot method for defining slots on objects.
     * @returns {typeof Base} The class itself.
     * @category Initialization
     */
    static setupDefineSlot () {
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
        this.defineStringCapitalized();
        return this;
    }

    /**
     * Initializes the class by setting up prototype slots and methods.
     * @returns {typeof Base} The class itself.
     * @category Initialization
     */
    static initThisClass () {
        this.setupDefineSlot();

        // initPrototypeSlots is split from initPrototype as initPrototype may need to 
        // access slots that are created in initPrototypeSlots. We can't just put the slot definitions at the top
        // as subclasses may *override* the slot definitions.
        
        if (Object.hasOwn(this.prototype, "initPrototypeSlots")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototypeSlots()
            this.prototype.initPrototypeSlots();
        }

        if (Object.hasOwn(this.prototype, "initPrototype")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototype()
            this.prototype.initPrototype();
        }

        SvGlobals.globals()[this.type()] = this; // This isn't done automatically by JS class deifintions, so we do it here
        return this;
    }

    /**
     * Returns the name of the class.
     * @returns {string} The name of the class.
     * @category Reflection
     */
    type () {
        return this.constructor.name;
    }

    /**
     * Creates and initializes a new instance of the class.
     * @returns {Base} A new instance of the class.
     * @category Instance Management
     */
    static clone () {
        const obj = new this();
        obj.init();
        return obj;
    }

    /**
     * Initializes the prototype. Subclasses should override this method.
     * IMPORTANT: This method should NEVER call super as each class is responsible for
     * initializing only its own prototype. The framework handles prototype inheritance automatically.
     * @category Initialization
     */
    initPrototype () {
        this.newSlot("isDebugging", false);
    }

    /**
     * Initializes the instance. Subclasses should override this method.
     * @category Initialization
     */
    init () {
        // subclasses should override to initialize
    }

    /**
     * Creates a new slot with a getter and setter.
     * @param {string} slotName - The name of the slot to create.
     * @param {*} [initialValue=null] - The initial value of the slot.
     * @returns {Base} The instance itself for method chaining.
     * @category Slot Management
     */
    newSlot (slotName, initialValue) {
        if (typeof (slotName) !== "string") {
            throw new Error("slot name must be a string");
        }

        if (initialValue === undefined) {
            initialValue = null;
        }

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

    /**
     * Returns a string identifier for debugging purposes.
     * @returns {string} The type of the instance.
     * @category Debugging
     */
    debugTypeId () {
        return this.type()
    }

    /**
     * Logs a debug message if debugging is enabled.
     * @param {string|function} s - The message to log or a function that returns the message.
     * @returns {Base} The instance itself for method chaining.
     * @category Debugging
     */
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

const assert = function (v, errorMessage) {
    if (!v) {
        if (typeof(errorMessage) === "function") {
            errorMessage = errorMessage();
        }
        const m = errorMessage ? errorMessage : "assert failed - false value";
        debugger;
        throw new Error(m);
    }
    return v
}

SvGlobals.set("assert", assert);

const debugAssert = function (v, errorMessage) {
    if (!v) {
        const m = errorMessage ? errorMessage : "assert failed - false value";
        console.warn(m);
        debugger;
        throw new Error(m)
    }
    return v
}

SvGlobals.set("debugAssert", debugAssert);