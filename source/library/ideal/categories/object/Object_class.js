"use strict";

/** * @module library.ideal.object
 */

/** * @class Object_class
 * @extends Object
 
 
 */

/**

 * Object_class
 *
 * Some added state and behavior on Object class.
 */

(class Object_class extends Object {

    /**
     * Gets the superclass of this class.
     * @returns {Function} The superclass.
     * @category Class Hierarchy
     */
    superClass () {
        return this.thisClass().superClass();
    }

    /**
     * Gets the class of this object.
     * @returns {Function} The class of this object.
     * @category Class Hierarchy
     */
    thisClass () {
        if (this.isPrototype()) {
            // it's a prototype
            return this.constructor;
        }

        // otherwise, it's an instance
        return this.__proto__.constructor;
    }

    /**
     * Gets the prototype of this instance.
     * @returns {Object} The prototype of this instance.
     * @throws {Error} If called on a non-instance.
     * @category Class Hierarchy
     */
    thisPrototype () {
        assert(this.isInstance());
        const prototype = this.__proto__;
        assert(prototype.isPrototype);
        return prototype;
    }

    // --- class methods ---

    /**
     * Creates a new instance of the class, initializes it, and returns it.
     * @returns {Object} A new instance of the class.
     * @category Object Creation
     */
    static clone () {
        const obj = new this();
        obj.init();
        obj.finalInit();
        obj.afterInit();
        return obj;
    }

    /**
     * Gets the class with the given name from the global scope.
     * @param {string} aName - The name of the class to get.
     * @returns {Function|undefined} The class with the given name, or undefined if not found.
     * @category Class Lookup
     */
    static getClassNamed (aName) {
        if (Type.isNullOrUndefined(aName)) {
            return undefined;
        }
        return SvGlobals.globals()[aName];
    }

    /**
     * Gets the parent class of this class.
     * @returns {Function|null} The parent class, or null if there is no parent.
     * @category Class Hierarchy
     */
    static parentClass () {
        const p = this.__proto__;

        if (p && p.svType) {
            return p;
        }

        return null;
    }

    /**
     * Adds a child class to this class.
     * @param {Function} aClass - The child class to add.
     * @returns {Function} This class.
     * @category Class Hierarchy
     */
    static addChildClass (aClass) {
        this.childClasses().add(aClass);
        return this;
    }

    /**
     * Gets the global object.
     * @returns {Object} The global object.
     * @category Global Access
     */
    static globals () {
        return SvGlobals.globals();
    }

    /**
     * Initializes class-level properties.
     * @category Class Initialization
     */
    static initClass () {
        this.newClassSlot("allClassesSet", new Set());
    }

    /**
     * Finds all ancestor classes of this class.
     * @returns {Array<Function>} An array of ancestor classes.
     * @category Class Hierarchy
     */
    static findAncestorClasses () {
        const results = [];
        let aClass = this.parentClass();
        while (aClass && aClass.parentClass) {
            results.push(aClass);
            aClass = aClass.parentClass();
        }
        return results;
    }

    /**
     * Creates a new class-level slot.
     * @param {string} slotName - The name of the slot.
     * @param {*} slotValue - The initial value of the slot.
     * @returns {Function} This class.
     * @category Class Properties
     */
    static newClassSlot (slotName, slotValue) {
        const ivarName = "_" + slotName;
        const assert = function (aBool) {
            if (!aBool) {
                throw new Error("failed assert");
            }
        };

        // define ivar
        {
            const hasIvar = !Type.isUndefined(Object.getOwnPropertyDescriptor(this, ivarName));
            assert(!hasIvar);
            const descriptor = {
                configurable: true,
                enumerable: false,
                value: slotValue,
                writable: true,
            };
            Object.defineProperty(this, ivarName, descriptor);
        }

        // define getter
        {
            const hasGetter = !Type.isUndefined(Object.getOwnPropertyDescriptor(this, slotName));
            assert(!hasGetter);
            const getterFunc = function () {
                assert(arguments.length === 0);
                return this[ivarName];
            };
            const descriptor = {
                configurable: true,
                enumerable: false,
                value: getterFunc,
                writable: true,
            };
            Object.defineProperty(this, slotName, descriptor);
        }

        // define setter
        {
            const setterName = "set" + slotName.capitalized();
            const setterFunc = function (v) {
                this[ivarName] = v;
                return this;
            };
            const descriptor = {
                configurable: true,
                enumerable: false,
                value: setterFunc,
                writable: true,
            };
            Object.defineProperty(this, setterName, descriptor);
        }

        return this;
    }

    /**
     * Initializes this class. Called on every class which we create.
     * @returns {Function} This class.
     * @category Class Initialization
     */
    static initThisClass () {
        if (this.svType().includes("_")) {
            throw new Error("class name should not contain an underscore as those are reserved for categories. If this is a category class, call initThisCategory() instead of initThisClass()");
        }

        this.defineClassGlobally();

        // setup ancestor list
        // could become invalid if class structure dynamically changes
        this.newClassSlot("ancestorClasses", this.findAncestorClasses());
        this.newClassSlot("childClasses", new Set());

        // add as class to parent
        const p = this.parentClass();
        if (p && p.addChildClass) {
            p.addChildClass(this);
        }

        if (Object.hasOwn(this, "initClass")) {
            // Only called if method defined on this class.
            // This method should *not* call super.initClass().
            this.initClass();
        }

        this.prototype.setupPrototype();

        this.addToAllClasses();
        return this;
    }

    /**
     * Iterates over each slot key-value pair.
     * @param {Function} fn - The function to call for each slot.
     * @category Object Properties
     */
    forEachSlotKV (fn) {
        // WARNING: overridden slots may be called multiple times using this method
        // use allSlotsMap() to avoid this

        this.forEachSlot(slot => {
            fn(slot.name(), slot);
        });
    }

    /**
     * Initializes the prototype.
     * @category Class Initialization
     */
    initPrototype () {
        // called after setupInOwner is called on each slot
        // so we have a chance to initialize things after all slots are set up
    }

    /**
     * Defines this class globally.
     * @throws {Error} If attempting to redefine a class that's not Object.
     * @category Class Registration
     */
    static defineClassGlobally () {
        const className = this.svType();
        if (Type.isUndefined(this.globals()[className])) {
            this.globals()[className] = this;

            // Also make the class available in global scope for direct access
            // This is especially important in Node.js where eval context might be isolated
            if (typeof global !== "undefined") {
                global[className] = this;
            }
            if (typeof window !== "undefined") {
                window[className] = this;
            }
            if (typeof globalThis !== "undefined") {
                globalThis[className] = this;
            }
        } else if (this.svType() !== "Object") {
            const msg = "WARNING: Attempt to redefine SvGlobals.globals()['" + className + "']";
            console.warn(msg);
            throw new Error(msg);
        }
    }

    /**
     * Gets the superclass of this class.
     * @returns {Function} The superclass.
     * @category Class Hierarchy
     */
    static superClass () {
        return this.__proto__;
    }

    /**
     * Adds this class to the set of all classes.
     * @returns {Function} This class.
     * @throws {Error} If attempting to call initThisClass twice on the same class.
     * @category Class Registration
     */
    static addToAllClasses () {
        if (this.allClassesSet().has(this)) {
            throw new Error("attempt to call initThisClass twice on class '" + this.svType() + "'");
        }
        this.allClassesSet().add(this);
        return this;
    }

    /**
     * Gets all subclasses of this class.
     * @returns {Set<Function>} A set of all subclasses.
     * @category Class Hierarchy
     */
    static allSubclasses () {
        return this.allClassesSet().select(aClass => aClass.hasAncestorClass(this));
    }

    /**
     * Gets direct subclasses of this class.
     * @returns {Set<Function>} A set of direct subclasses.
     * @category Class Hierarchy
     */
    static subclasses () {
        return this.allClassesSet().select(aClass => aClass.superClass() === this);
    }

    /**
     * Checks if this class has the given class as an ancestor.
     * @param {Function} aClass - The class to check.
     * @returns {boolean} True if aClass is an ancestor, false otherwise.
     * @category Class Hierarchy
     */
    static hasAncestorClass (aClass) {
        const sc = this.superClass();

        if (sc === aClass) {
            return true;
        }

        if (sc === Object || !sc.hasAncestorClass) {
            return false;
        }

        return sc.hasAncestorClass(aClass);
    }

    /**
     * Iterates over each slot of an object.
     * @param {Object} obj - The object to iterate over.
     * @param {Function} fn - The function to call for each slot.
     * @category Object Properties
     */
    static eachSlot (obj, fn) {
        Object.keys(obj).forEach(k => fn(k, obj[k]));
    }

    /**
     * Checks if this class is a kind of the given class.
     * @param {Function} aClass - The class to check against.
     * @returns {boolean} True if this class is a kind of aClass, false otherwise.
     * @category Class Hierarchy
     */
    static isKindOf (aClass) {
        if (this.name === "") {
            // anything touching the root "" class seems to crash Chrome,
            // so let's be careful to leave it alone
            return false;
        }

        if (this === aClass) {
            return true;
        }

        let proto = this.__proto__;
        if (proto && proto.name !== "") {
            return proto.isKindOf.call(proto, aClass);
        }

        return false;
    }

}).initThisCategory();

Object.initThisClass();
