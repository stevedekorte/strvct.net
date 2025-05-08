/**
 * @module local-web-server
 */

/**
 * @class Base
 * @classdesc Base class with helpful methods for cloning and slot creation
 */


(class Base {

    /**
     * @constructor
     */
    constructor () {
    }

    /**
     * Sets up the capitalized method on the String prototype
     * @static
     * @description Adds a capitalized method to the String prototype if it doesn't already exist
     */
    static setupCapitalized () {
        if (!String.prototype.capitalized) {
            String.prototype.capitalized = function () {
                return this.replace(/\b[a-z]/g, function (match) {
                    return match.toUpperCase();
                });
            }
        }
    }
    
    /**
     * Sets up the prototype for the class
     * @description Sets up the prototype by calling initPrototypeSlots and initPrototype if they exist
     */
    setupPrototype () { 
        if (Object.hasOwn(this, "initPrototypeSlots")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototypeSlots()
            this.initPrototypeSlots();
        }

        // this.initSlots();

        if (Object.hasOwn(this, "initPrototype")) {
            // each class inits it's own prototype, so make sure we only call our own initPrototype()
            this.initPrototype();
        }
    }

    /**
     * Initializes the class
     * @static
     * @description Sets up the prototype, adds the class to the global scope, and returns the class
     * @returns {typeof Base} The class itself
     */
    static initThisClass () {
        this.prototype.setupPrototype();
        getGlobalThis()[this.type()] = this
        return this
    }

    /**
     * Returns a shared instance of the class
     * @static
     * @description Creates a new instance if it doesn't exist, initializes it, and returns it
     * @returns {Base} The shared instance of the class
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
     * Returns the type (name) of the class
     * @static
     * @returns {string} The name of the class
     */
    static type () {
        return this.name
    }

    /**
     * Returns the type (name) of the instance's class
     * @returns {string} The name of the instance's class
     */
    type () {
        return this.constructor.name
    }

    /**
     * Creates and initializes a new instance of the class
     * @static
     * @returns {Base} A new instance of the class
     */
    static clone () {
        const obj = new this()
        obj.init()
        return obj
    }
    
    /**
     * Initializes the instance
     * @description Subclasses should override to initialize
     */
    init () {
        // subclasses should override to initialize
    }

    /**
     * Creates a new slot with getter and setter methods
     * @param {string} slotName - The name of the slot
     * @param {*} [initialValue=null] - The initial value of the slot
     * @returns {Base} The instance itself for method chaining
     * @throws {Error} If the slot name is not a string
     */
    newSlot (slotName, initialValue) {
        if (typeof(slotName) !== "string") {
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

}.initThisClass());

Base.setupCapitalized(); // so we don't run it on every class

Base.initThisClass();

