"use strict"; 

/**
 * @module Object_boot
 * @class Object_boot
 * @extends Object
 * @classdesc Category to add some basic functionality to the Object class.
 * @category Initialization
 */

(class Object_boot extends Object {

    /**
     * @static
     * @description Get the type name of the object
     * @category Type Checking
     * @returns {string} The type name of the object
     */
    static type() { 
        return this.name;
    }

    /**
     * @description Get the type of the object
     * @category Type Checking
     * @returns {string} The type name of the object
     */
    type() { 
        return this.constructor.name;
    }

    /**
     * @static
     * @description Check if the object is a class
     * @category Type Checking
     * @returns {boolean} True if the object is a class, false otherwise
     */
    static isClass() { 
        return true;
    }

    /**
     * @description Check if the object is a class
     * @category Type Checking
     * @returns {boolean} True if the object is a class, false otherwise
     */
    isClass() { 
        return false;
    }

    /**
     * @static
     * @description Check if the object is a prototype
     * @category Type Checking
     * @returns {boolean} True if the object is a prototype, false otherwise
     */
    static isPrototype() { 
        return false;
    }

    /**
     * @description Check if the object is a prototype
     * @category Type Checking
     * @returns {boolean} True if the object is a prototype, false otherwise
     */
    isPrototype() { 
        return this.constructor.prototype === this;
    }

    /**
     * @static
     * @description Check if the object is an instance
     * @category Type Checking
     * @returns {boolean} True if the object is an instance, false otherwise
     */
    static isInstance() { 
        return false;
    }

    /**
     * @description Check if the object is an instance
     * @category Type Checking
     * @returns {boolean} True if the object is an instance, false otherwise
     */
    isInstance() { 
        return !this.isPrototype();
    }

    /**
     * @description Enumerate the prototypes
     * @category Enumeration
     * @param {function} fn - The function to call for each prototype
     */
    forEachPrototype(fn) { 
        let proto = this;

        if (this.isInstance()) {
            proto = this.__proto__;
        }

        while (proto) {
            fn(proto);
            //console.log("proto is ", proto.type())
            if (proto === proto.__proto__) {
                throw new Error("__proto__ loop detected in " + proto.type());
                break;
            } else {
                proto = proto.__proto__;
            }
        }
    }

    /**
     * @description Enumerate the slots
     * @category Enumeration
     * @param {function} fn - The function to call for each slot
     */
    forEachSlot(fn) { 
        this.forEachPrototype(proto => {
            if (Object.hasOwn(proto, "_slotsMap")) {
                proto._slotsMap.forEach((slot, key, map) => {
                    fn(slot);
                })
            }
        });
    }

    /**
     * @description Setup the all slots map (_allSlotsMap property)
     * @category Initialization
     * @returns {void}
     */
    setupAllSlotsMap() { 
        if (!this.isPrototype()) {
            throw new Error("setupAllSlotsMap called on non-prototype");
        }

        const m = this._allSlotsMap;
        //console.log("*** " + this.type() + " setupAllSlotsMap");

        //assert(this.isPrototype())
        this.forEachSlot(slot => {
            const k = slot.name();
        if (!m.has(k)) { // to handle overrides 
                m.set(k, slot);
            }
        });
    }

    /**
     * @description Get the all slots map
     * @category Accessors
     * @returns {Map} The all slots map
     */
    allSlotsMap() { 
        return this._allSlotsMap;
    }

    /**
     * @description Get the slots map
     * @category Accessors
     * @returns {Map} The slots map
     */
    slotsMap() { 
        return this._slotsMap;
    }

    /**
     * @description Initialize the slots
     * @category Initialization
     * @returns {void}
     */
    initSlots () {
        assert(this.isPrototype());
        //console.log(this.type() + " this.slotsMap().size = " + this.slotsMap().size);

        this.slotsMap().forEach((slot) => {
            slot.setupInOwner();
            assert(this.hasOwnProperty([slot.name()]) && this.hasOwnProperty(["_" + slot.name()]), this.type() + " missing " + slot.name() + " slot");
        });
    }

    /**
     * @description Setup the prototype
     * @category Initialization
     * @returns {void}
     */
    setupPrototype () {
        if (!this.isPrototype()) {
            throw new Error("setupPrototype called on non-prototype");
        }

        /// each proto has it's own set of slots - use justNewSlot as newSlot needs to check the slots list
        Object.defineSlot(this, "_slotsMap", new Map()); // slots for just this proto
        Object.defineSlot(this, "_allSlotsMap", new Map()); // slots for this proto and all protos in the proto chain
        this.setupAllSlotsMap();

        // We need to separate initPrototypeSlots, initSlots, initPrototype as
        // initializing some slots may depend on others already existing.
        
        // Slot init ordering may be important as well and why slots should be stored in 
        // an array with a name->slot map used as an index.

        
        if (this.hasOwnProperty("initPrototypeSlots")) {
            // Only called if method defined on this class.
            this.initPrototypeSlots();// This method should NOT call super
        }

        this.initSlots();

        if (this.hasOwnProperty("initPrototype")) {
            this.initPrototype(); // This method should NOT call super

            if (this.assertProtoSlotsHaveType) {
                this.assertProtoSlotsHaveType();
            } else {
                if (this.type() !== "Object") {
                    console.log(this.type() + " missing assertProtoSlotsHaveType");
                    debugger;
                }
            }
        } else {
            //debugger;
        }

        //console.log("\n\n" + this.type() + " allSlots: ", Array.from(this.allSlotsMap().keys()).sort() + "\n\n");
        return this;
    }

}).initThisCategory();