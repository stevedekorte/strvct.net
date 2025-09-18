"use strict"; 

/**
 * @module boot
 * @class Object_boot
 * @extends Object
 * @classdesc Category to add some basic functionality to the Object class.
 */

(class Object_boot extends Object {

    /**
     * @static
     * @description Get the type name of the object
     * @category Type Checking
     * @returns {string} The type name of the object
     */
    static svType () { 
        return this.name;
    }

    /**
     * @description Get the type of the object
     * @category Type Checking
     * @returns {string} The type name of the object
     */
    svType () { 
        return this.constructor.name;
    }

    /**
     * @static
     * @description Check if the object is a class
     * @category Type Checking
     * @returns {boolean} True if the object is a class, false otherwise
     */
    static isClass () { 
        return true;
    }

    /**
     * @description Check if the object is a class
     * @category Type Checking
     * @returns {boolean} True if the object is a class, false otherwise
     */
    isClass () { 
        return false;
    }

    /**
     * @static
     * @description Check if the object is a prototype
     * @category Type Checking
     * @returns {boolean} True if the object is a prototype, false otherwise
     */
    static isPrototype () { 
        return false;
    }

    /**
     * @description Check if the object is a prototype
     * @category Type Checking
     * @returns {boolean} True if the object is a prototype, false otherwise
     */
    isPrototype () { 
        return this.constructor.prototype === this;
    }

    /**
     * @static
     * @description Check if the object is an instance
     * @category Type Checking
     * @returns {boolean} True if the object is an instance, false otherwise
     */
    static isInstance () { 
        return false;
    }

    /**
     * @description Check if the object is an instance
     * @category Type Checking
     * @returns {boolean} True if the object is an instance, false otherwise
     */
    isInstance () { 
        return !this.isPrototype();
    }

    /**
     * @description Enumerate the prototypes, starting with the instance's prototype and going up the prototype chain
     * @category Enumeration
     * @param {function} fn - The function to call for each prototype
     */
    forEachPrototype (fn) { 
    
        let proto = this;

        if (this.isInstance()) {
            proto = this.__proto__;
        }

        while (proto) {
            fn(proto);
            //console.log("proto is ", proto.svType())
            if (proto === proto.__proto__) {
                throw new Error("__proto__ loop detected in " + proto.svType());
            } else {
                proto = proto.__proto__;
            }
        }
    }

    reverseForEachPrototype (fn) {
        const protos = [];
        this.forEachPrototype(proto => {
            protos.push(proto);
        });
        protos.reverse().forEach(fn);
    }

    /**
     * @description Enumerate the slots
     * @category Enumeration
     * @param {function} fn - The function to call for each slot
     */
    forEachSlot (fn) { 
        this.forEachPrototype(proto => {
            if (Object.hasOwn(proto, "_slotsMap")) {
                proto._slotsMap.forEach((slot /*, key, map*/) => {
                    fn(slot);
                })
            }
        });
    }

    /**
     * @description Enumerate the slots in reverse order
     * @category Enumeration
     * @param {function} fn - The function to call for each slot
     */
    reverseForEachSlot (fn) {
        const slots = [];
        this.forEachSlot(slot => {
            slots.push(slot);
        });
        slots.reverse().forEach(fn);
    }

    /**
     * @description Setup the all slots map (_allSlotsMap property)
     * @category Initialization
     * @returns {void}
     */
    setupAllSlotsMap () { 
        if (!this.isPrototype()) {
            throw new Error("setupAllSlotsMap called on non-prototype");
        }

        const m = this._allSlotsMap;
        //console.log("*** " + this.svType() + " setupAllSlotsMap");

        //assert(this.isPrototype())

        // reverse order so m.keysArray() will return the slots in the order in which they are defined
        this.reverseForEachSlot(slot => { 
            const k = slot.name();
            m.set(k, slot);
        });

        /*
        this.forEachSlot(slot => {
            const k = slot.name();
        if (!m.has(k)) { // to handle overrides 
                m.set(k, slot);
            }
        });
        */
    }

    /**
     * @description Get the all slots map
     * @category Accessors
     * @returns {Map} The all slots map
     */
    allSlotsMap () { 
        return this._allSlotsMap;
    }

    /**
     * @description Get the slots map
     * @category Accessors
     * @returns {Map} The slots map
     */
    slotsMap () { 
        return this._slotsMap;
    }

    /**
     * @description Initialize the slots
     * @category Initialization
     * @returns {void}
     */
    initSlots () {
        assert(this.isPrototype());
        //console.log(this.svType() + " this.slotsMap().size = " + this.slotsMap().size);

        this.slotsMap().forEach((slot) => {
            slot.setupInOwner();
            const hasIvar = Object.hasOwn(this, "_" + slot.name());
            const hasGetter = Object.hasOwn(this, slot.name());
            assert(hasIvar && hasGetter, this.svType() + " missing " + slot.name() + " slot");
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

        if (Object.hasOwn(this, "_slotsMap")) {
            debugger;
        }

        if (Object.hasOwn(this, "_allSlotsMap")) {
            debugger;
        }
        /// each proto has it's own set of slots - use justNewSlot as newSlot needs to check the slots list
        Object.defineSlot(this, "_slotsMap", new Map()); // slots for just this proto
        Object.defineSlot(this, "_allSlotsMap", new Map()); // slots for this proto and all protos in the proto chain
        if (SvGlobals.get("ProtoClass")) {
            if (this !== ProtoClass.prototype) {
                if(this._allSlotsMap === ProtoClass.prototype._allSlotsMap) {
                    debugger;
                }
            }
        }
        this.setupAllSlotsMap();

        // We need to separate initPrototypeSlots, initSlots, initPrototype as
        // initializing some slots may depend on others already existing.
        
        // Slot init ordering may be important as well and why slots should be stored in 
        // an array with a name->slot map used as an index.

        
        if (Object.hasOwn(this, "initPrototypeSlots")) {
            // Only called if method defined on this class.
            this.initPrototypeSlots();// This method should NOT call super
            this.assertAllSlotsHaveTypes();
        }


        this.initSlots();

        if (Object.hasOwn(this, "initPrototype")) {
            this.initPrototype(); // This method should NOT call super

            if (this.assertProtoSlotsHaveType) {
                this.assertProtoSlotsHaveType();
            } else {
                if (this.svType() !== "Object") {
                    console.log(this.svType() + " missing assertProtoSlotsHaveType");
                    debugger;
                }
            }
        } else {
            //debugger;
        }

        //console.log("\n\n" + this.svType() + " allSlots: ", Array.from(this.allSlotsMap().keys()).sort() + "\n\n");
        return this;
    }

    assertAllSlotsHaveTypes () {
        this.forEachSlot(slot => {
            assert(slot.slotType() !== null, this.svType() + " missing slot type for " + slot.name());
        });
    }

    /**
     * @description Setup a category's prototype by calling its initialization methods
     * @category Initialization
     * @param {string} categoryName - The name of the category (e.g., "firestore" from "SvImage_firestore")
     * @returns {void}
     */
    setupCategoryPrototype (categoryName) {
        if (!this.isPrototype()) {
            throw new Error("setupCategoryPrototype called on non-prototype");
        }

        if (this.svType() === "Object") {
            //console.warn("Object_boot.setupCategoryPrototype() called on Object prototype - skipping as we don't have slotMaps without ProtoClass");
            return this;
        }

        // Ensure we have slot maps (should already exist from parent class initialization)
        if (!Object.hasOwn(this, "_slotsMap")) {
            throw new Error("setupCategoryPrototype called on prototype without slot maps - parent class not initialized?");
        }

        // Store the current number of slots so we know which ones are new
        const previousSlotCount = this._slotsMap.size;
        
        // Check for category-specific initPrototypeSlots method
        const catInitSlotsMethodName = "initPrototypeSlots_" + categoryName;
        if (Object.hasOwn(this, catInitSlotsMethodName)) {
            // Call the category's slot initialization
            this[catInitSlotsMethodName].apply(this);
            
            // Initialize only the new slots that were just defined by the category
            this.initCategorySlots(previousSlotCount);
            
            // Update the allSlotsMap to include the new category slots
            this.updateAllSlotsMapForCategory();
        }
        
        // Check for category-specific initPrototype method
        const catInitProtoMethodName = "initPrototype_" + categoryName;
        if (Object.hasOwn(this, catInitProtoMethodName)) {
            // Call the category's prototype initialization
            this[catInitProtoMethodName].apply(this);
        }
        
        return this;
    }

    /**
     * @description Initialize only the slots added by a category
     * @category Initialization
     * @param {number} previousSlotCount - The number of slots before the category added its slots
     * @returns {void}
     */
    initCategorySlots (previousSlotCount) {
        assert(this.isPrototype());
        
        // Convert the map to an array to access by index
        const slotsArray = Array.from(this._slotsMap.values());
        
        // Initialize only the new slots (those after previousSlotCount)
        for (let i = previousSlotCount; i < slotsArray.length; i++) {
            const slot = slotsArray[i];
            slot.setupInOwner();
            const hasIvar = Object.hasOwn(this, "_" + slot.name());
            const hasGetter = Object.hasOwn(this, slot.name());
            assert(hasIvar && hasGetter, this.svType() + " missing " + slot.name() + " slot (from category)");
        }
    }

    /**
     * @description Update the allSlotsMap to include newly added category slots
     * @category Initialization
     * @returns {void}
     */
    updateAllSlotsMapForCategory () {
        if (!this.isPrototype()) {
            throw new Error("updateAllSlotsMapForCategory called on non-prototype");
        }

        // Add the current prototype's slots to allSlotsMap
        // This will include any newly added category slots
        this._slotsMap.forEach((slot, key) => {
            // Only add if not already present (to preserve slot override behavior)
            if (!this._allSlotsMap.has(key)) {
                this._allSlotsMap.set(key, slot);
            }
        });
    }

}).initThisCategory();